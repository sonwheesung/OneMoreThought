# 프로젝트 스킬 색인 (OneMoreThought)

`C:\project\common\.claude\skills`(범용 방법론)에서 이식했다. 2026-10-06.
**common 이 원본이다.** 범용 규율이 바뀌면 common 을 고치고 여기로 다시 내린다.
반대로 이 프로젝트에서 새로 겪은 함정이 다른 프로젝트에도 통하는 규율로 판명되면 common 으로 올린다.
(승계: `C:\project\mission\.claude\skills\README.md` 의 왕복 규약과 표 모양)

🔴 **값을 베끼지 않는다. 정본을 가리킨다.** 스킬에 포트·경로·명령을 박으면 그 문서가 바뀔 때 같이 낡는다.

---

## 이식한 것 (4종)

| 스킬 | 언제 | 이식 형태 |
|---|---|---|
| `reload-docs` | `/compact` 직후 · 새 세션 착수 전 | common 그대로 |
| `doc-consistency` | 문서 여러 개를 갱신한 뒤 · Phase 를 닫을 때 | common 그대로 |
| `gap-hunt` | 기획서 · 새 시스템을 추가한 뒤 "빠진 반응 없나" | common 그대로 |
| `devils-advocate` | 🔴 **설계 정본을 닫기 전** · 큰 기획 결정 전 | common 그대로 |

⚠ 네 개는 이식한 날(2026-10-06) common 현재본과 **동일**하다(`diff -r` 로 확인). 갱신은 재복사로 한다. 여기서 고치지 않는다.

---

## 이식하지 않은 것: 전역에 이미 있다 (중복 금지)

`~/.claude/skills` 에 있는 것은 여기서 다시 만들지 않는다:
`ui-design-reference` · `play-store-launch-checklist` · `play-store-assets` · `privacy-*` · `ship` · `qa` · `investigate` · `review` · `code-review` · `design-consultation` 등.

---

## 🔴 아직 안 가져온 것: 코드가 생긴 뒤에 가져온다

지금 가져오면 스킬이 존재하지 않는 명령·문서를 가리킨다(`DOC_SYSTEM.md` §8.4).

| 후보 | 언제 | 왜 지금은 아닌가 |
|---|---|---|
| `test` | Phase 0(가드가 생길 때) | 명령은 `docs/README.md` §3 을 **읽어서** 돈다. 지금 §3 이 비어 있다 |
| `check` | 수정사항 시트에 이 프로젝트 탭이 생긴 뒤 | `common/FIX_REQUESTS.md` · 탭 이름 ❓ 미정 |
| `emulator-test` | Phase 2(감지 · 확인 화면이 생긴 뒤) | AVD `onemorethought` · 5590 은 예약만 했다. 대상 앱(대역) 시나리오가 필요하다 |
| `wireless-debug` | 실기기 검증 때 | 🔴 이 앱은 제조사별 백그라운드 제한 · 재부팅 · 정확한 알람이 **실기기로만** 확인된다 |
| `i18n-layout-audit` | 언어가 둘 이상으로 정해지면 | ⚠ 미결정(CLAUDE §14) |
| `copy-polish` | 화면 문구가 생긴 뒤 | 권한 안내 문구가 이 앱의 신뢰를 좌우한다(기획서 §21) |
| `security-audit` | 출시 전 | 서버가 없다. 다만 접근성 서비스가 다루는 데이터 범위를 점검할 때 쓴다 |

## 🚫 안 가져오는 것

| 스킬 | 왜 |
|---|---|
| `dev-stack` | 서버가 없다(기획서 §20) |
| `balance-sim` | 수치 밸런스가 없다 |

---

## 부록: 스킬을 가져올 때 체크리스트

```
[ ] common 의 **현재본**인가
[ ] 포트·경로·AVD·패키지명 같은 고유값이 박혀 있지 않은가. 있으면 정본을 가리키게 고친다
[ ] 스킬이 인용한 명령·문서가 **실재하나**(없으면 아직 이르다)
[ ] 이 README 표를 갱신했나
[ ] 검증 명령이 늘었으면 docs/README.md §3 에 추가했나
```
