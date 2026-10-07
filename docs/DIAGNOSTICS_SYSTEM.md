# DIAGNOSTICS_SYSTEM — 진단 기록 · 하루 요약 · 문의 첨부

> 정본 관계: 원칙과 결정은 [`../CLAUDE.md`](../CLAUDE.md) §14 #20 · #21 · #24(2026-10-08). 플랜과 근거(배구명가 선례 · 실패 신호를 고른 이유)는 [`review/2026-10-08-diagnostics-plan.md`](./review/2026-10-08-diagnostics-plan.md)(정본 아님).
> 받는 곳은 공용 서버(common_server · 결정 #20). 🔴 그쪽 설계는 **공용 서버 세션 · 사용자 승인**으로 정해진다(2026-10-08 요청 · 별도 테이블 · 앱별 스위치 방향 제안을 받음 · 확정 아님).

---

## 0. 구현 현황

| 영역 | 상태 | 비고 |
|---|---|---|
| 진단 링 버퍼(네이티브 · `DiagLog.kt`) | ✅ 2026-10-08 | 파일 `diag.jsonl` · 바이트 예산 256KB(placeholder) · 넘으면 오래된 줄부터 3/4 로 |
| Kotlin 미처리 예외 기록 | ✅ 2026-10-08 | `Thread.setDefaultUncaughtExceptionHandler` · 원래 핸들러로 넘긴다 · ⏳ 실기 미확인 |
| 지난번 종료 이유(`ApplicationExitInfo` · API 30+) | ✅ 2026-10-08 | 서비스 연결 · 모듈 생성 때 읽고 새 것만 기록 · ⏳ 삼성 절전 종료 값 실측 전 |
| JS 전역 크래시 핸들러(`lib/diag.ts`) | ✅ 2026-10-08 | 원래 핸들러 보존(배구명가 승계) · ⏳ 실기 미확인 |
| 스파이크 기록 → 진단 신호 거울 | ✅ 2026-10-08 | `SpikeStore.appendLog` 가 신호 이름으로 같이 쓴다 |
| 하루 요약 뼈대(`diagSummary` · 종류별 개수 + 기기) | 🔨 | 대상 앱별 통계 · 사용 통계는 Phase 5(결정 #21) |
| 하루 1회 보내기 | ❌ | Phase 5 · ~~공용 서버 경로 합의 뒤~~ → 공용 서버 쪽 ✅ 2026-10-08 운영 배포(§4 계약) · 앱 쪽만 남았다 |
| 문의 화면 + 진단 첨부 + 미리보기 | ❌ | Phase 5 · 결정 #20 · #24 |
| 설정에서 자동 요약 끄기 | ❌ | Phase 2 설정 화면 · 결정 #20 |

## 1. 버퍼

- 한 줄 = JSON 한 건: `{ kind, at(ms), tz, …필드 }`. 최신이 뒤.
- 🔴 기록이 앱을 막지 않는다. 쓰기 · 읽기 실패는 전부 삼킨다.
- 버퍼는 **한 곳**(네이티브). JS 는 `Intervention.logDiag(kind, fieldsJson)` 로 쓴다. 접근성 서비스가 RN 밖에서 돌아서 버퍼를 JS 에 두면 서비스가 못 쓴다.
- 예산 256KB 는 서버 첨부 상한과 **실측으로** 맞춘다(배구명가 2026-08-17 서버 256KB 상한이 실사용자 스냅샷을 100% 거부한 사고).

## 2. 신호 (`kind`)

| kind | 언제 | 출처 |
|---|---|---|
| `service_connected` · `service_interrupt` · `service_destroyed` | 접근성 서비스 생애 | 서비스 |
| `prompt_shown` | 확인 화면 첫 그림(`detectToDrawMs` · `via`) | 확인 화면 |
| `prompt_slow` | 위가 1초 초과(placeholder) | 거울 |
| `prompt_result` | `cancel` · `open` · `dismissed` | 확인 화면 |
| `prompt_fallback` | 액티비티가 0.8초 안에 안 떠서 오버레이로(백그라운드 실행 차단 의심) | 서비스 |
| `prompt_error` | 확인 화면 띄우기 예외 | 서비스 |
| `fg_while_prompt` | 확인 화면 중 앞에 나온 패키지(끼어든 창 진단) | 서비스 |
| `settings_route` · `settings_details_denied` | 설정으로 데려간 길 · 상세 직행 거부(📱 갤럭시 S24 실측 `SecurityException`) | 모듈 |
| `exit` | 지난번 프로세스 종료 이유(`reason` · `importance` · `description`) | `ApplicationExitInfo` |
| `crash_native` · `crash_js` · `crash_js_fatal` | 미처리 예외 | 핸들러 |

추가 예정(플랜 §2): `service_lost`(규칙이 있는데 서비스가 꺼짐) · `advanced_protection_on` · `alarm_late` · `usage_access_lost` · `notification_denied`.

## 3. 무엇이 어디로 가나 (결정 #20 · #21 · #24)

| | 하루 요약(자동 · 끌 수 있음) | 문의 첨부(항상 · 미리보기) |
|---|---|---|
| 신호 종류별 개수 · 기기 정보 | ✅ | ✅ |
| 사용 통계(확인 · 취소 · 열기 · 닫힘 · 실행 확인 결과) | ✅ | ✅ |
| 대상 앱 패키지 이름(별 통계) | ✅ | ✅ |
| 진단 버퍼 원문(최근 줄) | — | ✅ |
| 사용자가 쓴 확인 메시지 원문 | — | ✅(#24) |
| 화면 내용 · 입력 | 🚫 읽지도 않는다(기둥 5) | 🚫 |

🔴 보내는 것은 공개 문구 · 처리방침 · Play 데이터 보안과 같은 말을 해야 한다(CLAUDE 기둥 6 · `ANDROID_PLATFORM.md` §8.4).

## 4. 공용 서버 계약 (2026-10-08 확정 · 공용 서버 세션이 운영에 배포)

> 출처: 공용 서버 세션 메시지(2026-10-08). 그쪽 정본은 common_server 저장소 `docs/PLAN.md` Phase 15. 여기는 앱이 맞출 모양만 적는다.

### 4.1 하루 요약 `POST /api/v1/diagnostics`

- 헤더: `Authorization: Bearer <기기 토큰>` · `content-type: application/json`. 앱 코드는 토큰 클레임에서 읽는다(헤더 없음).
- 본문: 이쪽 초안 그대로 `{ v, dayKey, tz, appVersion, device: { manufacturer, model, sdkInt, advProtection }, signals, usage, targets }`. **본문 전체를 payload 로 저장**하므로 칸을 늘려도 서버 배포가 필요 없다.
- `dayKey` 필수(`YYYY-MM-DD` · 기기가 센 하루 · `lib/day.ts`). 아니면 400.
- **같은 날 다시 보내면 덮어쓴다**(키 = 앱 + 주체 + 날). 기기는 그날 전체를 다시 세어 보낸다.

| 응답 | 뜻 | 앱이 할 일 |
|---|---|---|
| 200 `{ ok: true, limit }` | 받음 · `limit` 이 현재 상한(지금 16384) | 🔴 상한을 코드에 박지 않고 이 값을 기억해 다음 묶기에 쓴다 |
| 401 | 토큰 없음 · 무효 · 앱 불일치 | 기기 토큰을 다시 받는다(공용 서버 SDK 방식) |
| 404 | 이 앱의 진단 스위치가 꺼졌거나 앱 비활성 | 그날은 그만둔다 · 진단 신호를 남기지 않는다(소음) |
| 413 `{ reason: 'too-large', limit, bytes }` | 상한 초과(인증보다 먼저 걸린다) | `limit` 에 맞춰 `targets` 를 줄여 한 번만 다시 보낸다 |
| 429 | 레이트리밋(10회 / 600초 · IP) | 다음 날까지 쉰다 |

### 4.2 문의 첨부 `POST /api/v1/tickets` 의 `diagnostics`

- 모양: `{ v, summary, lines, messages }`(§3 표의 "문의 첨부" 열).
- 문의 + 첨부 합계 상한 **512KB**(초과 시 413 `{ reason, limit: 524288, bytes }`). 링 버퍼 예산 256KB 의 두 배다. 🔴 보내기 전에 크기를 재서 넘으면 `lines` 를 오래된 것부터 자른다(배구명가 상한 사고 승계).
- 스위치가 꺼진 앱이 보내면 400 `diagnostics-not-enabled`(조용히 버리지 않는다).

### 4.3 보관 · 삭제

- 요약 90일 · 문의 첨부 1년 · 문의 본문 3년(첨부만 먼저 지워진다). 처리방침에 이 숫자를 그대로 쓴다(Phase 6).
- 탈퇴(기기 주체 삭제) 시 요약 행은 지운다(가명화가 아니라 삭제).

### 4.4 🔴 시험 주의

- 공용 서버는 **로컬 dev 도 운영 DB 를 쓴다.** 시험 전송은 운영에 행이 남는다. 시험용 기기 토큰으로 보내고, 지울 값을 공용 서버 세션에 알린다.

### 4.5 아직 없는 것

- ~~디스코드 기준 알림: 어떤 신호가 하루 몇 건이면 알릴지 이쪽이 정해 보낸다(사용자 결정).~~ → 결정 #32: `crash_native` · `crash_js_fatal` · `service_lost` · `prompt_error` · `advanced_protection_on` 이 그날 첫 1건이면 알림(같은 날 · 신호 · 기종은 한 번). 나머지는 DB 로만.
- 관리자 화면: 지금은 DB 로만 본다.
