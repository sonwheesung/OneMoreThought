package expo.modules.intervention

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * Phase 0 스파이크 저장소(docs/ANDROID_PLATFORM.md §9).
 *
 * 접근성 서비스는 RN 런타임 밖에서 돈다(§6). 그래서 JS 와 서비스가 SharedPreferences 하나를 같이 읽는다.
 * ⚠ 스파이크 전용이다. 규칙 저장소의 정본은 Phase 1 `docs/DATABASE.md` 에서 정한다(CLAUDE §6).
 *
 * 규칙은 아직 "대상 앱 + 메시지" 뿐이다(요일 · 시간대 판정은 Phase 1 · RULE_SYSTEM §3.1).
 */
internal object SpikeStore {
  private const val PREFS = "intervention_spike"
  private const val KEY_TARGETS = "targets"
  private const val KEY_MESSAGE = "message"
  private const val KEY_LOG = "log"
  private const val LOG_MAX = 50

  fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun setRule(context: Context, targets: List<String>, message: String) {
    prefs(context).edit()
      .putStringSet(KEY_TARGETS, targets.toSet())
      .putString(KEY_MESSAGE, message)
      .apply()
  }

  fun targets(context: Context): Set<String> =
    prefs(context).getStringSet(KEY_TARGETS, emptySet()) ?: emptySet()

  fun message(context: Context): String =
    prefs(context).getString(KEY_MESSAGE, "") ?: ""

  /** 감지 한 건을 남긴다. 지연은 이벤트 시각(uptime) → 오버레이가 처음 그려진 시각 */
  fun appendLog(context: Context, entry: JSONObject) {
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
