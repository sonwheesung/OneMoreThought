#!/usr/bin/env node
/**
 * check:docs — 문서에 적힌 개수 ⇄ 실제로 센 값 (`docs/DOC_DISCIPLINE.md` §4).
 *
 * 승계: mission `scripts/check-docs.mjs`(2026-10-08 · 앵커만 이 저장소 문구로 바꿨다 · 원본은 Re:Read).
 * 🔴 세는 법을 적어 두는 것만으로는 안 잡힌다(농구명가 2026-08-30: 아무도 명령을 안 돌려 세 곳이 이미 틀려 있었다).
 *    이 저장소도 2026-10-06 첫날 README 의 docs 수가 7 로 틀려 있었다(실제 6 · 손으로 잡았다).
 * 🔴 앵커가 사라져도 FAIL 한다. 문구를 바꿔 가드가 조용히 통과하는 것이 가장 나쁘다.
 * 🚫 실측치(감지 지연 ms · 배터리)는 대상이 아니다. 세면 나오는 수만 본다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const mdIn = (dir) => readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.md')).length;

/** 문서에서 숫자 하나를 뽑는다. 앵커가 없으면 null → FAIL */
function stated(text, pattern) {
  const m = text.match(pattern);
  return m ? Number(m[1]) : null;
}

const claude = read('CLAUDE.md');
const readme = read('docs/README.md');
const decisions = (claude.match(/^\*\*#/gm) ?? []).length;
const openItems = (claude.match(/^\| [A-Z] \|/gm) ?? []).length;
const closedItems = (claude.match(/^\| ~~[A-Z]~~ \|/gm) ?? []).length;
const verifyChain = JSON.parse(read('package.json')).scripts.verify.split('&&').length;

// ── 🔴 양성 대조 ───────────────────────────────────────────────────────
if (stated('결정 **7건**', /결정 \*\*(\d+)건\*\*/) !== 7) {
  console.error('SELF-TEST FAIL: stated() 가 숫자를 못 뽑는다');
  process.exit(2);
}
if (stated('앵커 없음', /결정 \*\*(\d+)건\*\*/) !== null) {
  console.error('SELF-TEST FAIL: 앵커가 없는데 null 이 아니다');
  process.exit(2);
}
if (decisions === 0 || openItems + closedItems === 0 || verifyChain < 2) {
  console.error(`SELF-TEST FAIL: 세는 쪽이 죽었다(결정 ${decisions} · 미결정 ${openItems} · 닫힌 미결정 ${closedItems} · verify ${verifyChain})`);
  process.exit(2);
}
// ──────────────────────────────────────────────────────────────────────

const checks = [
  { what: '확정 결정(README)', stated: stated(readme, /결정 \*\*(\d+)건\*\*/), actual: decisions },
  { what: '미결정(README)', stated: stated(readme, /미결정 \*\*(\d+)건\*\*/), actual: openItems },
  { what: 'docs 파일', stated: stated(readme, /바로 아래 \*\*(\d+)개\*\*/), actual: mdIn('docs') },
  { what: 'docs/review 파일', stated: stated(readme, /`docs\/review\/` \*\*(\d+)개\*\*/), actual: mdIn('docs/review') },
  { what: 'verify 체인(README §3)', stated: stated(readme, /아래 \*\*(\d+)개\*\*를 순서대로 돌린다/), actual: verifyChain },
];

const bad = [];
for (const c of checks) {
  if (c.stated === null) bad.push(`${c.what}: 🔴 문서에서 앵커를 못 찾았다(문구가 바뀌었나?) · 실제 ${c.actual}`);
  else if (c.stated !== c.actual) bad.push(`${c.what}: 문서 ${c.stated} ≠ 실제 ${c.actual}`);
}

if (bad.length) {
  console.error(`check:docs FAIL (${bad.length})`);
  for (const m of bad) console.error('  ' + m);
  process.exit(1);
}
console.log(`check:docs OK · ${checks.length}축 · 결정 ${decisions} · 미결정 ${openItems} · verify ${verifyChain}`);
