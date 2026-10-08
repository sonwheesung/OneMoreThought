package expo.modules.intervention

import android.content.Context
import org.json.JSONObject

/**
 * 통계 화면(결정 #28 · 시안 원모어 #15)용 하루 집계: 날짜 키 → 확인 결과별 횟수.
 * 기기에서 바로 그리려고 둔 작은 숫자뿐이다(정본 기록은 대기열 → 서버 · 결정 #30). 최근 DAYS_KEEP 일만 남긴다.
 * 디버그 기록(SpikeStore · 50줄)에서 세지 않는 이유: 금방 밀려나 숫자가 줄어든다.
 */
internal object PromptStats {
  private const val PREFS = "intervene_stats"
  private const val KEY = "prompt_days"
  private const val DAYS_KEEP = 14
  private val lock = Any()

  fun add(context: Context, dayKey: String, result: String) {
    synchronized(lock) {
      val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val all = try { JSONObject(p.getString(KEY, "{}") ?: "{}") } catch (_: Exception) { JSONObject() }
      val day = all.optJSONObject(dayKey) ?: JSONObject()
      day.put(result, day.optInt(result, 0) + 1)
      all.put(dayKey, day)
      // 오래된 날 지우기(날짜 키는 YYYY-MM-DD 라 글자 순서 = 날짜 순서)
      val keys = all.keys().asSequence().toList().sortedDescending()
      keys.drop(DAYS_KEEP).forEach { all.remove(it) }
      p.edit().putString(KEY, all.toString()).apply()
    }
  }

  /** {"YYYY-MM-DD": {"cancel": n, "open": n, "dismissed": n}} */
  fun read(context: Context): String =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "{}") ?: "{}"
}
