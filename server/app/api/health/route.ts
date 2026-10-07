import { db } from '@/lib/db';
import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** 인증 없음. DB 가 닿는지만 말한다 */
export async function GET() {
  try {
    await db()`SELECT 1`;
    return json({ ok: true, db: 'up' });
  } catch {
    return json({ ok: true, db: 'down' });
  }
}
