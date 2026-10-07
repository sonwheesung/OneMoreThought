import type { Rule } from '@/lib/rules.ts';
import { Intervention } from '@/modules/intervention';

import { appCall, type Result } from './server';

/**
 * 규칙 저장 · 동기화(docs/DATABASE.md §2 · §4 · 결정 #30).
 *
 * 🔴 순서: 캐시(rules.json)를 **먼저** 고친다 → 서버에 올린다. 못 올리면 대기열에 `rule_put` · `rule_delete` 로 남긴다.
 *    그래서 오프라인에서도 확인 화면은 새 규칙으로 바로 뜬다.
 * 🔴 서버에서 받아 캐시를 덮기 전에 대기열의 규칙 편집을 먼저 올린다(내 편집이 서버의 옛 값에 덮이지 않게 · §2.1).
 */
interface CacheFile {
  v: 1;
  syncedAt: number;
  rules: Rule[];
}

const BATCH = 200;

export function cachedRules(): Rule[] {
  if (!Intervention) return [];
  try {
    const v = JSON.parse(Intervention.getRules()) as Partial<CacheFile>;
    return Array.isArray(v.rules) ? v.rules : [];
  } catch {
    return [];
  }
}

function writeCache(rules: Rule[], syncedAt?: number): boolean {
  if (!Intervention) return false;
  const prev = (() => {
    try {
      return (JSON.parse(Intervention.getRules()) as Partial<CacheFile>).syncedAt ?? 0;
    } catch {
      return 0;
    }
  })();
  const file: CacheFile = { v: 1, syncedAt: syncedAt ?? prev, rules };
  return Intervention.setRules(JSON.stringify(file));
}

/** 만들기 · 고치기. 캐시 → 서버(실패하면 대기열). 반환: 서버까지 갔나 */
export async function saveRule(rule: Rule): Promise<'synced' | 'queued' | 'failed'> {
  const next = cachedRules().filter((r) => r.id !== rule.id).concat(rule);
  if (!writeCache(next)) return 'failed';
  const r = await appCall<{ applied: boolean }>(`/api/rules/${rule.id}`, { method: 'PUT', body: rule });
  if (r.ok) return 'synced';
  if (r.reason === 'invalid') return 'failed'; // 서버가 거절한 모양은 다시 보내 봐야 또 거절된다
  Intervention?.queueAppend(JSON.stringify({ type: 'rule_put', rule }));
  return 'queued';
}

export async function deleteRule(id: string): Promise<'synced' | 'queued' | 'failed'> {
  const deletedAt = Date.now();
  if (!writeCache(cachedRules().filter((r) => r.id !== id))) return 'failed';
  const r = await appCall(`/api/rules/${id}`, { method: 'DELETE', body: { deletedAt } });
  if (r.ok) return 'synced';
  if (r.reason === 'invalid') return 'failed';
  Intervention?.queueAppend(JSON.stringify({ type: 'rule_delete', ruleId: id, deletedAt }));
  return 'queued';
}

/** 대기열을 묶음으로 올린다. 서버가 200 이면 보낸 묶음을 지운다(틀린 사건은 서버가 건너뛰고 센다) */
export async function flushQueue(): Promise<Result<{ sent: number; ignored: number }>> {
  if (!Intervention) return { ok: false, reason: 'no-native' };
  let sent = 0;
  let ignored = 0;
  for (let round = 0; round < 50; round++) {
    const batch = JSON.parse(Intervention.queueRead(BATCH)) as { id?: string }[];
    if (batch.length === 0) break;
    const r = await appCall<{ accepted: number; ignored: number }>('/api/events', { method: 'POST', body: { events: batch } });
    if (!r.ok) return r;
    const last = batch[batch.length - 1]?.id;
    if (!last || Intervention.queueAck(last) === 0) break; // 지우지 못하면 같은 묶음을 끝없이 보내지 않는다
    sent += r.value.accepted;
    ignored += r.value.ignored;
  }
  return { ok: true, value: { sent, ignored } };
}

/** 서버 규칙으로 캐시를 덮는다. 대기열에 규칙 편집이 남아 있으면 덮지 않는다 */
export async function pullRules(): Promise<Result<Rule[]>> {
  if (Intervention?.queueHasRuleEdits()) return { ok: false, reason: 'offline' };
  const r = await appCall<{ rules: Rule[] }>('/api/rules');
  if (!r.ok) return r;
  writeCache(r.value.rules, Date.now());
  return { ok: true, value: r.value.rules };
}

/** 기기 정보(DATABASE §3 devices) */
export async function putDevice(info: { model?: string; sdkInt?: number; appVersion?: string; locale?: string; tz?: string; advProtection?: string }) {
  return appCall('/api/device', { method: 'PUT', body: info });
}

/** 앱을 열 때 · 앞으로 돌아올 때: 올리기 → 받기 */
export async function syncNow(): Promise<{ flush: Result<{ sent: number; ignored: number }>; pull: Result<Rule[]> }> {
  const flush = await flushQueue();
  const pull = flush.ok ? await pullRules() : ({ ok: false, reason: flush.reason } as const);
  return { flush, pull };
}
