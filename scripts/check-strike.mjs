#!/usr/bin/env node
/**
 * check:strike — 취소선(~~) 짝 검사 (`docs/DOC_DISCIPLINE.md` §5 "정정은 취소선").
 *
 * 왜: 2026-10-08 결정을 뒤집으며 취소선을 세 번 열고 안 닫았다. 닫히지 않은 취소선은 **뒤의 현역 문장까지 지워진 것처럼**
 *     보이게 하거나, 반대로 폐기된 추천이 현역처럼 남는다(RULE_SYSTEM 의 "최근 수정 규칙" 문장이 실제로 그랬다).
 *
 * 규칙: 문단(빈 줄로 나뉜 덩어리) 안에서 ~~ 개수가 짝수여야 한다. 표 줄은 줄마다. 코드 블록 안은 보지 않는다.
 *       여러 줄에 걸친 취소선(CLAUDE 기둥 6 · 결정 #12 · #15)은 한 문단 안이면 정상이다.
 * 🔴 대상 파일이 0 이면 FAIL(앵커가 사라진 가드가 조용히 통과하지 않게).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function oddSpots(text) {
  const lines = text.split(/\r?\n/);
  const bad = [];
  let fence = false;
  let para = [];
  // 인라인 코드(`...`) 안의 ~~ 는 취소선이 아니다(이 가드를 설명하는 README 줄이 첫 오탐이었다 · 2026-10-08)
  const count = (s) => (s.replace(/`[^`]*`/g, '').match(/~~/g) ?? []).length;
  const flush = () => {
    if (para.length && para.reduce((n, i) => n + count(lines[i]), 0) % 2 === 1) bad.push(para[0] + 1);
    para = [];
  };
  lines.forEach((l, i) => {
    const t = l.trim();
    if (t.startsWith('```')) { flush(); fence = !fence; return; }
    if (fence) return;
    if (t.startsWith('|')) { flush(); if (count(l) % 2 === 1) bad.push(i + 1); return; }
    if (!t) { flush(); return; }
    para.push(i);
  });
  flush();
  return bad;
}

// ── 🔴 변이 시험 ───────────────────────────────────────────────────────
const cases = [
  ['한 줄 정상', 'a ~~b~~ c', 0],
  ['한 줄 안 닫힘', 'a ~~b c', 1],
  ['여러 줄 한 문단 정상', '~~a\nb~~ c', 0],
  ['문단을 넘으면 안 됨', '~~a\n\nb~~', 2],
  ['표 줄은 줄마다', '| ~~A~~ | x |\n| ~~B | y |', 1],
  ['코드 블록 안은 무시', '```\n~~a\n```', 0],
  ['인라인 코드 안은 무시', '설명 `~~` 기호', 0],
  ['인라인 코드 밖은 센다', '`x` ~~a', 1],
];
for (const [name, text, want] of cases) {
  const got = oddSpots(text).length;
  if (got !== want) {
    console.error(`SELF-TEST FAIL: ${name} · 기대 ${want} · 실제 ${got}`);
    process.exit(2);
  }
}
// ──────────────────────────────────────────────────────────────────────

const files = ['CLAUDE.md', ...readdirSync(join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).map((f) => `docs/${f}`)];
if (files.length < 2) {
  console.error('check:strike FAIL: 대상 문서가 없다(앵커)');
  process.exit(1);
}
const bad = [];
for (const f of files) for (const line of oddSpots(readFileSync(join(ROOT, f), 'utf8'))) bad.push(`${f}:${line}`);
if (bad.length) {
  console.error(`check:strike FAIL (${bad.length}) — 취소선 ~~ 가 닫히지 않은 문단`);
  for (const b of bad) console.error('  ' + b);
  process.exit(1);
}
console.log(`check:strike OK · ${files.length}개 문서 · 변이 ${cases.length}종 통과`);
