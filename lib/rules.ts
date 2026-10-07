import { hasDay, minuteOfDay, weekdayOf, type Weekday } from './day.ts';

/**
 * 규칙 판정 순수 모듈 · `docs/RULE_SYSTEM.md` §3 · §4 · CLAUDE §5-8.
 *
 * 🔴 순수 · 결정적이다. 시각 · 무작위 값(seed)을 **인자로** 받는다(결정 #26 F: 겹치면 무작위 하나 · 그래도 시험할 수 있게).
 * 🔴 Kotlin(접근성 서비스)이 같은 규칙을 구현한다. `tests/rules-cases.json` 을 두 쪽이 같이 통과해야 한다.
 */

export type RuleKind = 'intercept' | 'check';

export interface Rule {
  id: string;
  kind: RuleKind;
  name: string;
  enabled: boolean;
  /** 요일 비트(월=1 … 일=64) */
  days: number;
  /** intercept: 시작 분 · check: 확인 시각 분(0 ~ 1439) */
  startMin: number;
  /** intercept: 끝 분(시작보다 작으면 자정을 넘는다) · check: 쓰지 않음 */
  endMin?: number;
  targets: string[];
  message: string;
  /** 다시 묻기 유예(분 · 결정 #27 · #28 · #29). 1 · 3 · 5 · 10 · 15 · 30 · 기본 1 */
  graceMin?: number;
  updatedAt: number;
}

export const GRACE_CHOICES = [1, 3, 5, 10, 15, 30] as const;
export const GRACE_DEFAULT = 1;
/** 부정확 알람 창(분 · placeholder 2026-10-06 · ANDROID_PLATFORM §4.2). 창이 끝난 뒤 깨면 놓친 것(결정 #28 J) */
export const CHECK_WINDOW_MIN = 10;

/**
 * 그 시각이 intercept 규칙의 시간대 안인가. 자정을 넘는 시간대는 **시작한 날의 요일**로 본다(결정 #26 C).
 * 시작 == 끝 은 저장하지 않는다(RULE_SYSTEM §1.1). 들어와도 언제나 거짓이다.
 */
export function inWindow(rule: Pick<Rule, 'days' | 'startMin' | 'endMin'>, at: Date): boolean {
  const end = rule.endMin;
  if (end === undefined || end === rule.startMin) return false;
  const min = minuteOfDay(at);
  const today = weekdayOf(at);
  if (rule.startMin < end) return hasDay(rule.days, today) && min >= rule.startMin && min < end;
  // 자정을 넘는다: 오늘 시작분 이후(오늘 요일) 또는 오늘 끝분 전(어제 요일)
  const yesterday = ((today + 6) % 7) as Weekday;
  if (min >= rule.startMin) return hasDay(rule.days, today);
  if (min < end) return hasDay(rule.days, yesterday);
  return false;
}

/** 통과 상태(RULE_SYSTEM §3.3): 앞에 있는 동안(leftAt=null) 유지 · 벗어나고 유예가 지나면 끝 */
export function isPassed(entry: { leftAtMs: number | null } | undefined, nowMs: number, graceMin: number): boolean {
  if (!entry) return false;
  if (entry.leftAtMs === null) return true;
  return nowMs - entry.leftAtMs <= graceMin * 60_000;
}

export interface InterceptHit {
  ruleId: string;
  message: string;
  /** 둘째 줄의 재료(결정 #27 M · 문구는 화면이 만든다) */
  ruleName: string;
}

/**
 * 대상 앱이 앞에 나왔을 때 확인 화면을 띄울 규칙. 없으면 null.
 * 겹치면 **한 번만** · 메시지는 무작위로 하나(결정 #26 F). `seed` 는 [0, 1).
 * 순서가 결과를 흔들지 않게 후보를 id 로 정렬한 뒤 고른다(TS · Kotlin 같은 답).
 */
export function pickIntercept(rules: Rule[], pkg: string, at: Date, seed: number): InterceptHit | null {
  const hits = rules
    .filter((r) => r.kind === 'intercept' && r.enabled && r.targets.includes(pkg) && inWindow(r, at))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (hits.length === 0) return null;
  const s = Math.min(Math.max(seed, 0), 0.999999999);
  const r = hits[Math.floor(s * hits.length)]!;
  return { ruleId: r.id, message: r.message, ruleName: r.name };
}

export type CheckVerdict = 'notify' | 'already' | 'notified' | 'not_today' | 'before' | 'missed' | 'off';

/**
 * 실행 확인: 지금 알림을 보내나(RULE_SYSTEM §4.1 · 결정 #4 · #26 K · #28 J).
 * firstOpenedMs = 오늘 0시 이후 그 앱이 처음 앞에 나온 시각(없으면 null).
 */
export function checkVerdict(
  rule: Pick<Rule, 'kind' | 'enabled' | 'days' | 'startMin'>,
  at: Date,
  firstOpenedMs: number | null,
  notifiedToday: boolean,
): CheckVerdict {
  if (rule.kind !== 'check' || !rule.enabled) return 'off';
  if (!hasDay(rule.days, weekdayOf(at))) return 'not_today';
  const min = minuteOfDay(at);
  if (min < rule.startMin) return 'before';
  if (notifiedToday) return 'notified';
  if (firstOpenedMs !== null && firstOpenedMs <= at.getTime()) return 'already';
  if (min >= rule.startMin + CHECK_WINDOW_MIN) return 'missed';
  return 'notify';
}
