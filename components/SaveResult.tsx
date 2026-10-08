import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { motion } from '@/theme/tokens.ts';
import { usePalette, useReducedMotion } from '@/theme/useTheme.ts';

import { Glyph } from './Glyph.tsx';
import { EASE, GlowBackground } from './ui.tsx';

/** 저장 체크 · 시안 원모어 #11: accentSoft 원 72 + accent 체크 · 0.9 → 1배 240ms. 축하 · 칭찬 없이 확인만 */
export function SaveResult({ label }: { label: string }) {
  const c = usePalette();
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (!reduced) Animated.timing(v, { toValue: 1, duration: motion.reveal, easing: EASE, useNativeDriver: true }).start();
  }, [reduced, v]);
  return (
    <GlowBackground>
      <View style={styles.center} accessibilityLiveRegion="polite">
        <Animated.View
          style={[
            styles.circle,
            { backgroundColor: c.accentSoft, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
          ]}>
          <Glyph name="check" color={c.accent} size={34} />
        </Animated.View>
        <Text style={[styles.text, { color: c.text }]}>{label}</Text>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  circle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 17, fontWeight: '600' },
});
