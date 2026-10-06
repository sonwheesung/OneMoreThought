# DOC_DISCIPLINE — 문서 작업법

> `C:\project\common\DOC_SYSTEM.md`(전 프로젝트 공용 정본)의 **OneMoreThought 판**.
> 직접 승계: `C:\project\mission\docs\DOC_DISCIPLINE.md`(mission · 2026-10-02)
> (← Re:Read `C:\project\Bookmind` ← Idea Repository ← LinkMemo ← 조각 `C:\project\diary` ← 배구명가 `C:\project\volleyball`).
>
> 이걸 지키면 "코드와 문서가 따로 노는" 드리프트와 "옛날 수치가 조용히 거짓이 되는" 사고를 막는다.

---

## 1. 결정은 코드보다 먼저 문서에

- 표준 작업 순서 정본은 [`../CLAUDE.md`](../CLAUDE.md) §13.
- 새 설계 결정은 코드보다 먼저 `CLAUDE.md`(기둥 · 결정 로그) 또는 `docs/<SYS>_SYSTEM.md` + `docs/README.md` 색인에 반영한다.
- "왜 이렇게 정했나"와 **"무엇을 포기했나"** 를 함께 적는다.
- 🔴 **기획서를 뒤집은 결정은 반드시 `CLAUDE.md` §14 에 근거와 함께 적는다.** 기획서([`ORIGINAL_BRIEF.md`](./ORIGINAL_BRIEF.md))는 역사 문서다.
- 사용자가 직접 한 말은 **원문 그대로 인용**한다. 요약하면 다음 세션이 범위를 넓혀 읽는다(`common/SESSION_PROTOCOL.md` §1 의 교훈).

## 2. 시스템마다 `*_SYSTEM.md`

- 독립 시스템 하나 = 문서 하나.
- 🔴 **문서 상단에 "0. 구현 현황" 표**(✅/🔨/❌/⏸/🚫). 일관성 검증은 이 표를 기준으로 한다.

## 3. README 색인

`docs/README.md` 가 색인이자 **구현 현황의 정본**이다. 새 문서는 색인 목록과 구현 현황에 함께 등록한다.

## 4. 🔴 손으로 적은 수 옆에 세는 법

```
| 확정 결정 **N건**(세는 법: `grep -c "^\*\*#" CLAUDE.md`) |
```

세는 법은 검출 가능하게 할 뿐 검출하지는 않는다. 파생값을 직접 세어 대조하는 스크립트(`check:docs`)를 Phase 0 에 만들고
README §3 검증 루틴에 넣는 것까지가 완료다(mission `scripts/check-docs.mjs` · 농구명가 `scripts/check-doc-counts.mjs` 참고).
🚫 실측치(감지 지연 ms · 배터리 소모 · 지표)는 자동 대조 대상이 아니다.

## 5. 날짜는 절대값 · 정정은 취소선

- `(2026-10-06 결정)` 형태. "최근" · "얼마 전" 금지.
- 🔴 뒤집힌 결정은 지우지 않는다. ~~취소선~~ + 무엇이 뒤집었는지 + 날짜.

## 6. 케이스(무엇)와 방법(어떻게)을 섞지 않는다

| | 어디 | 무엇 |
|---|---|---|
| 케이스 | `docs/EDGE_CASES.md`(첫 버그 때 신설) | 증상 → 원인 → 수정 → 가드 |
| 방법 | `.claude/skills/*` | 어떻게 새 버그를 찾나 |

버그를 고치면 "왜 기존 검증이 못 잡았나"(사각 분석) + 사각을 닫는 케이스까지가 완료다.

## 7. 수치에는 꼬리표

- 통과 유예 시간 · 감지 지연 목표 · 알림 시각 허용 오차 같은 수치는 기본 **placeholder** 다: `(placeholder 2026-10-06)` / `(확정 2026-MM-DD)`.
- 실측치에는 **기기 · OS 버전 · 측정일 · 표본 수**를 붙인다. 이 앱은 제조사(삼성 · 샤오미 등)마다 백그라운드 동작이 달라서 기기 없는 수치는 의미가 없다.

## 8. 🔴 도메인 · 플랫폼 · 정책 사실은 출처로

- Android API 동작 · Google Play 정책 · 법령은 **공식 문서로 확인하고 URL 과 확인 날짜를 붙인다.** 기억으로 단정하지 않는다.
- 이 앱은 Play 정책(접근성 API · 사용 기록 접근 · 정확한 알람)에 존립이 걸려 있다(기획서 §22). 정책 사실은 [`ANDROID_PLATFORM.md`](./ANDROID_PLATFORM.md) 한 곳에 모으고 다른 문서는 거기를 가리킨다.
- "확인 안 됨"을 "아님"으로 쓰지 않는다(`common/SESSION_PROTOCOL.md` §3).
- 🔴 "미확인"으로 적기 전에 형제 레포와 `common/` 을 먼저 grep 한다: `grep -rl "<개념>" C:/project/*/docs/`.

## 9. 외부 평가 · 리뷰는 `docs/review/`

- `gap-hunt` · `devils-advocate` 결과는 날짜를 붙여 `docs/review/` 에 둔다. **정본이 아니다.**
- 분류(사실 · 의도 · 오독)를 거쳐 채택된 것만 `CLAUDE.md` §14 와 `*_SYSTEM.md` 로 올린다(`devils-advocate` §5).

## 10. 커밋

🔴 정본은 `C:\project\common\COMMIT_CONVENTION.md` 다. 여기에 베껴 적지 않는다.

- 문서 갱신을 코드 커밋과 함께(또는 먼저) 한다.
- 메시지 파일은 Write 도구로 만들고 `git commit -F` 로 넘긴다(`COMMIT_CONVENTION.md` §7).
- 사용자에게 보이는 한국어는 `KOREAN_WRITING.md` §2(검수)를 따른다. **사용자가 직접 쓰는 개입 메시지는 사용자 글이라 검수 대상이 아니다.** 기본 예시 · 화면 문구 · 권한 안내가 대상이다.

---

## 부록 — 새 시스템 추가 시 체크리스트

```
[ ] docs/<SYS>_SYSTEM.md 작성 (§0 구현 현황표 · 설계 결정 · 대가 · 수치 꼬리표)
[ ] docs/README.md 문서 목록 + 구현 현황에 추가
[ ] 엣지케이스 문서화 (EDGE_CASES.md)
[ ] 검증 루틴(README §3)에 새 명령 추가
[ ] 설계가 CLAUDE.md 기둥에 닿으면 §14 결정 로그도 갱신
[ ] 🔴 Phase 를 닫거나 여러 문서를 동시에 갱신했으면 doc-consistency 스킬
```
