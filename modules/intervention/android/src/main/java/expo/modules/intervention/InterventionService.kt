package expo.modules.intervention

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.SystemClock
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject

/**
 * 실행 전 확인(기능 A)의 감지 · 개입. 결정 #10 · docs/ANDROID_PLATFORM.md §2 · §3.
 *
 * 🔴 기둥 5: 이벤트에서 **패키지 이름만** 읽는다. event.text · getSource() · 창 내용을 쓰지 않는다
 *    (설정 XML 의 canRetrieveWindowContent=false 로 읽을 수도 없다).
 * 🔴 기둥 1: 확인 화면은 [취소] · [열기] 둘뿐이고 [열기]는 한 번에 지나간다. 타이머 · 대기 없음.
 * 🔴 Play 정책(§8.2): [취소]의 "홈으로"는 사용자가 누른 뒤에만 일어나고, 접근성 동작(performGlobalAction)
 *    대신 홈 인텐트를 연다. 접근성으로 무언가를 실행하는 자리를 0 으로 둔다.
 *
 * 통과 상태(RULE_SYSTEM §3.3 · 미결정 D 추천안): [열기] 뒤 그 앱이 화면에서 벗어나고 GRACE_MS 가 지나면 끝난다.
 * 알림창 · 키보드 · 이 앱 자신의 창은 "벗어남"으로 치지 않는다.
 *
 * 확인 화면은 **액티비티**(InterventionActivity)로 띄운다(2026-10-08 · 대상 앱이 뒤에서 계속 돌던 문제).
 * 0.8초 안에 그 화면이 안 뜨면(백그라운드 실행이 막힌 기기 △) 오버레이로 대신한다.
 */
class InterventionService : AccessibilityService() {

  companion object {
    /** 미결정 D 추천안(placeholder 2026-10-08 · 60초) */
    const val GRACE_MS = 60_000L
    /** 잠금 화면 · 알림창(G3 · 2026-10-08 결정 #19: 잠금은 떠난 것이 아니다) */
    private val NOT_LEAVING = setOf("com.android.systemui")
    /**
     * 시스템이 끼어든 것이지 사용자가 떠난 것이 아니다(L4 · 결정 #19). 통화 · 알람 · 타이머.
     * 전화 상태 권한(위험 권한)을 받지 않으려고 패키지로 본다 △. 기본 전화 앱은 TelecomManager 로 더한다(권한 불필요).
     * 📱 삼성 통화 화면 `com.samsung.android.incallui` 관측(갤럭시 S24 · 2026-10-08 16:40:06).
     */
    private val INTERRUPTIONS = setOf(
      "com.samsung.android.incallui", "com.android.incallui", "com.google.android.dialer", "com.android.dialer",
      "com.sec.android.app.clockpackage", "com.google.android.deskclock", "com.android.deskclock",
    )
  }

  private var overlay: View? = null
  private var overlayPkg: String? = null

  private val passed get() = InterventionState.passed
  private val main = android.os.Handler(android.os.Looper.getMainLooper())
  private var foreground: String? = null

  override fun onServiceConnected() {
    super.onServiceConnected()
    registerReceiver(unlockReceiver, android.content.IntentFilter(Intent.ACTION_USER_PRESENT))
    DiagLog.installCrashHandler(this)
    DiagLog.recordExitReasons(this) // 지난번 프로세스가 왜 끝났나(제조사 절전 · 메모리 등)
    SpikeStore.appendLog(this, JSONObject().put("kind", "connected").put("at", System.currentTimeMillis()))
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    if (pkg == packageName || pkg in NOT_LEAVING || isIme(pkg) || isInterruption(pkg)) return
    // L1: 고르지 않고 닫힌 확인 화면이 있다 → 그 앱이 다시 보이면 같은 패키지여도 다시 묻는다
    if (pkg == foreground && pkg == InterventionState.pendingPkg && !InterventionState.activityResumed) {
      showActivity(pkg, event.eventTime)
      return
    }
    if (pkg == foreground) return
    val prev = foreground
    foreground = pkg
    // ⚠ 스파이크 진단: 확인 화면이 떠 있는 동안 앞에 나온 패키지(끼어든 창 찾기 · 2026-10-08). Phase 1 에서 뺀다(기둥 5)
    if (InterventionState.activityAlive) {
      SpikeStore.appendLog(this, JSONObject().put("kind", "fg").put("pkg", pkg).put("at", System.currentTimeMillis()))
    }

    // 통과시킨 앱에서 벗어났다 → 벗어난 시각을 찍는다
    if (prev != null && passed.containsKey(prev) && passed[prev] == null) {
      passed[prev] = SystemClock.uptimeMillis()
    }
    // 확인 화면이 떠 있는데 다른 앱으로 갔다(전화 · 홈 등) → 닫고 dismissed 로 남긴다(RULE_SYSTEM §7)
    if (overlay != null && pkg != overlayPkg) {
      record(overlayPkg ?: "", "dismissed", null)
      removeOverlay()
    }

    if (pkg !in SpikeStore.targets(this)) return
    if (isPassed(pkg)) {
      passed[pkg] = null // 다시 앞으로 왔다. 통과 유지
      return
    }
    // 확인 화면이 맨 앞에 있으면 그대로 둔다. 뒤에 숨어 살아 있으면(대상 앱이 그 위로 왔다) 다시 앞으로 부른다(2026-10-08 구멍)
    if (InterventionState.activityResumed || overlay != null) return
    showActivity(pkg, event.eventTime)
  }

  private fun showActivity(pkg: String, eventUptime: Long) {
    val i = Intent(this, InterventionActivity::class.java)
      .putExtra(InterventionActivity.EXTRA_PKG, pkg)
      .putExtra(InterventionActivity.EXTRA_EVENT_UPTIME, eventUptime)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_ANIMATION or Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS)
    try {
      startActivity(i)
    } catch (e: Exception) {
      SpikeStore.appendLog(this, JSONObject().put("kind", "error").put("pkg", pkg).put("error", e.toString()))
    }
    // 백그라운드 실행이 막히면 예외 없이 조용히 안 뜬다 → 0.8초 뒤 확인하고 오버레이로 대신
    main.postDelayed({
      if (!InterventionState.activityAlive && foreground == pkg && !isPassed(pkg)) {
        SpikeStore.appendLog(this, JSONObject().put("kind", "fallbackOverlay").put("pkg", pkg))
        showOverlay(pkg, eventUptime)
      }
    }, 800)
  }

  private fun isPassed(pkg: String): Boolean {
    if (!passed.containsKey(pkg)) return false
    val leftAt = passed[pkg] ?: return true
    if (SystemClock.uptimeMillis() - leftAt <= GRACE_MS) return true
    passed.remove(pkg)
    return false
  }

  private fun isInterruption(pkg: String): Boolean {
    if (pkg in INTERRUPTIONS) return true
    val tm = getSystemService(Context.TELECOM_SERVICE) as? android.telecom.TelecomManager ?: return false
    return try { tm.defaultDialerPackage == pkg } catch (e: Exception) { false }
  }

  /**
   * L1(화면 잠금 구멍): 확인 화면이 고르지 않은 채 닫혔는데(잠금 · 홈) 그 앱이 맨 앞인 채로 잠금이 풀리면
   * 창 전환 이벤트가 안 올 수 있다(잠금 화면은 무시 대상이라 foreground 가 그대로다). 잠금 해제 신호로 직접 확인한다.
   */
  private val unlockReceiver = object : android.content.BroadcastReceiver() {
    override fun onReceive(c: Context?, i: Intent?) {
      val p = InterventionState.pendingPkg ?: return
      if (foreground == p && !InterventionState.activityResumed && !isPassed(p)) {
        showActivity(p, SystemClock.uptimeMillis())
      }
    }
  }

  private fun isIme(pkg: String): Boolean {
    val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager ?: return false
    return imm.enabledInputMethodList.any { it.packageName == pkg }
  }

  override fun onInterrupt() {
    DiagLog.log(this, "service_interrupt")
    removeOverlay()
  }

  override fun onDestroy() {
    try { unregisterReceiver(unlockReceiver) } catch (_: Exception) {}
    DiagLog.log(this, "service_destroyed")
    removeOverlay()
    super.onDestroy()
  }

  // ── 확인 화면 ────────────────────────────────────────────────

  private fun showOverlay(pkg: String, eventUptime: Long) {
    if (overlay != null) return
    val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val root = buildView(pkg)
    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT,
    )
    // S1 · S2: 이벤트 시각 → 오버레이가 처음 그려진 시각
    root.viewTreeObserver.addOnPreDrawListener(object : ViewTreeObserver.OnPreDrawListener {
      override fun onPreDraw(): Boolean {
        root.viewTreeObserver.removeOnPreDrawListener(this)
        val ms = SystemClock.uptimeMillis() - eventUptime
        SpikeStore.appendLog(
          this@InterventionService,
          JSONObject().put("kind", "shown").put("pkg", pkg).put("detectToDrawMs", ms)
            .put("at", System.currentTimeMillis()),
        )
        return true
      }
    })
    try {
      wm.addView(root, params)
      overlay = root
      overlayPkg = pkg
      root.requestFocus()
    } catch (e: Exception) {
      SpikeStore.appendLog(this, JSONObject().put("kind", "error").put("pkg", pkg).put("error", e.toString()))
    }
  }

  private fun removeOverlay() {
    val v = overlay ?: return
    try {
      (getSystemService(Context.WINDOW_SERVICE) as WindowManager).removeView(v)
    } catch (_: Exception) {
    }
    overlay = null
    overlayPkg = null
  }

  private fun cancel(pkg: String) {
    record(pkg, "cancel", null)
    removeOverlay()
    val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    startActivity(home)
  }

  private fun open(pkg: String) {
    record(pkg, "open", null)
    passed[pkg] = null
    removeOverlay()
  }

  private fun record(pkg: String, result: String, extra: String?) {
    val o = JSONObject().put("kind", "result").put("pkg", pkg).put("result", result)
      .put("at", System.currentTimeMillis())
    if (extra != null) o.put("extra", extra)
    SpikeStore.appendLog(this, o)
  }

  /** 스파이크 화면. 실제 디자인은 Phase 2(`docs/UI_GUIDE.md` · ui-design-reference) */
  private fun buildView(pkg: String): View {
    val dp = { v: Float -> TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, resources.displayMetrics).toInt() }
    val root = object : FrameLayout(this) {
      override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // 뒤로가기 = [취소](RULE_SYSTEM §3.2)
        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
          cancel(pkg)
          return true
        }
        return super.dispatchKeyEvent(event)
      }
    }
    root.setBackgroundColor(Color.argb(235, 18, 18, 22))
    root.isFocusable = true
    root.isFocusableInTouchMode = true

    val card = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(dp(28f), dp(32f), dp(28f), dp(24f))
      background = GradientDrawable().apply {
        setColor(Color.rgb(32, 32, 38))
        cornerRadius = dp(20f).toFloat()
      }
    }
    // 🔴 기둥 4: 사용자 메시지를 그대로. 다듬지 않는다
    val message = TextView(this).apply {
      text = SpikeStore.message(this@InterventionService)
      setTextColor(Color.WHITE)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 24f)
      gravity = Gravity.CENTER
    }
    card.addView(message, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

    val row = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      setPadding(0, dp(28f), 0, 0)
    }
    val cancelBtn = Button(this).apply {
      text = getString(R.string.intervention_cancel)
      setOnClickListener { cancel(pkg) }
    }
    val openBtn = Button(this).apply {
      text = getString(R.string.intervention_open)
      setOnClickListener { open(pkg) }
    }
    val half = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
    row.addView(cancelBtn, half)
    row.addView(openBtn, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply { marginStart = dp(12f) })
    card.addView(row, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

    root.addView(
      card,
      FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        .apply { setMargins(dp(24f), 0, dp(24f), 0) },
    )
    return root
  }
}
