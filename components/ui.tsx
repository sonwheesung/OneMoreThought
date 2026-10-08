import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { motion, radius, size, type } from '@/theme/tokens.ts';
import { usePalette, useReducedMotion } from '@/theme/useTheme.ts';

/**
 * 공용 부품 · 결정 #33 «새벽 호수» · 시안 세션 calm_tokens.md §4 쓰임 규칙.
 * 🔴 색 · 숫자는 theme/tokens 만 쓴다. 새 의존성 없음(그라데이션은 RN 새 아키텍처의 experimental_backgroundImage).
 * 🔴 그라데이션은 주 버튼과 배경 번짐에만. 버튼은 애니메이션 밖(처음부터 보이고 눌린다 · 기둥 1).
 */

export const EASE = Easing.bezier(...motion.ease);

/** 불투명 bg + 끝이 투명한 번짐 3개(라벤더 왼쪽 위 · 민트 오른쪽 가운데 · 라일락 아래) */
export function GlowBackground({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return (
    <View
      style={[
        styles.fill,
        {
          backgroundColor: c.bg,
          experimental_backgroundImage: [
            `radial-gradient(circle at 15% 8%, ${c.bgGlowA} 0%, transparent 55%)`,
            `radial-gradient(circle at 95% 45%, ${c.bgGlowB} 0%, transparent 50%)`,
            `radial-gradient(circle at 20% 100%, ${c.bgGlowC} 0%, transparent 55%)`,
          ].join(', '),
        },
        style,
      ]}>
      {children}
    </View>
  );
}

/** 눌림 .97 · 120ms · 스프링 없음. 모션 줄이기면 줄지 않는다 */
function usePressScale() {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(1)).current;
  const to = (x: number) => {
    if (reduced) return;
    Animated.timing(v, { toValue: x, duration: motion.fast, easing: EASE, useNativeDriver: true }).start();
  };
  return { scale: v, pressIn: () => to(motion.pressScale), pressOut: () => to(1) };
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  height?: number;
}

/** 유리 알약(confirmBtn) — 확인 화면의 [취소][열기] · 권한 안내의 [나중에]. 진짜 버튼이다(글자 링크로 낮추지 않는다) */
export function GlassPill({ label, onPress, style, disabled, height = size.btn }: ButtonProps) {
  const c = usePalette();
  const p = usePressScale();
  return (
    <Animated.View style={[{ transform: [{ scale: p.scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={p.pressIn}
        onPressOut={p.pressOut}
        style={[
          styles.pill,
          { height, backgroundColor: c.confirmBtn, borderColor: c.confirmBtnLine },
          disabled && { backgroundColor: c.disabled, borderColor: c.disabled },
        ]}>
        <Text style={[type.button, { color: disabled ? c.disabledText : c.text }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** 주 버튼: accent → accentEnd 120° 그라데이션(못 그리면 accentSolid 단색) */
export function PrimaryButton({ label, onPress, style, disabled, height = size.btn }: ButtonProps) {
  const c = usePalette();
  const p = usePressScale();
  return (
    <Animated.View style={[{ transform: [{ scale: p.scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={p.pressIn}
        onPressOut={p.pressOut}
        style={[
          styles.pill,
          styles.noLine,
          { height },
          disabled
            ? { backgroundColor: c.disabled }
            : {
                backgroundColor: c.accentSolid,
                experimental_backgroundImage: `linear-gradient(120deg, ${c.accent}, ${c.accentEnd})`,
                boxShadow: `0 14px 34px -10px ${c.accentGlow}`,
              },
        ]}>
        <Text style={[type.button, { color: disabled ? c.disabledText : c.onAccent }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * 줄 단위 등장: 6px 위로 · 240ms · 간격 120ms(시안 원모어 #12). 버튼에는 쓰지 않는다.
 * count 만큼 값을 만들고 style(i) 로 꺼내 쓴다. 모션 줄이기면 처음부터 다 보인다.
 */
export function useStagger(count: number, gap = 120) {
  const reduced = useReducedMotion();
  const values = useRef([...Array(count)].map(() => new Animated.Value(0))).current;
  const play = () => {
    if (reduced) {
      values.forEach((v) => v.setValue(1));
      return;
    }
    values.forEach((v) => v.setValue(0));
    Animated.stagger(
      gap,
      values.map((v) => Animated.timing(v, { toValue: 1, duration: motion.reveal, easing: EASE, useNativeDriver: true })),
    ).start();
  };
  useEffect(play, [reduced]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = (i: number) => {
    const v = values[i] ?? values[0]!;
    return {
      opacity: v,
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [motion.revealRise, 0] }) }],
    };
  };
  return { style, replay: play };
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pill: {
    borderRadius: radius.btn,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  noLine: { borderWidth: 0 },
});
