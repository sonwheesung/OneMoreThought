/**
 * "하루"의 경계와 요일 · 결정 #26(기기 시간 **자정**) · `docs/RULE_SYSTEM.md` §2.
 *
 * 🔴 날짜 · 요일 · 하루 안의 분을 계산하는 곳은 여기 하나다(CLAUDE §5-7). 화면 · 판정 · 서버 올리기가 각자 자르지 않는다.
 * 🔴 순수하다. expo · 로케일 · 저장소를 안 쓴다. 가드(`scripts/check-day.mjs`)가 node 에서 그대로 돈다.
 * 🔴 Kotlin(접근성 서비스)도 같은 규칙을 쓴다. 같은 시험표(`tests/rules-cases.json`)로 묶는다(CLAUDE §5-8).
 *
 * 승계: mission `lib/day.ts`(새벽 4시 · 정오 기준 날짜 이동 · 없는 날짜 거부). 여기서는 경계를 자정으로 되돌렸다.
 */

/** 날짜 키 `YYYY-MM-DD`(기기 로컬 · 자정 기준). 문자열 비교가 곧 날짜 비교다 */
export type DayKey = string;

/** 요일 비트: 월=0 … 일=6. 규칙의 `days` 는 이 비트들의 합이다(월=1 · 화=2 · … · 일=64) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function dayKeyOf(at: Date): DayKey {
  if (Number.isNaN(at.getTime())) throw new Error('시각을 못 읽었다');
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, '0');
  const d = String(at.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 오늘. `now` 를 받는 이유: 가드와 테스트가 시계를 주입한다 */
export function todayKey(now: Date = new Date()): DayKey {
  return dayKeyOf(now);
}

/** 키 → 그 날짜의 정오 로컬 `Date`(서머타임 전환일에도 날짜가 안 밀린다 · mission 승계) */
export function noonOf(key: DayKey): Date {
  const match = DAY_KEY.exec(key);
  if (!match) throw new Error(`날짜 키가 이상하다: ${key}`);
  const t = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  // 🔴 2월 30일 같은 키를 조용히 3월 2일로 넘기지 않는다
  if (dayKeyOf(t) !== key) throw new Error(`없는 날짜다: ${key}`);
  return t;
}

export function shiftDay(key: DayKey, days: number): DayKey {
  const t = noonOf(key);
  t.setDate(t.getDate() + days);
  return dayKeyOf(t);
}

/** 그 시각의 요일(월=0 … 일=6). 🚫 로케일을 따르지 않는다 */
export function weekdayOf(at: Date): Weekday {
  return ((at.getDay() + 6) % 7) as Weekday;
}

/** 그 시각이 하루 중 몇 분째인가(0 ~ 1439 · 로컬 벽시계) */
export function minuteOfDay(at: Date): number {
  return at.getHours() * 60 + at.getMinutes();
}

/** 요일 비트 집합에 그 요일이 들었나 */
export function hasDay(days: number, wd: Weekday): boolean {
  return (days & (1 << wd)) !== 0;
}

/** 그 날 0시(로컬)의 ms. 실행 확인의 "오늘 처음 열었나" 조회 시작점(결정 #26 K) */
export function dayStartMs(at: Date): number {
  return new Date(at.getFullYear(), at.getMonth(), at.getDate(), 0, 0, 0, 0).getTime();
}
