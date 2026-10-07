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
| 하루 1회 보내기 | ❌ | Phase 5 · 공용 서버 경로 합의 뒤 |
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
