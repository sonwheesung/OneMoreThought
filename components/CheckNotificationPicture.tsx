import Constants from 'expo-constants';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { motion, radius, spacing } from '@/theme/tokens.ts';
import { usePalette, useReducedMotion } from '@/theme/useTheme.ts';

import { EASE } from './ui.tsx';

/**
 * 실행 확인 알림 미리보기(그림) · 시안 원모어 #14. 실제 알림은 Phase 3 네이티브(CheckNotifier · 시스템이 그린다).
 * 🔴 첫 줄 = 사용자가 쓴 메시지 그대로 · 둘째 줄은 사실만(시각 · 앱 · 아직 안 열었어요). 연속 기록 · 칭찬 없음.
 * 🔴 [나중에] · [<앱> 열기]는 같은 무게 · 같은 색(accent). 그림이라 Pressable 이 없다.
 */
export function CheckNotificationPicture({ message, app, time }: { message: string; app: string; time: string }) {
  const { t } = useTranslation();
  const c = usePalette();
  const reduced = useReducedMotion();
  const p = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (!reduced) Animated.timing(p, { toValue: 1, duration: motion.reveal, easing: EASE, useNativeDriver: true }).start();
  }, [reduced, p]);
  const ours = Constants.expoConfig?.name ?? '';
  return (
    <Animated.View
      accessible
      accessibilityLabel={t('newCheck.preview_tag')}
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: c.line },
        { opacity: p, transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] },
      ]}>
      <View style={styles.top}>
        <View style={[styles.dot, { backgroundColor: c.accent }]} />
        <Text style={[styles.app, { color: c.text2 }]} numberOfLines={1}>
          {ours} · {t('newCheck.preview_now')}
        </Text>
      </View>
      <Text style={[styles.title, { color: message ? c.text : c.disabledText }]}>{message || t('rule.message_empty')}</Text>
      <Text style={[styles.body, { color: c.text2 }]}>{t('newCheck.notifyBody', { time, app })}</Text>
      <View style={styles.actions}>
        <Text style={[styles.action, { color: c.accent }]}>{t('newCheck.later')}</Text>
        <Text style={[styles.action, { color: c.accent }]} numberOfLines={1}>
          {t('newCheck.open', { app })}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.input, borderWidth: 1, padding: spacing.lg, gap: 4 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  app: { fontSize: 12, flexShrink: 1 },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  body: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
  action: { fontSize: 14, fontWeight: '600' },
});
