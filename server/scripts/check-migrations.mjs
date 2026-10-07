/**
 * check:migrations — 마이그레이션 SQL 이 intervene 스키마 밖을 건드리지 않는가(docs/DATABASE.md §5).
 * 실제 파일 전부 + 반드시 막아야 하는 변이 문장(SELF-TEST). 변이가 하나라도 통과하면 FAIL 이다.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSql, checkStatement, splitStatements } from './sql-guard.mjs';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');
const fails = [];

const files = readdirSync(DIR).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
if (files.length === 0) fails.push('마이그레이션 파일이 없다');
let stmts = 0;
for (const f of files) {
  const sql = readFileSync(join(DIR, f), 'utf8');
  stmts += splitStatements(sql).length;
  for (const p of checkSql(sql)) fails.push(`${f}: ${p}`);
}

const MUST_REJECT = [
  'CREATE TABLE public.users (id int)',
  'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY',
  'GRANT ALL ON SCHEMA public TO intervene_app',
  'GRANT SELECT ON ALL TABLES IN SCHEMA public TO intervene_app',
  'SET search_path = public, intervene',
  'DROP TABLE users',
  "INSERT INTO intervene.rules (message) VALUES ('x')",
  'CREATE TABLE intervene.x (id int REFERENCES public.users(id))',
  'ALTER ROLE postgres SET statement_timeout = 0',
];
for (const s of MUST_REJECT) if (checkStatement(s) === null) fails.push(`변이가 통과했다: ${s}`);

if (fails.length) {
  console.error(`check:migrations FAIL (${fails.length})`);
  for (const f of fails) console.error('  ' + f);
  process.exit(1);
}
console.log(`check:migrations OK · 파일 ${files.length}개 · 문장 ${stmts}개 전부 intervene 안 · 변이 ${MUST_REJECT.length}종 거부`);
