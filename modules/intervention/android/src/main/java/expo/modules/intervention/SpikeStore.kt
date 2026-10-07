package expo.modules.intervention

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * Phase 0 스파이크 저장소(docs/ANDROID_PLATFORM.md §9).
 *
 * 접근성 서비스는 RN 런타임 밖에서 돈다(§6). 그래서 JS 와 서비스가 SharedPreferences 하나를 같이 읽는다.
 * ~~규칙 저장~~ → Phase 1 에서 `RuleStore`(rules.json)로 옮겼다(결정 #30). 여기에는 스파이크 화면의 감지 기록과
 * 진단 신호 거울만 남았다. 확인 결과의 정본 기록은 `EventQueue`(서버로 간다)다.
 */
internal object SpikeStore {
  private const val PREFS = "intervention_spike"
  private const val KEY_LOG = "log"
  private const val LOG_MAX = 50

  fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)


  /** 스파이크 기록 종류 → 진단 신호 이름(docs/DIAGNOSTICS_SYSTEM.md §2) */
  private val SIGNAL = mapOf(
    "shown" to "prompt_shown", "result" to "prompt_result", "fallbackOverlay" to "prompt_fallback",
    "error" to "prompt_error", "connected" to "service_connected", "a11ySettings" to "settings_route",
    "a11yDetailsFailed" to "settings_details_denied", "fg" to "fg_while_prompt",
  )
  /** 감지 → 확인 화면 첫 그림이 이보다 느리면 prompt_slow(placeholder 2026-10-08 · 1초) */
  private const val SLOW_MS = 1000L

  /** 감지 한 건을 남긴다(스파이크 화면용) + 같은 내용을 진단 신호 이름으로 진단 버퍼에도 */
  fun appendLog(context: Context, entry: JSONObject) {
    val kind = entry.optString("kind")
    SIGNAL[kind]?.let { DiagLog.log(context, it, JSONObject(entry.toString()).apply { remove("kind"); remove("at") }) }
    if (kind == "shown" && entry.optLong("detectToDrawMs", 0) > SLOW_MS) {
      DiagLog.log(context, "prompt_slow", JSONObject().put("ms", entry.optLong("detectToDrawMs")).put("pkg", entry.optString("pkg")))
    }
    val p = prefs(context)
    val old = try { JSONArray(p.getString(KEY_LOG, "[]")) } catch (e: Exception) { JSONArray() }
    val next = JSONArray()
    next.put(entry)
    for (i in 0 until minOf(old.length(), LOG_MAX - 1)) next.put(old.get(i))
    p.edit().putString(KEY_LOG, next.toString()).apply()
  }

  fun log(context: Context): String = prefs(context).getString(KEY_LOG, "[]") ?: "[]"

  fun clearLog(context: Context) {
    prefs(context).edit().putString(KEY_LOG, "[]").apply()
  }
}
