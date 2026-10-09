#!/usr/bin/env node
/**
 * 오픈소스 고지 생성 — `npm run licenses:build` · 드리프트 검사 `npm run check:licenses`(= 이 스크립트 `--check`)
 * 정본 체크리스트: `common/PRE_LAUNCH_CHECK.md` §2.1(① 폰트: 시스템 폰트라 해당 없음 · ② 전이 의존까지 · ③ 바이트 비교 · ⑤ 카피레프트 0).
 *
 * - `dependencies` 에서 시작해 **전이 의존까지** node_modules 해석 규칙대로 따라간다(중첩 설치 포함 · 농구명가 446 → 607 함정).
 * - devDependencies 제외 · 라이선스를 못 읽으면 exit 1 · 저작권 줄이 없으면 비운다(🚫 지어내지 않는다) · 🚫 번역하지 않는다.
 * - 본문은 라이선스 **종류마다 한 벌**(농구명가: 523벌 → 1벌). 패키지마다 저작권 줄.
 * - 카피레프트: SPDX `OR` 는 전부 카피레프트일 때만, `AND` · `WITH` 는 하나라도 있으면 멈춘다(Re:Read 함정).
 * - 출력이 정렬돼 있고 시각이 없어야 `--check` 의 바이트 비교가 성립한다.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'licenses.json');
const CHECK = process.argv.includes('--check');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** node 해석 규칙: from 폴더에서 위로 올라가며 node_modules/<name> 을 찾는다 */
function resolveDir(name, from) {
  let dir = from;
  for (;;) {
    const cand = join(dir, 'node_modules', ...name.split('/'));
    if (existsSync(join(cand, 'package.json'))) return cand;
    if (dir === ROOT) return null;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

function licenseOf(pkg) {
  if (typeof pkg.license === 'string') return pkg.license;
  if (pkg.license && typeof pkg.license.type === 'string') return pkg.license.type;
  if (Array.isArray(pkg.licenses)) return pkg.licenses.map((l) => l.type).join(' OR ');
  if (typeof pkg.licenses === 'string') return pkg.licenses; // 옛 형식(requireg 등 · 농구명가 함정)
  return '';
}

function licenseFile(dir) {
  let files;
  try {
    files = readdirSync(dir);
  } catch {
    return null;
  }
  const f = files.filter((x) => /^(LICENSE|LICENCE|COPYING)/i.test(x)).sort()[0];
  return f ? readFileSync(join(dir, f), 'utf8').replace(/\r\n/g, '\n').trim() : null;
}

function copyrightOf(text) {
  if (!text) return '';
  for (const raw of text.split('\n').slice(0, 40)) {
    const line = raw.trim();
    if (/^copyright\b/i.test(line) && /\d{4}|\(c\)|©/i.test(line)) return line.replace(/\s+/g, ' ');
  }
  return '';
}

const COPYLEFT = /^(A?GPL|LGPL|CC-BY-SA|EUPL|OSL|SSPL)/i;
const WEAK = /^(MPL|EPL|CDDL)/i;
/** SPDX 식이 카피레프트 의무를 지우나: OR 는 전부일 때만 · AND/WITH 는 하나라도 */
function copyleft(expr, re) {
  const e = expr.replace(/[()]/g, ' ').trim();
  if (/\bOR\b/.test(e)) return e.split(/\bOR\b/).every((x) => copyleft(x, re));
  if (/\b(AND|WITH)\b/.test(e)) return e.split(/\b(?:AND|WITH)\b/).some((x) => copyleft(x, re));
  return re.test(e.trim());
}

const root = readJson(join(ROOT, 'package.json'));
const seen = new Map(); // name@version → row
const queue = Object.keys(root.dependencies ?? {}).map((name) => ({ name, from: ROOT }));
const missing = [];
const texts = {};
while (queue.length) {
  const { name, from } = queue.shift();
  const dir = resolveDir(name, from);
  if (!dir) {
    // 선택 의존(optionalDependencies)이 안 깔린 것은 번들에도 없다
    continue;
  }
  const pkg = readJson(join(dir, 'package.json'));
  const key = `${pkg.name}@${pkg.version}`;
  if (seen.has(key)) continue;
  const license = licenseOf(pkg);
  const text = licenseFile(dir);
  if (!license) missing.push(key);
  seen.set(key, { name: pkg.name, version: pkg.version, license, copyright: copyrightOf(text) });
  if (text && license && !texts[license]) texts[license] = text;
  for (const dep of Object.keys({ ...(pkg.dependencies ?? {}), ...(pkg.optionalDependencies ?? {}) })) queue.push({ name: dep, from: dir });
}

if (missing.length) {
  console.error(`licenses FAIL · 라이선스를 못 읽은 패키지 ${missing.length}개: ${missing.join(', ')}`);
  process.exit(1);
}
const packages = [...seen.values()].sort((a, b) => (a.name + a.version < b.name + b.version ? -1 : 1));
const hard = packages.filter((p) => copyleft(p.license, COPYLEFT));
if (hard.length) {
  console.error(`licenses FAIL · 카피레프트 ${hard.length}개: ${hard.map((p) => `${p.name}(${p.license})`).join(', ')}`);
  process.exit(1);
}
const weak = packages.filter((p) => copyleft(p.license, WEAK));
const sortedTexts = Object.fromEntries(Object.keys(texts).sort().map((k) => [k, texts[k]]));
const out = JSON.stringify({ packages, texts: sortedTexts }, null, 1) + '\n';

if (CHECK) {
  const cur = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (cur !== out) {
    console.error('check:licenses FAIL · assets/licenses.json 이 지금 설치본과 다르다 → npm run licenses:build');
    process.exit(1);
  }
  // 화면과 입구가 있어야 고지가 존재한다
  const screen = readFileSync(join(ROOT, 'app', 'licenses.tsx'), 'utf8');
  const settings = readFileSync(join(ROOT, 'app', 'settings.tsx'), 'utf8');
  if (!screen.includes('licenses.json') || !settings.includes("'/licenses'")) {
    console.error('check:licenses FAIL · 고지 화면(app/licenses.tsx) 또는 설정의 입구가 없다');
    process.exit(1);
  }
  console.log(`check:licenses OK · ${packages.length}개 · 종류 ${Object.keys(sortedTexts).length} · 카피레프트 0${weak.length ? ` · 🟡 약한 ${weak.length}(${weak.map((p) => p.name).join(', ')})` : ''}`);
} else {
  writeFileSync(OUT, out);
  console.log(`licenses:build · ${packages.length}개 · 종류 ${Object.keys(sortedTexts).length} → assets/licenses.json${weak.length ? ` · 🟡 약한 카피레프트 ${weak.length}` : ''}`);
}
