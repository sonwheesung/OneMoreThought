/**
 * 조각 운영 DB 관리자 접속을 **읽어서 쓰기만** 한다(복사하지 않는다 · common/SECRET_HANDLING.md).
 * 값은 조각 `server/.env.local` 에 있다(2026-09-07 조각 docs/README: 그 파일이 운영을 가리킨다).
 * 🔴 값을 출력하지 않는다. 호스트 이름만 말한다.
 */
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const DIARY_ENV = 'C:/project/diary/server/.env.local';

export function adminUrl() {
  const env = parseEnv(readFileSync(DIARY_ENV, 'utf8'));
  const url = env.DATABASE_URL;
  if (!url) throw new Error(`${DIARY_ENV} 에 DATABASE_URL 이 없다`);
  const u = new URL(url);
  // DDL 은 Session pooler(5432) · Transaction pooler(6543) 는 거부(조각 drizzle.config 교훈)
  if (u.port === '6543') throw new Error('Transaction pooler(6543) 로는 DDL 을 하지 않는다');
  return url;
}

export function hostOf(url) {
  return new URL(url).hostname;
}

/** 조각 운영 Supabase 프로젝트 ref(풀러 사용자 이름 `postgres.<ref>` 의 뒤) */
export function projectRef(url) {
  const user = decodeURIComponent(new URL(url).username);
  const ref = user.split('.')[1];
  if (!ref) throw new Error('풀러 사용자 이름에서 프로젝트 ref 를 못 읽었다');
  return ref;
}
