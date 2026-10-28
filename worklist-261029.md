# worklist-261029 — 다음 작업일

> 양식 정본: `C:\project\common\WORKLIST_HANDOVER.md`. 작성 2026-10-28(문서 감사 뒤).

## 0. 바로 시작할 것

**프로덕션 vc4(0.1.0) 검토 결과를 게시 개요에서 본다.**

- 설계 정본: `docs/release/PLAY_CONSOLE.md` §7 · CLAUDE §15 · §16
- 먼저 할 것: 콘솔 → 게시 개요. 통과했으면 스토어 페이지(가격 ₩1,500 · 이름 «OneMoreThought - 디지털 디톡스»)를 본다. 거절이면 사유를 읽고 사용자에게 올린다.
- 요약:
  - 2026-10-28 프로덕션 액세스 부여 → 사용자가 vc4 AAB 업로드 · 검토 전송. 141개국 · 전체 출시 · ko-KR 등록정보 추가 · 관리형 게시 꺼짐(통과 즉시 게시).
  - 올라간 vc4 는 versionName **0.1.0**(사용자 결정). 콘솔 출시명은 `4 (1.0.0)` 이라 실물과 다르다(콘솔 안에서만 보인다).
- 주의:
  - 휴대폰에는 1.0.0 시험 빌드(versionCode 4)가 깔려 있다. Play 버전을 쓰려면 지우고 다시 받는다.
  - adb 는 `-s`. 무선 디버깅 포트는 매번 바뀐다(`adb mdns services`).

## 1. 백로그

| 묶음 | 항목 | 정본 | 왜 급한가 |
|---|---|---|---|
| 유저 피해 | vc5 = **1.0.0** · versionCode 5 · `reportDevice` 버전 고정값(`'0.1.0'`) 수정. 작업 트리에 준비됨(`app.json` · `features/rules.ts` · `app/dev/spike.tsx` · `docs/BUILD.md` 게이트) · 커밋 안 함(실기 확인 전) | 메모리 `production-version-1-0-0` · `docs/BUILD.md` §2 | 서버 `devices.app_version` 이 전부 0.1.0 으로 찍힌다 |
| 유저 피해 | 실행 확인 알림(Phase 3) → `CHECK_RULES_ENABLED` true | 결정 #42 | MVP 절반 |
| 보안 · 수익 | ₩100 판매 14일(11월 하순 · 지난 판매 10-26 끝 + 30일) | 결정 #44 | 데이터 모으기 |
| 보안 · 수익 | 처리방침이 실제보다 넓게 말한다: 문의 «회신받을 이메일»(앱에 칸 없음) · 요약 «대상 앱별 통계 · 실행 확인 결과»(vc4 는 패키지별 규칙 수만). 좁혀 다시 게시할지 → 2026-10-28 사용자 «그대로 둔다» · Phase 3 알림 · 통계를 넣을 때 실제와 함께 다시 맞춘다 | `docs/legal/PRIVACY.*.md` §2 · `DIAGNOSTICS_SYSTEM.md` §3 | 공개 문구 = 실제 수집(기둥 6) |
| 보안 · 수익 | 데이터 보안 «이메일» 다시 신고는 필요 없다고 봄(문의 화면에 이메일 칸 없음) 🙋 확인 | `release/PLAY_CONSOLE.md` §5 | — |
| 코드 결함(2026-10-28 감사) | 「이 기기에서만 지우기」가 진단 버퍼 `diag.jsonl` 을 안 지운다(옛 대상 앱 이름이 다음 문의에 붙는다) | `docs/DATABASE.md` §2 저장 키 표 | 결정 #34 «지웠다» 와 어긋남 |
| 코드 결함 | 하루 요약에 `advProtection` 없음 → 결정 #32 `advanced_protection_on` 알림이 못 뜬다(그 신호를 남기는 코드도 없음) | `DIAGNOSTICS_SYSTEM.md` §4.1 | — |
| 코드 결함 | 하루 요약이 어제 신호에 오늘 규칙 수를 붙인다 | `features/diagSummary.ts` | 분석 왜곡(작음) |
| 표면 흠 | 한국어 새 문구 ChatGPT 검수 전: 스토어 이름 · 설명 · 출시 노트 | CLAUDE §10 | — |
| 표면 흠 | 콘솔 앱 액세스 안내에 숨긴 «Remind if not opened» 줄이 남음 | `release/PLAY_CONSOLE.md` §5 | — |
| 검증 도구 | Phase 1 비행기 모드 시나리오(대기열 → 다시 올리기) 확인 기록 없음 | `docs/PLAN.md` Phase 1 | — |
| 검증 도구 | 진단 하루 요약이 공용 서버에 닿았는지 이쪽에서 못 봤다 | `DIAGNOSTICS_SYSTEM.md` §0 | — |
| 문서 | 축 ⑧ 남은 중복(낮은 위험): 포트 함정(CLAUDE §11 ↔ README §3) · 유예 값(#28 ↔ RULE_SYSTEM) · 하루 종일(#38 ↔ RULE_SYSTEM) | doc-consistency 2026-10-28 | — |
| 문서 | 서비스명 상표 조사(KIPRIS) 안 함 | CLAUDE §15 | — |

🙋 사용자 결정이 필요한 것: 데이터 보안 이메일 신고 판단 확인.
