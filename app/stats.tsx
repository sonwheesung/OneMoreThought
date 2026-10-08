import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton, GlassCard } from '@/components/flow.tsx';
import { Glyph } from '@/components/Glyph.tsx';
import { hhmm } from '@/components/TimeWheel.tsx';
import { EASE, GlowBackground } from '@/components/ui.tsx';
import { router } from 'expo-router';

import { resetDraft } from '@/features/draft.ts';
import { cachedRules } from '@/features/rules';
import { noonOf, shiftDay, todayKey, weekdayOf } from '@/lib/day.ts';
import { Intervention } from '@/modules/intervention';
import { spacing, type Palette } from '@/theme/tokens.ts';
import { usePalette, useReducedMotion } from '@/theme/useTheme.ts';

/**
 * 통계 · 최근 7일(결정 #28 · 시안 원모어 #15). 홈보다 낮은 위계 · 읽기만 한다.
 * 🔴 평가하지 않는다(기둥 2): 확인 · 취소 · 열기 막대는 모두 같은 mint(사실) · 비율 · 순위 · 목표 · 연속 기록 · 축하 없음.
 * 🔴 안 연 날은 빈 점선 동그라미(✕ · 빨강 없음). ✓ 는 "앱을 열었다"이지 "그 일을 했다"가 아니다(CLAUDE §5-5).
 * 숫자 재료: 기기 하루 집계(promptStats) · 사용 기록(openedDays). 권한이 없으면 숨기지 않고 말한다(기둥 7).
 */
type Counts = { shown: number; cancel: number; open: number };

function lastDays(n: number): string[] {
  const today = todayKey();
  return Array.from({ length: n }, (_, i) => shiftDay(today, i - (n - 1)));
}

function readCounts(keys: string[]): Counts {
  let all: Record<string, Partial<Record<string, number>>> = {};
  try {
    all = JSON.parse(Intervention?.promptStats() ?? '{}') as typeof all;
  } catch {
    all = {};
  }
  const out: Counts = { shown: 0, cancel: 0, open: 0 };
  for (const k of keys) {
    // 확인 = 뜬 횟수 전체(고르지 않고 닫힌 것 포함) · 그래서 취소 + 열기 ≤ 확인(시안 세션)
    out.shown += (all[k]?.cancel ?? 0) + (all[k]?.open ?? 0) + (all[k]?.dismissed ?? 0);
    out.cancel += all[k]?.cancel ?? 0;
    out.open += all[k]?.open ?? 0;
  }
  return out;
}

export default function Stats() {
  const { t } = useTranslation();
  const c = usePalette();
  const days = useMemo(() => lastDays(7), []);
  const counts = useMemo(() => readCounts(days), [days]);
  const shown = counts.shown;
  const checks = useMemo(() => cachedRules().filter((r) => r.kind === 'check'), []);
  const apps = useMemo(() => Intervention?.listLaunchableApps() ?? [], []);
  const [usage, setUsage] = useState(() => Intervention?.hasUsageAccess() ?? false);
  // 설정에서 켜고 돌아오면 다시 읽는다
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setUsage(Intervention?.hasUsageAccess() ?? false));
    return () => sub.remove();
  }, []);
  const dayNames = t('new.dayNames').split(',');

  return (
    <GlowBackground>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.bar}>
          <BackButton />
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
            {t('stats.title')}
          </Text>

          <GlassCard style={styles.gap}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{t('stats.promptTitle')}</Text>
            <Text style={[styles.note, { color: c.text2 }]}>{t('stats.promptNote')}</Text>
            {(
              [
                ['shown', shown],
                ['cancel', counts.cancel],
                ['open', counts.open],
              ] as const
            ).map(([k, v], i) => (
              <View key={k} style={styles.barRow} accessible accessibilityLabel={`${t(`stats.${k}`)} ${v}`}>
                <Text style={[styles.barLabel, { color: c.text2 }]}>{t(`stats.${k}`)}</Text>
                <Bar value={v} max={shown} delay={i * 120} c={c} />
                <Count value={v} delay={i * 120} color={c.mintText} />
              </View>
            ))}
          </GlassCard>

          <GlassCard style={styles.gap}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{t('stats.checkTitle')}</Text>
            {!usage ? (
              // 홈 #5 와 같은 줄 틀: 점 warnDot · 14/600 warn · 같은 줄에 [켜기](시스템 설정)
              <View style={styles.warnRow}>
                <View style={[styles.dot, { backgroundColor: c.warnDot }]} />
                <Text style={[styles.warnText, { color: c.warn }]}>{t('stats.noUsage')}</Text>
                <Pressable onPress={() => Intervention?.openUsageAccessSettings()} accessibilityRole="button" hitSlop={8}>
                  <Text style={[styles.action, { color: c.accent }]}>{t('stats.turnOn')}</Text>
                </Pressable>
              </View>
            ) : checks.length === 0 ? (
              <View style={styles.warnRow}>
                <Text style={[styles.note, styles.flex, { color: c.text2 }]}>{t('stats.noCheck')}</Text>
                <Pressable
                  onPress={() => {
                    resetDraft('check');
                    router.push('/rules/new/check-app');
                  }}
                  accessibilityRole="button"
                  hitSlop={8}>
                  <Text style={[styles.action, { color: c.accent }]}>{t('stats.makeCheck')}</Text>
                </Pressable>
              </View>
            ) : (
              checks.map((r, ri) => {
                const pkg = r.targets[0] ?? '';
                const opened = new Set(Intervention?.openedDays(pkg, 7) ?? []);
                const label = apps.find((a) => a.packageName === pkg)?.label ?? '';
                return (
                  <View key={r.id} style={styles.checkRow}>
                    <Text style={[styles.checkName, { color: c.text }]} numberOfLines={1}>
                      {label} · {t('stats.by', { time: hhmm(r.startMin) })}
                    </Text>
                    <View style={styles.cells}>
                      {days.map((k, i) => (
                        <DayCell
                          key={k}
                          on={opened.has(k)}
                          name={dayNames[weekdayOf(noonOf(k))] ?? ''}
                          delay={700 + ri * 120 + i * 40}
                          c={c}
                          a11y={t(opened.has(k) ? 'stats.openedDay' : 'stats.notOpenedDay', {
                            day: dayNames[weekdayOf(noonOf(k))],
                          })}
                        />
                      ))}
                    </View>
                  </View>
                );
              })
            )}
            <Text style={[styles.note, { color: c.text3 }]}>{t('stats.checkNote')}</Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}

/** 막대: 트랙 disabled · 채움 mint(셋 다 같은 색) · 600ms · 끝을 넘지 않는다 */
function Bar({ value, max, delay, c }: { value: number; max: number; delay: number; c: Palette }) {
  const reduced = useReducedMotion();
  const p = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  const to = Math.min(1, value / Math.max(max, 1));
  useEffect(() => {
    if (reduced) p.setValue(to);
    else
      Animated.timing(p, {
        toValue: to,
        duration: 600,
        delay,
        easing: EASE,
        useNativeDriver: true,
      }).start();
  }, [to, delay, reduced, p]);
  return (
    <View style={[styles.track, { backgroundColor: c.disabled }]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: w,
            backgroundColor: c.mint,
            transform: [
              {
                translateX: p.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-w, 0],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

/** 숫자: 막대와 같은 곡선으로 0 → 값 · 자릿수 고정 */
function Count({ value, delay, color }: { value: number; delay: number; color: string }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) return setN(value);
    const v = new Animated.Value(0);
    const id = v.addListener(({ value: x }) => setN(Math.round(x)));
    Animated.timing(v, {
      toValue: value,
      duration: 600,
      delay,
      easing: EASE,
      useNativeDriver: false,
    }).start();
    return () => v.removeListener(id);
  }, [value, delay, reduced]);
  return <Text style={[styles.count, { color }]}>{n}</Text>;
}

/** 7일 칸: 연 날 ✓(mintSoft + mintText) · 안 연 날 빈 점선 동그라미 */
function DayCell({ on, name, delay, c, a11y }: { on: boolean; name: string; delay: number; c: Palette; a11y: string }) {
  const reduced = useReducedMotion();
  const p = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (!reduced)
      Animated.timing(p, {
        toValue: 1,
        duration: 240,
        delay,
        easing: EASE,
        useNativeDriver: true,
      }).start();
  }, [delay, reduced, p]);
  return (
    <Animated.View style={[styles.cellWrap, { opacity: p }]} accessible accessibilityLabel={a11y}>
      <View
        style={[
          styles.cell,
          on
            ? { backgroundColor: c.mintSoft }
            : {
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: c.lineStrong,
              },
        ]}>
        {on && <Glyph name="check" color={c.mintText} size={14} />}
      </View>
      <Text style={[styles.cellName, { color: c.text3 }]}>{name}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  // 홈보다 낮은 위계: 제목 22(홈 · 만들기 26)
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: spacing.xs,
  },
  gap: { gap: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  note: { fontSize: 13, lineHeight: 19 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barLabel: { width: 44, fontSize: 14, fontWeight: '500' },
  track: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6 },
  count: {
    width: 36,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  checkRow: { gap: spacing.sm },
  checkName: { fontSize: 15, fontWeight: '600' },
  cells: { flexDirection: 'row', justifyContent: 'space-between' },
  cellWrap: { alignItems: 'center', gap: 4 },
  cell: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellName: { fontSize: 11 },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  warnText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  action: { fontSize: 14, fontWeight: '600' },
});
