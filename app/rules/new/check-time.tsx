import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { daysLabel, DayPicker } from '@/components/DayPicker.tsx';
import { FlowScreen, GlassCard, flowStyles, useEdit } from '@/components/flow.tsx';
import { hhmm, TimeWheel } from '@/components/TimeWheel.tsx';
import { setDraft, useDraft } from '@/features/draft.ts';
import { Intervention } from '@/modules/intervention';
import { spacing } from '@/theme/tokens.ts';
import { usePalette } from '@/theme/useTheme.ts';

/**
 * 실행 확인 · 확인 시각 · 요일 · 시안 원모어 #13 · 진행 2/3.
 * 휠 값 = startMin(확인 시각). 아래 한 줄이 뜻을 사실로만 말한다(탓하지 않는다 · 기둥 2).
 */
export default function NewCheckTime() {
  const { t } = useTranslation();
  const c = usePalette();
  const d = useDraft();
  const edit = useEdit();
  const app = useMemo(
    () => Intervention?.listLaunchableApps().find((a) => a.packageName === d.targets[0])?.label ?? '',
    [d.targets],
  );
  return (
    <FlowScreen
      step={2}
      total={3}
      title={t('newCheck.timeQ')}
      sub={t('newCheck.timeSub')}
      edit={edit.editing}
      footer={edit.footer}
      cta={edit.editing ? edit.cta : t('new.next')}
      ctaDisabled={!d.days || edit.saving}
      onCta={edit.editing ? edit.save : () => router.push('/rules/new/check-message')}>
      <GlassCard>
        <TimeWheel
          label={t('newCheck.time')}
          value={d.startMin}
          onChange={(startMin) => setDraft({ startMin })}
          stepMin={30}
          item={52}
          visible={3}
        />
      </GlassCard>
      <Text style={[styles.line, { color: c.text2 }]} accessibilityLiveRegion="polite">
        {t('newCheck.timeLine', { time: hhmm(d.startMin), app })}
      </Text>
      <View>
        <Text style={[flowStyles.label, { color: c.text2 }]}>{t('new.days')}</Text>
        <DayPicker value={d.days} onChange={(days) => setDraft({ days })} />
      </View>
      {d.days ? null : <Text style={[styles.line, { color: c.text3 }]}>{t('new.daysNone')}</Text>}
      <Text style={[styles.small, { color: c.text3 }]}>{d.days ? daysLabel(d.days, t) : ''}</Text>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  line: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: spacing.xs },
  small: { fontSize: 13, textAlign: 'center' },
});
