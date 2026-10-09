import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { motion, radius, size, spacing } from '@/theme/tokens.ts';
import { usePalette, useReducedMotion } from '@/theme/useTheme.ts';

import { EASE } from './ui.tsx';

/**
 * 설정 화면 부품 · 시안 원모어 #16: 스위치 · 확인창 · 알약 안내.
 * 🔴 출렁임 없음(timing). 꺼진 스위치는 바탕색 차이가 아니라 2px switchOffLine 테두리 + 14 손잡이로 구분(대비 3:1).
 */

/** 스위치 48×28 · 200ms · 손잡이 14 → 22. 트랙 색은 JS 드라이버 · 손잡이 위치는 네이티브(값을 섞지 않는다) */
export function Switch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const c = usePalette();
  const reduced = useReducedMotion();
  const pos = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) pos.setValue(value ? 1 : 0);
    else
      Animated.timing(pos, {
        toValue: value ? 1 : 0,
        duration: motion.base,
        easing: EASE,
        useNativeDriver: true,
      }).start();
  }, [value, reduced, pos]);
  const knob = value ? 22 : 14;
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      hitSlop={10}
      style={[
        styles.track,
        value
          ? { backgroundColor: c.switchOn, borderColor: c.switchOn }
          : { backgroundColor: c.switchOffTrack, borderColor: c.switchOffLine },
      ]}>
      <Animated.View
        style={{
          width: knob,
          height: knob,
          borderRadius: knob / 2,
          backgroundColor: value ? c.knob : c.switchOffLine,
          transform: [
            {
              translateX: pos.interpolate({
                inputRange: [0, 1],
                outputRange: [5, 19],
              }),
            },
          ],
        }}
      />
    </Pressable>
  );
}

/** 가운데 확인창: 바닥 어둡게 · 창 surface 불투명 · 0.96 → 1배 180ms · 닫힘 140ms(닫히는 동안 내용 그대로) */
export function useDialog() {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const p = useRef(new Animated.Value(0)).current;
  const show = () => {
    setOpen(true);
    if (reduced) p.setValue(1);
    else
      Animated.timing(p, {
        toValue: 1,
        duration: 180,
        easing: EASE,
        useNativeDriver: true,
      }).start();
  };
  const hide = (after?: () => void) => {
    const done = () => {
      setOpen(false);
      after?.();
    };
    if (reduced) {
      p.setValue(0);
      done();
    } else
      Animated.timing(p, {
        toValue: 0,
        duration: 140,
        easing: EASE,
        useNativeDriver: true,
      }).start(done);
  };
  return { open, show, hide, p };
}

export function Dialog({ d, onClose, children }: { d: ReturnType<typeof useDialog>; onClose: () => void; children: ReactNode }) {
  const c = usePalette();
  const dark = useColorScheme() === 'dark';
  return (
    <Modal transparent visible={d.open} onRequestClose={onClose} statusBarTranslucent>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: dark ? 'rgba(0,0,0,0.5)' : 'rgba(19,18,49,0.35)',
            opacity: d.p,
          },
        ]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityElementsHidden importantForAccessibility="no" />
      </Animated.View>
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.box,
            { backgroundColor: c.surface, borderColor: c.surfaceLine },
            {
              opacity: d.p,
              transform: [
                {
                  scale: d.p.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

/** 알약 안내: text 바탕 · bg 글자 · 200ms + 1.6초 + 200ms */
export function useToast() {
  const [msg, setMsg] = useState('');
  const p = useRef(new Animated.Value(0)).current;
  const show = (m: string) => {
    setMsg(m);
    p.stopAnimation();
    Animated.sequence([
      Animated.timing(p, {
        toValue: 1,
        duration: 200,
        easing: EASE,
        useNativeDriver: true,
      }),
      Animated.delay(1600),
      Animated.timing(p, {
        toValue: 0,
        duration: 200,
        easing: EASE,
        useNativeDriver: true,
      }),
    ]).start();
  };
  return { msg, p, show };
}

/**
 * 🔴 absolute 자식은 SafeAreaView 의 padding 을 무시한다 → 아래 여백을 직접 더한다(2026-10-10 실기기: 내비게이션 바에 가렸다).
 * 🔴 Android 는 elevation 이 있는 형제(그림자 버튼)가 순서와 상관없이 위에 그린다 → 알약도 elevation 을 준다(홈에서 «규칙을 지웠어요»가 버튼 뒤에 숨었다).
 * `above`: 아래 고정 버튼이 있는 화면에서 그 높이만큼 띄운다.
 */
export function Toast({ t, above = 0 }: { t: ReturnType<typeof useToast>; above?: number }) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { bottom: 40 + above + insets.bottom, backgroundColor: c.text, opacity: t.p }]}
      accessibilityLiveRegion="polite">
      <Text style={[styles.toastText, { color: c.bg }]}>{t.msg}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: size.switchW,
    height: size.switchH,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  box: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: radius.chip,
    elevation: 12,
    zIndex: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  toastText: { fontSize: 14, fontWeight: '600' },
});
