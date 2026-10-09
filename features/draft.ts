import { useSyncExternalStore } from 'react';

import { Intervention } from '@/modules/intervention';
import { GRACE_DEFAULT, type Rule, type RuleKind } from '@/lib/rules.ts';

import { saveRule } from './rules';

/**
 * 규칙 만들기 흐름의 초안(시안 원모어 #7 ~ #11 · #13). 화면 사이에서 들고 다니는 메모리 값이다.
 * 🔴 저장 전에는 서버 · 기기 캐시 어디에도 가지 않는다. 흐름 끝 [저장]에서 `saveRule` 한 번.
 * 뒤로가도 답은 남는다. 저장하거나 새로 시작하면 비운다.
 */
export interface Draft {
  kind?: RuleKind;
  targets: string[];
  /** 요일 비트(월=1 … 일=64). 0 이면 아직 안 고름 */
  days: number;
  startMin: number;
  endMin: number;
  name: string;
  message: string;
  graceMin: number;
  /** 사용자가 이름을 직접 고쳤나. 고쳤으면 «빠르게 고르기» 칩이 이름을 덮지 않는다 */
  nameTouched: boolean;
}

/**
 * «안 열었을 때 알림»(check) 규칙을 만들 수 있나. 2026-10-10 사용자 선택 «알림이 나올 때까지 숨김»:
 * 이 빌드는 확인 시각 알림을 아직 보내지 않는다(Phase 3) → 없는 기능을 약속하지 않는다. 알림이 나오면 true.
 * 끄면 [+ 규칙 만들기]가 종류 고르기를 건너뛰고 앱 고르기로 간다(3단계).
 */
export const CHECK_RULES_ENABLED = false;

/** 만들기(실행 전 확인) 흐름의 단계 번호. 종류 고르기가 없으면 하나씩 당겨진다 */
export const interceptStep = (n: 2 | 3 | 4) => ({ step: CHECK_RULES_ENABLED ? n : n - 1, total: CHECK_RULES_ENABLED ? 4 : 3 });

/** 메시지 글자 수 상한(가로 확인 화면에서 두 줄 안쪽 · 시안 제안값 · 서버 상한 500 보다 작다) */
export const MESSAGE_MAX = 40;

const EMPTY: Draft = {
  targets: [],
  days: 0,
  startMin: 9 * 60,
  endMin: 18 * 60,
  name: '',
  message: '',
  graceMin: GRACE_DEFAULT,
  nameTouched: false,
};

let draft: Draft = EMPTY;
const listeners = new Set<() => void>();

export function setDraft(patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) {
  draft = { ...draft, ...(typeof patch === 'function' ? patch(draft) : patch) };
  listeners.forEach((l) => l());
}

export function resetDraft(kind?: RuleKind) {
  draft = { ...EMPTY, kind, ...(kind === 'check' ? { days: 127, startMin: 21 * 60 } : {}) };
  listeners.forEach((l) => l());
}

export function useDraft(): Draft {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => draft,
  );
}

/** 초안 → 규칙. 만들기는 새 id · 켜짐, 고치기는 그 규칙의 id · 켜짐 상태를 그대로 쓴다 */
function toRule(d: Draft, id: string, enabled: boolean): Rule {
  return {
    id,
    kind: d.kind!,
    name: d.name.trim(),
    enabled,
    days: d.days,
    startMin: d.startMin,
    ...(d.kind === 'intercept' ? { endMin: d.endMin, graceMin: d.graceMin } : {}),
    targets: d.kind === 'check' ? d.targets.slice(0, 1) : d.targets,
    message: d.message,
    updatedAt: Date.now(),
  };
}

/** 흐름 끝 [저장]. 이 흐름에서 부르는 규칙 함수는 이것 하나다 */
export async function saveDraft(): Promise<'synced' | 'queued' | 'failed'> {
  if (!Intervention || !draft.kind) return 'failed';
  const r = await saveRule(toRule(draft, Intervention.uuid(), true));
  if (r !== 'failed') resetDraft();
  return r;
}

// ── 고치기(시안 원모어 #18): 규칙 자세히의 줄을 누르면 초안을 그 규칙 값으로 채우고 만들기의 그 단계 하나만 연다 ──
let editing: Rule | null = null;
let flash: { to: 'detail' | 'home'; msg: 'saved' | 'deleted' } | null = null;

/** 초안을 이 규칙 값으로 채운다. 이름은 이미 있으므로 «빠르게 고르기»가 덮지 않게 손댄 것으로 본다 */
export function loadDraft(rule: Rule) {
  editing = rule;
  draft = {
    kind: rule.kind,
    targets: rule.targets,
    days: rule.days,
    startMin: rule.startMin,
    endMin: rule.endMin ?? EMPTY.endMin,
    name: rule.name,
    message: rule.message,
    graceMin: rule.graceMin ?? GRACE_DEFAULT,
    nameTouched: true,
  };
  listeners.forEach((l) => l());
}

/** 고치기 [저장]: saveRule 한 번(id · 켜짐은 원래 값). 자세히 화면이 돌아와서 알약을 띄우게 표시를 남긴다 */
export async function saveEdit(): Promise<'synced' | 'queued' | 'failed'> {
  if (!editing || !draft.kind) return 'failed';
  const r = await saveRule(toRule(draft, editing.id, editing.enabled));
  if (r !== 'failed') {
    editing = null;
    flash = { to: 'detail', msg: 'saved' };
    resetDraft();
  }
  return r;
}

/** 다음 화면이 띄울 알약 하나(고치기 저장 → 자세히 · 지우기 → 홈) */
export function setFlash(to: 'detail' | 'home', msg: 'saved' | 'deleted') {
  flash = { to, msg };
}

/** 그 화면이 포커스를 받을 때 한 번 꺼내 간다 */
export function takeFlash(to: 'detail' | 'home'): 'saved' | 'deleted' | null {
  if (!flash || flash.to !== to) return null;
  const m = flash.msg;
  flash = null;
  return m;
}
