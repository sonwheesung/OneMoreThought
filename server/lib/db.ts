import postgres from 'postgres';

/**
 * intervene_app 역할 접속(docs/DATABASE.md §5). 조각 관리자 접속을 쓰지 않는다.
 * 모듈 로드에서 던지지 않는다(DB 없이도 빌드가 된다 · 조각 승계). 실패는 요청에서 503 으로 드러난다.
 * 🔴 Transaction pooler(6543)로 붙는다. 서버리스는 인스턴스가 여럿 떠서 Session pooler(5432)면 인스턴스마다 접속을 잡아
 *    역할 접속 한도(10)를 넘는다(2026-10-06 실측 `too many connections for role "intervene_app"`). prepare: false · 인스턴스당 1개.
 */
const g = globalThis as unknown as { __pg?: ReturnType<typeof postgres> };

export function db(): ReturnType<typeof postgres> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL 이 없다');
  g.__pg ??= postgres(process.env.DATABASE_URL, { max: 1, prepare: false, idle_timeout: 20, onnotice: () => {} });
  return g.__pg;
}
