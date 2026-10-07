#!/usr/bin/env node
/**
 * check:rules — 규칙 판정 시험표(`tests/rules-cases.json`) · `docs/RULE_SYSTEM.md` · CLAUDE §5-8 · 결정 #26 · #28.
 *
 * 🔴 같은 표를 Kotlin(접근성 서비스)도 통과해야 한다(Phase 1 Kotlin 단위 시험 · 아직 ⏸).
 * 🔴 시간대를 바꿔 자식 프로세스로 돈다(서머타임이 있는 뉴욕 · 로드하우 포함 · mission check-day 승계).
 *    표의 시각은 로컬 벽시계라 어느 시간대에서도 같은 답이어야 한다.
 * 🔴 양성 대조: 틀린 변이 구현을 같은 표에 넣어 FAIL 이 나는지 먼저 본다(못 잡는 표는 아무것도 안 보는 표다).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const self = fileURLToPath(import.meta.url);
const ZONES = ['Asia/Seoul', 'America/New_York', 'Australia/Lord_Howe', 'UTC'];

if (!process.env.CHECK_RULES_CHILD) {
  let failed = 0;
  for (const tz of ZONES) {
    const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', self], {
      env: { ...process.env, TZ: tz, CHECK_RULES_CHILD: '1' },
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
  console.log(`check:rules OK · 시간대 ${ZONES.length}개`);
  process.exit(0);
}

// ── 자식: 한 시간대에서 표 전부 ─────────────────────────────────────
const day = await import(pathToFileURL(join(ROOT, 'lib/day.ts')).href);
const rules = await import(pathToFileURL(join(ROOT, 'lib/rules.ts')).href);
const T = JSON.parse(readFileSync(join(ROOT, 'tests/rules-cases.json'), 'utf8'));

/** "YYYY-MM-DDTHH:MM" → 로컬 Date(시간대 없음) */
function local(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
  if (!m) throw new Error(`시각 형식: ${s}`);
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}

function run(impl) {
  const bad = [];
  for (const c of T.weekdays) if (day.weekdayOf(local(c.at)) !== c.weekday) bad.push(`weekday ${c.at}`);
  for (const c of T.inWindow) if (impl.inWindow(c.rule, local(c.at)) !== c.want) bad.push(`inWindow: ${c.name}`);
  for (const c of T.isPassed) if (impl.isPassed(c.entry ?? undefined, c.nowMs, c.graceMin) !== c.want) bad.push(`isPassed: ${c.name}`);
  for (const c of T.pickIntercept) {
    const hit = impl.pickIntercept(c.rules, c.pkg, local(c.at), c.seed);
    if ((hit ? hit.ruleId : null) !== c.want) bad.push(`pickIntercept: ${c.name}`);
  }
  for (const c of T.checkVerdict) {
    const first = c.firstOpened ? local(c.firstOpened).getTime() : null;
    const v = impl.checkVerdict(c.rule, local(c.at), first, c.notified);
    if (v !== c.want) bad.push(`checkVerdict: ${c.name} (${v})`);
  }
  return bad;
}

// 🔴 양성 대조 변이: 자정을 넘는 시간대를 "그 시각의 요일"로 보는 틀린 구현(#26 C 의 반대)
const mutantCrossDay = {
  ...rules,
  inWindow(rule, at) {
    if (rule.endMin === undefined || rule.endMin === rule.startMin) return false;
    const min = day.minuteOfDay(at);
    const inRange = rule.startMin < rule.endMin ? min >= rule.startMin && min < rule.endMin : min >= rule.startMin || min < rule.endMin;
    return inRange && day.hasDay(rule.days, day.weekdayOf(at));
  },
};
// 변이: 겹칠 때 정렬 없이 배열 순서로(TS · Kotlin 이 갈라질 자리)
const mutantNoSort = {
  ...rules,
  pickIntercept(rs, pkg, at, seed) {
    const hits = rs.filter((r) => r.kind === 'intercept' && r.enabled && r.targets.includes(pkg) && rules.inWindow(r, at));
    if (!hits.length) return null;
    const r = hits[Math.floor(Math.min(seed, 0.999999) * hits.length)];
    return { ruleId: r.id, message: r.message, ruleName: r.name };
  },
};
// 변이: 놓친 알림도 보낸다(#28 J 의 반대)
const mutantLate = {
  ...rules,
  checkVerdict(rule, at, first, notified) {
    const v = rules.checkVerdict(rule, at, first, notified);
    return v === 'missed' ? 'notify' : v;
  },
};
for (const [name, m] of [['자정 넘김 요일', mutantCrossDay], ['겹침 정렬 없음', mutantNoSort], ['놓친 알림 보냄', mutantLate]]) {
  if (run(m).length === 0) {
    console.error(`SELF-TEST FAIL: 변이 "${name}" 를 표가 못 잡았다`);
    process.exit(2);
  }
}

const bad = run(rules);
if (bad.length) {
  for (const b of bad) console.error('  ' + b);
  process.exit(1);
}
const n = T.weekdays.length + T.inWindow.length + T.isPassed.length + T.pickIntercept.length + T.checkVerdict.length;
console.log(`${n}케이스 · 변이 3종 검출`);
