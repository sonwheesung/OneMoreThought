import { requireOptionalNativeModule } from 'expo';

/**
 * 앱 안 네이티브 모듈(Kotlin) — `docs/ANDROID_PLATFORM.md` §6 · 결정 #10.
 *
 * 🔴 없을 수 있다. Expo Go · iOS · 웹에서는 `null` 이다. 부르는 쪽이 그때를 처리한다.
 * ⚠ `setSpikeRule` · `getLog` 는 Phase 0 스파이크 전용이다. 규칙 저장소는 Phase 1 `docs/DATABASE.md` 에서 정한다.
 */
export interface LaunchableApp {
  packageName: string;
  label: string;
}

export interface InterventionNative {
  isServiceEnabled(): boolean;
  /** 🔴 접근성 공개 화면(ANDROID_PLATFORM §7.1)에서 동의를 받은 뒤에만 부른다 */
  openAccessibilitySettings(): void;
  setSpikeRule(targets: string[], message: string): void;
  /** JSON 배열 문자열(최신이 앞) */
  getLog(): string;
  clearLog(): void;
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  /** 오늘 자정 이후 처음 앞에 나온 시각(ms). 없거나 권한이 없으면 null */
  firstOpenedToday(packageName: string): number | null;
  listLaunchableApps(): LaunchableApp[];
  advancedProtection(): 'on' | 'off' | 'unknown';
  sdkInt(): number;
}

export const Intervention = requireOptionalNativeModule<InterventionNative>('Intervention');
