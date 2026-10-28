import { db } from '@/lib/db';
import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

/**
 * 보관 기간 정리 · 결정 #40 · docs/DATABASE.md §3. Vercel cron 이 하루 한 번 부른다(vercel.json).
 * 마지막 접속(= 그 기기 행들 중 가장 늦은 last_seen_at · received_at) 뒤 1년이 지난 subject 의 행을 전부 지운다.
 * 지우는 표 · 순서는 DELETE /api/me 와 같다.
 * 🔴 CRON_SECRET 이 없거나 틀리면 아무것도 하지 않는다(Vercel cron 은 `Authorization: Bearer <CRON_SECRET>` 을 붙인다).
 * 🔴 값 · subject 를 로그에 남기지 않는다. 개수만.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return json({ ok: false }, 401);
  try {
    let subjects = 0;
    let deleted = 0;
    await db().begin(async (tx) => {
      const stale = await tx<{ subject_id: string }[]>`
        SELECT subject_id FROM (
          SELECT subject_id, last_seen_at AS t FROM intervene.devices
          UNION ALL SELECT subject_id, received_at FROM intervene.rules
          UNION ALL SELECT subject_id, received_at FROM intervene.rule_versions
          UNION ALL SELECT subject_id, received_at FROM intervene.prompt_events
          UNION ALL SELECT subject_id, received_at FROM intervene.check_days
        ) x
        GROUP BY subject_id
        HAVING max(t) < now() - interval '1 year'`;
      const ids = stale.map((r) => r.subject_id);
      subjects = ids.length;
      if (ids.length === 0) return;
      deleted += (await tx`DELETE FROM intervene.prompt_events WHERE subject_id = ANY(${ids})`).count;
      deleted += (await tx`DELETE FROM intervene.check_days WHERE subject_id = ANY(${ids})`).count;
      deleted += (await tx`DELETE FROM intervene.rule_versions WHERE subject_id = ANY(${ids})`).count;
      deleted += (await tx`DELETE FROM intervene.rules WHERE subject_id = ANY(${ids})`).count;
      deleted += (await tx`DELETE FROM intervene.devices WHERE subject_id = ANY(${ids})`).count;
    });
    console.log('[intervene-server] purge', { subjects, deleted });
    return json({ ok: true, subjects, deleted });
  } catch (e) {
    console.error('[intervene-server] purge', (e as { code?: string })?.code ?? (e as Error)?.name ?? 'error');
    return json({ ok: false, reason: 'error' }, 503);
  }
}
