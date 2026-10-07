/**
 * 신원: common_server 에 묻는다(docs/DATABASE.md §4 · mission server/lib/auth.ts 승계 · 기기 토큰 Bearer).
 * 서버는 토큰을 검증하지 않는다. 서명 키를 나눠 가지면 그 키가 두 곳에 생긴다.
 * 🔴 common_server 가 응답하지 않으면 'upstream'(503)이지 'unauthenticated'(401)가 아니다. 앱 SDK 는 401 에 세션을 지운다.
 * 이 앱은 로그인이 없다(결정 #5 · #30). 기기 토큰의 subject.id 만 쓴다. 이메일 칸이 와도 읽지 않는다.
 */
const COMMON_SERVER_URL = (process.env.COMMON_SERVER_URL ?? 'https://common-server.vercel.app').replace(/\/$/, '');
const CACHE_TTL_MS = 60_000;

export type Identity = { subjectId: string };
export type AuthFailure = 'unauthenticated' | 'upstream';

const g = globalThis as unknown as { __authCache?: Map<string, { who: Identity; at: number }> };
const cache = (g.__authCache ??= new Map());

export async function identify(req: Request): Promise<Identity | AuthFailure> {
  const header = req.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return 'unauthenticated';

  // 로컬에서 서버 계약만 시험할 때. 두 겹: 명시적으로 켜야 하고, 프로덕션 빌드는 무시한다
  if (process.env.AUTH_STUB === '1' && process.env.NODE_ENV !== 'production') {
    return { subjectId: `stub:${token}` };
  }

  const hit = cache.get(token);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.who;

  let res: Response;
  try {
    res = await fetch(`${COMMON_SERVER_URL}/api/v1/auth/me`, {
      // 앱 코드는 토큰의 클레임에서 읽는다. x-app-code 헤더는 공용 서버가 보지 않는다(2026-10-08 공용 서버 세션 답)
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // 상류가 죽었으면 만료된 기억이라도 쓴다. 우리 상류가 느리다고 기록이 못 올라가면 안 된다
    return hit ? hit.who : 'upstream';
  }
  if (res.status === 401) {
    cache.delete(token);
    return 'unauthenticated';
  }
  if (!res.ok) return hit ? hit.who : 'upstream';
  const body = (await res.json().catch(() => null)) as { subject?: { id?: unknown } } | null;
  const id = body?.subject?.id;
  if (typeof id !== 'string' || id.length === 0) return 'unauthenticated';
  const who = { subjectId: id };
  cache.set(token, { who, at: Date.now() });
  return who;
}
