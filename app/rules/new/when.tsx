import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { daysLabel, DayPicker } from '@/components/DayPicker.tsx';
import { Chip, FlowScreen, GlassCard, flowStyles } from '@/components/flow.tsx';
import { hhmm, TimeWheel } from '@/components/TimeWheel.tsx';
import { EASE } from '@/components/ui.tsx';
import { setDraft, useDraft } from '@/features/draft.ts';
import { motion, radius, spacing } from '@/theme/tokens.ts';
import { usePalette, useReducedMotion } from '@/theme/useTheme.ts';

/**
 * 실행 전 확인 · 요일 · 시간대 · 시안 원모어 #9(묶음 카드는 #11) · 진행 3/4.
 * 끝이 시작보다 이르면 «다음 날»(자정을 넘는다 · 요일은 시작한 날 · 결정 #26 C). 시작 == 끝은 호박색 한 줄 + [다음] 꺼짐.
 * 🔴 판정(lib/rules.ts)은 부르지도 고치지도 않는다. 값만 만든다.
 */
const PRESETS = [
  { key: 'late', days: 127, start: 21 * 60, end: 0 },
  { key: 'night', days: 127, start: 23 * 60, end: 7 * 60 },
  { key: 'weekend', days: 96, start: 10 * 60, end: 22 * 60 },
] as const;

export default function NewRuleWhen() {
  const { t } = useTranslation();
  const c = usePalette();
  const d = useDraft();
  const nextDay = d.endMin < d.startMin;
  const same = d.endMin === d.startMin;
  const summary = t('new.whenLabel', {
    days: daysLabel(d.days, t),
    start: hhmm(d.startMin),
    next: nextDay ? `${t('new.nextDay')} ` : '',
    end: hhmm(d.endMin),
  });

  return (
    <FlowScreen
      step={3}
      total={4}
      title={t('new.whenQ')}
      sub={t('new.whenSub')}
      cta={t('new.next')}
      ctaDisabled={!d.days || same}
      onCta={() => router.push('/rules/new/message')}>
      <View>
        <Text style={[flowStyles.label, { color: c.text2 }]}>{t('new.presets')}</Text>
        <View style={flowStyles.row}>
          {PRESETS.map((p) => (
            <Chip
              key={p.key}
              label={t(`new.preset_${p.key}`)}
              on={d.days === p.days && d.startMin === p.start && d.endMin === p.end}
              onPress={() =>
                // 요일 · 시간은 이 화면에 보이니 바꿔도 보인다. 이름은 안 보이므로 사용자가 고친 적이 없을 때만 채운다
                setDraft((cur) => ({
                  days: p.days,
                  startMin: p.start,
                  endMin: p.end,
                  ...(cur.nameTouched ? {} : { name: t(`new.preset_${p.key}_name`) }),
                }))
              }
            />
          ))}
        </View>
      </View>

      <View>
        <Text style={[flowStyles.label, { color: c.text2 }]}>{t('new.days')}</Text>
        <DayPicker value={d.days} onChange={(days) => setDraft({ days })} />
      </View>

      <GlassCard>
        <View style={styles.wheels}>
          <View style={styles.flex}>
            <Text style={[styles.wheelLabel, { color: c.text2 }]}>{t('new.start')}</Text>
            <TimeWheel label={t('new.start')} value={d.startMin} onChange={(startMin) => setDraft({ startMin })} />
          </View>
          <View style={styles.flex}>
            <View style={styles.endHead}>
              <Text style={[styles.wheelLabel, { color: c.text2 }]}>{t('new.end')}</Text>
              <NextDayTag on={nextDay} label={t('new.nextDay')} />
            </View>
            <TimeWheel label={t('new.end')} value={d.endMin} onChange={(endMin) => setDraft({ endMin })} />
          </View>
        </View>
      </GlassCard>

      <Text style={[styles.summary, { color: same ? c.warn : c.text2 }]} accessibilityLiveRegion="polite">
        {same ? t('new.whenSame') : d.days ? summary : t('new.daysNone')}
      </Text>
    </FlowScreen>
  );
}

/** «다음 날» 알약: 나타날 때 6px 떠오름 · 사라질 때는 바로 */
function NextDayTag({ on, label }: { on: boolean; label: string }) {
  const c = usePalette();
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (!on || reduced) {
      v.setValue(on ? 1 : 0);
      return;
    }
    v.setValue(0);
    Animated.timing(v, {
      toValue: 1,
      duration: motion.reveal,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [on, reduced, v]);
  if (!on) return null;
  return (
    <Animated.View
      style={[
        styles.tag,
        {
          backgroundColor: c.accentSoft,
          opacity: v,
          transform: [
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [motion.revealRise, 0],
              }),
            },
          ],
        },
      ]}>
      <Text style={[styles.tagText, { color: c.accentStrong }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wheels: { flexDirection: 'row', gap: spacing.lg },
  wheelLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  endHead: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    height: 22,
    borderRadius: radius.chip,
    paddingHorizontal: 8,
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tagText: { fontSize: 11.5, fontWeight: '700' },
  summary: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
});
