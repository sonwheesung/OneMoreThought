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
}

/** 메시지 글자 수 상한(가로 확인 화면에서 두 줄 안쪽 · 시안 제안값 · 서버 상한 500 보다 작다) */
export const MESSAGE_MAX = 40;

const EMPTY: Draft = { targets: [], days: 0, startMin: 9 * 60, endMin: 18 * 60, name: '', message: '', graceMin: GRACE_DEFAULT };

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

/** 흐름 끝 [저장]. 이 흐름에서 부르는 규칙 함수는 이것 하나다 */
export async function saveDraft(): Promise<'synced' | 'queued' | 'failed'> {
  if (!Intervention || !draft.kind) return 'failed';
  const d = draft;
  const rule: Rule = {
    id: Intervention.uuid(),
    kind: d.kind!,
    name: d.name.trim(),
    enabled: true,
    days: d.days,
    startMin: d.startMin,
    ...(d.kind === 'intercept' ? { endMin: d.endMin, graceMin: d.graceMin } : {}),
    targets: d.kind === 'check' ? d.targets.slice(0, 1) : d.targets,
    message: d.message,
    updatedAt: Date.now(),
  };
  const r = await saveRule(rule);
  if (r !== 'failed') resetDraft();
  return r;
}
