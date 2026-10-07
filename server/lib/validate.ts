/**
 * 들어온 값 검사(docs/DATABASE.md §2 · §3). 틀린 행은 건너뛰고 세기만 한다(mission sync 승계: 하나가 틀려도 묶음 전체를 버리지 않는다).
 * 🔴 상한은 placeholder(2026-10-08). 메시지 원문을 모은다(결정 #24) · 너무 긴 글만 막는다.
 */
export const LIMITS = { name: 60, message: 500, targets: 50, pkg: 255, batch: 500 } as const;
const GRACE = new Set([1, 3, 5, 10, 15, 30]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const PKG = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/;

export type RuleIn = {
  id: string; kind: 'intercept' | 'check'; name: string; enabled: boolean; days: number;
  startMin: number; endMin: number | null; targets: string[]; message: string; graceMin: number | null; updatedAt: number;
};

const isInt = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
const isStr = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
export const isPkg = (v: unknown): v is string => isStr(v, LIMITS.pkg) && PKG.test(v as string);
export const isDay = (v: unknown): v is string => typeof v === 'string' && DAY.test(v);
export const isMs = (v: unknown): v is number => isInt(v, 1_600_000_000_000, 4_000_000_000_000);
export const isTz = (v: unknown): v is string => isStr(v, 64);

export function ruleOf(v: unknown): RuleIn | null {
  const r = v as Record<string, unknown> | null;
  if (!r || typeof r !== 'object') return null;
  if (!isUuid(r.id) || (r.kind !== 'intercept' && r.kind !== 'check')) return null;
  if (!isStr(r.name, LIMITS.name) || typeof r.enabled !== 'boolean' || !isInt(r.days, 1, 127)) return null;
  if (!isInt(r.startMin, 0, 1439) || !isStr(r.message, LIMITS.message) || !isMs(r.updatedAt)) return null;
  if (!Array.isArray(r.targets) || r.targets.length === 0 || r.targets.length > LIMITS.targets || !r.targets.every(isPkg)) return null;
  const endMin = r.endMin === undefined || r.endMin === null ? null : r.endMin;
  if (r.kind === 'intercept' && (!isInt(endMin, 0, 1439) || endMin === r.startMin)) return null;
  if (r.kind === 'check' && r.targets.length !== 1) return null; // 결정 #3
  const graceMin = r.graceMin === undefined || r.graceMin === null ? null : r.graceMin;
  if (graceMin !== null && !GRACE.has(graceMin as number)) return null;
  return {
    id: r.id, kind: r.kind, name: r.name, enabled: r.enabled, days: r.days, startMin: r.startMin,
    endMin: r.kind === 'intercept' ? (endMin as number) : null, targets: r.targets as string[], message: r.message,
    graceMin: graceMin as number | null, updatedAt: r.updatedAt,
  };
}
