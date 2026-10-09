#!/usr/bin/env node
/**
 * check:release-url — 나갈 번들에 개발 머신 주소가 구워졌나 · 운영 주소가 실제로 들어갔나(`common/PRE_LAUNCH_CHECK.md` §4.0).
 * 🔴 둘을 같이 잰다: "나쁜 게 없다"만 보면 주소가 통째로 빠진 번들도 통과한다.
 *   node scripts/check-release-url.mjs [AAB 또는 APK 경로]   (기본: android/app/build/outputs/bundle/release/app-release.aab)
 */
import { existsSync } from 'node:fs';
import { zipEntries } from './lib-zip.mjs';

const file = process.argv[2] ?? 'android/app/build/outputs/bundle/release/app-release.aab';
if (!existsSync(file)) {
  console.error(`check:release-url FAIL · 파일이 없다: ${file}`);
  process.exit(1);
}
const entries = zipEntries(file);
const name = [...entries.keys()].find((k) => /(^|\/)assets\/index\.android\.bundle$/.test(k));
if (!name) {
  console.error('check:release-url FAIL · index.android.bundle 이 없다(디버그 빌드인가?)');
  process.exit(1);
}
// React Native 의 getDevServer.js 고정 폴백(`http://localhost:8081`)은 모든 릴리스 번들에 있다(우리 값 아님 · LinkMemo OTA_UPDATE 2026-09-15 실측).
// 이 한 문자열만 지우고 본다. 우리 포트는 8095 · 3900 이라 이 예외가 우리 값을 가리지 않는다.
const RN_FALLBACK = 'http://localhost:8081';
const text = entries.get(name)().toString('latin1').split(RN_FALLBACK).join('');

const MUST = ['https://vg-intervene-sync.vercel.app', 'https://common-server.vercel.app'];
const MUST_NOT = [/localhost/, /127\.0\.0\.1/, /10\.0\.2\.2/, /\b100\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, /\b192\.168\.\d{1,3}\.\d{1,3}\b/, /:8095\b/, /:3900\b/];

// 양성 대조: 패턴이 살아 있나
if (!MUST_NOT[0].test('http://localhost:3900') || !MUST_NOT[4].test('192.168.0.22')) {
  console.error('SELF-TEST FAIL');
  process.exit(2);
}
const bad = [];
for (const m of MUST) if (!text.includes(m)) bad.push(`운영 주소가 없다: ${m}`);
for (const r of MUST_NOT) {
  const hit = text.match(r);
  if (hit) bad.push(`개발 주소가 있다: ${hit[0]}`);
}
if (bad.length) {
  console.error(`check:release-url FAIL (${bad.length}) · ${file}`);
  for (const b of bad) console.error('  ' + b);
  process.exit(1);
}
console.log(`check:release-url OK · ${file} · 운영 ${MUST.length}개 있음 · 개발 주소 0`);
