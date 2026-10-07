/**
 * 조각 운영 DB 에 intervene 서버 전용 역할 intervene_app 을 만든다(docs/DATABASE.md §5).
 * 비밀번호는 여기서 만들어 server/.env.local 에만 적는다. 🔴 화면에 출력하지 않는다.
 * 이미 있으면 멈춘다. 비밀번호를 바꾸려면 --rotate(바꾼 뒤 Vercel env 도 바꿔야 한다).
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { adminUrl, hostOf, projectRef } from './admin-db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_LOCAL = join(ROOT, '.env.local');
const rotate = process.argv.includes('--rotate');

const admin = adminUrl();
const sql = postgres(admin, { max: 1, prepare: false, onnotice: () => {} });
try {
  const exists = (await sql`SELECT 1 FROM pg_roles WHERE rolname = 'intervene_app'`).length > 0;
  if (exists && !rotate) {
    console.error('intervene_app 이 이미 있다. 비밀번호를 바꾸려면 --rotate');
    process.exit(1);
  }
  // base64url 이라 따옴표가 없다 → 리터럴에 그대로 넣어도 안전하다(CREATE ROLE 은 바인드를 못 받는다)
  const pw = randomBytes(24).toString('base64url');
  if (exists) {
    await sql.unsafe(`ALTER ROLE intervene_app WITH PASSWORD '${pw}'`);
  } else {
    // 접속 수를 묶어 사고 반경을 줄인다 · 오래 도는 질의를 끊는다
    await sql.unsafe(`CREATE ROLE intervene_app LOGIN NOINHERIT CONNECTION LIMIT 10 PASSWORD '${pw}'`);
    await sql.unsafe(`ALTER ROLE intervene_app SET statement_timeout = '10s'`);
  }
  const u = new URL(admin);
  const appUrl = `postgresql://${encodeURIComponent(`intervene_app.${projectRef(admin)}`)}:${pw}@${u.hostname}:5432/postgres`;
  let env = existsSync(ENV_LOCAL) ? readFileSync(ENV_LOCAL, 'utf8') : readFileSync(join(ROOT, '.env.example'), 'utf8');
  env = /^DATABASE_URL=.*$/m.test(env) ? env.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${appUrl}`) : `${env}\nDATABASE_URL=${appUrl}\n`;
  writeFileSync(ENV_LOCAL, env);
  console.log(`intervene_app ${exists ? '비밀번호 교체' : '생성'} · host ${hostOf(admin)} · server/.env.local 에 적음(값은 출력하지 않음)`);
} finally {
  await sql.end();
}
