# OneMoreThought(가칭) — 문서 색인

> 🔴 **이 파일이 문서 색인이자 구현 현황의 정본이다.** 새 `*_SYSTEM.md` 를 추가하면 반드시 아래 목록과
> 구현 현황표에 함께 등록한다([`DOC_DISCIPLINE.md`](./DOC_DISCIPLINE.md) 부록).
> 다른 세션이 **이 파일만 읽고도 전체를 돌릴 수 있어야 한다.**
>
> 설계 원칙 · 기둥 · MVP 범위 · 결정 로그는 루트 [`../CLAUDE.md`](../CLAUDE.md).

---

## 1. 문서 목록

`docs/` 바로 아래 **6개**(세는 법: `ls docs/*.md | wc -l`) · `docs/review/` **2개**(세는 법: `ls docs/review/*.md | wc -l`)

| 문서 | 범위 | 상태 |
|---|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | 설계 정본. 기둥 7개 · MVP 범위 · 계정 없음 · 서버 없음(네이티브 ⇄ JS 경계) · 결정 **10건**(세는 법: `grep -c "^\*\*#" CLAUDE.md`) · 미결정 **15건**(세는 법: `grep -c "^| [A-Z] |" CLAUDE.md`) | ✅ 2026-10-06 |
| [`PLAN.md`](./PLAN.md) | 착수 순서(리뷰 → Phase 0 스파이크 ~ 8) · 완료 기준 · 막는 미결정 | ✅ 2026-10-06 |
| [`RULE_SYSTEM.md`](./RULE_SYSTEM.md) | 규칙 두 종류 · 판정 · 하루 · 통과 상태 · 하루 1회 알림 · 기록 · 통계 · 엣지 출발 목록 | 🔨 2026-10-06 · 설계 초안(미결정 다수) |
| [`ANDROID_PLATFORM.md`](./ANDROID_PLATFORM.md) | 감지(접근성 · 사용 기록) · 오버레이 · 알람 · 앱 목록 · Expo 네이티브 · 권한 온보딩 · 🔴 Play 접근성 정책 · Phase 0 스파이크 | 🔨 2026-10-06 · 정책 원문 직접 대조(§8) · 사례 조사 반영 |
| [`DOC_DISCIPLINE.md`](./DOC_DISCIPLINE.md) | 문서 작업법(`common/DOC_SYSTEM.md` 의 프로젝트판 · mission 승계) | ✅ 2026-10-06 |
| [`ORIGINAL_BRIEF.md`](./ORIGINAL_BRIEF.md) | 🔴 **원본 기획서 원문. 정본이 아니다** | ✅ 2026-10-06 |
| [`README.md`](./README.md) | 이 색인 | ✅ 2026-10-06 |
| [`review/2026-10-06-decisions.md`](./review/2026-10-06-decisions.md) | 사용자 결정 원문 기록(#10 · 읽은 범위). 정본은 CLAUDE §14 | ✅ 2026-10-06 |
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
| `MONETIZATION_SYSTEM.md` | Pro 를 붙일 때 | ⏸ 출시 초기 무료 · 광고 없음(결정 #2) |

---

## 2. 구현 현황

**2026-10-06 기준. 문서 체계만 있다. 코드 0줄.** Phase 정의는 [`PLAN.md`](./PLAN.md).

### 앱

| 영역 | 상태 | 비고 |
|---|---|---|
| Expo 부트(SDK 54 · expo-router · TS strict · Metro **8095**) | ❌ | Phase 0 |
| 네이티브 모듈 골격 · 개발 빌드 | ❌ | Phase 0 · [`ANDROID_PLATFORM.md`](./ANDROID_PLATFORM.md) §6 |
| 감지 · 오버레이 스파이크 S1 ~ S6 | ❌ | Phase 0 · [`ANDROID_PLATFORM.md`](./ANDROID_PLATFORM.md) §9 |
| 규칙 판정 · 로컬 DB | ❌ | Phase 1 · [`RULE_SYSTEM.md`](./RULE_SYSTEM.md) |
| 실행 전 확인(홈 · 만들기 · 확인 화면 · 권한 온보딩) | ❌ | Phase 2 |
| 실행 확인(알람 · 알림 · 오늘 ✓) | ❌ | Phase 3 |

### 서버

| 영역 | 상태 | 비고 |
|---|---|---|
| 앱 서버 | 🚫 | 결정 #5 · 기획서 §20 |
| common_server | ⏸ | 미결정 I |

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

**아직 없음.** Phase 0 에서 `npm run verify` 와 첫 가드(`typecheck` · `lint` · `check:chars` · `check:day` · `check:docs`)를 만들며 채운다.
예정 가드: `check:rules`(TS ⇄ Kotlin 같은 시험표) · `check:manifest`(쓰지 않기로 한 권한이 매니페스트에 없다 · 접근성 서비스가 창 내용을 읽지 않는다 · `ANDROID_PLATFORM.md` §2 · §5) · `check:i18n`.

---

## 4. 아키텍처 원칙 (요약)

- **서버 없음. 모든 데이터는 기기에만**(CLAUDE 기둥 6 · §6).
- **네이티브(Kotlin)가 감지 · 확인 화면 · 알람을 맡고, JS 는 규칙 편집 · 홈을 맡는다.** 이 경계가 되돌리기 비싸다.
- 판정은 순수 함수. TS 와 Kotlin 이 같은 시험표로 묶인다.
- 앱이 열렸는지만 본다. 앱 안은 보지 않는다(기둥 5). 접근성 서비스는 창 내용을 읽지 않는다.
- 의존 방향 `app/` → `features/` → `db/`·`lib/`·`modules/`·`theme/`.
