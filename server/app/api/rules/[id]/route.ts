import { db } from '@/lib/db';
import { body, json, withSubject } from '@/lib/http';
import { deleteRule, putRule } from '@/lib/rules';
import { isMs, isUuid, ruleOf } from '@/lib/validate';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

/** 규칙 저장(멱등 · 새 것이 이긴다). applied=false 는 서버 것이 같거나 새롭다는 뜻이지 실패가 아니다 */
export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withSubject(req, async (subject) => {
    const rule = ruleOf(await body(req));
    if (!rule || rule.id !== id) return json({ ok: false, reason: 'invalid' }, 400);
    return json({ ok: true, applied: await putRule(db(), subject, rule) });
  });
}

/** tombstone. 몸통 { deletedAt: ms } */
export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withSubject(req, async (subject) => {
    const b = (await body(req)) as { deletedAt?: unknown } | null;
    const at = b?.deletedAt;
    if (!isUuid(id) || !isMs(at)) return json({ ok: false, reason: 'invalid' }, 400);
    return json({ ok: true, applied: await deleteRule(db(), subject, id, at) });
  });
}
