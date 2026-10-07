package expo.modules.intervention

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.util.Calendar
import java.util.TimeZone

/**
 * `tests/rules-cases.json` 을 TS(`scripts/check-rules.mjs`)와 **같은 표로** 돈다(CLAUDE §5-8).
 * 시간대 4개(서울 · 서머타임 뉴욕 · 30분 서머타임 로드하우 · UTC). 표의 시각은 로컬 벽시계라 어디서나 같은 답이어야 한다.
 * 실행: `npm run check:rules:kt`(android/ 개발 빌드 프로젝트가 있어야 한다).
 */
class RuleJudgeTest {
  private val zones = listOf("Asia/Seoul", "America/New_York", "Australia/Lord_Howe", "UTC")

  private fun table(): JSONObject {
    // 작업 디렉터리는 모듈 폴더(modules/intervention/android) · 저장소 루트를 위로 찾는다
    var dir: File? = File("").absoluteFile
    while (dir != null && !File(dir, "tests/rules-cases.json").exists()) dir = dir.parentFile
    requireNotNull(dir) { "tests/rules-cases.json 을 못 찾았다" }
    return JSONObject(File(dir, "tests/rules-cases.json").readText())
  }

  private fun local(s: String): Calendar {
    val m = Regex("""^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$""").find(s) ?: error("시각 형식: $s")
    val (y, mo, d, h, mi) = m.destructured
    return Calendar.getInstance().apply {
      clear()
      set(y.toInt(), mo.toInt() - 1, d.toInt(), h.toInt(), mi.toInt(), 0)
    }
  }

  private fun JSONObject.optIntOrNull(k: String): Int? = if (has(k) && !isNull(k)) getInt(k) else null

  private fun ruleOf(o: JSONObject) = RuleJudge.Rule(
    id = o.getString("id"), kind = o.getString("kind"), name = o.getString("name"), enabled = o.getBoolean("enabled"),
    days = o.getInt("days"), startMin = o.getInt("startMin"), endMin = o.optIntOrNull("endMin"),
    targets = o.getJSONArray("targets").let { a -> List(a.length()) { a.getString(it) } },
    message = o.getString("message"), graceMin = o.optIntOrNull("graceMin"), updatedAt = o.getLong("updatedAt"),
  )

  private fun JSONArray.objects(): List<JSONObject> = List(length()) { getJSONObject(it) }

  @Test
  fun sameAnswersAsTs() {
    val t = table()
    val original = TimeZone.getDefault()
    var n = 0
    try {
      for (zone in zones) {
        TimeZone.setDefault(TimeZone.getTimeZone(zone))
        val bad = mutableListOf<String>()
        for (c in t.getJSONArray("weekdays").objects()) {
          if (RuleJudge.weekdayOf(local(c.getString("at"))) != c.getInt("weekday")) bad += "weekday ${c.getString("at")}"
        }
        for (c in t.getJSONArray("inWindow").objects()) {
          val r = c.getJSONObject("rule")
          val got = RuleJudge.inWindow(r.getInt("days"), r.getInt("startMin"), r.optIntOrNull("endMin"), local(c.getString("at")))
          if (got != c.getBoolean("want")) bad += "inWindow: ${c.getString("name")}"
        }
        for (c in t.getJSONArray("isPassed").objects()) {
          val present = !c.isNull("entry")
          val left = if (present) c.getJSONObject("entry").let { e -> if (e.isNull("leftAtMs")) null else e.getLong("leftAtMs") } else null
          if (RuleJudge.isPassed(present, left, c.getLong("nowMs"), c.getInt("graceMin")) != c.getBoolean("want")) bad += "isPassed: ${c.getString("name")}"
        }
        for (c in t.getJSONArray("pickIntercept").objects()) {
          val rules = c.getJSONArray("rules").objects().map(::ruleOf)
          val hit = RuleJudge.pickIntercept(rules, c.getString("pkg"), local(c.getString("at")), c.getDouble("seed"))
          val want = if (c.isNull("want")) null else c.getString("want")
          if (hit?.ruleId != want) bad += "pickIntercept: ${c.getString("name")}"
        }
        for (c in t.getJSONArray("checkVerdict").objects()) {
          val r = c.getJSONObject("rule")
          val first = if (c.isNull("firstOpened")) null else local(c.getString("firstOpened")).timeInMillis
          val v = RuleJudge.checkVerdict(r.getString("kind"), r.getBoolean("enabled"), r.getInt("days"), r.getInt("startMin"), local(c.getString("at")), first, c.getBoolean("notified"))
          if (v != c.getString("want")) bad += "checkVerdict: ${c.getString("name")} ($v)"
        }
        assertEquals("[$zone] ${bad.joinToString("; ")}", 0, bad.size)
        n++
      }
    } finally {
      TimeZone.setDefault(original)
    }
    assertEquals(zones.size, n)
  }

  /** 상수가 TS 와 같다(lib/rules.ts) */
  @Test
  fun constantsMatchTs() {
    val root = generateSequence(File("").absoluteFile) { it.parentFile }.first { File(it, "lib/rules.ts").exists() }
    val ts = File(root, "lib/rules.ts").readText()
    assertTrue("CHECK_WINDOW_MIN", Regex("""CHECK_WINDOW_MIN = ${RuleJudge.CHECK_WINDOW_MIN};""").containsMatchIn(ts))
    assertTrue("GRACE_DEFAULT", Regex("""GRACE_DEFAULT = ${RuleJudge.GRACE_DEFAULT};""").containsMatchIn(ts))
    assertTrue("GRACE_CHOICES", ts.contains("GRACE_CHOICES = [${RuleJudge.GRACE_CHOICES.joinToString(", ")}]"))
  }
}
