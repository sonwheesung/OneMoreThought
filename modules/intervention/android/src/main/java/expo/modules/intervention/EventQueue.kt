package expo.modules.intervention

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import java.util.UUID

/**
 * 미전송 기록 대기열 `queue.jsonl`(docs/DATABASE.md §1.1 · §2.2 · 결정 #30).
 *
 * 한 줄 = 사건 하나 · 기기가 만든 UUID `id` 를 가진다(서버가 id 로 멱등하게 받는다).
 * 🔴 덧붙이기도 지우기도 이 객체가 같은 잠금 안에서 한다. JS 는 읽고(`read`) 서버가 받은 뒤 `ack(lastId)` 만 부른다.
 *    (JS 가 파일을 직접 고치면 Kotlin 이 덧붙이는 중에 줄이 사라질 수 있다.)
 * 상한 1MB(placeholder 2026-10-08): 넘으면 오래된 prompt · check 부터 버리고 진단에 queue_trim. 규칙 편집(rule_*)은 버리지 않는다.
 */
internal object EventQueue {
  private const val FILE = "queue.jsonl"
  const val MAX_BYTES = 1_000_000L
  private val lock = Any()

  private fun file(context: Context) = File(context.filesDir, FILE)

  /** 사건 하나. id · at 이 없으면 채운다 */
  fun append(context: Context, event: JSONObject) {
    if (!event.has("id")) event.put("id", UUID.randomUUID().toString())
    val line = event.toString().replace("\n", " ") + "\n"
    synchronized(lock) {
      val f = file(context)
      f.appendText(line)
      if (f.length() > MAX_BYTES) trim(context, f)
    }
  }

  /** 확인 화면 결과(DATABASE §2.2 `prompt`) */
  fun prompt(context: Context, ruleId: String, pkg: String, shownAt: Long, result: String, decideMs: Long?) {
    val o = JSONObject().put("type", "prompt").put("ruleId", ruleId).put("pkg", pkg).put("shownAt", shownAt)
      .put("result", result).put("tz", TimeZone.getDefault().id).put("dayKey", dayKeyOf(shownAt))
    if (decideMs != null) o.put("decideMs", decideMs)
    append(context, o)
  }

  /** 앞에서부터 max 줄(JSON 배열 문자열). 깨진 줄은 건너뛴다(그 줄은 ack 로 같이 지워진다) */
  fun read(context: Context, max: Int): String {
    val out = JSONArray()
    synchronized(lock) {
      val f = file(context)
      if (!f.exists()) return "[]"
      f.useLines { lines ->
        for (l in lines) {
          if (out.length() >= max) break
          if (l.isBlank()) continue
          try { out.put(JSONObject(l)) } catch (_: Exception) {}
        }
      }
    }
    return out.toString()
  }

  /** 서버가 받은 마지막 id 까지 지운다. 그 id 가 없으면 아무것도 안 지운다(다른 묶음의 ack 로 잘못 지우지 않게) */
  fun ack(context: Context, lastId: String): Int {
    synchronized(lock) {
      val f = file(context)
      if (!f.exists()) return 0
      val lines = f.readLines().filter { it.isNotBlank() }
      val idx = lines.indexOfFirst { idOf(it) == lastId }
      if (idx < 0) return 0
      val rest = lines.drop(idx + 1)
      writeAtomic(context, f, rest)
      return idx + 1
    }
  }

  fun count(context: Context): Int = synchronized(lock) {
    val f = file(context)
    if (!f.exists()) 0 else f.readLines().count { it.isNotBlank() }
  }

  /** 아직 안 올라간 규칙 편집이 있나(앱이 서버 규칙으로 캐시를 덮기 전에 먼저 올려야 한다 · DATABASE §2.1) */
  fun hasRuleEdits(context: Context): Boolean = synchronized(lock) {
    val f = file(context)
    f.exists() && f.readLines().any { it.contains("\"type\":\"rule_") }
  }

  private fun trim(context: Context, f: File) {
    val lines = f.readLines().filter { it.isNotBlank() }.toMutableList()
    var bytes = lines.sumOf { it.length + 1L }
    var dropped = 0
    val it = lines.iterator()
    while (bytes > MAX_BYTES * 3 / 4 && it.hasNext()) {
      val l = it.next()
      if (l.contains("\"type\":\"rule_")) continue
      bytes -= l.length + 1
      it.remove()
      dropped++
    }
    writeAtomic(context, f, lines)
    DiagLog.log(context, "queue_trim", JSONObject().put("dropped", dropped))
  }

  private fun writeAtomic(context: Context, f: File, lines: List<String>) {
    val tmp = File(context.filesDir, "$FILE.tmp")
    tmp.writeText(if (lines.isEmpty()) "" else lines.joinToString("\n", postfix = "\n"))
    if (!tmp.renameTo(f)) {
      f.delete()
      tmp.renameTo(f)
    }
  }

  private fun idOf(line: String): String? = try { JSONObject(line).optString("id") } catch (_: Exception) { null }

  /** 기기 로컬 자정 기준 날짜 키(lib/day.ts dayKeyOf 와 같다 · 결정 #26) */
  fun dayKeyOf(ms: Long): String {
    val c = Calendar.getInstance().apply { timeInMillis = ms }
    // 🔴 Locale.ROOT: 기기 언어에 따라 아라비아 숫자가 아닌 숫자가 나오지 않게
    return String.format(Locale.ROOT, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH))
  }
}
