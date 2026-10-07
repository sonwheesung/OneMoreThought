/**
 * 서버 계약 시험(docs/DATABASE.md §4 · §7). 로컬 서버(AUTH_STUB=1 · 포트 3900)에 붙어 실제 DB(intervene 스키마)에 쓴다.
 * 시험 주체는 `stub:e2e-<시각>` 이고 끝에서 DELETE /api/me 로 지운다. 지우기를 확인하지 못하면 FAIL 이다(mission 승계).
 */
import { randomUUID } from 'node:crypto';

const BASE = process.env.BASE_URL ?? 'http://localhost:3900';
const TOKEN = `e2e-${Date.now()}`;
const fails = [];
const eq = (what, got, want) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`${what}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
};
const call = async (path, init = {}, token = TOKEN) => {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const put = (r) => call(`/api/rules/${r.id}`, { method: 'PUT', body: JSON.stringify(r) });
const events = (list) => call('/api/events', { method: 'POST', body: JSON.stringify({ events: list }) });

eq('health', (await call('/api/health', {}, null)).body, { ok: true, db: 'up' });
eq('인증 없으면 401', (await call('/api/rules', {}, null)).status, 401);

const T0 = Date.UTC(2026, 9, 8, 1, 0);
const rule = { id: randomUUID(), kind: 'intercept', name: '업무시간', enabled: true, days: 31, startMin: 540, endMin: 1080, targets: ['com.google.android.youtube'], message: '지금 이걸 볼 때일까?', graceMin: 1, updatedAt: T0 };
const check = { id: randomUUID(), kind: 'check', name: '일기', enabled: true, days: 127, startMin: 1380, targets: ['com.example.diary'], message: '오늘 일기 썼어?', updatedAt: T0 };

eq('규칙 저장', (await put(rule)).body, { ok: true, applied: true });
eq('같은 것 다시 → 반영 안 함(멱등)', (await put(rule)).body, { ok: true, applied: false });
eq('옛 것은 지지 않는다', (await put({ ...rule, message: '옛것', updatedAt: T0 - 1000 })).body.applied, false);
eq('새 것이 이긴다', (await put({ ...rule, message: '고침', updatedAt: T0 + 1000 })).body.applied, true);
eq('실행 확인 규칙', (await put(check)).body.applied, true);
eq('실행 확인에 앱 둘 → 400(결정 #3)', (await put({ ...check, id: randomUUID(), targets: ['a.b', 'c.d'] })).status, 400);
eq('시작 == 끝 → 400', (await put({ ...rule, id: randomUUID(), endMin: 540 })).status, 400);
eq('유예 2분 → 400(결정 #28)', (await put({ ...rule, id: randomUUID(), graceMin: 2 })).status, 400);
eq('경로 id 와 몸통 id 가 다르면 400', (await call(`/api/rules/${randomUUID()}`, { method: 'PUT', body: JSON.stringify(rule) })).status, 400);

const list = (await call('/api/rules')).body.rules;
eq('목록 2개', list.length, 2);
eq('목록: 고친 문구', list.find((r) => r.id === rule.id)?.message, '고침');
eq('목록: 실행 확인은 endMin 없음', 'endMin' in (list.find((r) => r.id === check.id) ?? {}), false);

const p1 = { id: randomUUID(), type: 'prompt', ruleId: rule.id, pkg: 'com.google.android.youtube', shownAt: T0 + 60_000, result: 'cancel', decideMs: 1800, tz: 'Asia/Seoul', dayKey: '2026-10-08' };
const bad = { ...p1, id: randomUUID(), result: 'great' };
const c1 = { id: randomUUID(), type: 'check', ruleId: check.id, dayKey: '2026-10-08', verdict: 'notify', at: T0 + 3_600_000, tz: 'Asia/Seoul', firstOpenedAt: null };
const c2 = { id: randomUUID(), type: 'check', ruleId: check.id, dayKey: '2026-10-08', verdict: 'notified', at: T0 + 3_700_000, tz: 'Asia/Seoul' };
const a1 = { id: randomUUID(), type: 'check_action', ruleId: check.id, dayKey: '2026-10-08', action: 'later', at: T0 + 3_800_000 };
eq('사건 올리기(틀린 1 건너뜀)', (await events([p1, bad, c1, c2, a1])).body, { ok: true, accepted: 4, ignored: 1 });
eq('같은 확인 화면 사건 다시 → 안 받음', (await events([p1])).body, { ok: true, accepted: 0, ignored: 1 });
eq('501개 → 413', (await events(Array.from({ length: 501 }, () => p1))).status, 413);

eq('지우기(tombstone)', (await call(`/api/rules/${rule.id}`, { method: 'DELETE', body: JSON.stringify({ deletedAt: T0 + 5000 }) })).body, { ok: true, applied: true });
eq('지운 뒤 목록 1개', (await call('/api/rules')).body.rules.length, 1);
eq('지운 규칙은 다시 살아나지 않는다', (await put({ ...rule, updatedAt: T0 + 9000 })).body.applied, false);
eq('기기 정보', (await call('/api/device', { method: 'PUT', body: JSON.stringify({ model: 'SM-S921N', sdkInt: 36, appVersion: '0.0.1', locale: 'ko', tz: 'Asia/Seoul', advProtection: 'off' }) })).body, { ok: true });

// 규칙 2 + 버전 4(저장 · 고침 · 실행 확인 · 지움은 버전 아님 → 3) + 확인 화면 1 + 실행 확인 하루 1 + 기기 1
const purge = (await call('/api/me', { method: 'DELETE' })).body;
eq('이 기기 데이터 지우기', purge, { ok: true, deleted: 8 });
eq('지운 뒤 0', (await call('/api/rules')).body.rules.length, 0);

if (fails.length) {
  console.error(`e2e FAIL (${fails.length})`);
  for (const f of fails) console.error('  ' + f);
  process.exit(1);
}
console.log('e2e OK');
