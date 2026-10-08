# DATABASE — 서버 스키마 · 기기 캐시 · 기록 대기열

> 정본 규칙: [`../CLAUDE.md`](../CLAUDE.md) §6(서버 경계) · 결정 #22 · #23 · #24 · #30. 판정 규칙은 [`RULE_SYSTEM.md`](./RULE_SYSTEM.md).
> 작성 2026-10-08(Phase 1). 승계: mission `docs/SYNC_SYSTEM.md`(조각 DB 스키마 · 전용 역할 · 손 SQL · postgres.js). 다른 점은 **서버가 정본**이라는 것이다(mission 은 기기가 정본).
>
> 이름(결정 #31): 스키마 **`intervene`** · DB 역할 **`intervene_app`** · Vercel **`vg-intervene-sync`** · 공용 서버 `app_code` **`intervene`**(요청 중). 서비스명(미결정 N)을 박지 않는다.

## 0. 구현 현황

| 항목 | 상태 | 비고 |
|---|---|---|
| 설계(이 문서) | ✅ 2026-10-08 | §6 이름은 결정 #31 |
| 기기 규칙 캐시(`rules.json`) | ✅ 2026-10-08(코드) | `RuleStore.kt` · 접근성 서비스가 `RuleJudge` 로 판정 · 스파이크 `SpikeStore` 의 규칙 저장을 대체 · ⏳ 실기기 |
| 기록 대기열(`queue.jsonl`) | ✅ 2026-10-08(코드) | `EventQueue.kt`(덧붙이기 · 읽기 · ack · 1MB 상한) · `features/rules.ts` 가 올린다 · ⏳ 실기기 |
| `server/` 골격 · API 7개 | ✅ 2026-10-08 | mission 승계 · 로컬 e2e 통과(AUTH_STUB · 실제 조각 DB) |
| 조각 DB `intervene` 스키마 · 전용 역할 | ✅ 2026-10-08 | 결정 #31 그날 확인 · 0001 · 조각 `public` 앞뒤 같음 · `db:check` 29항목. 🔴 조각 세션이 떠 있지 않아 통지는 이 행 · CLAUDE §15 · 사용자 보고로 남겼다 |
| Vercel 배포 | ✅ 2026-10-08 | `https://vg-intervene-sync.vercel.app`(팀 sonws · `icn1`) · env 2개(`DATABASE_URL` 은 6543 · 값은 stdin 으로만) · health `db: up` · 토큰 없음 · 가짜 토큰 · 인증 우회 시도 전부 401 |
| 공용 서버 `app_code` | ✅ 2026-10-08 | 그쪽 등록. ✅ 2026-10-08 14:49 실기기(갤럭시 S24): 기기 토큰 발급 → 앱 서버 `/api/rules` 가 그 토큰을 받아 동기화 `↑0 · ↓0` · 주체 번호 표시 |

## 1. 구조

```
┌─ 기기 ───────────────────────────────────────────────────────────────┐
│  JS(RN) ── setRules(json) ──▶ rules.json ◀── 읽기 ── 접근성 서비스(Kotlin) │
│     ▲                                              │ 확인 화면 결과       │
│     │ 올리기(연결되면) ◀──── queue.jsonl ◀── 덧붙이기 ┘ 실행 확인 결과    │
└─────┼────────────────────────────────────────────────────────────────┘
      │ Bearer <공용 서버 기기 토큰>
      ▼
  앱 서버(server/ · Next.js · Vercel icn1)
      │ ① 공용 서버 /api/v1/auth/me → subject.id
      │ ② intervene_app 역할로 intervene.* 만 읽고 쓴다
      ▼
  조각 운영 Supabase · 스키마 intervene
```

- **규칙의 정본은 서버다**(결정 #30). 기기의 `rules.json` 은 접근성 서비스가 인터넷 없이 바로 판정하기 위한 캐시다.
- **기록의 정본도 서버다.** 기기는 올리기 전까지만 들고 있는다(대기열).
- 앱은 DB 를 직접 부르지 않는다. 사용자가 많아져 스키마를 새 프로젝트로 옮겨도 서버 URL 만 그대로면 앱은 안 바뀐다(mission 승계).

### 1.1 CLAUDE §6 의 질문: 규칙 저장소를 누가 소유하나

**JS 가 쓰고 네이티브가 읽는다. 같은 파일을 둘이 쓰지 않는다.**

| 파일 | 쓰는 쪽 | 읽는 쪽 | 왜 |
|---|---|---|---|
| `rules.json` | JS(`setRules` 네이티브 함수 · 임시 파일에 쓰고 이름 바꾸기) | Kotlin(서비스 시작 · 바뀐 알림을 받을 때) | 규칙 편집 화면은 JS 다. 접근성 서비스는 JS 가 죽어 있어도 돈다 |
| `queue.jsonl` | Kotlin(확인 화면 결과 · 실행 확인 결과를 한 줄씩 덧붙인다) | JS(올리고 서버가 받은 id 까지 지운다) | 사건은 네이티브에서 난다. 올리기는 네트워크 · 토큰이 있는 JS 가 한다 |
| `diag.jsonl` | Kotlin · JS(`logDiag`) | JS(요약 · 문의 첨부) | 이미 있다([`DIAGNOSTICS_SYSTEM.md`](./DIAGNOSTICS_SYSTEM.md)) |

- 🔴 대기열을 지우는 일만 JS 가 한다. Kotlin 이 덧붙이는 중에 JS 가 지우면 줄이 사라질 수 있으므로 **지우기는 네이티브 함수(`ackQueue(lastId)`)로 내려 보내 Kotlin 이 같은 잠금 안에서 한다.**
- SQLite 를 쓰지 않는다(결정 #30). 파일은 앱 전용 저장소(`filesDir`)에 있고 백업 대상에서 뺀다.

## 2. 기기 캐시 형식

### 2.1 `rules.json`

```json
{ "v": 1, "syncedAt": 1760000000000, "rules": [ <Rule> ... ] }
```

`<Rule>` 은 `lib/rules.ts` 의 `Rule` 과 같은 모양이다(id · kind · name · enabled · days · startMin · endMin · targets · message · graceMin · updatedAt). 삭제된 규칙은 캐시에 넣지 않는다(서버에만 tombstone).

- 규칙을 만들거나 고치면 **캐시를 먼저 고치고** 서버에 올린다. 오프라인이어도 확인 화면은 새 규칙으로 뜬다. 서버에 못 닿은 편집은 대기열에 `rule_put` · `rule_delete` 로 남는다.
- 앱을 열 때 서버에서 받아 캐시를 덮는다. 단, 대기열에 아직 안 올라간 편집이 있으면 그것을 먼저 올린다(내 편집이 서버의 옛 값에 덮이지 않게).

### 2.2 `queue.jsonl`

한 줄에 사건 하나. 모든 사건은 기기가 만든 UUID `id` 를 가진다. 서버는 `id` 로 멱등하게 받는다(두 번 올려도 한 줄).

| `type` | 언제 | 내용 |
|---|---|---|
| `prompt` | 확인 화면이 닫혔을 때 | `ruleId` · `pkg` · `shownAt` · `result`(`cancel` · `open` · `dismissed`) · `decideMs` · `tz` · `dayKey` |
| `check` | 실행 확인 판정을 했을 때(알람에서 깸) | `ruleId` · `pkg` · `dayKey` · `verdict`(`checkVerdict` 의 값) · `firstOpenedAt` · `at` · `tz` |
| `check_action` | 실행 확인 알림을 눌렀을 때 | `ruleId` · `dayKey` · `action`(`later` · `open`) · `at` |
| `rule_put` · `rule_delete` | 오프라인에서 규칙을 바꿨을 때 | `<Rule>` 전체 · 또는 `ruleId` · `deletedAt` |

- 크기 상한: ⚠ 1MB(placeholder · 2026-10-08). 넘으면 오래된 `prompt` · `check` 부터 버리고 진단에 `queue_trim` 을 남긴다. 규칙 편집(`rule_*`)은 버리지 않는다.
- 🔴 메시지 원문은 `rule_put` 에만 있다. 사건마다 메시지를 다시 싣지 않는다(서버가 `ruleId` 로 잇는다 · 당시 문구는 §3 `rule_versions`).

### 2.3 앱 쪽 코드(2026-10-08)

| 파일 | 하는 일 |
|---|---|
| `features/server.ts` | 공용 서버 기기 토큰(`POST /api/v1/devices` · 기기 id 는 처음 한 번 만든 UUID) · 앱 서버 호출(401 이면 토큰을 한 번 다시 받는다) |
| `features/rules.ts` | `saveRule` · `deleteRule`(캐시 먼저 → 서버 → 실패하면 대기열) · `flushQueue`(200개 묶음 · 200 이면 ack) · `pullRules`(대기열에 규칙 편집이 남아 있으면 덮지 않는다) · `syncNow` |
| `RuleStore.kt` · `EventQueue.kt` | §2.1 · §2.2 |

- 기기 id · 토큰은 앱 전용 SharedPreferences(`intervene_kv`)에 둔다. 다른 앱은 못 읽는다. 로그 · 진단에 남기지 않는다.
- 결정 #27 L(제외 앱): 앱 고르기 목록에서 이 앱 · 홈 런처 · 시스템 설정 · 기본 전화 앱을 뺀다. 접근성 서비스도 홈 런처 · 설정을 판정 전에 거른다(이 앱 · 전화는 이미 "떠남 아님"으로 거른다).

## 3. 서버 표(`intervene`)

모든 사용자 표에 `subject_id`(공용 서버 subject · 기기 토큰의 가명 번호)와 `received_at`(서버가 받은 시각)을 둔다. PK 는 `(subject_id, 기기 UUID)` 다.

| 표 | PK | 내용 |
|---|---|---|
| `intervene.rules` | `(subject_id, id)` | 현재 규칙. `kind` · `name` · `enabled` · `days` · `start_min` · `end_min` · `targets text[]` · `message` · `grace_min` · `updated_at` · `deleted_at`(tombstone · 기록의 `rule_id` 가 살아 있게 · CLAUDE §5-11) |
| `intervene.rule_versions` | `(subject_id, rule_id, updated_at)` | 규칙을 바꿀 때마다 한 줄. 어떤 문장이 취소를 끌어냈나를 당시 문구로 잇기 위해서다(결정 #24) |
| `intervene.prompt_events` | `(subject_id, id)` | 확인 화면 한 번 = 한 줄. `rule_id` · `pkg` · `shown_at` · `result` · `decide_ms` · `tz` · `day_key` |
| `intervene.check_days` | `(subject_id, rule_id, day_key)` | 실행 확인의 하루. `verdict` · `first_opened_at` · `notified_at` · `action` · `tz` |
| `intervene.devices` | `subject_id` | 처음 · 마지막 본 시각 · 기종 · SDK · 앱 버전 · 언어 · 시간대 · 고급 보호 모드 |
| `intervene._migrations` | `name` | 러너 기록 |

- 충돌: 규칙은 `updated_at` 이 큰 쪽이 이긴다. 기기는 하나뿐이라(계정 없음 · 기기 토큰) 실제로 겹칠 일은 오프라인 편집 뒤 늦게 올리는 경우뿐이다.
- `check_days` 는 하루 한 줄이다. 같은 날 사건이 여럿 오면 칸을 채워 나간다(`notified_at` 은 처음 값을 지킨다 · 하루 1회 · 결정 #4).
- 🔴 사용자의 모든 앱 사용을 올리지 않는다. `pkg` 는 그 사용자가 규칙에 넣은 대상 앱뿐이다(CLAUDE §5-9 · 기둥 5).
- 보관 기간 · 삭제: ⚠ Phase 6 처리방침에서 정한다. 계정이 없으므로 앱 설정의 "이 기기의 데이터 지우기"가 서버의 `subject_id` 행을 전부 지운다(API §4 `DELETE /api/me`).

## 4. API(앱 서버)

| 경로 | 하는 일 |
|---|---|
| `GET /api/health` | DB 연결 확인(값 없이 `up` · `down`) |
| `GET /api/rules` | 내 규칙 전부(tombstone 제외) |
| `PUT /api/rules/:id` | 규칙 저장(멱등 · `rule_versions` 한 줄) |
| `DELETE /api/rules/:id` | tombstone |
| `POST /api/events` | 대기열 묶음 올리기 · 받은 마지막 `id` 를 돌려준다 |
| `PUT /api/device` | 기기 정보 |
| `DELETE /api/me` | 이 기기(subject)의 행 전부 지우기 |

- 신원: `Authorization: Bearer <기기 토큰>` → 공용 서버 `GET /api/v1/auth/me` 로 `subject.id` 를 받는다. ~~`x-app-code` 헤더~~ 는 공용 서버가 보지 않는다. 앱 코드는 토큰 클레임에서 읽고 주체의 app_code 와 둘 다 맞아야 한다(2026-10-08 공용 서버 세션 답). 60초 기억. 🔴 공용 서버가 응답하지 않으면 503 이지 401 이 아니다(mission §1.1 승계). △ 기기 토큰으로 `/auth/me` 가 같은 모양을 주는지는 실측 전이다.
- 운영에서 인증 우회 플래그는 무시한다(mission 승계).

## 5. 보안(mission §1.2 승계 · 두 겹)

- 서버는 조각 관리자 접속을 쓰지 않는다. **`intervene_app` 역할**로 붙고 이 역할은 `intervene` 스키마에만 권한이 있다. 조각 `public` 은 권한으로 막는다.
- 관리자 접속값은 마이그레이션 스크립트만 쓰고, 실행할 때 조각 저장소의 env 파일에서 읽는다. 이 저장소로 복사하지 않는다(`common/SECRET_HANDLING.md` · 🔴 공개 저장소).
- 🔴 `drizzle-kit push` 를 쓰지 않는다. 마이그레이션은 손 SQL(`server/db/migrations/NNNN_*.sql`)이고 러너는 `intervene.` 밖을 건드리는 문장이 있으면 실행 전에 죽는다.
- 모든 표 RLS 켬 · `anon` · `authenticated` 권한 없음 · PostgREST 노출 목록에 넣지 않는다(`common/DRIZZLE_RLS_TRAP.md`).
- 적용 뒤 `npm run db:check`(server): RLS · 익명 권한 · `intervene_app` 이 `public` 을 못 읽는 것을 **실제로 읽어 보고** 잰다. 조각 `public` 표 수 · 행 수가 적용 앞뒤로 같은지 본다.

## 6. ~~정할 것~~ → 결정 #31 로 닫혔다(2026-10-08)

| 무엇 | 왜 지금 | 되돌리기 |
|---|---|---|
| 스키마 이름 | 마이그레이션 · 역할 이름이 따라간다. 서비스명을 박지 않는다(미결정 N) | 이름 바꾸기는 가능하지만 역할 · 권한을 다시 건다 |
| 스키마를 만드는 날의 확인 | 조각 운영 DB 에 처음 쓰는 일이다(결정 #23 · mission #28 선례) | 스키마째 지우면 된다(조각 `public` 은 안 건드린다) |
| Vercel 프로젝트 이름 | URL 이 앱 빌드에 들어간다 | 바꾸면 이전 빌드가 옛 URL 을 부른다 |
| 공용 서버 `app_code` 등록 | 기기 토큰 · `/auth/me` 의 전제 | 공용 서버 세션이 등록한다(그쪽 사용자 승인) |

## 7. 가드(예정)

- `check:queue`(앱): 대기열 덧붙이기 · 지우기 · 상한 · 멱등 id · 메시지가 사건에 섞이지 않음.
- `db:check`(server): §5.
- 서버 e2e: 같은 사건 두 번 → 한 줄 · tombstone 뒤 기록의 `rule_id` 가 남는다 · `DELETE /api/me` 뒤 0행 · 공용 서버 죽음 → 503.
