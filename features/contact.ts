import Constants from "expo-constants";

import { Intervention } from "@/modules/intervention";

import { serverAllowed } from "./age";
import { cachedRules } from "./rules";
import {
  APP_CODE,
  COMMON_SERVER_URL,
  ensureToken,
  previousSubjects,
  subjectId,
} from "./server";

/**
 * 문의 보내기 · `docs/DIAGNOSTICS_SYSTEM.md` §5 · 결정 #20 · #24 · #34 · #35.
 * 공용 서버 `POST /api/v1/tickets`. 첨부(`diagnostics`)는 항상 붙인다. 화면의 미리보기와 같은 함수로 만든다.
 * 🔴 만 14세 미만 · 나이 답 전이면 서버로 보내지 않는다(결정 #41 · 화면이 메일 길을 보여 준다).
 */
export const SUPPORT_EMAIL = "support@vivace-games.com";
export const CONTENT_MIN = 5;
export const CONTENT_MAX = 2000;
export const CATEGORIES = ["bug", "suggestion", "question", "etc"] as const;
export type Category = (typeof CATEGORIES)[number];

/** 서버 상한 512KB 보다 여유를 둔다(본문 · JSON 따옴표 몫) */
const BUDGET = 480 * 1024;
const TIMEOUT_MS = 15_000;

const parse = (s: string | undefined | null, fallback: unknown): unknown => {
  try {
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
};

export function contactAllowed(): boolean {
  return serverAllowed();
}

/** 보낼 첨부. 미리보기와 보내기가 같은 값을 쓴다 */
export function buildDiagnostics(): Record<string, unknown> {
  const rules = cachedRules();
  return {
    v: 1,
    summary: {
      diag: parse(Intervention?.diagSummary(), {}),
      prompts: parse(Intervention?.promptStats(), {}),
      rules: {
        intercept: rules.filter((r) => r.kind === "intercept").length,
        check: rules.filter((r) => r.kind === "check").length,
      },
    },
    lines: parse(Intervention?.getDiag(), []),
    messages: rules.map((r) => ({
      name: r.name,
      kind: r.kind,
      enabled: r.enabled,
      targets: r.targets,
      message: r.message,
    })),
    subjects: { now: subjectId(), previous: previousSubjects() },
  };
}

const bytes = (s: string) => new TextEncoder().encode(s).length;

/** 상한을 넘으면 오래된 진단 줄부터 버린다 */
function fit(body: Record<string, unknown>, limit: number): string {
  let json = JSON.stringify(body);
  const d = body.diagnostics as { lines?: unknown };
  while (bytes(json) > limit && Array.isArray(d.lines) && d.lines.length > 0) {
    d.lines = d.lines.slice(Math.ceil(d.lines.length / 4));
    json = JSON.stringify(body);
  }
  return json;
}

export type SendResult = "ok" | "local" | "offline" | "rate-limited" | "error";

async function post(
  json: string,
  token: string | null,
): Promise<{ status: number; body: unknown } | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${COMMON_SERVER_URL}/api/v1/tickets`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
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

export async function sendContact(
  category: Category,
  content: string,
): Promise<SendResult> {
  if (!contactAllowed()) return "local";
  const text = content.trim();
  if (text.length < CONTENT_MIN) return "error";
  const body = {
    app: APP_CODE,
    category,
    content: text.slice(0, CONTENT_MAX),
    device: {
      platform: "android",
      appVersion: Constants.expoConfig?.version ?? "",
    },
    diagnostics: buildDiagnostics(),
  };
  let limit = BUDGET;
  for (let attempt = 0; attempt < 3; attempt++) {
    const tok = await ensureToken(attempt > 0);
    const r = await post(fit(body, limit), tok.ok ? tok.value : null);
    if (!r) return "offline";
    if (r.status === 200) return "ok";
    if (r.status === 429) return "rate-limited";
    if (r.status === 401 && attempt === 0) continue;
    const b = r.body as { limit?: unknown } | null;
    if (r.status === 413 && typeof b?.limit === "number") {
      limit = Math.min(limit, Math.floor(b.limit * 0.9));
      continue;
    }
    return "error";
  }
  return "error";
}
