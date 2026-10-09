import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

import { Intervention } from '@/modules/intervention';

/**
 * 설치된 앱의 실제 아이콘(2026-10-10 사용자 지시: 첫 글자 타일을 없앤다).
 * 네이티브에서 PNG 로 한 번 받아 앱이 켜져 있는 동안 기억한다. 못 읽으면 빈 자리(같은 크기)만 둔다.
 * 아이콘은 그 앱의 것이라 우리 배경 · 색을 씌우지 않는다.
 */
const cache = new Map<string, string | null>();

export function AppIcon({ pkg, size = 40 }: { pkg: string; size?: number }) {
  const [uri, setUri] = useState<string | null | undefined>(() => cache.get(pkg));
  useEffect(() => {
    if (cache.has(pkg)) {
      setUri(cache.get(pkg));
      return;
    }
    let alive = true;
    void Intervention?.appIcon(pkg, 96)
      .then((v) => {
        cache.set(pkg, v);
        if (alive) setUri(v);
      })
      .catch(() => cache.set(pkg, null));
    return () => {
      alive = false;
    };
  }, [pkg]);
  if (!uri) return <View style={{ width: size, height: size }} />;
  return <Image source={{ uri }} style={{ width: size, height: size }} accessibilityIgnoresInvertColors importantForAccessibility="no" />;
}
