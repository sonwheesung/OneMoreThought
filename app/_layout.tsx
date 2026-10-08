import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/i18n';
import { installJsCrashHandler } from '@/lib/diag';
import { usePalette, useReducedMotion } from '@/theme/useTheme.ts';

installJsCrashHandler();

/**
 * 뿌리 레이아웃. 첫 화면은 아직 스파이크(`app/index.tsx` · Phase 1 실기기 시험 도구)다.
 * 전환(시안 원모어 #17): 페이드 220ms + 화면 안 내용이 오른쪽 24px 에서 들어옴 · 모션 줄이기면 200ms 크로스페이드만 · 출렁임 없음.
 * 바탕을 bg 로 깔아 전환 중 흰색이 번쩍이지 않게 한다.
 */
export default function RootLayout() {
  const c = usePalette();
  const reduce = useReducedMotion();
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          // 네이티브 스택에는 '오른쪽 24px + 페이드'가 없다. 스택은 페이드만, 24px 들어옴은 화면 안 조각이 한다(components/flow.tsx)
          animation: 'fade',
          animationDuration: reduce ? 200 : 220,
          gestureEnabled: true,
        }}
      />
    </SafeAreaProvider>
  );
}
