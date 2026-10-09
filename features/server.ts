import { Intervention } from '@/modules/intervention';

/**
 * 서버 두 곳과의 연결(docs/DATABASE.md §4 · 결정 #30 · #31).
 * - 공용 서버: 기기 토큰(로그인 없음 · 가명 · LinkMemo 방식). 앱 코드 `intervene`.
 * - 앱 서버 `vg-intervene-sync`: 규칙 · 기록. 토큰은 Bearer 로 그대로 넘긴다(앱 서버가 공용 서버 /auth/me 로 확인한다).
 *
 * 🔴 실패는 던지지 않고 결과로 돌려준다. 서버가 죽어도 확인 화면은 기기 캐시로 돈다(기둥 6).
 * 🔴 토큰 · 기기 id 를 로그 · 진단에 남기지 않는다.
 */
export const APP_CODE = 'intervene';
export const COMMON_SERVER_URL = (process.env.EXPO_PUBLIC_COMMON_SERVER_URL ?? 'https://common-server.vercel.app').replace(/\/$/, '');
export const APP_SERVER_URL = (process.env.EXPO_PUBLIC_APP_SERVER_URL ?? 'https://vg-intervene-sync.vercel.app').replace(/\/$/, '');

const KEY_DEVICE = 'cs_device_id';
const KEY_TOKEN = 'cs_token';
const KEY_SUBJECT = 'cs_subject';
/** 「이 기기에서만 지우기」 전에 쓰던 주체 번호들(JSON 배열 · 문의에 붙여 서버 기록을 찾게 · 결정 #34) */
const KEY_PREV_SUBJECTS = 'cs_prev_subjects';
const TIMEOUT_MS = 10_000;

export type Fail = 'offline' | 'unauthorized' | 'upstream' | 'invalid' | 'no-native' | 'error';
export type Result<T> = { ok: true; value: T } | { ok: false; reason: Fail; status?: number };

async function fetchJson(url: string, init: RequestInit): Promise<{ status: number; body: unknown } | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal });
    const body: unknown = await res.json().catch(() => null);
    return { status: res.status, body };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 기기 id(처음 한 번 만들어 둔다). 같은 id 면 공용 서버가 같은 주체를 돌려준다(멱등) */
function deviceId(): string | null {
  if (!Intervention) return null;
  let id = Intervention.kvGet(KEY_DEVICE);
  if (!id) {
    id = Intervention.uuid();
    Intervention.kvSet(KEY_DEVICE, id);
  }
  return id;
}

/** 기기 토큰. 없으면 공용 서버에 기기를 등록해 받는다(`POST /api/v1/devices`) */
export async function ensureToken(force = false): Promise<Result<string>> {
  if (!Intervention) return { ok: false, reason: 'no-native' };
  const saved = Intervention.kvGet(KEY_TOKEN);
  if (saved && !force) return { ok: true, value: saved };
  const id = deviceId();
  if (!id) return { ok: false, reason: 'no-native' };
  const r = await fetchJson(`${COMMON_SERVER_URL}/api/v1/devices`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ app: APP_CODE, deviceId: id }),
  });
  if (!r) return { ok: false, reason: 'offline' };
  const b = r.body as { token?: unknown; subject?: { id?: unknown } } | null;
  if (r.status !== 200 || typeof b?.token !== 'string') return { ok: false, reason: r.status === 401 ? 'unauthorized' : 'upstream', status: r.status };
  Intervention.kvSet(KEY_TOKEN, b.token);
  if (typeof b.subject?.id === 'string') Intervention.kvSet(KEY_SUBJECT, b.subject.id);
  return { ok: true, value: b.token };
}

/** 이 기기의 공용 서버 주체 번호(화면 · 진단 표시용 · 가명) */
export function subjectId(): string | null {
  return Intervention?.kvGet(KEY_SUBJECT) ?? null;
}

/** 지우기 전에 쓰던 주체 번호들(오래된 것이 앞) */
export function previousSubjects(): string[] {
  try {
    const v: unknown = JSON.parse(Intervention?.kvGet(KEY_PREV_SUBJECTS) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * 새 가명으로 바꾼다(결정 #34). 기기 id · 토큰 · 주체를 지워 다음 호출에서 새로 등록된다.
 * 🔴 그래야 다음 동기화에서 옛 서버 사본이 다시 내려오지 않는다("지웠는데 그대로"를 막는다 · 시안 세션 지적 ①).
 * 옛 주체 번호는 남겨 문의에 붙인다(서버 기록 삭제 요청을 찾을 길 · 지적 ②).
 */
export function resetIdentity(): void {
  if (!Intervention) return;
  const old = subjectId();
  if (old) Intervention.kvSet(KEY_PREV_SUBJECTS, JSON.stringify([...previousSubjects().filter((x) => x !== old), old]));
  Intervention.kvSet(KEY_DEVICE, null);
  Intervention.kvSet(KEY_TOKEN, null);
  Intervention.kvSet(KEY_SUBJECT, null);
}

/** 앱 서버 호출. 401 이면 기기 토큰을 한 번 다시 받아 재시도한다 */
export async function appCall<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<Result<T>> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const tok = await ensureToken(attempt > 0);
    if (!tok.ok) return tok;
    const r = await fetchJson(`${APP_SERVER_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: { authorization: `Bearer ${tok.value}`, 'content-type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!r) return { ok: false, reason: 'offline' };
    if (r.status === 401 && attempt === 0) continue;
    if (r.status === 200) return { ok: true, value: r.body as T };
    const reason: Fail = r.status === 401 ? 'unauthorized' : r.status === 400 || r.status === 413 ? 'invalid' : r.status === 503 ? 'upstream' : 'error';
    return { ok: false, reason, status: r.status };
  }
  return { ok: false, reason: 'unauthorized' };
}
