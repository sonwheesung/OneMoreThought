package expo.modules.intervention

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

/**
 * JS ↔ 네이티브 다리. 결정 #10 · docs/ANDROID_PLATFORM.md §2 ~ §6 · §8.5.
 * 실패는 JS 로 던지지 않고 false · null · "unknown" 을 돌려준다(SnoreLess alarm-tone 승계).
 */
class InterventionModule : Module() {
  private companion object {
    const val KV = "intervene_kv"
  }

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context lost")

  override fun definition() = ModuleDefinition {
    Name("Intervention")

    OnCreate {
      appContext.reactContext?.let {
        DiagLog.installCrashHandler(it)
        DiagLog.recordExitReasons(it)
      }
    }

    // ── 진단(결정 #20 · #21 · docs/DIAGNOSTICS_SYSTEM.md) ──
    /** JS 쪽 신호(전역 크래시 핸들러 등)도 같은 버퍼에. fieldsJson 은 JSON 객체 문자열 */
    Function("logDiag") { kind: String, fieldsJson: String ->
      val f = try { org.json.JSONObject(fieldsJson) } catch (_: Exception) { org.json.JSONObject() }
      DiagLog.log(context, kind, f)
    }
    Function("getDiag") { DiagLog.read(context) }
    Function("clearDiag") { DiagLog.clear(context) }
    Function("diagSummary") { DiagLog.summary(context) }

    // ── 접근성 서비스(기능 A) ──
    Function("isServiceEnabled") {
      val me = ComponentName(context, InterventionService::class.java).flattenToString()
      val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: ""
      enabled.split(':').any { it.equals(me, ignoreCase = true) }
    }

    /**
     * 🔴 공개 화면(§7.1)에서 동의를 받은 뒤에만 부른다.
     * 접근성 목록을 열면서 우리 항목을 강조한다(ANDROID_PLATFORM §7.2).
     * 상세 화면 직행(ACCESSIBILITY_DETAILS_SETTINGS)은 Android 13+ 에서 시스템 권한 앱만 쓸 수 있어 쓰지 않는다.
     * 강조 인자(:settings:fragment_args_key)는 비공식이다. 제조사가 무시하면 목록 첫 화면이 열릴 뿐이다.
     */
    Function("openAccessibilitySettings") {
      val key = ComponentName(context, InterventionService::class.java).flattenToString()
      // ① 우리 서비스 상세로 직행 시도. 삼성 One UI 는 서비스가 "설치된 앱" 한 단계 아래에 있어
      //    목록 강조(②)가 먹을 줄이 첫 화면에 없다(📱 갤럭시 S24 · Android 16 · 2026-10-08).
      //    일반 앱에 막혀 있으면(시스템 권한) 예외 · 또는 설정이 스스로 목록으로 돌린다 → ② 로.
      val details = Intent("android.settings.ACCESSIBILITY_DETAILS_SETTINGS")
        .putExtra(Intent.EXTRA_COMPONENT_NAME, key)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      val opened = try {
        if (details.resolveActivity(context.packageManager) != null) {
          context.startActivity(details)
          true
        } else false
      } catch (e: Exception) {
        SpikeStore.appendLog(context, org.json.JSONObject().put("kind", "a11yDetailsFailed").put("error", e.toString()))
        false
      }
      // ② 목록 + 강조(비공식 인자)
      if (!opened) openSettings(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS), key)
      // ③ 설정 위에 경로 안내. 삼성은 강조가 안 먹는다(📱 갤럭시 S24 · 2026-10-08). 토스트는 권한이 필요 없다
      if (!opened) {
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
          android.widget.Toast.makeText(context, R.string.intervention_settings_path, android.widget.Toast.LENGTH_LONG).show()
        }, 600)
      }
      SpikeStore.appendLog(context, org.json.JSONObject().put("kind", "a11ySettings").put("route", if (opened) "details" else "list"))
    }

    // ── 규칙 캐시 · 기록 대기열(결정 #30 · docs/DATABASE.md §1.1 · §2) ──
    /** JS 가 rules.json 을 쓴다(쓰는 쪽은 JS 하나). 못 읽는 JSON 이면 false 이고 이전 캐시를 지킨다 */
    Function("setRules") { json: String -> RuleStore.write(context, json) }
    Function("getRules") { RuleStore.raw(context) }
    /** 대기열 앞에서 max 줄(JSON 배열 문자열) */
    Function("queueRead") { max: Int -> EventQueue.read(context, max) }
    /** 서버가 받은 마지막 id 까지 지운다(지우기는 Kotlin 이 잠금 안에서 한다). 지운 줄 수 */
    Function("queueAck") { lastId: String -> EventQueue.ack(context, lastId) }
    /** JS 쪽 사건(오프라인 규칙 편집 rule_put · rule_delete · 실행 확인 등). eventJson = JSON 객체 */
    Function("queueAppend") { eventJson: String ->
      try { EventQueue.append(context, org.json.JSONObject(eventJson)); true } catch (_: Exception) { false }
    }
    Function("queueCount") { EventQueue.count(context) }
    Function("queueHasRuleEdits") { EventQueue.hasRuleEdits(context) }

    // ── 기기 저장값(공용 서버 기기 id · 토큰) ──
    /** 🔴 앱 전용 SharedPreferences(다른 앱이 못 읽는다 · 백업 제외). 값은 로그 · 진단에 남기지 않는다 */
    Function("kvGet") { key: String -> context.getSharedPreferences(KV, Context.MODE_PRIVATE).getString(key, null) }
    Function("kvSet") { key: String, value: String? ->
      context.getSharedPreferences(KV, Context.MODE_PRIVATE).edit().apply { if (value == null) remove(key) else putString(key, value) }.apply()
    }
    /** UUID v4(Hermes 에 crypto.randomUUID 가 없다) */
    Function("uuid") { java.util.UUID.randomUUID().toString() }

    Function("getLog") { SpikeStore.log(context) }
    Function("clearLog") { SpikeStore.clearLog(context) }

    // ── 사용 기록(기능 B · S5) ──
    Function("hasUsageAccess") { hasUsageAccess() }

    /** 우리 앱 항목을 지정해 연다(package: 데이터 + 강조 인자). 받는 화면이 없으면 목록 첫 화면 */
    Function("openUsageAccessSettings") {
      val direct = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, android.net.Uri.parse("package:${context.packageName}"))
      if (direct.resolveActivity(context.packageManager) != null) {
        openSettings(direct, context.packageName)
      } else {
        openSettings(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS), context.packageName)
      }
    }

    /** 오늘(기기 시간 자정 · 미결정 B 추천안) 이후 그 앱이 처음 앞에 나온 시각(ms). 없으면 null */
    Function("firstOpenedToday") { pkg: String ->
      if (!hasUsageAccess()) return@Function null
      val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val start = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
      }.timeInMillis
      val events = usm.queryEvents(start, System.currentTimeMillis())
      val e = UsageEvents.Event()
      while (events.hasNextEvent()) {
        events.getNextEvent(e)
        // ACTIVITY_RESUMED(29+) == MOVE_TO_FOREGROUND(구) == 1
        if (e.packageName == pkg && e.eventType == 1) return@Function e.timeStamp.toDouble()
      }
      null
    }

    /** 최근 days 일 중 그 앱이 화면 앞에 나온 날의 날짜 키들(결정 #26 K · 통계 7일 칸). 권한이 없으면 null */
    Function("openedDays") { pkg: String, days: Int ->
      if (!hasUsageAccess()) return@Function null
      val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val start = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
        add(Calendar.DAY_OF_MONTH, -(days.coerceIn(1, 31) - 1))
      }.timeInMillis
      val events = usm.queryEvents(start, System.currentTimeMillis())
      val e = UsageEvents.Event()
      val out = linkedSetOf<String>()
      while (events.hasNextEvent()) {
        events.getNextEvent(e)
        if (e.packageName == pkg && e.eventType == 1) out.add(EventQueue.dayKeyOf(e.timeStamp))
      }
      out.toList()
    }

    /** 통계용 하루 집계(PromptStats) JSON */
    Function("promptStats") { PromptStats.read(context) }
    Function("clearPromptStats") { PromptStats.clear(context) }

    // ── 앱 고르기(§5) ──
    /** 결정 #27 L: 이 앱 · 홈 런처 · 시스템 설정 · 전화는 목록에서 뺀다(서비스도 따로 거른다) */
    Function("listLaunchableApps") {
      val pm = context.packageManager
      val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val excluded = buildSet {
        add(context.packageName)
        add("com.android.settings")
        pm.resolveActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0)?.activityInfo?.packageName?.let { add(it) }
        try {
          (context.getSystemService(Context.TELECOM_SERVICE) as? android.telecom.TelecomManager)?.defaultDialerPackage?.let { add(it) }
        } catch (_: Exception) {}
      }
      pm.queryIntentActivities(intent, 0)
        .map { it.activityInfo.packageName to it.loadLabel(pm).toString() }
        .distinctBy { it.first }
        .filter { it.first !in excluded }
        .sortedBy { it.second.lowercase() }
        .map { mapOf("packageName" to it.first, "label" to it.second) }
    }

    /**
     * 앱 아이콘(PNG data URI · 한 변 size px). 앱 고르기 목록이 첫 글자 타일 대신 쓴다(2026-10-10 사용자 지시).
     * 목록에 있는 앱(<queries> MAIN/LAUNCHER)만 읽을 수 있다. 실패하면 null.
     */
    AsyncFunction("appIcon") { pkg: String, size: Int ->
      try {
        val d = context.packageManager.getApplicationIcon(pkg)
        val px = size.coerceIn(24, 256)
        val bmp = android.graphics.Bitmap.createBitmap(px, px, android.graphics.Bitmap.Config.ARGB_8888)
        val canvas = android.graphics.Canvas(bmp)
        d.setBounds(0, 0, px, px)
        d.draw(canvas)
        val out = java.io.ByteArrayOutputStream()
        bmp.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, out)
        bmp.recycle()
        "data:image/png;base64," + android.util.Base64.encodeToString(out.toByteArray(), android.util.Base64.NO_WRAP)
      } catch (_: Exception) {
        null
      }
    }

    // ── 고급 보호 모드(§8.5 · S7) ──
    /** "on" · "off" · "unknown"(API 없음 · 권한 거부 등). 리플렉션이라 컴파일 SDK 와 무관하다 */
    Function("advancedProtection") {
      try {
        val cls = Class.forName("android.security.advancedprotection.AdvancedProtectionManager")
        val mgr = context.getSystemService(cls) ?: return@Function "unknown"
        val on = cls.getMethod("isAdvancedProtectionEnabled").invoke(mgr) as Boolean
        if (on) "on" else "off"
      } catch (e: Throwable) {
        "unknown"
      }
    }

    Function("sdkInt") { Build.VERSION.SDK_INT }
  }

  /** 설정 화면을 열면서 목록에서 우리 항목을 강조하라고 알린다(비공식 · 무시돼도 안전) */
  private fun openSettings(intent: Intent, highlightKey: String) {
    val args = android.os.Bundle().apply { putString(":settings:fragment_args_key", highlightKey) }
    intent.putExtra(":settings:fragment_args_key", highlightKey)
      .putExtra(":settings:show_fragment_args", args)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      context.startActivity(intent)
    } catch (e: Exception) {
      context.startActivity(Intent(intent.action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }

  private fun hasUsageAccess(): Boolean {
    val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    } else {
      @Suppress("DEPRECATION")
      ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }
}
