import { db } from '@/lib/db';
import { applyEvent } from '@/lib/events';
import { body, json, withSubject } from '@/lib/http';
import { LIMITS } from '@/lib/validate';

export const dynamic = 'force-dynamic';

/** 대기열 묶음 올리기(docs/DATABASE.md §2.2 · §4). { events: [...] } → { accepted, ignored } */
export function POST(req: Request) {
  return withSubject(req, async (subject) => {
    const b = (await body(req)) as { events?: unknown } | null;
    const events = b?.events;
    if (!Array.isArray(events)) return json({ ok: false, reason: 'invalid' }, 400);
    if (events.length > LIMITS.batch) return json({ ok: false, reason: 'too_many' }, 413);
    let accepted = 0;
    await db().begin(async (tx) => {
      for (const e of events) if (await applyEvent(tx, subject, e)) accepted++;
    });
    return json({ ok: true, accepted, ignored: events.length - accepted });
  });
}
