# BUILD — 릴리스 AAB 굽기 · 서명 · 게이트 (결정 #36 · #37 · #39)

> 작성 2026-10-09(첫 릴리스 AAB). 순서의 정본은 `common/PLAY_FIRST_UPLOAD.md`, 점검은 `common/PRE_LAUNCH_CHECK.md` §4, R8 은 `common/R8_OBFUSCATION.md`, 산출물 위치는 `common/BUILD_ARTIFACTS.md`.
> 🔴 `android/` 는 CNG 산출물이다(git 에 없다). 서명 · R8 · 아이콘 · OTA 설정은 **전부 `app.json` + `plugins/`** 에 산다. `android/` 를 손으로 고치지 않는다.

## 1. 업로드 키

| 무엇 | 값 |
|---|---|
| 키스토어 | `C:\project\secrets\onemorethought-upload.jks`(저장소 밖) |
| 비밀번호 · 별칭 | `C:\project\secrets\onemorethought-upload.env`(🔴 값을 문서 · 커밋 · 로그에 적지 않는다) |
| 백업 | `D:\keystore-backup\onemorethought\`(같은 두 파일 · 2026-10-09) |
| 주체 | `CN=Vivace Games, O=Vivace Games, C=KR` · RSA 2048 · 10000일 |
| **SHA-256 지문**(공개값) | `65:68:C1:8E:EC:19:8B:E9:4E:50:26:CA:E8:C9:E6:0D:69:7D:2A:BB:09:B2:54:10:FC:D1:D0:A0:EA:7C:56:F9` |

🔴 이 키가 앱의 신원이다. 잃으면 Play 업로드 키 재설정 절차뿐이다. Play 앱 서명 키는 첫 AAB 를 올린 뒤에 생긴다(`PLAY_FIRST_UPLOAD.md` §1 ⑥).

## 2. 굽는 법

```bash
# ① 서명 값을 env 로 받아 prebuild(플러그인이 build.gradle · gradle.properties 에 박는다)
set -a; . /c/project/secrets/onemorethought-upload.env; set +a
export OMT_UPLOAD_STORE_FILE="$KEYSTORE_PATH" OMT_UPLOAD_STORE_PASSWORD="$STORE_PASSWORD" \
       OMT_UPLOAD_KEY_ALIAS="$KEY_ALIAS" OMT_UPLOAD_KEY_PASSWORD="$KEY_PASSWORD"
npx expo prebuild --platform android --no-install
#    ⚠ prebuild 가 package.json 에 "android" · "ios" 스크립트를 되살린다 → 지운다(README §3-1)

# ② 게이트(실물을 본다 · R8_OBFUSCATION §2-C)
grep -q '^android.enableMinifyInReleaseBuilds=true' android/gradle.properties || echo "R8 꺼짐"
grep -q 'signingConfigs.upload' android/app/build.gradle || echo "서명 블록 없음"
grep -q 'versionCode 1' android/app/build.gradle       # app.json android.versionCode 와 같은가

# ③ 굽기(🔴 gradlew clean 금지 · 필요하면 rm -rf android/app/build android/app/.cxx android/build android/.gradle)
#    android/local.properties: sdk.dir=C:/Users/user/AppData/Local/Android/Sdk (🔴 역슬래시를 쓰면 \u 로 읽혀 깨진다)
cd android && ./gradlew bundleRelease assembleRelease --console=plain > build.log 2>&1; grep "BUILD SUCCESSFUL" build.log

# ④ 구운 것을 연다
npm run check:release-url   # 운영 주소 둘 있음 · localhost · 10.0.2.2 · 100.x · 192.168 · :8095 · :3900 없음
npm run check:signing       # 업로드 키 지문과 같은가(디버그 키여도 jarsigner 는 통과한다)
```

- 서버 주소는 `features/server.ts` 의 기본값이 운영 주소다(`EXPO_PUBLIC_*` 를 넣지 않으면 운영). `.env` 를 두지 않는다.
- `check:release-url` 은 React Native `getDevServer.js` 의 고정 폴백 `http://localhost:8081` 한 문자열만 빼고 본다(모든 RN 릴리스 번들에 있다 · 우리 값 아님).
- APK 서명은 `apksigner verify --print-certs`(APK 는 jarsigner 가 "unsigned" 로 나온다 · R8 §4).

## 3. OTA (결정 #39)

| 칸 | 값 |
|---|---|
| Expo 프로젝트 | `@shs00925/onemorethought` · id `54bde4ef-2e84-4a58-bace-c97ca48afe60` |
| `runtimeVersion` | **`native-1`**(고정 문자열 · fingerprint 🚫). 🔴 `modules/intervention` · 네이티브 의존성 · 플러그인을 바꾸면 `native-2` 로 올린다 |
| 채널 | `app.json` `updates.requestHeaders` 의 `expo-channel-name: production`(로컬 gradle 은 `eas.json` 채널을 안 받는다) |
| 확인 | `checkAutomatically: ON_LOAD` |

🔴 비공개 테스트 14일 동안 OTA 를 쏘지 않는다(결정 #39). 쏠 때는 `common/OTA_RULES.md` §8 체크리스트.

## 4. AAB 점검표 (첫 AAB · 2026-10-09)

| 확인 | 결과 |
|---|---|
| 서명 = 업로드 키 | `check:signing` |
| 운영 주소 · 개발 주소 0 | `check:release-url` |
| R8 켬 · `proguard-android-optimize.txt` · `android.r8.optimizedShrinking`(AGP 8.11) | gradle.properties · build.gradle |
| keep 규칙이 `expo.modules.intervention`(접근성 서비스 · 액티비티 · 서비스)을 덮는다 | `expo.modules.**` keep(app.json `extraProguardRules`) |
| 금지 권한 · `AD_ID` 없음 · `canRetrieveWindowContent=false` · `isAccessibilityTool=false` | AAB 매니페스트(§4.1) |
| targetSdk 36 · 64비트 .so 16KB 정렬 | §4.1 |
| 🔴 릴리스 APK E2E(R8 은 조용한 기능 실종으로 깨진다 · 디버그 빌드로는 못 잰다) | ❌ 메인 세션이 실기기에 깔아 확인한다(감지 · 확인 화면 · 대기열 · 서버 동기화 · expo-updates `shared_prefs`) |

### 4.1 실측 값

vc1 · 2026-10-09 15:36 · `BUILD SUCCESSFUL in 7m 28s`(R8 포함)

| 항목 | 값 |
|---|---|
| AAB · APK | 43,871,148 B · 61,615,671 B |
| 패키지 · 버전 | `com.vivacegames.onemorethought` · vc1 · 0.1.0 |
| targetSdk · compileSdk | 36 · 36 |
| 권한(APK `aapt2 dump badging`) | `INTERNET` · `PACKAGE_USAGE_STATS` · `QUERY_ADVANCED_PROTECTION_MODE` · 자체 `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` 뿐 · 🚫 `AD_ID` 없음 · 금지 5종 없음 |
| 접근성 설정 xml | `canRetrieveWindowContent=false` · `isAccessibilityTool=false` |
| 64비트 .so 16KB 정렬 | arm64-v8a · x86_64 전부 `p_align ≥ 16384`(LOAD 세그먼트 · node 로 ELF 헤더를 읽음) |
| 서명 | AAB `keytool -printcert` · APK `apksigner --print-certs` 둘 다 `CN=Vivace Games` · SHA-256 §1 과 같다 |
| OTA | 매니페스트 `EXPO_UPDATE_URL` · `expo-channel-name: production` · `EXPO_RUNTIME_VERSION` 있음 |
| 운영 주소 | `check:release-url` OK(운영 2 · 개발 0) |

⚠ 이 vc1 의 JS 는 2026-10-09 15:29 작업 트리(메인 세션 UI 수정 진행 중)다. **업로드 직전에 다시 굽는다**(versionCode 는 1 그대로 · 아직 안 올렸다).


## 5. 산출물

`D:\builds\OneMoreThought\onemorethought-vc<versionCode>.aab`(+ 같은 이름 `.apk`) · `BUILD_ARTIFACTS.md` §1. `mapping.txt` 는 AAB 안에 들어 있어 따로 두지 않는다.

| vc | 버전 | 날짜 | 무엇 | 크기 |
|---|---|---|---|---|
| 1 | 0.1.0 | 2026-10-09 | 첫 비공개 테스트 후보(결정 #37 · OTA 포함 #39 · 아이콘은 자리표시) · `D:\builds\OneMoreThought\onemorethought-vc1.aab` · `.apk` | 43.9MB · 61.6MB |

버전: 비공개 테스트는 프로모션 코드 테스터뿐이라 `0.x` 를 유지한다. 낯선 사람이 돈을 낼 수 있는 프로덕션 전에 `1.0.0` 으로 올린다(`PRE_LAUNCH_CHECK.md` §4).

## 6. 아이콘

`tools/make-icon.mjs`(`npm i --no-save sharp && npm run icons:build`) → `assets/brand/`. 🔴 **자리표시**다(결정 #33 색 · 글자 없음). 시안 세션(연출 사전)이 정식 아이콘을 내면 바꾼다.
