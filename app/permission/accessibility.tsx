import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, AppState, BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glyph, type GlyphName } from '@/components/Glyph.tsx';
import { EASE, GlassPill, GlowBackground, PrimaryButton, useStagger } from '@/components/ui.tsx';
import { Intervention } from '@/modules/intervention';
import { radius, spacing, type } from '@/theme/tokens.ts';
import { usePalette, useReducedMotion } from '@/theme/useTheme.ts';

/**
 * 접근성 권한 안내(눈에 띄는 공개 · ANDROID_PLATFORM §7.1 · §8) · 시안 원모어 #12.
 *
 * 🔴 동의 전에는 켜진 스위치 · 체크 · "켜짐" 글자가 어디에도 없다. 체크는 설정에서 돌아와 **실제로 읽은 값**이 켜짐일 때만.
 * 🔴 [나중에]와 [동의하고 설정 열기]는 같은 높이(56)의 진짜 버튼. 뒤로가기는 동의가 아니다(= [나중에]).
 * 🔴 "보내는 것"은 실제 동작(서버로 보냄 · 결정 #21 · #24)과 같은 말이다. 줄이지 않는다.
 * 버튼은 처음부터 보이고 눌린다(강제 대기 없음 · 기둥 1). 줄 단위 등장은 글자에만.
 */
type Step = 'ask' | 'away' | 'on' | 'off';

const LINES = 6; // 머리 표시 · 제목 · 설명 · 보는 것 · 안 보는 것 · 보내는 것

export default function AccessibilityDisclosure() {
  const { t } = useTranslation();
  const c = usePalette();
  const reduced = useReducedMotion();
  const lines = useStagger(LINES);
  const [step, setStep] = useState<Step>('ask');
  const done = useRef(new Animated.Value(0)).current;

  // 설정에서 돌아오면 실제로 켜졌는지 읽는다
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active' || step !== 'away') return;
      const on = Intervention?.isServiceEnabled() ?? false;
      setStep(on ? 'on' : 'off');
      if (on) {
        done.setValue(reduced ? 1 : 0);
        if (!reduced) Animated.timing(done, { toValue: 1, duration: 240, easing: EASE, useNativeDriver: true }).start();
      }
    });
    return () => sub.remove();
  }, [step, reduced, done]);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // 뒤로가기 = [나중에]. 동의로 치지 않는다
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      leave();
      return true;
    });
    return () => sub.remove();
  }, []);

  const agree = () => {
    setStep('away');
    Intervention?.openAccessibilitySettings();
  };

  const block = (i: number, icon: GlyphName, tone: 'accent' | 'mint', title: string, body: string) => (
    <Animated.View style={[styles.block, { backgroundColor: c.surfaceGlass, borderColor: c.surfaceLine }, lines.style(i)]}>
      <View style={styles.iconBox}>
        <Glyph name={icon} color={tone === 'accent' ? c.accent : c.mintText} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.blockTitle, { color: c.text }]}>{title}</Text>
        <Text style={[styles.blockBody, { color: c.text2 }]}>{body}</Text>
      </View>
    </Animated.View>
  );

  return (
    <GlowBackground>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Animated.View style={[styles.halo, lines.style(0)]}>
            <Glyph name="eye" color={c.accent} size={24} />
          </Animated.View>
          <Animated.Text style={[type.title, styles.title, { color: c.text }, lines.style(1)]}>
            {t('disclosure.title')}
          </Animated.Text>
          <Animated.Text style={[styles.desc, { color: c.text2 }, lines.style(2)]}>{t('disclosure.why')}</Animated.Text>

          {block(3, 'eye', 'accent', t('disclosure.seesTitle'), t('disclosure.sees'))}
          {block(4, 'eyeOff', 'mint', t('disclosure.notSeesTitle'), t('disclosure.notSees'))}
          {block(5, 'send', 'mint', t('disclosure.whereTitle'), t('disclosure.where'))}

          <Text style={[styles.path, { color: c.text3 }]}>{t('disclosure.path')}</Text>

          {step === 'on' && (
            <Animated.View
              style={[
                styles.status,
                { backgroundColor: c.mintSoft },
                { opacity: done, transform: [{ scale: done.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
              ]}
              accessibilityLiveRegion="polite">
              <Glyph name="check" color={c.mintText} size={18} />
              <Text style={[styles.statusText, { color: c.mintText }]}>{t('disclosure.enabled')}</Text>
            </Animated.View>
          )}
          {step === 'off' && (
            <View
              style={[styles.status, { backgroundColor: c.warnBg, borderColor: c.warnLine, borderWidth: 1 }]}
              accessibilityLiveRegion="polite">
              <View style={[styles.dot, { backgroundColor: c.warnDot }]} />
              <Text style={[styles.statusText, styles.flex, { color: c.warn }]}>{t('disclosure.stillOff')}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.actions}>
          {step === 'on' ? (
            <PrimaryButton label={t('disclosure.done')} onPress={leave} style={styles.flex} />
          ) : (
            <>
              <GlassPill label={t('disclosure.later')} onPress={leave} style={styles.flex} />
              <PrimaryButton
                label={step === 'off' ? t('disclosure.reopen') : t('disclosure.agree')}
                onPress={agree}
                style={styles.wide}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wide: { flex: 1.35 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg, gap: spacing.md },
  // 아이콘에 배경을 두지 않는다(2026-10-09 사용자 지시)
  halo: { width: 32, height: 32, justifyContent: 'center', marginBottom: spacing.sm },
  title: { fontSize: 25, lineHeight: 33 },
  desc: { fontSize: 14, lineHeight: 21, marginBottom: spacing.sm },
  block: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  iconBox: { width: 24, paddingTop: 1, alignItems: 'center' },
  blockTitle: { fontSize: 15, fontWeight: '600', lineHeight: 21, marginBottom: 2 },
  blockBody: { fontSize: 13, lineHeight: 19 },
  path: { fontSize: 13, lineHeight: 18, marginTop: spacing.xs },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.row,
  },
  statusText: { fontSize: 15, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
