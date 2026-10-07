import type postgres from 'postgres';
import type { RuleIn } from './validate';

type Sql = postgres.Sql | postgres.TransactionSql;

/** 규칙 저장(멱등 · 새 것이 이긴다 · 바뀌면 rule_versions 한 줄). 반영했으면 true */
export async function putRule(sql: Sql, subject: string, r: RuleIn): Promise<boolean> {
  const at = new Date(r.updatedAt);
  const rows = await sql`
    INSERT INTO intervene.rules (subject_id, id, kind, name, enabled, days, start_min, end_min, targets, message, grace_min, updated_at)
    VALUES (${subject}, ${r.id}, ${r.kind}, ${r.name}, ${r.enabled}, ${r.days}, ${r.startMin}, ${r.endMin}, ${r.targets}, ${r.message}, ${r.graceMin}, ${at})
    ON CONFLICT (subject_id, id) DO UPDATE SET
      kind = EXCLUDED.kind, name = EXCLUDED.name, enabled = EXCLUDED.enabled, days = EXCLUDED.days,
      start_min = EXCLUDED.start_min, end_min = EXCLUDED.end_min, targets = EXCLUDED.targets, message = EXCLUDED.message,
      grace_min = EXCLUDED.grace_min, updated_at = EXCLUDED.updated_at, received_at = now()
    WHERE intervene.rules.updated_at < EXCLUDED.updated_at AND intervene.rules.deleted_at IS NULL
    RETURNING id`;
  if (rows.length === 0) return false;
  await sql`
    INSERT INTO intervene.rule_versions (subject_id, rule_id, updated_at, snapshot)
    VALUES (${subject}, ${r.id}, ${at}, ${sql.json(r as unknown as postgres.JSONValue)})
    ON CONFLICT DO NOTHING`;
  return true;
}

/** tombstone. 기록의 rule_id 가 살아 있게 행은 남긴다(CLAUDE §5-11) */
export async function deleteRule(sql: Sql, subject: string, id: string, atMs: number): Promise<boolean> {
  const at = new Date(atMs);
  const rows = await sql`
    UPDATE intervene.rules SET deleted_at = ${at}, updated_at = ${at}, received_at = now()
    WHERE subject_id = ${subject} AND id = ${id} AND deleted_at IS NULL AND updated_at <= ${at}
    RETURNING id`;
  return rows.length > 0;
}

export async function listRules(sql: Sql, subject: string) {
  const rows = await sql`
    SELECT id, kind, name, enabled, days, start_min, end_min, targets, message, grace_min, updated_at
    FROM intervene.rules WHERE subject_id = ${subject} AND deleted_at IS NULL ORDER BY id`;
  return rows.map((r) => ({
    id: r.id as string, kind: r.kind as string, name: r.name as string, enabled: r.enabled as boolean, days: r.days as number,
    startMin: r.start_min as number, ...(r.end_min === null ? {} : { endMin: r.end_min as number }), targets: r.targets as string[],
    message: r.message as string, ...(r.grace_min === null ? {} : { graceMin: r.grace_min as number }),
    updatedAt: (r.updated_at as Date).getTime(),
  }));
}
