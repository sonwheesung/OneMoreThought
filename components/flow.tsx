import { router } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { motion, radius, size, spacing, type } from '@/theme/tokens.ts';
import { usePalette, useReducedMotion } from '@/theme/useTheme.ts';

import { EASE, GlowBackground, PrimaryButton } from './ui.tsx';

/**
 * 규칙 만들기 흐름의 틀(시안 원모어 #7 ~ #11 · #13): 왼쪽 위 뒤로가기 · 진행 칸 · 큰 질문 26/700 · 한 줄 설명 · 아래 고정 주 버튼.
 * 🔴 한 화면에 질문 하나. 진행 표시는 칸 수만(퍼센트 · 칭찬 없음). 깊이 1 이상이면 왼쪽 위 뒤로가기(common/UI_NAVIGATION.md).
 */
interface FlowProps {
  step: number;
  total: number;
  title: string;
  sub?: string;
  cta: string;
  ctaDisabled?: boolean;
  onCta: () => void;
  /** 질문 아래 고정 영역(검색칸 · 칩 줄 등) */
  head?: ReactNode;
  /** 스크롤 대신 자식이 직접 목록을 그릴 때(FlatList) */
  noScroll?: boolean;
  /** 주 버튼 위 한 줄(경고 · 저장 결과) */
  footer?: ReactNode;
  children: ReactNode;
}

export function FlowScreen({ step, total, title, sub, cta, ctaDisabled, onCta, head, noScroll, footer, children }: FlowProps) {
  const c = usePalette();
  const reduced = useReducedMotion();
  // 들어옴: 오른쪽 24px → 0 · 220ms(시안 원모어 #11 · #17). 모션 줄이기면 스택 페이드만
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) enter.setValue(1);
    else
      Animated.timing(enter, {
        toValue: 1,
        duration: 220,
        easing: EASE,
        useNativeDriver: true,
      }).start();
  }, [reduced, enter]);
  const slide = {
    transform: [
      {
        translateX: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [reduced ? 0 : 24, 0],
        }),
      },
    ],
  };
  return (
    <GlowBackground>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.bar}>
          <BackButton />
          <StepBar step={step} total={total} />
          <View style={styles.barSide} />
        </View>
        <Animated.View style={[styles.flex, slide]}>
          <View style={styles.head}>
            <Text style={[type.title, { color: c.text }]} accessibilityRole="header">
              {title}
            </Text>
            {sub ? <Text style={[type.sub, styles.sub, { color: c.text2 }]}>{sub}</Text> : null}
            {head}
          </View>
          {noScroll ? (
            <View style={styles.flex}>{children}</View>
          ) : (
            <ScrollView style={styles.flex} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          )}
        </Animated.View>
        <View style={styles.foot}>
          {footer}
          <PrimaryButton label={cta} onPress={onCta} disabled={ctaDisabled} />
        </View>
      </SafeAreaView>
    </GlowBackground>
  );
}

/** 왼쪽 위 40 유리 원 뒤로가기. 답은 초안에 남는다 */
export function BackButton() {
  const c = usePalette();
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      hitSlop={8}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={[styles.back, { backgroundColor: c.surfaceGlass, borderColor: c.surfaceLine }]}>
      <Text style={[styles.backText, { color: c.text }]}>‹</Text>
    </Pressable>
  );
}

/** 진행 칸: 18×4 막대 · 지금까지 accent */
export function StepBar({ step, total }: { step: number; total: number }) {
  const c = usePalette();
  return (
    <View style={styles.steps} accessibilityLabel={`${step} / ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.stepCell, { backgroundColor: i < step ? c.accent : c.line }]} />
      ))}
    </View>
  );
}

/** on 값을 200ms 로 따라가는 0 ↔ 1(테두리 · 점 · 체크 투명도용 · 네이티브 드라이버) */
export function useOnValue(on: boolean) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) v.setValue(on ? 1 : 0);
    else
      Animated.timing(v, {
        toValue: on ? 1 : 0,
        duration: motion.base,
        easing: EASE,
        useNativeDriver: true,
      }).start();
  }, [on, reduced, v]);
  return v;
}

/** 칩(높이 38 · 알약). 고르면 chipSelected + 1.5px chipSelectedLine + chipSelectedText */
export function Chip({
  label,
  on,
  onPress,
  style,
  height = size.chip,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  height?: number;
}) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          height,
          backgroundColor: on ? c.chipSelected : c.chip,
          borderColor: on ? c.chipSelectedLine : c.line,
          borderWidth: on ? 1.5 : 1,
        },
        style,
      ]}>
      <Text style={[styles.chipText, { color: on ? c.chipSelectedText : c.text2 }]}>{label}</Text>
    </Pressable>
  );
}

/** 체크 원 24: 꺼짐 2px lineStrong → 켜짐 accent + onAccent 체크(.6 → 1 · 200ms) */
export function CheckCircle({ on, radio }: { on: boolean; radio?: boolean }) {
  const c = usePalette();
  const v = useOnValue(on);
  return (
    <View style={[styles.check, { borderColor: on && radio ? c.chipSelectedLine : c.lineStrong }]}>
      <Animated.View
        style={[
          radio ? styles.radioDot : styles.checkFill,
          {
            backgroundColor: c.accent,
            opacity: v,
            transform: [
              {
                scale: v.interpolate({
                  inputRange: [0, 1],
                  outputRange: [radio ? 0.4 : 0.6, 1],
                }),
              },
            ],
          },
        ]}>
        {!radio && <View style={[styles.tick, { borderColor: c.onAccent }]} />}
      </Animated.View>
    </View>
  );
}

/** 유리 카드(반경 28) */
export function GlassCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return <View style={[styles.card, { backgroundColor: c.surfaceGlass, borderColor: c.surfaceLine }, style]}>{children}</View>;
}

export const flowStyles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  barSide: { width: 40 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 26, lineHeight: 30, marginTop: -3 },
  steps: { flexDirection: 'row', gap: 6 },
  stepCell: { width: 18, height: 4, borderRadius: 2 },
  head: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  sub: { marginTop: spacing.xs },
  body: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  foot: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.chip,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkFill: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  tick: {
    width: 6,
    height: 11,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  card: { borderRadius: radius.card, borderWidth: 1, padding: 18 },
});
