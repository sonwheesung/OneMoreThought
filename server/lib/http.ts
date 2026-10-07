import { identify } from './auth';

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

/** 인증을 거친 처리. 401 = 토큰 무효 · 503 = 상류(common_server · DB)를 못 씀(mission 승계) */
export async function withSubject(req: Request, fn: (subjectId: string) => Promise<Response>): Promise<Response> {
  const who = await identify(req);
  if (who === 'unauthenticated') return json({ ok: false, reason: 'unauthorized' }, 401);
  if (who === 'upstream') return json({ ok: false, reason: 'upstream' }, 503);
  try {
    return await fn(who.subjectId);
  } catch (e) {
    // 값 · 행 내용을 남기지 않는다. 오류 종류만
    console.error('[intervene-server]', (e as { code?: string })?.code ?? (e as Error)?.name ?? 'error');
    return json({ ok: false, reason: 'error' }, 503);
  }
}

/** 몸통 JSON. 못 읽으면 null */
export async function body(req: Request): Promise<unknown> {
  return req.json().catch(() => null);
}
