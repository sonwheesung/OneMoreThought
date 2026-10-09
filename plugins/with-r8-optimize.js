// R8 권장 두 줄 설정 (2026-09-15 · common/R8_OBFUSCATION.md §6.1 · 정본 common/R8_OBFUSCATION.md §6.1·§6.2)
// ① proguard-android.txt → proguard-android-optimize.txt   (콘솔 "최적화가 사용 설정되지 않음")
// ② android.r8.optimizedShrinking=true                      (콘솔 "최적화된 리소스 축소가 사용 설정되지 않음")
// expo-build-properties 는 둘 다 못 넣고, android/ 를 손으로 고치면 저장소에 안 남는다. 그래서 플러그인이다.
const fs = require('fs');
const path = require('path');
const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

// 🔴 AGP 는 모르는 android.* 속성을 오류 없이 무시한다. 이름이 버전마다 달라서 버전을 읽고 맞지 않으면 멈춘다.
//    8.10~8.12: android.r8.optimizedShrinking · 8.13+: android.r8.optimizedResourceShrinking(옛 이름은 Removed)
function shrinkFlagForAgp(projectRoot) {
  const toml = path.join(projectRoot, 'node_modules/@react-native/gradle-plugin/gradle/libs.versions.toml');
  const m = fs.readFileSync(toml, 'utf8').match(/^agp\s*=\s*"(\d+)\.(\d+)\.\d+"/m);
  if (!m) throw new Error('[with-r8-optimize] AGP 버전을 읽지 못했다: ' + toml);
  const [major, minor] = [Number(m[1]), Number(m[2])];
  if (major === 8 && minor >= 10 && minor <= 12) return 'android.r8.optimizedShrinking';
  throw new Error(
    '[with-r8-optimize] AGP ' + major + '.' + minor + ' 는 확인하지 않은 버전이다. ' +
      '8.13+ 는 android.r8.optimizedResourceShrinking 로 이름이 바뀐다. common/R8_OBFUSCATION.md §6.1 을 보고 이 파일을 고친다.'
  );
}

const DEFAULT_RULES = 'getDefaultProguardFile("proguard-android.txt")';
const OPTIMIZE_RULES = 'getDefaultProguardFile("proguard-android-optimize.txt")';

module.exports = function withR8Optimize(config) {
  config = withAppBuildGradle(config, (cfg) => {
    const src = cfg.modResults.contents;
    if (src.includes(OPTIMIZE_RULES)) return cfg; // 멱등
    if (!src.includes(DEFAULT_RULES)) {
      throw new Error('[with-r8-optimize] build.gradle 에서 proguard-android.txt 줄을 못 찾았다. 템플릿이 바뀌었는지 본다.');
    }
    cfg.modResults.contents = src.replace(DEFAULT_RULES, OPTIMIZE_RULES);
    return cfg;
  });

  config = withGradleProperties(config, (cfg) => {
    const key = shrinkFlagForAgp(cfg.modRequest.projectRoot);
    const props = cfg.modResults.filter((p) => !(p.type === 'property' && p.key === key));
    props.push({ type: 'property', key, value: 'true' });
    cfg.modResults = props;
    return cfg;
  });

  return config;
};
