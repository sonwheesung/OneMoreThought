import { Redirect, router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Toast, useToast } from '@/components/controls.tsx';
import { GlassCard } from '@/components/flow.tsx';
import { Glyph } from '@/components/Glyph.tsx';
import { EmptyHome, PermissionRow, RuleRow, ruleLine, SummaryRing } from '@/components/Home.tsx';
import { GlowBackground, PrimaryButton, useStagger } from '@/components/ui.tsx';
import { ageAnswer } from '@/features/age.ts';
import { CHECK_RULES_ENABLED, resetDraft, takeFlash } from '@/features/draft.ts';
import { cachedRules, reportDevice, saveRule, syncNow } from '@/features/rules';
import { todayKey } from '@/lib/day.ts';
import type { Rule } from '@/lib/rules.ts';
import { Intervention } from '@/modules/intervention';
import { spacing } from '@/theme/tokens.ts';
import { usePalette } from '@/theme/useTheme.ts';

/**
 * 홈 · 시안 원모어 #4 · #5 · #6 · 기획서 §11. 이 앱의 주인공 화면이다(통계는 보조 · 결정 #28).
 * - 맨 위: 권한이 꺼졌으면 호박색 줄(기둥 7 · 켜짐을 읽은 뒤에만 접힌다).
 * - 요약: «오늘 N번 물어봤어요» 사실 한 줄(평가 · 연속 기록 없음 · 기둥 2).
 * - 규칙 두 묶음(열기 전 확인 · 안 열었을 때 알림) · 줄마다 켜고 끄기(saveRule).
 * - 아래 엄지 자리 [+ 규칙 만들기](이 화면의 유일한 그라데이션).
 * 앞으로 돌아올 때마다 서버와 맞추고(syncNow) 캐시를 다시 읽는다. 시험 도구(스파이크)는 app/dev/spike.tsx.
 */
function todayAsked(): number {
  try {
    const all = JSON.parse(Intervention?.promptStats() ?? '{}') as Record<string, Partial<Record<string, number>>>;
    const d = all[todayKey()] ?? {};
    return (d.cancel ?? 0) + (d.open ?? 0) + (d.dismissed ?? 0);
  } catch {
    return 0;
  }
}

/** 나이 확인(결정 #41)을 아직 안 했으면 먼저 묻는다. 이미 쓰던 설치도 다음 실행에 한 번 묻는다 */
export default function Index() {
  return ageAnswer() ? <Home /> : <Redirect href={'/age' as Href} />;
}

function Home() {
  const { t } = useTranslation();
  const c = usePalette();
  const [rules, setRules] = useState<Rule[]>(() => cachedRules());
  const [serviceOn, setServiceOn] = useState(() => Intervention?.isServiceEnabled() ?? true);
  const [usageOn, setUsageOn] = useState(() => Intervention?.hasUsageAccess() ?? true);
  const [asked, setAsked] = useState(todayAsked);
  const apps = useMemo(() => Intervention?.listLaunchableApps() ?? [], []);
  const rise = useStagger(3, 60);

  const reread = useCallback(() => {
    setRules(cachedRules());
    setServiceOn(Intervention?.isServiceEnabled() ?? true);
    setUsageOn(Intervention?.hasUsageAccess() ?? true);
    setAsked(todayAsked());
  }, []);

  useEffect(() => {
    reportDevice();
    const pull = () => void syncNow().then(reread);
    pull();
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      reread(); // 🔴 실제 상태를 다시 읽는다 — 켜짐을 확인한 뒤에만 줄이 접힌다
      pull();
    });
    return () => sub.remove();
  }, [reread]);

  // 만들기 흐름에서 저장하고 돌아오면 캐시를 다시 읽는다
  useFocusEffect(reread);

  // 규칙 자세히에서 지우고 돌아오면 «규칙을 지웠어요»(시안 원모어 #18)
  const toast = useToast();
  useFocusEffect(
    useCallback(() => {
      if (takeFlash('home') === 'deleted') toast.show(t('rule.deleted'));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const toggle = (r: Rule, enabled: boolean) => {
    const next = { ...r, enabled, updatedAt: Date.now() };
    setRules((rs) => rs.map((x) => (x.id === r.id ? next : x))); // 화면 먼저
    void saveRule(next); // 'queued' 도 성공(오프라인이면 대기열 · 확인 화면은 캐시로 바로 따른다)
  };

  const intercepts = rules.filter((r) => r.kind === 'intercept');
  const checks = rules.filter((r) => r.kind === 'check');
  // 그 권한이 필요한 켜진 규칙이 있을 때만 알린다(권한은 규칙을 만들 때 묻는다 · 기획서 §21)
  const needService = !serviceOn && intercepts.some((r) => r.enabled);
  const needUsage = !usageOn && checks.some((r) => r.enabled);
  const permText = needService && needUsage ? t('home.permBoth') : needService ? t('home.permOff') : t('home.usageOff');
  const enable = () => (needService ? router.push('/permission/accessibility') : Intervention?.openUsageAccessSettings());

  const group = (title: string, list: Rule[]) =>
    list.length === 0 ? null : (
      <View style={styles.group}>
        <Text style={[styles.groupTitle, { color: c.text3 }]}>{title}</Text>
        {list.map((r, i) => (
          <View key={r.id}>
            {i > 0 && <View style={[styles.sep, { backgroundColor: c.line }]} />}
            <RuleRow
              rule={r}
              line={ruleLine(r, apps, t)}
              onToggle={(on) => toggle(r, on)}
              onOpen={() => router.push(`/rules/${r.id}` as Href)}
            />
          </View>
        ))}
      </View>
    );

  return (
    <GlowBackground>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.body}>
          <PermissionRow visible={needService || needUsage} text={permText} onEnable={enable} />

          <View style={styles.head}>
            <View style={styles.flex}>
              <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
                {t('home.title')}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/settings' as Href)}
              accessibilityRole="button"
              accessibilityLabel={t('settings.title')}
              hitSlop={8}
              style={styles.gearBtn}>
              <Glyph name="gear" color={c.text2} size={22} hole={c.bg} />
            </Pressable>
          </View>

          {rules.length === 0 ? (
            <EmptyHome />
          ) : (
            <>
              <Animated.View style={rise.style(0)}>
                <Pressable onPress={() => router.push('/stats' as Href)} accessibilityRole="button">
                  <GlassCard style={styles.summary}>
                    <SummaryRing count={asked} />
                    <View style={styles.flex}>
                      <Text style={[styles.summaryText, { color: c.text }]}>
                        {asked === 0 ? t('home.askedNone') : t('home.asked', { count: asked })}
                      </Text>
                      <Text style={[styles.summarySub, { color: c.text2 }]}>
                        {t('home.ruleCount', { count: rules.length })} · {t('home.seeStats')}
                      </Text>
                    </View>
                  </GlassCard>
                </Pressable>
              </Animated.View>
              <Animated.View style={rise.style(1)}>
                <GlassCard style={styles.list}>
                  {group(t('home.groupIntercept'), intercepts)}
                  {intercepts.length > 0 && checks.length > 0 && <View style={[styles.groupSep, { backgroundColor: c.line }]} />}
                  {group(t('home.groupCheck'), checks)}
                </GlassCard>
              </Animated.View>
            </>
          )}

          {__DEV__ && (
            <Pressable onPress={() => router.push('/dev/spike' as Href)} style={styles.dev}>
              <Text style={[styles.devText, { color: c.text3 }]}>{t('home.devSpike')}</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.foot}>
          <PrimaryButton
            label={`+ ${t('home.new')}`}
            onPress={() => {
              if (CHECK_RULES_ENABLED) {
                resetDraft();
                router.push('/rules/new' as Href);
              } else {
                resetDraft('intercept'); // 종류가 하나뿐이면 고르기를 건너뛴다
                router.push('/rules/new/apps' as Href);
              }
            }}
          />
        </View>
        <Toast t={toast} above={64} />
      </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.xs },
  title: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  // 아이콘에 배경을 두지 않는다(2026-10-09 사용자 지시) · 누르는 자리만 40
  gearBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  summaryText: { fontSize: 16, fontWeight: '600' },
  summarySub: { fontSize: 13, marginTop: 2 },
  list: { paddingVertical: spacing.sm },
  group: { gap: 2 },
  groupTitle: { fontSize: 12.5, fontWeight: '600', marginTop: spacing.sm, marginBottom: 2 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 36 },
  groupSep: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
  foot: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  dev: { alignSelf: 'center', paddingVertical: spacing.md },
  devText: { fontSize: 12 },
});
