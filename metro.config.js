const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro 가 네이티브 빌드 산출물을 보지 않게 한다.
 *
 * 왜: 2026-10-08 Metro 가 두 번 죽었다(종료 코드 143 · 134). 두 번째 로그는
 *     "JavaScript heap out of memory". 둘 다 gradle 재빌드 직후였다.
 *     `android/` · `modules/*\/android/build` 에 빌드 파일이 수만 개 생기고 Metro 가 그걸 지켜본다.
 *     네이티브 모듈을 자주 다시 굽는 앱은 이 저장소가 처음이라 형제에는 이 설정이 없다.
 */
const config = getDefaultConfig(__dirname);

const blocked = [
  /[\\/]android[\\/]build[\\/].*/,
  /[\\/]android[\\/]app[\\/]build[\\/].*/,
  /[\\/]android[\\/]\.gradle[\\/].*/,
  /[\\/]android[\\/]\.cxx[\\/].*/,
  /[\\/]modules[\\/][^\\/]+[\\/]android[\\/]build[\\/].*/,
  // 앱 서버(Next.js · 결정 #30)는 앱 번들과 관계없다. node_modules · .next 가 크다
  /[\\/]server[\\/].*/,
];
const existing = config.resolver.blockList;
config.resolver.blockList = existing
  ? [...(Array.isArray(existing) ? existing : [existing]), ...blocked]
  : blocked;

module.exports = config;
