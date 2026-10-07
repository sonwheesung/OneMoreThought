/**
 * 마이그레이션 러너(docs/DATABASE.md §5). 🔴 조각 운영 DB 에 적용된다.
 * - 실행 전에 모든 파일을 sql-guard 로 잰다. intervene 밖을 건드리는 문장이 하나라도 있으면 아무것도 안 한다.
 * - 파일 하나 = 트랜잭션 하나. 적용 기록은 intervene._migrations.
 * - 조각 public 표를 앞뒤로 찍어 같은지 본다(조각 public 표 변경 0 · mission 승계).
 * 실행: node scripts/migrate.mjs --target=jogak-prod (대상 이름을 손으로 쳐야 돈다)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { adminUrl, hostOf } from './admin-db.mjs';
import { checkSql } from './sql-guard.mjs';

if (!process.argv.includes('--target=jogak-prod')) {
  console.error('대상을 손으로 적는다: --target=jogak-prod');
  process.exit(1);
}
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');
const files = readdirSync(DIR).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
for (const f of files) {
  const problems = checkSql(readFileSync(join(DIR, f), 'utf8'));
  if (problems.length) {
    console.error(`${f} 가 intervene 밖을 건드린다. 아무것도 적용하지 않았다:\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
}

const admin = adminUrl();
const sql = postgres(admin, { max: 1, prepare: false, onnotice: () => {} });
const snapshotPublic = async () =>
  JSON.stringify(
    await sql`SELECT c.relname, c.relkind, c.relrowsecurity,
                     has_table_privilege('anon', c.oid, 'SELECT') AS anon_select
              FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = 'public' ORDER BY c.relname, c.relkind`,
  );
try {
  console.log(`대상 host ${hostOf(admin)}`);
  if ((await sql`SELECT 1 FROM pg_roles WHERE rolname = 'intervene_app'`).length === 0) {
    console.error('intervene_app 역할이 없다. 먼저 node scripts/create-role.mjs');
    process.exit(1);
  }
  const before = await snapshotPublic();
  const has = (await sql`SELECT to_regclass('intervene._migrations') AS t`)[0]?.t !== null;
  const applied = new Set(has ? (await sql`SELECT name FROM intervene._migrations`).map((r) => r.name) : []);
  let n = 0;
  for (const f of files) {
    if (applied.has(f)) continue;
    const body = readFileSync(join(DIR, f), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO intervene._migrations (name) VALUES (${f})`;
    });
    console.log(`적용 ${f}`);
    n++;
  }
  const after = await snapshotPublic();
  if (before !== after) {
    console.error('🔴 조각 public 표 목록 · RLS · anon 권한이 앞뒤로 다르다. 바로 확인할 것');
    process.exit(2);
  }
  console.log(`끝 · 새로 적용 ${n}개 · 조각 public 앞뒤 같음`);
} finally {
  await sql.end();
}
