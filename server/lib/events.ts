import type postgres from 'postgres';
import { deleteRule, putRule } from './rules';
import { isDay, isMs, isPkg, isTz, isUuid, ruleOf } from './validate';

/**
 * 대기열 사건 받기(docs/DATABASE.md §2.2). 모든 사건은 기기 UUID 를 가진다 → 두 번 와도 한 줄.
 * 틀린 사건은 건너뛰고 센다. 기기는 응답이 200 이면 보낸 것을 전부 지운다(틀린 것을 다시 보내 봐야 또 틀린다).
 */
type Tx = postgres.TransactionSql;
const RESULTS = new Set(['cancel', 'open', 'dismissed']);
const VERDICTS = new Set(['notify', 'already', 'notified', 'not_today', 'before', 'missed', 'off']);
const ACTIONS = new Set(['later', 'open']);

export async function applyEvent(tx: Tx, subject: string, v: unknown): Promise<boolean> {
  const e = v as Record<string, unknown> | null;
  if (!e || typeof e !== 'object' || !isUuid(e.id)) return false;
  switch (e.type) {
    case 'prompt': {
      const { ruleId, pkg, shownAt, result, tz, dayKey, decideMs } = e;
      if (!isUuid(ruleId) || !isPkg(pkg) || !isMs(shownAt) || typeof result !== 'string' || !RESULTS.has(result) || !isTz(tz) || !isDay(dayKey)) return false;
      const decide = Number.isInteger(decideMs) && (decideMs as number) >= 0 ? (decideMs as number) : null;
      const r = await tx`
        INSERT INTO intervene.prompt_events (subject_id, id, rule_id, pkg, shown_at, result, decide_ms, tz, day_key)
        VALUES (${subject}, ${e.id}, ${ruleId}, ${pkg}, ${new Date(shownAt)}, ${result}, ${decide}, ${tz}, ${dayKey})
        ON CONFLICT DO NOTHING RETURNING id`;
      return r.length > 0;
    }
    case 'check': {
      const { ruleId, dayKey, verdict, at, tz, firstOpenedAt } = e;
      if (!isUuid(ruleId) || !isDay(dayKey) || typeof verdict !== 'string' || !VERDICTS.has(verdict) || !isMs(at) || !isTz(tz)) return false;
      const first = isMs(firstOpenedAt) ? new Date(firstOpenedAt) : null;
      const notified = verdict === 'notify' ? new Date(at) : null;
      // 하루 한 줄. 알린 시각은 처음 값을 지킨다(결정 #4) · 처음 연 시각은 이른 쪽
      await tx`
        INSERT INTO intervene.check_days (subject_id, rule_id, day_key, verdict, first_opened_at, notified_at, tz, updated_at)
        VALUES (${subject}, ${ruleId}, ${dayKey}, ${verdict}, ${first}, ${notified}, ${tz}, ${new Date(at)})
        ON CONFLICT (subject_id, rule_id, day_key) DO UPDATE SET
          verdict = EXCLUDED.verdict,
          first_opened_at = LEAST(intervene.check_days.first_opened_at, EXCLUDED.first_opened_at),
          notified_at = COALESCE(intervene.check_days.notified_at, EXCLUDED.notified_at),
          tz = EXCLUDED.tz,
          updated_at = GREATEST(intervene.check_days.updated_at, EXCLUDED.updated_at),
          received_at = now()`;
      return true;
    }
    case 'check_action': {
      const { ruleId, dayKey, action, at } = e;
      if (!isUuid(ruleId) || !isDay(dayKey) || typeof action !== 'string' || !ACTIONS.has(action) || !isMs(at)) return false;
      await tx`
        INSERT INTO intervene.check_days (subject_id, rule_id, day_key, action, updated_at)
        VALUES (${subject}, ${ruleId}, ${dayKey}, ${action}, ${new Date(at)})
        ON CONFLICT (subject_id, rule_id, day_key) DO UPDATE SET
          action = EXCLUDED.action,
          updated_at = GREATEST(intervene.check_days.updated_at, EXCLUDED.updated_at),
          received_at = now()`;
      return true;
    }
    case 'rule_put': {
      const rule = ruleOf(e.rule);
      if (!rule) return false;
      await putRule(tx, subject, rule);
      return true;
    }
    case 'rule_delete': {
      const { ruleId, deletedAt } = e;
      if (!isUuid(ruleId) || !isMs(deletedAt)) return false;
      await deleteRule(tx, subject, ruleId, deletedAt);
      return true;
    }
    default:
      return false;
  }
}
