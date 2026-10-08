import { requireOptionalNativeModule } from 'expo';

/**
 * 앱 안 네이티브 모듈(Kotlin) — `docs/ANDROID_PLATFORM.md` §6 · 결정 #10.
 *
 * 🔴 없을 수 있다. Expo Go · iOS · 웹에서는 `null` 이다. 부르는 쪽이 그때를 처리한다.
 * ⚠ `getLog` 는 Phase 0 스파이크 화면 전용이다. 규칙 캐시 · 대기열은 `docs/DATABASE.md` §1.1 · §2(결정 #30).
 */
export interface LaunchableApp {
  packageName: string;
  label: string;
}

export interface InterventionNative {
  isServiceEnabled(): boolean;
  /** 🔴 접근성 공개 화면(ANDROID_PLATFORM §7.1)에서 동의를 받은 뒤에만 부른다 */
  openAccessibilitySettings(): void;
  /** rules.json 쓰기(쓰는 쪽은 JS 하나 · DATABASE §2.1). 못 읽는 JSON 이면 false */
  setRules(json: string): boolean;
  /** rules.json 원문({ v, syncedAt, rules }) */
  getRules(): string;
  /** 대기열 앞에서 max 줄(JSON 배열 문자열 · DATABASE §2.2) */
  queueRead(max: number): string;
  /** 서버가 받은 마지막 id 까지 지운다. 지운 줄 수 */
  queueAck(lastId: string): number;
  /** JS 쪽 사건 덧붙이기(eventJson = JSON 객체). id 가 없으면 채운다 */
  queueAppend(eventJson: string): boolean;
  queueCount(): number;
  queueHasRuleEdits(): boolean;
  /** 앱 전용 저장값(기기 id · 기기 토큰). 값을 로그에 남기지 않는다 */
  kvGet(key: string): string | null;
  kvSet(key: string, value: string | null): void;
  uuid(): string;
  /** JSON 배열 문자열(최신이 앞) */
  getLog(): string;
  clearLog(): void;
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  /** 오늘 자정 이후 처음 앞에 나온 시각(ms). 없거나 권한이 없으면 null */
  firstOpenedToday(packageName: string): number | null;
  /** 최근 days 일 중 그 앱이 화면 앞에 나온 날(YYYY-MM-DD). 권한이 없으면 null */
  openedDays(packageName: string, days: number): string[] | null;
  /** {"YYYY-MM-DD": {cancel, open, dismissed}} JSON · 통계 화면용 하루 집계 */
  promptStats(): string;
  listLaunchableApps(): LaunchableApp[];
  advancedProtection(): 'on' | 'off' | 'unknown';
  sdkInt(): number;
  /** 진단 버퍼에 한 건(결정 #20). fieldsJson = JSON 객체 문자열 */
  logDiag(kind: string, fieldsJson: string): void;
  /** JSON 배열 문자열(최신이 뒤) · 문의 첨부 · 미리보기용 */
  getDiag(): string;
  clearDiag(): void;
  /** {device, counts} JSON · 하루 요약의 뼈대 */
  diagSummary(): string;
}

export const Intervention = requireOptionalNativeModule<InterventionNative>('Intervention');
