package expo.modules.intervention

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.SystemClock
import android.util.TypedValue
import android.view.Gravity
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject

/**
 * 실행 전 확인 화면(기능 A) · docs/ANDROID_PLATFORM.md §3.
 *
 * 왜 오버레이가 아니라 액티비티인가(2026-10-08 · 📱 갤럭시 S24 실측):
 *   오버레이는 대상 앱 위에 판을 덮을 뿐이라 **뒤에서 앱이 계속 돈다**(게임 소리 · 로딩).
 *   사용자 원문: *"메세지는 출력되는데 앱도 실행이 되네 확인을 눌러야 실행되게는 못하겠지?"*
 *   우리 화면이 진짜 화면으로 앞에 서면 대상 앱은 뒤로 가서 일시정지된다. [열기]를 눌러야 다시 앞으로 온다.
 *   🔴 앱 실행 자체를 막지는 못한다(시스템이 실행 **뒤에** 알려 준다) · 막아서도 안 된다(기둥 1 · Play 정책).
 *
 * 🔴 기둥 1: [취소] · [열기] 둘뿐 · [열기]는 한 번에 지나간다. 타이머 · 대기 없음.
 * 🔴 기둥 4: 사용자 메시지를 그대로.
 * 닫히는 길은 셋뿐: [취소](뒤로가기 포함) · [열기] · 화면에서 사라짐(onStop · dismissed).
 *   다른 앱 창이 잠깐 끼어드는 것으로는 닫히지 않는다(오버레이 시절 저절로 닫히던 결함 · 2026-10-08).
 * 🔴 onUserLeaveHint 에 기대지 않는다. 📱 갤럭시 S24 제스처 홈에서 오지 않았다(2026-10-08 16:39:16).
 *    그래서 확인 화면이 뒤에 숨은 채 살아 있었고, 서비스가 "이미 떠 있다"며 다시 띄우지 않아 게임이 그냥 열렸다.
 */
class InterventionActivity : Activity() {

  companion object {
    const val EXTRA_PKG = "pkg"
    const val EXTRA_EVENT_UPTIME = "eventUptime"
    const val EXTRA_RULE_ID = "ruleId"
    const val EXTRA_MESSAGE = "message"
  }

  private var pkg: String = ""
  private var ruleId: String = ""
  private var message: String = ""
  private var shownAt = 0L
  private var decided = false
  private var messageView: TextView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    pkg = intent.getStringExtra(EXTRA_PKG) ?: ""
    ruleId = intent.getStringExtra(EXTRA_RULE_ID) ?: ""
    message = intent.getStringExtra(EXTRA_MESSAGE) ?: ""
    shownAt = System.currentTimeMillis()
    val eventUptime = intent.getLongExtra(EXTRA_EVENT_UPTIME, SystemClock.uptimeMillis())
    InterventionState.activityAlive = true
    val root = buildView()
    setContentView(root)
    // S1 · S2: 감지 이벤트 시각 → 우리 화면이 처음 그려진 시각
    root.viewTreeObserver.addOnPreDrawListener(object : ViewTreeObserver.OnPreDrawListener {
      override fun onPreDraw(): Boolean {
        root.viewTreeObserver.removeOnPreDrawListener(this)
        SpikeStore.appendLog(
          this@InterventionActivity,
          JSONObject().put("kind", "shown").put("via", "activity").put("pkg", pkg)
            .put("detectToDrawMs", SystemClock.uptimeMillis() - eventUptime).put("at", System.currentTimeMillis()),
        )
        return true
      }
    })
  }

  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {
    cancel() // 뒤로가기 = [취소](RULE_SYSTEM §3.2)
  }

  /** singleTask 라 다시 부르면 새로 안 만들어지고 이리로 온다. 대상 앱을 갱신하고 다시 고르게 한다 */
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    pkg = intent.getStringExtra(EXTRA_PKG) ?: pkg
    ruleId = intent.getStringExtra(EXTRA_RULE_ID) ?: ruleId
    message = intent.getStringExtra(EXTRA_MESSAGE) ?: message
    messageView?.text = message
    shownAt = System.currentTimeMillis()
    decided = false
  }

  override fun onResume() {
    super.onResume()
    InterventionState.activityResumed = true
  }

  override fun onPause() {
    InterventionState.activityResumed = false
    super.onPause()
  }

  override fun onStop() {
    super.onStop()
    // 화면에서 사라졌다(홈 · 최근 앱 · 다른 앱). 고르지 않았다 → 닫는다. 대상 앱이 다시 오면 서비스가 새로 묻는다
    if (!decided && !isChangingConfigurations) {
      decided = true
      record("dismissed")
      InterventionState.pendingPkg = pkg // L1: 그 앱이 다시 보이면 다시 묻는다
      finish()
    }
  }

  override fun onDestroy() {
    InterventionState.activityAlive = false
    InterventionState.activityResumed = false
    super.onDestroy()
  }

  private fun cancel() {
    if (decided) return
    decided = true
    record("cancel")
    InterventionState.pendingPkg = null
    startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    finish()
  }

  private fun open() {
    if (decided) return
    decided = true
    record("open")
    InterventionState.pass(pkg, RuleStore.rules(this).firstOrNull { it.id == ruleId }?.graceMin)
    InterventionState.pendingPkg = null
    // L3: 그사이 대상 앱이 꺼졌으면 우리 화면만 걷어서는 홈이 나온다. 실행 인텐트를 직접 부른다
    // (살아 있으면 아이콘을 누른 것처럼 그 화면 그대로 앞으로 온다)
    packageManager.getLaunchIntentForPackage(pkg)?.let {
      try { startActivity(it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) {}
    }
    finish()
    overridePendingTransition(0, 0)
  }

  private fun record(result: String) {
    val now = System.currentTimeMillis()
    SpikeStore.appendLog(this, JSONObject().put("kind", "result").put("pkg", pkg).put("result", result).put("at", now))
    // 서버로 갈 기록(DATABASE §2.2 · 결정 #30)
    if (ruleId.isNotEmpty()) EventQueue.prompt(this, ruleId, pkg, shownAt, result, now - shownAt)
  }

  /** 스파이크 화면. 실제 디자인은 Phase 2(`docs/UI_GUIDE.md` · ui-design-reference) */
  private fun buildView(): FrameLayout {
    val dp = { v: Float -> TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, resources.displayMetrics).toInt() }
    val root = FrameLayout(this)
    root.setBackgroundColor(Color.rgb(18, 18, 22))
    // 시스템 막대(상태 · 내비게이션) · 노치 영역만큼 안쪽으로. 가로에서 카드가 내비 바 밑으로 들어가던 것(2026-10-09 시안 세션 지적 ·
    // 📱 갤럭시 S24 가로 캡처). 색과 무관해서 디자인(결정 #33) 반영 전에 먼저 넣는다
    root.setOnApplyWindowInsetsListener { v, insets ->
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
        val b = insets.getInsets(android.view.WindowInsets.Type.systemBars() or android.view.WindowInsets.Type.displayCutout())
        v.setPadding(b.left, b.top, b.right, b.bottom)
      } else {
        @Suppress("DEPRECATION")
        v.setPadding(insets.systemWindowInsetLeft, insets.systemWindowInsetTop, insets.systemWindowInsetRight, insets.systemWindowInsetBottom)
      }
      insets
    }
    // 카드 최대 폭 520dp(가로 · 태블릿에서 버튼이 끝없이 길어지지 않게)
    val maxCard = dp(520f)
    val card = object : LinearLayout(this) {
      override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val w = MeasureSpec.getSize(widthMeasureSpec)
        val spec = if (w > maxCard) MeasureSpec.makeMeasureSpec(maxCard, MeasureSpec.EXACTLY) else widthMeasureSpec
        super.onMeasure(spec, heightMeasureSpec)
      }
    }.apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(dp(28f), dp(32f), dp(28f), dp(24f))
      background = GradientDrawable().apply {
        setColor(Color.rgb(32, 32, 38))
        cornerRadius = dp(20f).toFloat()
      }
    }
    // 🔴 기둥 4: 사용자 메시지를 그대로
    val message = TextView(this).apply {
      text = this@InterventionActivity.message
      setTextColor(Color.WHITE)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 24f)
      gravity = Gravity.CENTER
    }
    messageView = message
    card.addView(message, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
    val row = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      setPadding(0, dp(28f), 0, 0)
    }
    val cancelBtn = Button(this).apply {
      text = getString(R.string.intervention_cancel)
      setOnClickListener { cancel() }
    }
    val openBtn = Button(this).apply {
      text = getString(R.string.intervention_open)
      setOnClickListener { open() }
    }
    row.addView(cancelBtn, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
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

/** 서비스와 확인 화면이 같은 프로세스에서 나눠 쓰는 상태(메모리 · 재시작 시 사라져도 된다 · RULE_SYSTEM §3.3) */
internal object InterventionState {
  @Volatile var activityAlive = false
  /** 확인 화면이 지금 맨 앞에 있나. alive 와 다르다: 뒤에 숨어 살아 있을 수 있다 */
  @Volatile var activityResumed = false
  /** 고르지 않고 닫힌 확인 화면의 대상(L1). 취소 · 열기 · 통과로 지운다 */
  @Volatile var pendingPkg: String? = null
  /** [열기]로 통과시킨 패키지 → 화면에서 벗어난 시각(uptime). null 이면 아직 앞에 있다 */
  val passed = HashMap<String, Long?>()
  /** 통과시킨 패키지 → 그 규칙의 유예(분 · 결정 #29). 없으면 기본 1분 */
  val graceMin = HashMap<String, Int>()
  /** 서비스가 판정한 결과(패키지 → 규칙 · 메시지). 확인 화면 · 기록이 같은 규칙을 가리키게 */
  val hits = HashMap<String, RuleJudge.Hit>()

  @Synchronized fun pass(pkg: String, grace: Int?) {
    passed[pkg] = null
    graceMin[pkg] = grace ?: RuleJudge.GRACE_DEFAULT
  }
}
