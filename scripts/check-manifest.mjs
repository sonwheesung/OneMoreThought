#!/usr/bin/env node
/**
 * check:manifest — 쓰지 않기로 한 권한 · 접근성 서비스가 읽지 않기로 한 것 (`docs/ANDROID_PLATFORM.md` §2 · §5 · §8.6).
 *
 * 왜: 이 앱의 존립이 Play 정책에 걸려 있다(기획서 §22). 그리고 형제 Re:Read · LinkMemo 에서
 *     Expo 템플릿이 `SYSTEM_ALERT_WINDOW` 를 몰래 넣었다(처리방침과 어긋났다).
 *
 * 축(소스 기준):
 *   ① app.json `android.blockedPermissions` 에 금지 권한이 전부 있다
 *   ② 네이티브 모듈 매니페스트가 금지 권한을 요청하지 않는다
 *   ③ 접근성 설정 XML: canRetrieveWindowContent="false" · isAccessibilityTool="false" · 이벤트는 typeWindowStateChanged 만
 *   ④ Kotlin 이 창 내용 · 접근성 동작 API 를 부르지 않는다(기둥 5 · §8.2)
 *
 * ⚠ 소스만 본다. 🔴 최종 판정은 **AAB/APK 매니페스트**다(Re:Read 교훈 · `docs/README.md` §3 의 빌드 확인 줄).
 * 🔴 앵커(파일 · 속성)가 사라져도 FAIL 한다.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

export const FORBIDDEN = [
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.QUERY_ALL_PACKAGES',
  'android.permission.USE_EXACT_ALARM',
  'android.permission.RECORD_AUDIO',
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
];
/** 기둥 5 · Play 접근성 정책: 창 내용을 읽거나 접근성으로 동작을 실행하는 API */
export const FORBIDDEN_CALLS = [
  'getSource(',
  'rootInActiveWindow',
  'getRootInActiveWindow',
  'performGlobalAction',
  'getWindows(',
  'event.text',
  'event.getText',
  '.contentDescription',
  'dispatchGesture',
];

const MODULE = 'modules/intervention/android/src/main';
const A11Y_XML = `${MODULE}/res/xml/intervention_accessibility.xml`;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.kt')) out.push(p);
  }
  return out;
}

/** 순수 판정. 입력은 문자열들이라 변이 시험이 쉽다 */
export function judge({ appJson, moduleManifest, a11yXml, kotlin }) {
  const bad = [];
  let blocked;
  try {
    blocked = JSON.parse(appJson).expo?.android?.blockedPermissions;
  } catch {
    blocked = undefined;
  }
  if (!Array.isArray(blocked)) bad.push('① app.json 에 android.blockedPermissions 가 없다(앵커)');
  else for (const p of FORBIDDEN.slice(0, 4)) if (!blocked.includes(p)) bad.push(`① blockedPermissions 에 ${p} 가 없다`);

  for (const p of FORBIDDEN) {
    if (new RegExp(`uses-permission[^>]*${p.replace(/\./g, '\\.')}`).test(moduleManifest)) bad.push(`② 모듈 매니페스트가 ${p} 를 요청한다`);
  }
  if (!/BIND_ACCESSIBILITY_SERVICE/.test(moduleManifest)) bad.push('② 접근성 서비스 선언이 없다(앵커)');

  if (!/android:canRetrieveWindowContent="false"/.test(a11yXml)) bad.push('③ canRetrieveWindowContent="false" 가 아니다(또는 없다)');
  if (!/android:isAccessibilityTool="false"/.test(a11yXml)) bad.push('③ isAccessibilityTool="false" 가 아니다(또는 없다)');
  const types = a11yXml.match(/android:accessibilityEventTypes="([^"]*)"/);
  if (!types) bad.push('③ accessibilityEventTypes 가 없다(앵커)');
  else if (types[1] !== 'typeWindowStateChanged') bad.push(`③ 이벤트 종류가 typeWindowStateChanged 하나가 아니다: ${types[1]}`);

  if (!kotlin.length) bad.push('④ Kotlin 소스가 없다(앵커)');
  for (const { file, text } of kotlin) {
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); // 주석 속 언급은 허용
    for (const c of FORBIDDEN_CALLS) if (code.includes(c)) bad.push(`④ ${file} 가 ${c} 를 쓴다`);
  }
  return bad;
}

function load() {
  return {
    appJson: read('app.json'),
    moduleManifest: read(`${MODULE}/AndroidManifest.xml`),
    a11yXml: read(A11Y_XML),
    kotlin: walk(join(ROOT, `${MODULE}/java`)).map((f) => ({ file: f.slice(ROOT.length + 1), text: readFileSync(f, 'utf8') })),
  };
}

// ── 🔴 변이 시험: 각 축이 실제로 FAIL 하는지 ─────────────────────────
const real = load();
const mutations = [
  ['① 금지 권한 하나 빠짐', { ...real, appJson: real.appJson.replace('"android.permission.SYSTEM_ALERT_WINDOW",', '') }],
  ['① 앵커 제거', { ...real, appJson: real.appJson.replace('blockedPermissions', 'blocked') }],
  ['② 모듈이 금지 권한 요청', { ...real, moduleManifest: real.moduleManifest.replace('<queries>', '<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" /><queries>') }],
  ['③ 창 내용 읽기 켬', { ...real, a11yXml: real.a11yXml.replace('canRetrieveWindowContent="false"', 'canRetrieveWindowContent="true"') }],
  ['③ 접근성 도구로 신고', { ...real, a11yXml: real.a11yXml.replace('isAccessibilityTool="false"', 'isAccessibilityTool="true"') }],
  ['③ 이벤트 종류 확대', { ...real, a11yXml: real.a11yXml.replace('"typeWindowStateChanged"', '"typeAllMask"') }],
  ['④ 창 내용 API 호출', { ...real, kotlin: [...real.kotlin, { file: 'mut.kt', text: 'val n = event.getSource()' }] }],
  ['④ 접근성 동작 호출', { ...real, kotlin: [...real.kotlin, { file: 'mut.kt', text: 'performGlobalAction(GLOBAL_ACTION_HOME)' }] }],
];
for (const [name, input] of mutations) {
  if (judge(input).length === 0) {
    console.error(`SELF-TEST FAIL: 변이 "${name}" 를 못 잡았다`);
    process.exit(2);
  }
}
// 주석 속 언급은 통과해야 한다(설명 문서가 API 이름을 말할 수 있다)
if (judge({ ...real, kotlin: [{ file: 'c.kt', text: '// performGlobalAction 을 쓰지 않는다\n/* getSource( */' }] }).length !== 0) {
  console.error('SELF-TEST FAIL: 주석 속 언급을 위반으로 잡았다(오탐)');
  process.exit(2);
}
// ──────────────────────────────────────────────────────────────────────

const bad = judge(real);
if (bad.length) {
  console.error(`check:manifest FAIL (${bad.length})`);
  for (const m of bad) console.error('  ' + m);
  process.exit(1);
}
console.log(`check:manifest OK · 4축 · 금지 권한 ${FORBIDDEN.length} · 금지 호출 ${FORBIDDEN_CALLS.length} · 변이 ${mutations.length}종 전부 검출 · Kotlin ${real.kotlin.length}파일`);
