#!/usr/bin/env node
/**
 * check:rules:kt — Kotlin 판정(`RuleJudge.kt`)이 TS 와 같은 시험표(`tests/rules-cases.json`)를 통과하나(CLAUDE §5-8).
 *
 * 🔴 `verify` 체인에 넣지 않는다: gradle 이 30초 넘게 걸리고 `android/`(prebuild 산출물 · 커밋 안 함)가 있어야 돈다.
 *    대신 `lib/rules.ts` · `lib/day.ts` · `RuleJudge.kt` · 시험표 중 하나라도 고치면 반드시 같이 돌린다(README §3).
 * 🔴 "BUILD SUCCESSFUL" 만 믿지 않는다. 결과 XML 에서 시험 수가 0 이 아닌지 · 실패 0 인지 읽는다(시험이 안 돌아도 빌드는 성공한다).
 * 양성 대조(2026-10-08): 자정 넘김을 "그 시각의 요일"로 바꾼 변이 → sameAnswersAsTs FAILED 를 확인했다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ANDROID = join(ROOT, 'android');
const RESULT = join(ROOT, 'modules/intervention/android/build/test-results/testDebugUnitTest/TEST-expo.modules.intervention.RuleJudgeTest.xml');

if (!existsSync(ANDROID)) {
  console.error('check:rules:kt — android/ 가 없다. 먼저 `npx expo prebuild --platform android`');
  process.exit(1);
}
const env = { ...process.env };
if (!env.ANDROID_HOME && !env.ANDROID_SDK_ROOT && env.LOCALAPPDATA) env.ANDROID_HOME = join(env.LOCALAPPDATA, 'Android', 'Sdk');

rmSync(RESULT, { force: true }); // 지난번 결과를 이번 것으로 착각하지 않는다
const gradlew = process.platform === 'win32' ? join(ANDROID, 'gradlew.bat') : './gradlew';
const r = spawnSync(gradlew, [':intervention:testDebugUnitTest', '-q'], { cwd: ANDROID, env, encoding: 'utf8', shell: process.platform === 'win32' });
if (!existsSync(RESULT)) {
  console.error(`check:rules:kt FAIL — 결과 파일이 없다(gradle 종료 ${r.status})\n${(r.stdout ?? '') + (r.stderr ?? '')}`.slice(0, 4000));
  process.exit(1);
}
const xml = readFileSync(RESULT, 'utf8');
const n = (k) => Number(new RegExp(`${k}="(\\d+)"`).exec(xml)?.[1] ?? NaN);
const tests = n('tests');
const failures = n('failures') + n('errors');
if (!(tests > 0) || failures !== 0 || r.status !== 0) {
  console.error(`check:rules:kt FAIL — 시험 ${tests} · 실패 ${failures} · gradle 종료 ${r.status}`);
  process.exit(1);
}
console.log(`check:rules:kt OK · Kotlin 시험 ${tests}개 · 같은 시험표 · 시간대 4개`);
