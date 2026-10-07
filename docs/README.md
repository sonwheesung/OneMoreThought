# OneMoreThought(가칭) — 문서 색인

> 🔴 **이 파일이 문서 색인이자 구현 현황의 정본이다.** 새 `*_SYSTEM.md` 를 추가하면 반드시 아래 목록과
> 구현 현황표에 함께 등록한다([`DOC_DISCIPLINE.md`](./DOC_DISCIPLINE.md) 부록).
> 다른 세션이 **이 파일만 읽고도 전체를 돌릴 수 있어야 한다.**
>
> 설계 원칙 · 기둥 · MVP 범위 · 결정 로그는 루트 [`../CLAUDE.md`](../CLAUDE.md).

---

## 1. 문서 목록

`docs/` 바로 아래 **8개**(세는 법: `ls docs/*.md | wc -l`) · `docs/review/` **5개**(세는 법: `ls docs/review/*.md | wc -l`)

| 문서 | 범위 | 상태 |
|---|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | 설계 정본. 기둥 7개 · MVP 범위 · 계정 없음 · ~~기기 정본 + 서버 사본(결정 #22)~~ → 서버 정본 + 기기 최소 캐시(결정 #30) · 결정 **27건**(세는 법: `grep -c "^\*\*#" CLAUDE.md`) · 미결정 **1건**(세는 법: `grep -c "^| [A-Z] |" CLAUDE.md`) | ✅ 2026-10-06 |
| [`PLAN.md`](./PLAN.md) | 착수 순서(리뷰 → Phase 0 스파이크 ~ 8) · 완료 기준 · 막는 미결정 | ✅ 2026-10-06 |
| [`RULE_SYSTEM.md`](./RULE_SYSTEM.md) | 규칙 두 종류 · 판정 · 하루 · 통과 상태 · 하루 1회 알림 · 기록 · 통계 · 엣지 출발 목록 | 🔨 2026-10-06 · 설계 초안(미결정 다수) |
| [`ANDROID_PLATFORM.md`](./ANDROID_PLATFORM.md) | 감지(접근성 · 사용 기록) · 오버레이 · 알람 · 앱 목록 · Expo 네이티브 · 권한 온보딩 · 🔴 Play 접근성 정책 · Phase 0 스파이크 | 🔨 2026-10-06 · 정책 원문 직접 대조(§8) · 사례 조사 반영 |
| [`DATABASE.md`](./DATABASE.md) | 서버 스키마(조각 Supabase 이 앱 스키마) · 기기 캐시(`rules.json`) · 기록 대기열(`queue.jsonl`) · 누가 쓰고 누가 읽나 · API · 보안(결정 #30) | 🔨 2026-10-08 · 초안 · 스키마 이름 등 §6 대기 |
| [`DIAGNOSTICS_SYSTEM.md`](./DIAGNOSTICS_SYSTEM.md) | 진단 링 버퍼 · 미처리 예외 · 종료 이유 · 신호 목록 · 하루 요약 / 문의 첨부에 무엇이 가나(결정 #20 · #21 · #24) | 🔨 2026-10-08 · 기기 쪽 ✅ · 보내기 Phase 5 |
| [`DOC_DISCIPLINE.md`](./DOC_DISCIPLINE.md) | 문서 작업법(`common/DOC_SYSTEM.md` 의 프로젝트판 · mission 승계) | ✅ 2026-10-06 |
| [`ORIGINAL_BRIEF.md`](./ORIGINAL_BRIEF.md) | 🔴 **원본 기획서 원문. 정본이 아니다** | ✅ 2026-10-06 |
| [`README.md`](./README.md) | 이 색인 | ✅ 2026-10-06 |
| [`review/2026-10-06-decisions.md`](./review/2026-10-06-decisions.md) | 사용자 결정 원문 기록(#10 · 읽은 범위). 정본은 CLAUDE §14 | ✅ 2026-10-06 |
| [`review/2026-10-08-diagnostics-plan.md`](./review/2026-10-08-diagnostics-plan.md) | 진단 · 오류 보고 플랜(3층 · 실패 신호 10종 · 배구명가 선례 · 공용 서버 영향). 🔴 사용자 결정 전 · 정본 아님 | 🔨 2026-10-08 |
| [`review/2026-10-08-gap-hunt-intervention.md`](./review/2026-10-08-gap-hunt-intervention.md) | 엣지 케이스 매트릭스(확인 화면 12 · 통과 10 · 기기 10 · 실행 확인 8) · 오늘 결함 2건의 공통 뿌리 · 평결 대기 8건. 정본 아님 | 🔨 2026-10-08 |
| [`review/2026-10-06-bm-proposal.md`](./review/2026-10-06-bm-proposal.md) | BM 제안(무료 1+1 · 보상형 칸 · 평생 Pro). 경쟁 앱 7종 · 자릿수 추정. 정본 아님 · 🔄 2026-10-07 사용자가 구독(#15)을 거쳐 **유료 앱(#18)** 으로 정했다 | ✅ 2026-10-06 · 이력 |
| [`review/2026-10-06-play-policy.md`](./review/2026-10-06-play-policy.md) | Play 정책 실제 반려 · 통과 사례(반려 3 · 통과 등록정보 8) · 판정 · 설계로 옮길 것. 정본 아님 | ✅ 2026-10-06 |
| [`../.claude/skills/README.md`](../.claude/skills/README.md) | 스킬 색인. 이식 4종 · 나중에 가져올 것 · 안 가져오는 것 | ✅ 2026-10-06 |

### 아직 없는 문서 (필요해지는 시점)

| 문서 | 언제 | 상태 |
|---|---|---|
| `review/<날짜>-gap-hunt-brief.md` · `-devils-advocate-brief.md` · `-decisions.md` | Phase 리뷰 | ❌ |
| `DATABASE.md` | Phase 1(규칙 · 기록 스키마 · 네이티브와 공유 방식) | ❌ |
| `I18N_SYSTEM.md` | Phase 0(미결정 H 이후) | ❌ |
| `UI_GUIDE.md` | Phase 2(첫 화면 전) | ❌ |
| `EDGE_CASES.md` | 첫 버그 · Phase 4 | ❌ |
| `POLISH_BACKLOG.md` | 첫 "알면서 남겨 둔 것" | ❌ |
| `OTA_SYSTEM.md` · `BUILD.md` · `OPEN_SOURCE_NOTICE.md` · `STORE_LISTING.md` · `legal/` | Phase 6 ~ 7 | ❌ |
| ~~`MONETIZATION_SYSTEM.md`~~ | 🚫 결정 #18(유료 앱 · 앱 안 결제 없음)로 따로 둘 내용이 없다. 가격 · 판매 규칙은 CLAUDE §7 이 정본 | ~~광고(#12)~~ → ~~구독(#15)~~ → 유료 앱(#18) |
| `DISTRIBUTION_POLICY.md` | Phase 6(145개국 · 32개국을 닫은 이유 · 결정 #14 · `PRE_LAUNCH_CHECK.md` §1) | ❌ |

---

## 2. 구현 현황

**2026-10-08 기준. Phase 0 스파이크(S24 실측) · Phase 1 판정 순수 모듈까지.** Phase 정의는 [`PLAN.md`](./PLAN.md).

### 앱

| 영역 | 상태 | 비고 |
|---|---|---|
| Expo 부트(SDK 54 · expo-router · TS strict · Metro **8095**) | ✅ 2026-10-08 | Phase 0 · `verify` 8단계(§3) |
| 네이티브 모듈 골격 · 개발 빌드 | 🔨 2026-10-08 | Phase 0 · `modules/intervention`(접근성 서비스 · 오버레이 · 사용 기록 · 앱 목록 · 고급 보호 모드) · [`ANDROID_PLATFORM.md`](./ANDROID_PLATFORM.md) §6 |
| 감지 · 오버레이 스파이크 S1 ~ S7 | 🔨 2026-10-08 · S24 한 대 실측(삼성 외 기기 · 절전은 남음) | Phase 0 · [`ANDROID_PLATFORM.md`](./ANDROID_PLATFORM.md) §9 |
| 하루 경계 `lib/day.ts` · 판정 순수 모듈 `lib/rules.ts` | ✅ 2026-10-08(TS) | Phase 1 · `check:day` · `check:rules` · 시험표 `tests/rules-cases.json` |
| 판정 Kotlin(같은 시험표) · 기기 규칙 캐시 · 기록 대기열 | ❌ | Phase 1 · [`RULE_SYSTEM.md`](./RULE_SYSTEM.md) · ~~로컬 DB~~ → 결정 #30 |
| 실행 전 확인(홈 · 만들기 · 확인 화면 · 권한 온보딩) | ❌ | Phase 2 |
| 실행 확인(알람 · 알림 · 오늘 ✓) | ❌ | Phase 3 |

### 서버

| 영역 | 상태 | 비고 |
|---|---|---|
| 앱 서버 | ~~🚫 결정 #5~~ → ❌ Phase 1 | 결정 #30 · 조각 Supabase 이 앱 스키마 · mission 승계(스키마 생성은 그날 사용자 확인) |
| common_server | ⏳ | 결정 #20 · 진단 · 문의 첨부는 공용 서버 세션 합의 대기 |

### 외부

| 영역 | 상태 | 비고 |
|---|---|---|
| `DEV_ALLOCATION.md` 행 | ✅ 2026-10-06 | Metro 8095 · AVD `onemorethought` 5590 |
| AVD `onemorethought` | ❌ | Phase 0 |
| Play 접근성 선언 · 영상 | ❌ | Phase 6 · 🔴 출시 차단 |
| Play 앱 · 패키지 이름 | ❌ | Phase 7 · 서비스명(미결정 N) 먼저 |

---

## 3. 검증 루틴

> `test` 스킬이 이 절을 **읽어서** 그대로 돈다. 명령을 스킬에 복사하지 않는다(`common/DOC_SYSTEM.md` §2).
> 새 가드를 만들면 여기에 명령을 추가하는 것까지가 완료다.

한 방: **`npm run verify`**. 아래 **8개**를 순서대로 돌린다(세는 법: `package.json` 의 `verify` 를 `&&` 로 센다 · `check:docs` 가 대조한다).

| # | 명령 | 무엇 | 정본 |
|---|---|---|---|
| 1 | `npm run typecheck` | `tsc --noEmit`(strict · `noUncheckedIndexedAccess`) | — |
| 2 | `npm run lint` | `expo lint` | — |
| 3 | `npm run check:chars` | 제어문자 스윕(바이트로 읽는다 · 줄 중간 CR · 0x08 등) · SELF-TEST 8케이스 | mission · Re:Read 승계 |
| 4 | `npm run check:manifest` | 금지 권한 5종이 막혀 있다 · 모듈이 요청하지 않는다 · 접근성 서비스가 창 내용을 못 읽는다 · 접근성 도구로 신고하지 않는다 · Kotlin 이 창 내용 · 접근성 동작 API 를 안 부른다 · 변이 8종 | [`ANDROID_PLATFORM.md`](./ANDROID_PLATFORM.md) §2 · §8.6 |
| 5 | `npm run check:strike` | 취소선 `~~` 가 문단 안에서 짝이 맞는다(여러 줄 취소선 허용 · 표 줄 · 코드 블록 · 인라인 코드 제외) · 변이 8종 | [`DOC_DISCIPLINE.md`](./DOC_DISCIPLINE.md) §5 · 2026-10-08 세 번 안 닫았다 |
| 6 | `npm run check:day` | 하루 경계(자정 · 결정 #26) · 요일(월=0) · 월말 · 윤년 · 서머타임 전환일 날짜 이동 · 없는 날짜 거부 · 시간대 6개(서울 · 뉴욕 · 로드하우 · 키리티마티 · 파고파고 · UTC) · 변이 4종(변이마다 어느 한 시간대에서는 잡힌다) | [`RULE_SYSTEM.md`](./RULE_SYSTEM.md) §2 · mission 승계 |
| 7 | `npm run check:rules` | 판정 시험표 `tests/rules-cases.json`(시간대 안 · 자정 넘김은 시작한 날 요일 · 통과 유예 · 겹치면 id 정렬 뒤 seed 로 하나 · 실행 확인 알림 · 놓침) · 시간대 4개 · 변이 3종. 🔴 Kotlin 도 같은 표를 통과해야 한다(⏸ Phase 1) | [`RULE_SYSTEM.md`](./RULE_SYSTEM.md) §3 · §4 · CLAUDE §5-8 |
| 8 | `npm run check:docs` | 문서의 개수(결정 · 미결정 · 문서 수 · 이 표의 개수) ⇄ 실제 | [`DOC_DISCIPLINE.md`](./DOC_DISCIPLINE.md) §4 |

예정 가드: `check:rules` 의 Kotlin 쪽(같은 시험표 · Phase 1) · `check:i18n`.

**개발 빌드(가드 밖 · 이 앱은 처음부터 이것으로만 확인한다)** 감지가 네이티브라 Expo Go 로는 돌지 않는다.
1. `npx expo prebuild --platform android --no-install`(`android/` 는 커밋하지 않는다 · CNG). ⚠ prebuild 가 `package.json` 에 `android` · `ios` 실행 스크립트를 넣는다. 지운다(`expo run:android` 는 실기기로 갈 수 있다 · mission 함정).
2. `ANDROID_HOME=$LOCALAPPDATA/Android/Sdk` 를 잡고 `cd android && ./gradlew assembleDebug -PreactNativeArchitectures=x86_64,arm64-v8a -PreactNativeDevServerPort=8095`.
   🔴 **`-PreactNativeDevServerPort=8095` 를 빠뜨리지 않는다.** 없으면 디버그 앱이 8081(My Word 의 Metro)에서 코드를 받는다.
3. 🔴 **권한 최종 판정은 APK 매니페스트다**(Re:Read 교훈): `aapt dump permissions android/app/build/outputs/apk/debug/app-debug.apk` 에 금지 권한 5종이 없어야 한다.
4. 에뮬레이터: `ANDROID_AVD_HOME=D:\emulators\onemorethought` · `emulator -avd onemorethought -port 5590 -no-snapshot -no-boot-anim` · 모든 `adb` 에 `-s emulator-5590`. Metro 는 `npx expo start --port 8095 --offline`.
5. 실기기(무선 디버깅): 기기 이름으로 부르고 다시 붙을 때마다 `adb reverse tcp:8095 tcp:8095`.

---

## 4. 아키텍처 원칙 (요약)

- ~~서버 없음. 모든 데이터는 기기에만~~ → **기기가 정본 · 서버는 사본이자 분석 창고**(CLAUDE 기둥 6 · §6 · 결정 #21 · #22). 로그인 없음 · 기기 토큰(가명).
- **네이티브(Kotlin)가 감지 · 확인 화면 · 알람을 맡고, JS 는 규칙 편집 · 홈을 맡는다.** 이 경계가 되돌리기 비싸다.
- 판정은 순수 함수. TS 와 Kotlin 이 같은 시험표로 묶인다.
- 앱이 열렸는지만 본다. 앱 안은 보지 않는다(기둥 5). 접근성 서비스는 창 내용을 읽지 않는다.
- 의존 방향 `app/` → `features/` → `db/`·`lib/`·`modules/`·`theme/`.
