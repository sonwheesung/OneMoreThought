package expo.modules.intervention

import android.app.ActivityManager
import android.app.ApplicationExitInfo
import android.content.Context
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.TimeZone

/**
 * 기기 안 진단 기록(링 버퍼) · 결정 #20 · #21 · docs/DIAGNOSTICS_SYSTEM.md.
 *
 * 승계: 배구명가 `lib/deviceLog.ts`(도착 순서 · 바이트 예산 · AsyncStorage 링). 이 앱은 감지가 네이티브라
 * 버퍼를 네이티브에 둔다. JS 도 `InterventionModule.logDiag` 로 같은 버퍼에 쓴다(한 곳).
 *
 * 형식: 파일 한 줄 = JSON 한 건(`diag.jsonl`). 예산을 넘으면 오래된 줄부터 버린다.
 * 🔴 기록이 앱을 막으면 안 된다. 전부 try/catch 로 삼킨다(배구명가 텔레메트리 "비차단" 계약).
 * ⚠ 이 기록은 사용자 문의 첨부 · 하루 요약으로 서버에 간다(결정 #20 · #21 · #24). 그러니 넣는 것은 정의된 신호만.
 */
internal object DiagLog {
  /** 바이트 예산(placeholder 2026-10-08 · 256KB). 서버 첨부 상한과 실측으로 맞춘다(배구명가 413 사고) */
  const val BUDGET_BYTES = 256 * 1024
  private const val FILE = "diag.jsonl"
  private const val PREFS = "intervention_diag"
  private const val KEY_LAST_EXIT = "lastExitTs"

  @Synchronized
  fun log(context: Context, kind: String, fields: JSONObject? = null) {
    try {
      val o = fields ?: JSONObject()
      o.put("kind", kind).put("at", System.currentTimeMillis()).put("tz", TimeZone.getDefault().id)
      val f = File(context.filesDir, FILE)
      f.appendText(o.toString() + "\n")
      if (f.length() > BUDGET_BYTES) trim(f)
    } catch (_: Throwable) {
    }
  }

  /** 오래된 줄부터 버려 예산의 3/4 로 줄인다(매번 다시 쓰지 않게 여유를 둔다) */
  private fun trim(f: File) {
    val lines = f.readLines()
    var size = 0L
    val keep = ArrayList<String>()
    for (line in lines.asReversed()) {
      size += line.toByteArray().size + 1
      if (size > BUDGET_BYTES * 3 / 4) break
      keep.add(line)
    }
    f.writeText(keep.asReversed().joinToString("\n", postfix = "\n"))
  }

  /** 최신이 뒤. 문의 첨부 · 미리보기용 */
  @Synchronized
  fun read(context: Context): String = try {
    val f = File(context.filesDir, FILE)
    val arr = JSONArray()
    if (f.exists()) f.readLines().forEach { if (it.isNotBlank()) arr.put(JSONObject(it)) }
    arr.toString()
  } catch (_: Throwable) {
    "[]"
  }

  @Synchronized
  fun clear(context: Context) {
    try { File(context.filesDir, FILE).delete() } catch (_: Throwable) {}
  }

  /** 기기 정보(결정 #21). 하루 요약 · 문의 첨부에 붙는다 */
  fun device(): JSONObject = JSONObject()
    .put("manufacturer", Build.MANUFACTURER)
    .put("model", Build.MODEL)
    .put("sdk", Build.VERSION.SDK_INT)
    .put("release", Build.VERSION.RELEASE)

  /** 종류별 개수 + 기기 정보. 하루 요약(결정 #21)의 뼈대 · 대상 앱별 통계는 Phase 5 에서 붙인다 */
  fun summary(context: Context): String = try {
    val counts = JSONObject()
    val arr = JSONArray(read(context))
    for (i in 0 until arr.length()) {
      val k = arr.getJSONObject(i).optString("kind")
      counts.put(k, counts.optInt(k, 0) + 1)
    }
    JSONObject().put("device", device()).put("counts", counts).toString()
  } catch (_: Throwable) {
    "{}"
  }

  // ── 앱이 죽은 이유 ─────────────────────────────────────────────

  private var handlerInstalled = false

  /**
   * Kotlin 미처리 예외를 기록하고 원래 처리(시스템 종료)로 넘긴다. 배구명가 JS 전역 핸들러(기존 핸들러 보존)와 같은 결.
   * 접근성 서비스는 RN 밖에서 돈다. JS 핸들러로는 서비스의 크래시를 못 잡는다.
   */
  @Synchronized
  fun installCrashHandler(context: Context) {
    if (handlerInstalled) return
    handlerInstalled = true
    val app = context.applicationContext
    val prev = Thread.getDefaultUncaughtExceptionHandler()
    Thread.setDefaultUncaughtExceptionHandler { t, e ->
      log(app, "crash_native", JSONObject().put("thread", t.name).put("error", e.toString())
        .put("stack", e.stackTrace.take(12).joinToString("\n") { it.toString() }))
      prev?.uncaughtException(t, e)
    }
  }

  /**
   * 지난번 프로세스가 왜 끝났나(API 30+). 제조사 절전 · 메모리 부족 종료가 여기로 보인다 △(제조사별 값은 실측).
   * 이미 기록한 것은 다시 안 쓴다(마지막 타임스탬프를 기억).
   */
  fun recordExitReasons(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return
    try {
      val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val last = prefs.getLong(KEY_LAST_EXIT, 0L)
      val infos = am.getHistoricalProcessExitReasons(context.packageName, 0, 10)
      var newest = last
      for (info in infos.sortedBy { it.timestamp }) {
        if (info.timestamp <= last) continue
        log(context, "exit", JSONObject()
          .put("reason", reasonName(info.reason))
          .put("exitAt", info.timestamp)
          .put("importance", info.importance)
          .put("description", info.description ?: ""))
        if (info.timestamp > newest) newest = info.timestamp
      }
      prefs.edit().putLong(KEY_LAST_EXIT, newest).apply()
    } catch (_: Throwable) {
    }
  }

  private fun reasonName(r: Int): String = when (r) {
    ApplicationExitInfo.REASON_ANR -> "anr"
    ApplicationExitInfo.REASON_CRASH -> "crash"
    ApplicationExitInfo.REASON_CRASH_NATIVE -> "crash_native"
    ApplicationExitInfo.REASON_DEPENDENCY_DIED -> "dependency_died"
    ApplicationExitInfo.REASON_EXCESSIVE_RESOURCE_USAGE -> "excessive_resource"
    ApplicationExitInfo.REASON_EXIT_SELF -> "exit_self"
    ApplicationExitInfo.REASON_INITIALIZATION_FAILURE -> "init_failure"
    ApplicationExitInfo.REASON_LOW_MEMORY -> "low_memory"
    ApplicationExitInfo.REASON_OTHER -> "other"
    ApplicationExitInfo.REASON_PERMISSION_CHANGE -> "permission_change"
    ApplicationExitInfo.REASON_SIGNALED -> "signaled"
    ApplicationExitInfo.REASON_USER_REQUESTED -> "user_requested"
    ApplicationExitInfo.REASON_USER_STOPPED -> "user_stopped"
    ApplicationExitInfo.REASON_FREEZER -> "freezer"
    ApplicationExitInfo.REASON_PACKAGE_UPDATED -> "package_updated"
    else -> "unknown_$r"
  }
}
