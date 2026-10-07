/**
 * db:check — 적용 뒤 실제로 막혀 있는가(docs/DATABASE.md §5 · common/DRIZZLE_RLS_TRAP.md).
 * 관리자 쪽: 표마다 RLS · anon/authenticated 권한 없음 · intervene_app 정책.
 * intervene_app 쪽(server/.env.local): intervene 표는 읽힌다 · 조각 public 표는 못 읽는다 · public 에 표를 못 만든다.
 * 🔴 "막혀 있겠지"가 아니라 그 역할로 실제로 해 본다. 값은 출력하지 않는다.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import postgres from 'postgres';
import { adminUrl, hostOf } from './admin-db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
const ok = [];
const expect = (what, cond) => (cond ? ok : fails).push(what);

const admin = postgres(adminUrl(), { max: 1, prepare: false, onnotice: () => {} });
const appEnv = parseEnv(readFileSync(join(ROOT, '.env.local'), 'utf8'));
const app = postgres(appEnv.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });
try {
  const tables = await admin`
    SELECT c.relname, c.relrowsecurity,
           has_table_privilege('anon', c.oid, 'SELECT') AS anon_sel,
           has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_sel,
           (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'intervene' AND p.tablename = c.relname AND 'intervene_app' = ANY (p.roles))::int AS app_policies
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'intervene' AND c.relkind = 'r' ORDER BY c.relname`;
  // 사용자 표 5 + _migrations 1(0001 · DATABASE.md §3)
  expect(`intervene 표 6개(실제 ${tables.length})`, tables.length === 6);
  for (const t of tables) {
    expect(`${t.relname} RLS 켜짐`, t.relrowsecurity === true);
    expect(`${t.relname} anon SELECT 없음`, t.anon_sel === false);
    expect(`${t.relname} authenticated SELECT 없음`, t.auth_sel === false);
    if (t.relname !== '_migrations') expect(`${t.relname} intervene_app 정책 1개`, t.app_policies === 1);
  }
  const [s] = await admin`SELECT has_schema_privilege('anon', 'intervene', 'USAGE') AS a, has_schema_privilege('authenticated', 'intervene', 'USAGE') AS b`;
  expect('anon · authenticated 는 intervene 스키마를 못 쓴다', s.a === false && s.b === false);

  // ── intervene_app 으로 실제로 해 본다
  const [who] = await app`SELECT current_user AS u`;
  expect(`intervene_app 으로 붙었다(${who.u})`, who.u === 'intervene_app');
  await app`SELECT count(*) FROM intervene.rules`;
  ok.push('intervene_app 이 intervene.rules 를 읽는다');
  const [pub] = await admin`SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname LIMIT 1`;
  if (pub) {
    try {
      await app.unsafe(`SELECT 1 FROM public."${pub.relname}" LIMIT 1`);
      fails.push('🔴 intervene_app 이 조각 public 표를 읽었다');
    } catch (e) {
      expect(`intervene_app 은 조각 public 표를 못 읽는다(${e.code})`, e.code === '42501');
    }
  } else {
    fails.push('public 표를 하나도 못 찾았다(대상 DB 가 맞나)');
  }
  try {
    await app.begin(async (tx) => {
      await tx.unsafe('CREATE TABLE public.zz_intervene_probe (a int)');
      throw Object.assign(new Error('created'), { code: 'CREATED' });
    });
  } catch (e) {
    expect(`intervene_app 은 public 에 표를 못 만든다(${e.code})`, e.code === '42501');
  }
} finally {
  await admin.end();
  await app.end();
}
console.log(`대상 host ${hostOf(adminUrl())}`);
if (fails.length) {
  console.error(`db:check FAIL (${fails.length})`);
  for (const f of fails) console.error('  ' + f);
  process.exit(1);
}
console.log(`db:check OK · ${ok.length}항목`);
