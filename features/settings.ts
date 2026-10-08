import { Intervention } from '@/modules/intervention';

/**
 * 앱 설정 값(기기 kv). 규칙이 아니라 서버로 가지 않는다.
 * 진단 자동 요약(결정 #20): 기본 켬 · 설정에서 끈다. 요약 올리기(Phase 5)가 이 값을 읽는다.
 */
const KEY_DIAG = 'diag_summary_on';

export function diagSummaryOn(): boolean {
  return Intervention?.kvGet(KEY_DIAG) !== 'off';
}

export function setDiagSummaryOn(on: boolean): void {
  Intervention?.kvSet(KEY_DIAG, on ? 'on' : 'off');
}
