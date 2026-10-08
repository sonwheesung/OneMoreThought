import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/theme/tokens.ts';
import { usePalette } from '@/theme/useTheme.ts';

import { Chip } from './flow.tsx';

/**
 * 요일 원 7개(월=1 … 일=64 · lib/rules.ts 의 비트) + 빠른 칩 [평일 31][주말 96][매일 127] · 시안 원모어 #9.
 * 원은 색만 바뀐다(크기 그대로).
 */
export const PRESET_DAYS = { weekday: 31, weekend: 96, everyday: 127 } as const;

export function DayPicker({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  const { t } = useTranslation();
  const c = usePalette();
  const names = t('new.dayNames').split(',');
  return (
    <View style={styles.wrap}>
      <View style={styles.days}>
        {names.map((name, i) => {
          const on = (value & (1 << i)) !== 0;
          return (
            <Pressable
              key={i}
              onPress={() => onChange(value ^ (1 << i))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={name}
              style={[
                styles.day,
                on
                  ? { backgroundColor: c.chipSelected, borderColor: c.chipSelectedLine, borderWidth: 1.5 }
                  : { backgroundColor: c.chip, borderColor: c.line, borderWidth: 1 },
              ]}>
              <Text style={[styles.dayText, { color: on ? c.chipSelectedText : c.text2 }]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.presets}>
        {(Object.keys(PRESET_DAYS) as (keyof typeof PRESET_DAYS)[]).map((k) => (
          <Chip key={k} label={t(`new.${k}`)} on={value === PRESET_DAYS[k]} onPress={() => onChange(PRESET_DAYS[k])} height={32} />
        ))}
      </View>
    </View>
  );
}

/** 요일 비트 → 짧은 말(평일 · 주말 · 매일 · 그 밖은 요일 이름 나열) */
export function daysLabel(days: number, t: (k: string) => string): string {
  if (days === PRESET_DAYS.everyday) return t('new.everyday');
  if (days === PRESET_DAYS.weekday) return t('new.weekday');
  if (days === PRESET_DAYS.weekend) return t('new.weekend');
  const names = t('new.dayNames').split(',');
  return names.filter((_, i) => (days & (1 << i)) !== 0).join(' · ');
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14, fontWeight: '600' },
  presets: { flexDirection: 'row', gap: spacing.sm },
});
