import Constants from 'expo-constants';

import { dayKeyOf, shiftDay, todayKey, type DayKey } from '@/lib/day.ts';
import { Intervention } from '@/modules/intervention';

import { cachedRules } from './rules';
import { COMMON_SERVER_URL, ensureToken } from './server';
import { diagSummaryOn } from './settings';

/**
 * 진단 하루 요약 · 결정 #20 · #21 · `docs/DIAGNOSTICS_SYSTEM.md` §4.1.
 * 홈을 열 때 **어제** 하루치를 한 번 보낸다(그날이 다 끝난 숫자). 같은 날을 다시 보내면 서버가 덮어쓴다.
 * 🔴 설정에서 끄면(`diagSummaryOn`) 보내지 않는다. 나이 확인 전 · 만 14세 미만이면 `ensureToken` 이 막는다(결정 #41).
 * 🔴 실패는 조용히 넘긴다(비차단 · 진단 신호도 남기지 않는다 · 소음).
 */
const KEY_SENT = 'diag_summary_sent_day';
const KEY_LIMIT = 'diag_summary_limit';
const DEFAULT_LIMIT = 16384;
const TIMEOUT_MS = 10_000;

const parse = <T>(s: string | undefined | null, fallback: T): T => {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

/** 보낼 본문. 대상 앱별 값은 켜진 규칙 수(확인 결과는 앱 서버 기록에 패키지별로 있다) */
export function buildSummary(day: DayKey): Record<string, unknown> {
  const diag = parse<{ device?: Record<string, unknown> }>(Intervention?.diagSummary(), {});
  const lines = parse<{ kind?: unknown; at?: unknown }[]>(Intervention?.getDiag(), []);
  const signals: Record<string, number> = {};
  for (const l of lines) {
    if (typeof l.kind !== 'string' || typeof l.at !== 'number') continue;
    if (dayKeyOf(new Date(l.at)) !== day) continue;
    signals[l.kind] = (signals[l.kind] ?? 0) + 1;
  }
  const prompts = parse<Record<string, Record<string, number>>>(Intervention?.promptStats(), {});
  const rules = cachedRules().filter((r) => r.enabled);
  const targets: Record<string, { rules: number }> = {};
  for (const r of rules) for (const p of r.targets) targets[p] = { rules: (targets[p]?.rules ?? 0) + 1 };
  const d = diag.device ?? {};
  return {
    v: 1,
    dayKey: day,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    appVersion: Constants.expoConfig?.version ?? '',
    device: { manufacturer: d.manufacturer, model: d.model, sdkInt: d.sdk, release: d.release },
    signals,
    usage: {
      prompts: prompts[day] ?? {},
      rules: {
        intercept: rules.filter((r) => r.kind === 'intercept').length,
        check: rules.filter((r) => r.kind === 'check').length,
      },
    },
    targets,
  };
}

async function post(json: string, token: string): Promise<{ status: number; body: unknown } | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${COMMON_SERVER_URL}/api/v1/diagnostics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: json,
      signal: ctl.signal,
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

let running = false;

export async function sendDailySummary(): Promise<void> {
  if (!Intervention || running || !diagSummaryOn()) return;
  const day = shiftDay(todayKey(), -1);
  if (Intervention.kvGet(KEY_SENT) === day) return;
  running = true;
  try {
    const body = buildSummary(day);
    const limit = Number(Intervention.kvGet(KEY_LIMIT)) || DEFAULT_LIMIT;
    let json = JSON.stringify(body);
    if (new TextEncoder().encode(json).length > limit) json = JSON.stringify({ ...body, targets: {} });
    for (let attempt = 0; attempt < 2; attempt++) {
      const tok = await ensureToken(attempt > 0);
      if (!tok.ok) return; // local(나이) · offline · 그 밖 → 다음에 다시
      const r = await post(json, tok.value);
      if (!r) return;
      if (r.status === 401 && attempt === 0) continue;
      if (r.status === 413 && attempt === 0) {
        json = JSON.stringify({ ...body, targets: {} });
        continue;
      }
      const b = r.body as { limit?: unknown } | null;
      if (r.status === 200 && typeof b?.limit === 'number') Intervention.kvSet(KEY_LIMIT, String(b.limit));
      // 200 · 404(스위치 꺼짐) · 429 · 그 밖 → 그날은 그만둔다
      Intervention.kvSet(KEY_SENT, day);
      return;
    }
  } catch {
    // 요약 실패로 앱을 멈추지 않는다
  } finally {
    running = false;
  }
}
