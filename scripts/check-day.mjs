#!/usr/bin/env node
/**
 * check:day — 하루 경계 `lib/day.ts` · 결정 #26(자정) · CLAUDE §5-7 · mission check-day 승계.
 *
 * 🔴 시간대를 바꿔 자식 프로세스로 돈다. 서머타임 전환일(뉴욕 3/8 · 11/1 · 로드하우 30분 전환)에도
 *    날짜 이동이 하루씩 정확히 움직이고, 없는 날짜를 조용히 넘기지 않는지 본다.
 * 🔴 양성 대조: 틀린 변이(UTC 로 날짜 키 · 일요일=0 요일 · 24시간 ms 로 날짜 이동)를 먼저 넣어 FAIL 을 본다.
 */
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const self = fileURLToPath(import.meta.url);
const MUTANT_COUNT = 4;
const ZONES = ['Asia/Seoul', 'America/New_York', 'Australia/Lord_Howe', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'UTC'];

if (!process.env.CHECK_DAY_CHILD) {
  let failed = 0;
  const caughtAll = new Set();
  for (const tz of ZONES) {
    const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', self], {
      env: { ...process.env, TZ: tz, CHECK_DAY_CHILD: '1' },
      encoding: 'utf8',
    });
    if (r.status !== 0) {
      failed++;
      console.error(`[${tz}] FAIL\n${r.stdout}${r.stderr}`);
    } else {
      process.stdout.write(`[${tz}] ${r.stdout.trim()}\n`);
    }
  }
  if (failed) process.exit(1);
  console.log(`check:day OK · 시간대 ${ZONES.length}개`);
  process.exit(0);
}

const day = await import(pathToFileURL(join(ROOT, 'lib/day.ts')).href);

function run(d) {
  const bad = [];
  const eq = (name, got, want) => { if (got !== want) bad.push(`${name}: ${got} ≠ ${want}`); };
  const throws = (name, fn) => { try { fn(); bad.push(`${name}: 던지지 않았다`); } catch { /* 기대 */ } };

  // 자정 경계(결정 #26): 23:59 와 00:00 은 다른 날
  eq('23:59 키', d.dayKeyOf(new Date(2026, 9, 9, 23, 59)), '2026-10-09');
  eq('00:00 키', d.dayKeyOf(new Date(2026, 9, 10, 0, 0)), '2026-10-10');
  eq('00:30 키', d.dayKeyOf(new Date(2026, 9, 10, 0, 30)), '2026-10-10');
  // 요일(월=0)
  eq('금', d.weekdayOf(new Date(2026, 9, 9, 12)), 4);
  eq('일', d.weekdayOf(new Date(2026, 9, 11, 12)), 6);
  eq('월', d.weekdayOf(new Date(2026, 9, 12, 0, 0)), 0);
  // 날짜 이동: 월말 · 연말 · 윤년 · 서머타임 전환일
  eq('월말', d.shiftDay('2026-10-31', 1), '2026-11-01');
  eq('연말', d.shiftDay('2026-12-31', 1), '2027-01-01');
  eq('윤년', d.shiftDay('2028-02-28', 1), '2028-02-29');
  eq('평년', d.shiftDay('2026-02-28', 1), '2026-03-01');
  eq('뒤로', d.shiftDay('2026-03-01', -1), '2026-02-28');
  eq('뉴욕 봄', d.shiftDay('2026-03-07', 1), '2026-03-08');
  eq('뉴욕 봄 다음', d.shiftDay('2026-03-08', 1), '2026-03-09');
  eq('뉴욕 가을', d.shiftDay('2026-11-01', 1), '2026-11-02');
  eq('로드하우 봄', d.shiftDay('2026-10-04', 1), '2026-10-05');
  eq('로드하우 가을', d.shiftDay('2026-04-05', -1), '2026-04-04');
  eq('1년', d.shiftDay('2026-01-01', 365), '2027-01-01');
  // 없는 날짜 · 엉터리 키는 던진다
  throws('2/30', () => d.noonOf('2026-02-30'));
  throws('13월', () => d.noonOf('2026-13-01'));
  throws('형식', () => d.noonOf('2026-1-1'));
  throws('NaN', () => d.dayKeyOf(new Date(NaN)));
  // 하루 안의 분 · 요일 비트
  eq('분 00:00', d.minuteOfDay(new Date(2026, 9, 9, 0, 0)), 0);
  eq('분 23:59', d.minuteOfDay(new Date(2026, 9, 9, 23, 59)), 1439);
  eq('비트 금 ∈ 평일', d.hasDay(31, 4), true);
  eq('비트 토 ∉ 평일', d.hasDay(31, 5), false);
  eq('비트 일 ∈ 매일', d.hasDay(127, 6), true);
  // 그 날 0시: 같은 날의 어느 시각이든 같은 값 · 키가 같다
  const s = d.dayStartMs(new Date(2026, 9, 9, 23, 59));
  eq('0시 같은 값', d.dayStartMs(new Date(2026, 9, 9, 0, 1)), s);
  eq('0시 키', d.dayKeyOf(new Date(s)), '2026-10-09');
  eq('0시 전 1ms 는 어제', d.dayKeyOf(new Date(s - 1)), '2026-10-08');
  return bad;
}

const mutants = [
  ['UTC 날짜 키', { ...day, dayKeyOf: (at) => at.toISOString().slice(0, 10) }],
  ['일요일=0 요일', { ...day, weekdayOf: (at) => at.getDay() }],
  ['24시간 ms 로 이동', { ...day, shiftDay: (k, n) => day.dayKeyOf(new Date(new Date(k + 'T00:00').getTime() + n * 86_400_000)) }],
  ['없는 날짜 넘김', { ...day, noonOf: (k) => { const [y, m, dd] = k.split('-').map(Number); return new Date(y, m - 1, dd, 12); } }],
];
// 시간대마다 잡히는 변이가 다르다(UTC 에서는 UTC 키가 맞는다 · 서머타임 없는 곳에서는 24시간 이동이 맞는다).
// 🔴 시간대와 무관하게 잡혀야 하는 것만 여기서 단정한다. 나머지는 이 시간대에서 잡힌 수만 보고한다.
const MUST = new Set(['일요일=0 요일', '없는 날짜 넘김']);
const caught = [];
for (const [name, m] of mutants) {
  const hit = run(m).length > 0;
  if (hit) caught.push(name);
  else if (MUST.has(name)) {
    console.error(`SELF-TEST FAIL: 변이 "${name}" 를 못 잡았다`);
    process.exit(2);
  }
}

const bad = run(day);
if (bad.length) {
  for (const b of bad) console.error('  ' + b);
  process.exit(1);
}
if (mutants.length !== MUTANT_COUNT) { console.error('MUTANT_COUNT 를 고쳐라'); process.exit(2); }
console.log(`변이 ${caught.length}/${mutants.length} · 잡힘: ${caught.join(',')}`);
