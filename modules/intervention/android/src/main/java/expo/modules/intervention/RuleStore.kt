package expo.modules.intervention

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * 기기 규칙 캐시 `rules.json`(docs/DATABASE.md §1.1 · §2.1 · 결정 #30).
 *
 * 🔴 쓰는 쪽은 JS 하나다(`setRules`). 접근성 서비스는 읽기만 한다. 같은 파일을 둘이 쓰지 않는다.
 * 🔴 서버가 정본이고 이것은 캐시다. 그래도 접근성 서비스는 인터넷 없이 이것만으로 판정한다(기둥 6 · 오프라인에서도 돈다).
 * 쓰기는 임시 파일에 쓰고 이름을 바꾼다(반쯤 쓴 파일을 서비스가 읽지 않게).
 */
internal object RuleStore {
  private const val FILE = "rules.json"
  @Volatile private var cached: List<RuleJudge.Rule> = emptyList()
  @Volatile private var cachedStamp = -1L

  private fun file(context: Context) = File(context.filesDir, FILE)

  /** JS 가 보낸 `{ v, syncedAt, rules }` 를 검사하고 저장한다. 못 읽으면 false(이전 캐시 유지) */
  @Synchronized
  fun write(context: Context, json: String): Boolean {
    val parsed = try { parse(JSONObject(json)) } catch (e: Exception) {
      DiagLog.log(context, "rules_write_error", JSONObject().put("error", e.javaClass.simpleName))
      return false
    }
    val f = file(context)
    val tmp = File(context.filesDir, "$FILE.tmp")
    tmp.writeText(json)
    if (!tmp.renameTo(f)) {
      f.delete()
      if (!tmp.renameTo(f)) return false
    }
    cached = parsed
    cachedStamp = f.lastModified()
    return true
  }

  /** 서비스가 부른다. 파일이 바뀌었으면 다시 읽는다(프로세스가 새로 떴을 때 · JS 가 고쳤을 때) */
  fun rules(context: Context): List<RuleJudge.Rule> {
    val f = file(context)
    if (!f.exists()) return emptyList()
    val stamp = f.lastModified()
    if (stamp == cachedStamp) return cached
    synchronized(this) {
      cached = try { parse(JSONObject(f.readText())) } catch (e: Exception) {
        DiagLog.log(context, "rules_read_error", JSONObject().put("error", e.javaClass.simpleName))
        emptyList()
      }
      cachedStamp = stamp
    }
    return cached
  }

  fun raw(context: Context): String {
    val f = file(context)
    return if (f.exists()) f.readText() else """{"v":1,"syncedAt":0,"rules":[]}"""
  }

  private fun parse(o: JSONObject): List<RuleJudge.Rule> {
    val arr: JSONArray = o.getJSONArray("rules")
    return List(arr.length()) { i ->
      val r = arr.getJSONObject(i)
      RuleJudge.Rule(
        id = r.getString("id"),
        kind = r.getString("kind"),
        name = r.getString("name"),
        enabled = r.getBoolean("enabled"),
        days = r.getInt("days"),
        startMin = r.getInt("startMin"),
        endMin = if (r.has("endMin") && !r.isNull("endMin")) r.getInt("endMin") else null,
        targets = r.getJSONArray("targets").let { a -> List(a.length()) { a.getString(it) } },
        message = r.getString("message"),
        graceMin = if (r.has("graceMin") && !r.isNull("graceMin")) r.getInt("graceMin") else null,
        updatedAt = r.getLong("updatedAt"),
      )
    }
  }
}
