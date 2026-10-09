import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { usePalette, useReducedMotion } from '@/theme/useTheme.ts';

/**
 * 시각 휠 · 시안 원모어 #9(한 시간 단위 · 칸 36 · 5칸) · #13(30분 단위 · 칸 52 · 3칸).
 * 손가락을 따르는 ScrollView + 칸 단위 맞춤(FlatList 가 아니다: 화면의 세로 ScrollView 안에 들어가 가상 목록 중첩 경고가 났다 · 칸이 최대 144개라 다 그려도 된다). 하루를 3바퀴 이어 붙이고 멈출 때마다 가운데 바퀴로 되돌려 끝없이 도는 느낌을 낸다.
 * 칸 투명도는 거리로 흐리게(그라데이션 마스크 없이) · 가운데 띠는 accentSoft. 잘못 칠 수 없다.
 * 🔴 출렁임 없음 · 휠 안에서만 움직인다. 모션 줄이기면 프로그램 이동도 즉시.
 */
interface Props {
  /** 분(0 ~ 1439) */
  value: number;
  onChange: (min: number) => void;
  stepMin?: 60 | 30;
  item?: number;
  visible?: 3 | 5;
  label: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const hhmm = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

export function TimeWheel({ value, onChange, stepMin = 60, item = 36, visible = 5, label }: Props) {
  const c = usePalette();
  const reduced = useReducedMotion();
  const n = (24 * 60) / stepMin;
  const idx = Math.round(value / stepMin) % n;
  const ref = useRef<ScrollView | null>(null);
  const y = useRef(new Animated.Value((n + idx) * item)).current;
  const half = Math.floor(visible / 2);
  const data = Array.from({ length: n * 3 }, (_, i) => i);

  // 바깥 값이 바뀌면(빠른 칩 등) 맞춰 굴린다
  const shown = useRef(idx);
  useEffect(() => {
    if (shown.current === idx) return;
    shown.current = idx;
    ref.current?.scrollTo({ y: (n + idx) * item, animated: !reduced });
  }, [idx, n, item, reduced]);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / item);
    const k = ((i % n) + n) % n;
    if (i < n || i >= 2 * n) ref.current?.scrollTo({ y: (n + k) * item, animated: false });
    shown.current = k;
    if (k !== idx) onChange(k * stepMin);
  };

  const step = (d: 1 | -1) => onChange(((((idx + d) % n) + n) % n) * stepMin);

  return (
    <View
      style={{ height: item * visible }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: hhmm(idx * stepMin) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <View pointerEvents="none" style={[styles.band, { top: item * half, height: item, backgroundColor: c.accentSoft }]} />
      <Animated.ScrollView
        ref={ref}
        contentOffset={{ x: 0, y: (n + idx) * item }}
        onLayout={() => ref.current?.scrollTo({ y: (n + shown.current) * item, animated: false })}
        contentContainerStyle={{ paddingVertical: item * half }}
        snapToInterval={item}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], { useNativeDriver: true })}
        onMomentumScrollEnd={settle}
        importantForAccessibility="no-hide-descendants">
        {data.map((i) => (
          <Animated.Text
            key={i}
            style={[
              styles.text,
              {
                height: item,
                lineHeight: item,
                fontSize: visible === 3 ? 22 : 20,
                fontWeight: visible === 3 ? '700' : '600',
                color: c.text,
                opacity: y.interpolate({
                  inputRange: [-3, -2, -1, 0, 1, 2, 3].map((d) => (i + d) * item),
                  outputRange: [0, 0.22, 0.5, 1, 0.5, 0.22, 0],
                  extrapolate: 'clamp',
                }),
              },
            ]}>
            {hhmm((i % n) * stepMin)}
          </Animated.Text>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0, borderRadius: 14 },
  text: { textAlign: 'center', fontVariant: ['tabular-nums'] },
});
