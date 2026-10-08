import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckCircle, FlowScreen, GlassCard, useOnValue } from '@/components/flow.tsx';
import { resetDraft, useDraft } from '@/features/draft.ts';
import type { RuleKind } from '@/lib/rules.ts';
import { radius, spacing } from '@/theme/tokens.ts';
import { usePalette } from '@/theme/useTheme.ts';

/**
 * 규칙 종류 고르기 · 시안 원모어 #7. 두 카드는 같은 크기 · 같은 모양(추천 배지 없음 · 기둥 2).
 * 이 단계는 규칙 함수를 부르지 않는다. 고른 값은 초안에만.
 */
export default function NewRuleKind() {
  const { t } = useTranslation();
  const d = useDraft();
  const pick = (kind: RuleKind) => {
    if (d.kind !== kind) resetDraft(kind);
  };
  return (
    <FlowScreen
      step={1}
      total={d.kind === 'check' ? 3 : 4}
      title={t('new.kindQ')}
      sub={t('new.kindSub')}
      cta={t('new.next')}
      ctaDisabled={!d.kind}
      onCta={() => router.push(d.kind === 'check' ? '/rules/new/check-app' : '/rules/new/apps')}>
      <View accessibilityRole="radiogroup" style={styles.list}>
        <KindCard
          on={d.kind === 'intercept'}
          onPress={() => pick('intercept')}
          title={t('new.intercept')}
          body={t('new.interceptBody')}
          example={t('new.interceptExample')}
        />
        <KindCard
          on={d.kind === 'check'}
          onPress={() => pick('check')}
          title={t('new.check')}
          body={t('new.checkBody')}
          example={t('new.checkExample')}
        />
      </View>
    </FlowScreen>
  );
}

function KindCard({ on, onPress, title, body, example }: { on: boolean; onPress: () => void; title: string; body: string; example: string }) {
  const c = usePalette();
  const v = useOnValue(on);
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={title}>
      <GlassCard>
        <Animated.View pointerEvents="none" style={[styles.ring, { borderColor: c.chipSelectedLine, opacity: v }]} />
        <View style={styles.top}>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: c.text }]}>{title}</Text>
            <Text style={[styles.body, { color: c.text2 }]}>{body}</Text>
          </View>
          <CheckCircle on={on} radio />
        </View>
        <View style={[styles.example, { backgroundColor: c.accentSoft }]}>
          <Text style={[styles.exTag, { color: c.accentStrong }]}>{t('new.exampleTag')}</Text>
          <Text style={[styles.exText, { color: c.text }]}>{example}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: spacing.md },
  ring: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: radius.card, borderWidth: 1.5 },
  top: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  title: { fontSize: 17, fontWeight: '600', lineHeight: 23 },
  body: { fontSize: 13.5, lineHeight: 20, marginTop: 2 },
  example: { borderRadius: radius.row, padding: spacing.md, marginTop: spacing.md, gap: 2 },
  exTag: { fontSize: 12.5, fontWeight: '600' },
  exText: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
});
