import { db } from '@/lib/db';
import { json, withSubject } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** 이 기기(subject)의 행 전부 지우기(docs/DATABASE.md §3 · 계정이 없으므로 이것이 삭제 요청 경로다) */
export function DELETE(req: Request) {
  return withSubject(req, async (subject) => {
    let deleted = 0;
    await db().begin(async (tx) => {
      deleted += (await tx`DELETE FROM intervene.prompt_events WHERE subject_id = ${subject}`).count;
      deleted += (await tx`DELETE FROM intervene.check_days WHERE subject_id = ${subject}`).count;
      deleted += (await tx`DELETE FROM intervene.rule_versions WHERE subject_id = ${subject}`).count;
      deleted += (await tx`DELETE FROM intervene.rules WHERE subject_id = ${subject}`).count;
      deleted += (await tx`DELETE FROM intervene.devices WHERE subject_id = ${subject}`).count;
    });
    return json({ ok: true, deleted });
  });
}
