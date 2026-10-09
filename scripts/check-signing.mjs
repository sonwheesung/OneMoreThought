#!/usr/bin/env node
/**
 * check:signing — 릴리스 AAB 가 **업로드 키**로 서명됐나(`common/PLAY_FIRST_UPLOAD.md` §3 · `R8_OBFUSCATION.md` §2-C).
 * 🔴 디버그 키로 서명돼도 `jarsigner -verify` 는 통과한다. 그래서 인증서 지문을 공개값과 맞춘다.
 * 지문(SHA-256)은 공개값이다(콘솔이 화면에 띄운다). 비밀번호는 여기 없다.
 *   node scripts/check-signing.mjs [AAB 경로]
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const UPLOAD_SHA256 = '65:68:C1:8E:EC:19:8B:E9:4E:50:26:CA:E8:C9:E6:0D:69:7D:2A:BB:09:B2:54:10:FC:D1:D0:A0:EA:7C:56:F9';
const file = process.argv[2] ?? 'android/app/build/outputs/bundle/release/app-release.aab';
if (!existsSync(file)) {
  console.error(`check:signing FAIL · 파일이 없다: ${file}`);
  process.exit(1);
}
const out = execFileSync('keytool', ['-printcert', '-jarfile', file], { encoding: 'utf8' });
const sha = out.match(/SHA256:\s*([0-9A-F:]+)/)?.[1];
const owner = out.match(/Owner:\s*(.+)/)?.[1]?.trim();
if (!sha) {
  console.error('check:signing FAIL · 서명이 없다');
  process.exit(1);
}
if (/Android Debug/i.test(owner ?? '') || sha !== UPLOAD_SHA256) {
  console.error(`check:signing FAIL · 업로드 키가 아니다 · 주체 ${owner} · SHA-256 ${sha}`);
  process.exit(1);
}
console.log(`check:signing OK · ${owner} · SHA-256 ${sha}`);
