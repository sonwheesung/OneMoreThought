import { db } from '@/lib/db';
import { body, json, withSubject } from '@/lib/http';
import { isTz } from '@/lib/validate';

export const dynamic = 'force-dynamic';

const str = (v: unknown, max: number) => (typeof v === 'string' && v.length > 0 && v.length <= max ? v : null);

/** 기기 정보(docs/DATABASE.md §3 devices). 틀린 칸은 비워 둔다 */
export function PUT(req: Request) {
  return withSubject(req, async (subject) => {
    const d = ((await body(req)) ?? {}) as Record<string, unknown>;
    const sdk = Number.isInteger(d.sdkInt) && (d.sdkInt as number) > 0 && (d.sdkInt as number) < 1000 ? (d.sdkInt as number) : null;
    const tz = isTz(d.tz) ? d.tz : null;
    await db()`
      INSERT INTO intervene.devices (subject_id, model, sdk_int, app_version, locale, tz, adv_protection)
      VALUES (${subject}, ${str(d.model, 100)}, ${sdk}, ${str(d.appVersion, 40)}, ${str(d.locale, 20)}, ${tz}, ${str(d.advProtection, 20)})
      ON CONFLICT (subject_id) DO UPDATE SET
        last_seen_at = now(), model = EXCLUDED.model, sdk_int = EXCLUDED.sdk_int, app_version = EXCLUDED.app_version,
        locale = EXCLUDED.locale, tz = EXCLUDED.tz, adv_protection = EXCLUDED.adv_protection`;
    return json({ ok: true });
  });
}
