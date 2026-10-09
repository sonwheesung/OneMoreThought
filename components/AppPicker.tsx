import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Intervention, type LaunchableApp } from '@/modules/intervention';
import { radius, spacing } from '@/theme/tokens.ts';
import { usePalette } from '@/theme/useTheme.ts';

import { AppIcon } from './AppIcon.tsx';
import { CheckCircle, FlowScreen, useEdit } from './flow.tsx';

/**
 * 앱 고르기 · 시안 원모어 #8(여러 개 · 실행 전 확인) · #13(하나 · 실행 확인 · 라디오).
 * 🔴 패키지 이름은 화면 · 접근성 라벨 어디에도 쓰지 않는다. 찾기도 이름으로만. 저장 값(targets)만 패키지 이름.
 * 목록은 결정 #27 L 제외 앱이 이미 빠진 `listLaunchableApps()`.
 */
interface Props {
  step: number;
  total: number;
  title: string;
  sub: string;
  single?: boolean;
  value: string[];
  onChange: (targets: string[]) => void;
  onNext: () => void;
  /** 고치기(시안 원모어 #18) · useEdit() 값 */
  edit?: ReturnType<typeof useEdit>;
}

export function AppPicker({ step, total, title, sub, single, value, onChange, onNext, edit }: Props) {
  const { t } = useTranslation();
  const c = usePalette();
  const apps = useMemo<LaunchableApp[]>(
    () => [...(Intervention?.listLaunchableApps() ?? [])].sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const k = q.trim().toLocaleLowerCase();
    return k ? apps.filter((a) => a.label.toLocaleLowerCase().includes(k)) : apps;
  }, [apps, q]);
  const labelOf = (pkg: string) => apps.find((a) => a.packageName === pkg)?.label ?? '';
  const flip = (pkg: string) => {
    if (single) onChange([pkg]);
    else onChange(value.includes(pkg) ? value.filter((p) => p !== pkg) : [...value, pkg]);
  };

  const head = (
    <View style={styles.headExtra}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={t('new.appSearch')}
        placeholderTextColor={c.text3}
        selectionColor={c.accent}
        cursorColor={c.accent}
        style={[
          styles.search,
          {
            backgroundColor: c.surfaceGlass,
            borderColor: c.surfaceLine,
            color: c.text,
          },
        ]}
      />
      {!single && (
        <View style={styles.chips}>
          {value.length === 0 ? (
            <Text style={[styles.none, { color: c.text3 }]}>{t('new.appNone')}</Text>
          ) : (
            value.map((p) => (
              <Pressable
                key={p}
                onPress={() => flip(p)}
                accessibilityRole="button"
                accessibilityLabel={t('new.appRemove', { name: labelOf(p) })}
                style={[
                  styles.chip,
                  {
                    backgroundColor: c.chipSelected,
                    borderColor: c.chipSelectedLine,
                  },
                ]}>
                <Text style={[styles.chipText, { color: c.chipSelectedText }]} numberOfLines={1}>
                  {labelOf(p)}
                </Text>
                <Text style={[styles.chipX, { color: c.chipSelectedText }]}>×</Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );

  return (
    <FlowScreen
      step={step}
      total={total}
      title={title}
      sub={sub}
      head={head}
      noScroll
      edit={edit?.editing}
      footer={edit?.footer}
      cta={edit?.editing ? edit.cta : !single && value.length ? t('new.nextN', { count: value.length }) : t('new.next')}
      ctaDisabled={value.length === 0 || !!edit?.saving}
      onCta={edit?.editing ? edit.save : onNext}>
      <FlatList
        data={shown}
        keyExtractor={(a) => a.packageName}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: c.line }]} />}
        ListEmptyComponent={<Text style={[styles.empty, { color: c.text3 }]}>{t('new.appEmpty')}</Text>}
        renderItem={({ item }) => {
          const on = value.includes(item.packageName);
          return (
            <Pressable
              onPress={() => flip(item.packageName)}
              accessibilityRole={single ? 'radio' : 'checkbox'}
              accessibilityState={{ checked: on }}
              accessibilityLabel={item.label}
              style={styles.row}>
              <AppIcon pkg={item.packageName} />
              <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
                {item.label}
              </Text>
              <CheckCircle on={on} radio={single} />
            </Pressable>
          );
        }}
      />
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  headExtra: { marginTop: spacing.md, gap: spacing.md },
  search: {
    height: 48,
    borderRadius: radius.input,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    minHeight: 34,
  },
  none: { fontSize: 13, lineHeight: 34 },
  chip: {
    height: 34,
    borderRadius: radius.chip,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    gap: 6,
    maxWidth: 200,
  },
  chipText: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  chipX: { fontSize: 16, fontWeight: '600' },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  sep: { height: StyleSheet.hairlineWidth },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  name: { flex: 1, fontSize: 16, fontWeight: '600' },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: spacing.xl },
});
