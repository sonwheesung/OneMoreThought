import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Dialog, Switch, Toast, useDialog, useToast } from '@/components/controls.tsx';
import { daysLabel } from '@/components/DayPicker.tsx';
import { BackButton, GlassCard } from '@/components/flow.tsx';
import { hhmm } from '@/components/TimeWheel.tsx';
import { GlassPill, GlowBackground } from '@/components/ui.tsx';
import { loadDraft, setFlash, takeFlash } from '@/features/draft.ts';
import { cachedRules, deleteRule, saveRule } from '@/features/rules.ts';
import { END_OF_DAY, GRACE_DEFAULT, type Rule } from '@/lib/rules.ts';
import { Intervention } from '@/modules/intervention';
import { radius, size, spacing } from '@/theme/tokens.ts';
import { usePalette } from '@/theme/useTheme.ts';

/**
 * 규칙 자세히 · 시안 원모어 #18. 홈 규칙 줄(스위치 밖)을 누르면 오는 깊이 1 화면.
 * 맨 위 스위치로 켜고 끄고(홈 줄과 같은 saveRule) · 값 줄을 누르면 만들기의 그 단계를 «고치기»로 연다(?edit=<id>).
 * 🔴 [규칙 지우기]는 빨강이 아니라 호박(warn). 서버까지 지운다(deleteRule) → 창 문구로 설정의 «이 기기에서만 지우기»와 구분한다.
 * 🔴 끈 규칙은 값 카드를 흐리게(0.55)만. 메시지는 줄임표 없이 3줄(40자 상한).
 * 뒤로가기는 오른쪽 위 글자(사용자 지시 · 시안의 왼쪽 위 아이콘 대신) · 카드 반경 20.
 */
type Step = 'apps' | 'when' | 'message';

export default function RuleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const c = usePalette();
  const dialog = useDialog();
  const toast = useToast();
  const [rule, setRule] = useState<Rule | undefined>(() => cachedRules().find((r) => r.id === id));
  const apps = useMemo(() => Intervention?.listLaunchableApps() ?? [], []);

  // 고치기에서 저장하고 돌아오면 캐시를 다시 읽고 «저장했어요»
  useFocusEffect(
    useCallback(() => {
      setRule(cachedRules().find((r) => r.id === id));
      if (takeFlash('detail') === 'saved') toast.show(t('edit.saved'));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]),
  );

  if (!rule) {
    return (
      <GlowBackground>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.bar}>
            <BackButton />
          </View>
        </SafeAreaView>
      </GlowBackground>
    );
  }

  const check = rule.kind === 'check';
  const names = rule.targets.map((p) => apps.find((a) => a.packageName === p)?.label ?? p);
  const appsText = names.length <= 1 ? (names[0] ?? '') : t('home.appsMore', { first: names[0], count: names.length - 1 });
  const days = daysLabel(rule.days, t);
  const end = rule.endMin ?? rule.startMin;
  const whenText = check
    ? `${days} ${t('stats.by', { time: hhmm(rule.startMin) })}`
    : rule.startMin === 0 && end === END_OF_DAY
      ? t('new.whenAllDay', { days })
      : `${days} ${hhmm(rule.startMin)} – ${end < rule.startMin ? `${t('new.nextDay')} ` : ''}${end === END_OF_DAY ? '24:00' : hhmm(end)}`;

  const toggle = (enabled: boolean) => {
    const next = { ...rule, enabled, updatedAt: Date.now() };
    setRule(next); // 화면 먼저
    void saveRule(next);
    toast.show(t(enabled ? 'rule.toggled_on' : 'rule.toggled_off', { name: rule.name }));
  };

  const edit = (step: Step) => {
    loadDraft(rule);
    const path = check ? { apps: 'check-app', when: 'check-time', message: 'check-message' }[step] : step;
    router.push(`/rules/new/${path}?edit=${rule.id}` as Href);
  };

  // 창이 다 닫힌 뒤(140ms) 지운다 · 지운 뒤 홈에서 «규칙을 지웠어요»
  const remove = () =>
    dialog.hide(() => {
      void deleteRule(rule.id);
      setFlash('home', 'deleted');
      router.back();
    });

  return (
    <GlowBackground>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.bar}>
          <BackButton />
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.kind, { color: c.text3 }]}>{t(check ? 'new.check' : 'new.intercept')}</Text>
          <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
            {rule.name}
          </Text>

          <GlassCard style={styles.card}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={[styles.value, { color: c.text }]}>{t(rule.enabled ? 'rule.on' : 'rule.off')}</Text>
                <Text style={[styles.sub, { color: c.text2 }]}>
                  {t(rule.enabled ? (check ? 'rule.on_sub_check' : 'rule.on_sub') : 'rule.off_sub')}
                </Text>
              </View>
              <Switch value={rule.enabled} onChange={toggle} label={rule.name} />
            </View>
          </GlassCard>

          <GlassCard style={[styles.card, !rule.enabled && styles.dim]}>
            <Row first label={t('rule.f_apps')} value={appsText} onPress={() => edit('apps')} />
            <Row label={t(check ? 'rule.f_check' : 'rule.f_when')} value={whenText} onPress={() => edit('when')} />
            <Row big label={t('rule.f_message')} value={rule.message} onPress={() => edit('message')} />
            {check ? null : (
              <Row
                label={t('rule.grace_q')}
                value={t('rule.grace_min', { count: rule.graceMin ?? GRACE_DEFAULT })}
                onPress={() => edit('message')}
              />
            )}
          </GlassCard>

          <Pressable
            onPress={dialog.show}
            accessibilityRole="button"
            style={[styles.delBtn, { backgroundColor: c.warnBg, borderColor: c.warnLine }]}>
            <Text style={[styles.delText, { color: c.warn }]}>{t('rule.delete')}</Text>
          </Pressable>
        </ScrollView>

        <Dialog d={dialog} onClose={() => dialog.hide()}>
          <Text style={[styles.dTitle, { color: c.text }]}>{t('rule.delete_q', { name: rule.name })}</Text>
          <Text style={[styles.dBody, { color: c.text2 }]}>{t('rule.delete_body')}</Text>
          <View style={styles.dActions}>
            <GlassPill label={t('settings.cancel')} onPress={() => dialog.hide()} style={styles.flex} />
            <Pressable
              onPress={remove}
              accessibilityRole="button"
              style={[styles.dDel, { backgroundColor: c.warnBg, borderColor: c.warnLine }]}>
              <Text style={[styles.dDelText, { color: c.warn }]}>{t('rule.delete_do')}</Text>
            </Pressable>
          </View>
        </Dialog>
        <Toast t={toast} />
      </SafeAreaView>
    </GlowBackground>
  );
}

/** 값 줄: 이름표 12.5/500 text3 + 값 16/600(메시지는 17/600 · 3줄) · 오른쪽 › */
function Row({
  label,
  value,
  onPress,
  first,
  big,
}: {
  label: string;
  value: string;
  onPress: () => void;
  first?: boolean;
  big?: boolean;
}) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      style={[styles.row, styles.valueRow, !first && { borderTopWidth: 1, borderTopColor: c.line }]}>
      <View style={styles.flex}>
        <Text style={[styles.label, { color: c.text3 }]}>{label}</Text>
        <Text style={[big ? styles.big : styles.value, { color: c.text }]} numberOfLines={big ? 3 : 1}>
          {value}
        </Text>
      </View>
      <Text style={[styles.chev, { color: c.text3 }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: spacing.xl },
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  kind: { fontSize: 13, fontWeight: '500', marginHorizontal: spacing.xs },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.9, marginHorizontal: spacing.xs, marginTop: 2 },
  card: { marginTop: spacing.md, paddingVertical: 4 },
  dim: { opacity: 0.55 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 },
  valueRow: { paddingVertical: 10 },
  label: { fontSize: 12.5, fontWeight: '500', marginBottom: 3 },
  value: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  big: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3, lineHeight: 23 },
  sub: { fontSize: 13, lineHeight: 19, marginTop: 2 },
  chev: { fontSize: 22 },
  delBtn: {
    height: 48,
    marginTop: 18,
    borderRadius: radius.btn,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delText: { fontSize: 15, fontWeight: '600' },
  dTitle: { fontSize: 19, fontWeight: '700', lineHeight: 26 },
  dBody: { fontSize: 15, lineHeight: 22 },
  dActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  dDel: {
    flex: 1,
    height: size.btn,
    borderRadius: radius.btn,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dDelText: { fontSize: 17, fontWeight: '600' },
});
