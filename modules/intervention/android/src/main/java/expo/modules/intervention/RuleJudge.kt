package expo.modules.intervention

import java.util.Calendar
import kotlin.math.floor

/**
 * 규칙 판정 · `lib/rules.ts` · `lib/day.ts` 의 Kotlin 판(CLAUDE §5-8 · docs/RULE_SYSTEM.md §3 · §4).
 *
 * 🔴 TS 와 같은 답을 내야 한다. 같은 시험표 `tests/rules-cases.json` 을 단위 시험(`RuleJudgeTest`)이 읽는다.
 *    어느 한쪽을 고치면 다른 쪽도 고치고 둘 다 돌린다(`npm run check:rules` · `npm run check:rules:kt`).
 * 🔴 순수하다. Android API 를 쓰지 않는다(JVM 단위 시험에서 그대로 돈다). 시각 · 무작위 값(seed)은 인자로 받는다(결정 #26 F).
 * 🔴 java.time 대신 Calendar 를 쓴다(minSdk 24 · 디슈가링 없이). 기기 기본 시간대의 벽시계로 읽는다(결정 #26 B 자정).
 */
object RuleJudge {
  /** 부정확 알람 창(분 · placeholder 2026-10-06 · lib/rules.ts CHECK_WINDOW_MIN 과 같아야 한다) */
  const val CHECK_WINDOW_MIN = 10
  val GRACE_CHOICES = listOf(1, 3, 5, 10, 15, 30)
  const val GRACE_DEFAULT = 1

  data class Rule(
    val id: String,
    val kind: String, // "intercept" | "check"
    val name: String,
    val enabled: Boolean,
    /** 요일 비트(월=1 … 일=64) */
    val days: Int,
    val startMin: Int,
    val endMin: Int?,
    val targets: List<String>,
    val message: String,
    val graceMin: Int?,
    val updatedAt: Long,
  )

  data class Hit(val ruleId: String, val message: String, val ruleName: String)

  /** 요일(월=0 … 일=6). Calendar 는 일=1 … 토=7 이다 */
  fun weekdayOf(at: Calendar): Int = (at.get(Calendar.DAY_OF_WEEK) + 5) % 7

  fun minuteOfDay(at: Calendar): Int = at.get(Calendar.HOUR_OF_DAY) * 60 + at.get(Calendar.MINUTE)

  fun hasDay(days: Int, wd: Int): Boolean = (days and (1 shl wd)) != 0

  /** 자정을 넘는 시간대는 시작한 날의 요일로 본다(결정 #26 C). 시작 == 끝 은 언제나 거짓 */
  fun inWindow(days: Int, startMin: Int, endMin: Int?, at: Calendar): Boolean {
    if (endMin == null || endMin == startMin) return false
    val min = minuteOfDay(at)
    val today = weekdayOf(at)
    if (startMin < endMin) return hasDay(days, today) && min >= startMin && min < endMin
    val yesterday = (today + 6) % 7
    if (min >= startMin) return hasDay(days, today)
    if (min < endMin) return hasDay(days, yesterday)
    return false
  }

  fun inWindow(rule: Rule, at: Calendar): Boolean = inWindow(rule.days, rule.startMin, rule.endMin, at)

  /** 통과 상태: entryPresent=false 면 통과 없음 · leftAtMs=null 이면 앞에 있는 중 · 벗어나고 유예가 지나면 끝 */
  fun isPassed(entryPresent: Boolean, leftAtMs: Long?, nowMs: Long, graceMin: Int): Boolean {
    if (!entryPresent) return false
    if (leftAtMs == null) return true
    return nowMs - leftAtMs <= graceMin * 60_000L
  }

  /** 겹치면 한 번만 · id 로 정렬한 뒤 seed 로 하나(결정 #26 F · TS 의 `a.id < b.id` 와 같은 UTF-16 사전순) */
  fun pickIntercept(rules: List<Rule>, pkg: String, at: Calendar, seed: Double): Hit? {
    val hits = rules
      .filter { it.kind == "intercept" && it.enabled && pkg in it.targets && inWindow(it, at) }
      .sortedWith { a, b -> a.id.compareTo(b.id) }
    if (hits.isEmpty()) return null
    val s = seed.coerceIn(0.0, 0.999999999)
    val r = hits[floor(s * hits.size).toInt()]
    return Hit(r.id, r.message, r.name)
  }

  /** 실행 확인: 'notify' · 'already' · 'notified' · 'not_today' · 'before' · 'missed' · 'off' */
  fun checkVerdict(kind: String, enabled: Boolean, days: Int, startMin: Int, at: Calendar, firstOpenedMs: Long?, notifiedToday: Boolean): String {
    if (kind != "check" || !enabled) return "off"
    if (!hasDay(days, weekdayOf(at))) return "not_today"
    val min = minuteOfDay(at)
    if (min < startMin) return "before"
    if (notifiedToday) return "notified"
    if (firstOpenedMs != null && firstOpenedMs <= at.timeInMillis) return "already"
    if (min >= startMin + CHECK_WINDOW_MIN) return "missed"
    return "notify"
  }
}
