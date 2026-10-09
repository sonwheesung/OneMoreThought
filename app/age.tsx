import WheelPicker, { type PickerItem } from '@quidone/react-native-wheel-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/flow.tsx';
import { GlowBackground, PrimaryButton } from '@/components/ui.tsx';
import { answerAge } from '@/features/age.ts';
import { spacing, type } from '@/theme/tokens.ts';
import { usePalette } from '@/theme/useTheme.ts';

/**
 * 나이 확인 · 결정 #41. 첫 실행(또는 「이 기기에서만 지우기」 뒤)에 홈보다 먼저 한 번 묻는다.
 * 🔴 휠은 «선택»에서 시작한다(어른 연도를 미리 골라 두지 않는다 · 그냥 눌러 넘기지 못하게).
 * 🔴 출생연도는 화면 밖으로 나가지 않는다. 결과(ok · under14)만 기기에 남긴다(features/age.ts).
 * 만 14세 미만이어도 앱은 그대로 쓴다. 다만 서버로 아무것도 보내지 않는다.
 * 뒤로가기 없음: 이 화면이 첫 화면이다.
 */
const NONE = 0;

export default function AgeGate() {
  const { t } = useTranslation();
  const c = usePalette();
  const [year, setYear] = useState(NONE);
  const data = useMemo<PickerItem<number>[]>(() => {
    const now = new Date().getFullYear();
    return [
      { value: NONE, label: t('age.pick') },
      ...Array.from({ length: 101 }, (_, i) => ({ value: now - i, label: String(now - i) })),
    ];
  }, [t]);

  const done = () => {
    if (year === NONE) return;
    answerAge(year);
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/');
  };

  return (
    <GlowBackground>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.head}>
          <Text style={[type.title, { color: c.text }]} accessibilityRole="header">
            {t('age.title')}
          </Text>
          <Text style={[type.sub, styles.sub, { color: c.text2 }]}>{t('age.sub')}</Text>
        </View>
        <View style={styles.center}>
          <GlassCard style={styles.card}>
            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={t('age.title')}
              accessibilityValue={{ text: year === NONE ? t('age.pick') : String(year) }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(e) => {
                const i = data.findIndex((d) => d.value === year);
                const next =
                  data[Math.min(data.length - 1, Math.max(0, i + (e.nativeEvent.actionName === 'increment' ? 1 : -1)))];
                if (next) setYear(next.value);
              }}>
              <View importantForAccessibility="no-hide-descendants">
                <WheelPicker
                  data={data}
                  value={year}
                  onValueChanged={({ item }) => setYear(item.value)}
                  itemHeight={44}
                  visibleItemCount={5}
                  enableScrollByTapOnItem
                  itemTextStyle={[styles.text, { color: c.text }]}
                  overlayItemStyle={[styles.band, { backgroundColor: c.accentSolid }]}
                />
              </View>
            </View>
          </GlassCard>
          <Text style={[styles.note, { color: c.text3 }]}>{t('age.note')}</Text>
        </View>
        <View style={styles.foot}>
          <PrimaryButton label={t('age.done')} onPress={done} disabled={year === NONE} />
        </View>
      </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  sub: { marginTop: spacing.xs },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  card: { paddingVertical: 4 },
  band: { borderRadius: 14, opacity: 0.12 },
  text: { textAlign: 'center', fontSize: 20, fontWeight: '600', fontVariant: ['tabular-nums'] },
  note: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  foot: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
});
