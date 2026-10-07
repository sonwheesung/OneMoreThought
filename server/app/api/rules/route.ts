import { db } from '@/lib/db';
import { json, withSubject } from '@/lib/http';
import { listRules } from '@/lib/rules';

export const dynamic = 'force-dynamic';

/** 내 규칙 전부(tombstone 제외 · docs/DATABASE.md §4) */
export function GET(req: Request) {
  return withSubject(req, async (subject) => json({ ok: true, rules: await listRules(db(), subject) }));
}
