#!/usr/bin/env node
/**
 * 앱 아이콘 만들기 — 🔴 자리표시(placeholder · 2026-10-09). 시안 세션(연출 사전)이 정식 아이콘을 내면 바꾼다.
 * 결정 #33 «새벽 호수» 색(theme/tokens.ts light accent → accentEnd · 민트 번짐). 글자 · 서비스명 없음(미결정 N).
 * 모양: 잔잔한 호수에 떨어진 한 방울 — 가운데 점 + 물결 두 겹("한 번 더 생각" · 확인 화면 물결 표시와 같은 결).
 *
 *   npm i --no-save sharp && node tools/make-icon.mjs
 * 출력: assets/brand/{icon.png 1024 · adaptive-fg.png · adaptive-bg.png · store-512.png · splash.png} + 원본 SVG
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const sharp = (await import('sharp')).default;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'brand');

const ACCENT = '#5F52D3';
const ACCENT_END = '#7656D2';
const MINT = '#DAF1E9';

const bg = (s) => `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ACCENT}"/><stop offset="1" stop-color="${ACCENT_END}"/>
    </linearGradient>
    <radialGradient id="m" cx="0.85" cy="0.2" r="0.6">
      <stop offset="0" stop-color="${MINT}" stop-opacity="0.45"/><stop offset="1" stop-color="${MINT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${s}" height="${s}" fill="url(#g)"/>
  <rect width="${s}" height="${s}" fill="url(#m)"/>`;

// 가운데 기준 · 크기 비율 k(1 = 1024 캔버스 전체에 그릴 때)
const mark = (s, k) => {
  const c = s / 2;
  const u = (s / 1024) * k;
  return `
  <circle cx="${c}" cy="${c}" r="${46 * u}" fill="#FFFFFF"/>
  <circle cx="${c}" cy="${c}" r="${150 * u}" fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="${30 * u}"/>
  <circle cx="${c}" cy="${c}" r="${262 * u}" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="${24 * u}"/>`;
};

const svg = (s, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${body}</svg>`;

const files = {
  'icon.svg': svg(1024, bg(1024) + mark(1024, 1)),
  // 적응형: 108dp 중 가운데 66dp 만 안전 → 전경을 그 안에 둔다(0.62배)
  'adaptive-fg.svg': svg(1024, mark(1024, 0.62)),
  'adaptive-bg.svg': svg(1024, bg(1024)),
  // 스플래시: 투명 바탕 위 마크(바탕색은 app.json splash.backgroundColor)
  'splash.svg': svg(1024, `<g>${mark(1024, 0.8).replaceAll('#FFFFFF', ACCENT)}</g>`),
};

for (const [name, text] of Object.entries(files)) writeFileSync(join(OUT, name), text);
const png = (src, out, size) => sharp(Buffer.from(files[src])).resize(size, size).png().toFile(join(OUT, out));
await png('icon.svg', 'icon.png', 1024);
await png('icon.svg', 'store-512.png', 512);
await png('adaptive-fg.svg', 'adaptive-fg.png', 1024);
await png('adaptive-bg.svg', 'adaptive-bg.png', 1024);
await png('splash.svg', 'splash.png', 1024);
console.log('icons →', OUT);
