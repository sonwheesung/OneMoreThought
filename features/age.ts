import { Intervention } from '@/modules/intervention';

/**
 * 나이 확인(결정 #41 · 2026-10-09). 첫 실행에 출생연도를 한 번 묻는다.
 * 🔴 출생연도는 저장하지도 보내지도 않는다. 기기에는 답의 결과(`ok` · `under14`)만 남긴다.
 * 🔴 답하기 전과 만 14세 미만이면 서버 두 곳(앱 서버 · 공용 서버)에 아무것도 보내지 않는다. 막는 자리는 `features/server.ts` `ensureToken` 하나다.
 * 연도만으로는 생일을 모르므로 보수적으로 판정한다: 올해 − 출생연도 ≤ 14 면 만 14세 미만일 수 있다 → under14.
 */
const KEY_AGE = 'age_gate';

export type AgeAnswer = 'ok' | 'under14';

export function ageAnswer(): AgeAnswer | null {
  const v = Intervention?.kvGet(KEY_AGE);
  return v === 'ok' || v === 'under14' ? v : null;
}

/** 출생연도로 판정해 결과만 남긴다 */
export function answerAge(birthYear: number, now = new Date()): AgeAnswer {
  const a: AgeAnswer = now.getFullYear() - birthYear <= 14 ? 'under14' : 'ok';
  Intervention?.kvSet(KEY_AGE, a);
  return a;
}

/** 서버로 보내도 되나: 답했고 만 14세 이상일 때만 */
export function serverAllowed(): boolean {
  return ageAnswer() === 'ok';
}

/** 「이 기기에서만 지우기」가 부른다. 다음에 다시 묻는다 */
export function resetAge(): void {
  Intervention?.kvSet(KEY_AGE, null);
}
