import { useEffect, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import { dark, light, type Palette } from './tokens.ts';

/** 시스템 밝기를 따른다(결정 #33 · 라이트 · 다크 같은 색조) */
export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** 모션 줄이기 설정. 켜져 있으면 등장 · 눌림 애니메이션 없이 바로 바꾼다(시안 원모어 #17) */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduced(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
