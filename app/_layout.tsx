import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/i18n';
import { installJsCrashHandler } from '@/lib/diag';

installJsCrashHandler();

/**
 * 뿌리 레이아웃. Phase 0 은 스파이크 화면 한 장뿐이다(`docs/ANDROID_PLATFORM.md` §9).
 * 실제 화면 구조는 Phase 2(`docs/UI_GUIDE.md`).
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
