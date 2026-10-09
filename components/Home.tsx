import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Rule } from '@/lib/rules.ts';
import type { LaunchableApp } from '@/modules/intervention';
import { radius, spacing } from '@/theme/tokens.ts';
import { usePalette, useReducedMotion } from '@/theme/useTheme.ts';

import { ConfirmThumb } from './ConfirmThumb.tsx';
import { Switch } from './controls.tsx';
import { daysLabel } from './DayPicker.tsx';
import { Glyph } from './Glyph.tsx';
import { hhmm } from './TimeWheel.tsx';
import { EASE } from './ui.tsx';

/**
 * 홈 부품 · 시안 원모어 #4(목록 · 요약) · #5(권한 꺼짐 줄) · #6(빈 상태).
 * 🔴 평가하지 않는다(기둥 2): 요약은 사실 한 줄 · 끈 규칙은 흐림일 뿐(빨강 · 경고 없음) · 민트는 요약 고리와 그 숫자에만.
 * 🔴 패키지 이름을 쓰지 않는다. 앱 이름만.
 */

/** 규칙 줄글: «평일 09:00 – 18:00 · NBA 외 1» / «매일 21:00까지 · 일기» */
export function ruleLine(r: Rule, apps: LaunchableApp[], t: (k: string, o?: Record<string, unknown>) => string): string {
  const names = r.targets.map((p) => apps.find((a) => a.packageName === p)?.label).filter((x): x is string => !!x);
  const who =
    names.length === 0 ? '' : names.length === 1 ? names[0]! : t('home.appsMore', { first: names[0], count: names.length - 1 });
  const days = daysLabel(r.days, t);
  if (r.kind === 'check') return [`${days} ${t('stats.by', { time: hhmm(r.startMin) })}`, who].filter(Boolean).join(' · ');
  const end = r.endMin ?? r.startMin;
  const when = `${days} ${hhmm(r.startMin)} – ${end < r.startMin ? `${t('new.nextDay')} ` : ''}${hhmm(end)}`;
  return [when, who].filter(Boolean).join(' · ');
}

/** 줄을 누르면 규칙 자세히(시안 원모어 #18) · 스위치는 그 자리에서 켜고 끈다 */
export function RuleRow({
  rule,
  line,
  onToggle,
  onOpen,
}: {
  rule: Rule;
  line: string;
  onToggle: (on: boolean) => void;
  onOpen: () => void;
}) {
  const c = usePalette();
  const on = rule.enabled;
  return (
    <View style={[styles.row, !on && styles.dim]}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${rule.name}, ${line}`} style={styles.open}>
        <View style={styles.icon}>
          <Glyph name={rule.kind === 'check' ? 'check' : 'eye'} color={on ? c.accent : c.disabledText} size={18} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
            {rule.name}
          </Text>
          <Text style={[styles.line, { color: c.text2 }]} numberOfLines={1}>
            {line}
          </Text>
        </View>
      </Pressable>
      <Switch value={on} onChange={onToggle} label={rule.name} />
    </View>
  );
}

/** 요약 고리 58 · 두께 8: mint 75% / mint2 25%(테두리 네 변을 나눠 칠한다 · svg 없이) + 숫자 18/700 mintText */
export function SummaryRing({ count }: { count: number }) {
  const c = usePalette();
  return (
    <View style={[styles.ring, { borderColor: c.mint, borderTopColor: c.mint2, transform: [{ rotate: '45deg' }] }]}>
      <Text style={[styles.ringNum, { color: c.mintText, transform: [{ rotate: '-45deg' }] }]}>{count}</Text>
    </View>
  );
}

/**
 * 권한 꺼짐 줄(#5): 높이 0 → 60 으로 펼쳐지며 아래를 민다 · 240ms · 닫기 버튼 없음(기둥 7).
 * 켜짐을 **읽은 뒤에만** 접힌다(부르는 쪽이 실제 값을 넘긴다). [켜기]는 권한 안내로 이동만.
 */
export function PermissionRow({ visible, text, onEnable }: { visible: boolean; text: string; onEnable: () => void }) {
  const { t } = useTranslation();
  const c = usePalette();
  const reduced = useReducedMotion();
  const h = useRef(new Animated.Value(visible ? 1 : 0)).current; // JS: 높이 · 아래 간격
  const o = useRef(new Animated.Value(visible ? 1 : 0)).current; // native: 투명도 · 위치
  useEffect(() => {
    const cfg = { toValue: visible ? 1 : 0, duration: reduced ? 0 : 240, easing: EASE };
    Animated.parallel([
      Animated.timing(h, { ...cfg, useNativeDriver: false }),
      Animated.timing(o, { ...cfg, useNativeDriver: true }),
    ]).start();
  }, [visible, reduced, h, o]);
  return (
    <Animated.View
      style={{
        overflow: 'hidden',
        height: h.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }),
        marginBottom: h.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }),
      }}
      accessibilityLiveRegion="polite">
      <Animated.View
        style={[
          styles.warn,
          { backgroundColor: c.warnBg, borderColor: c.warnLine },
          { opacity: o, transform: [{ translateY: o.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] },
        ]}>
        <View style={[styles.dot, { backgroundColor: c.warnDot }]} />
        <Text style={[styles.warnText, { color: c.warn }]} numberOfLines={1}>
          {text}
        </Text>
        <Pressable onPress={onEnable} accessibilityRole="button" style={[styles.warnBtn, { backgroundColor: c.warnDot }]}>
          <Text style={[styles.warnBtnText, { color: c.onWarn }]}>{t('home.permOn')}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// 누구나 공감하는 예시(2026-10-10 사용자 지시: 업무 시간 · 게임 예시는 빼고)
const EXAMPLES = ['diet', 'money', 'night'] as const;

/** 빈 상태(#6): 사실 한 줄 + 확인 화면 그림(예시 문장이 1.2초마다 바뀐다 · 그림이라 눌리지 않는다) */
export function EmptyHome() {
  const { t } = useTranslation();
  const c = usePalette();
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const p = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) return; // 모션 줄이기면 첫 예시에 멈춘다
    const id = setInterval(() => setI((v) => (v + 1) % EXAMPLES.length), 1200 + 240);
    return () => clearInterval(id);
  }, [reduced]);
  useEffect(() => {
    if (reduced) return;
    p.setValue(0);
    Animated.timing(p, { toValue: 1, duration: 240, easing: EASE, useNativeDriver: true }).start();
  }, [i, reduced, p]);
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{t('home.emptyTitle')}</Text>
      <Text style={[styles.emptyBody, { color: c.text2 }]}>{t('home.emptyBody')}</Text>
      <Text style={[styles.previewTag, { color: c.text3 }]}>{t('home.emptyPreview')}</Text>
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{ opacity: p, transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }}>
        <ConfirmThumb
          message={t(`example.${EXAMPLES[i]!}`)}
          ruleName={t(`example.${EXAMPLES[i]!}_rule`)}
          targetLabel={t(`example.${EXAMPLES[i]!}_app`)}
        />
      </Animated.View>
      <View style={styles.dots}>
        {EXAMPLES.map((k, j) => (
          <View
            key={k}
            style={[
              styles.dotStep,
              j === i ? { width: 16, backgroundColor: c.accent } : { backgroundColor: `${c.accentSolid}47` },
            ]}
          />
        ))}
      </View>
      {/* «안 열었을 때 알려 주는 규칙도 만들 수 있어요» 는 뺐다(2026-10-10): 이 빌드는 알림을 아직 보내지 않는다 · 없는 기능을 약속하지 않는다. Phase 3 알림이 나오면 되살린다 */}
    </View>
  );
}

const styles = StyleSheet.create({
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64 },
  dim: { opacity: 0.55 },
  // 아이콘에 배경을 두지 않는다(2026-10-09 사용자 지시)
  icon: { width: 24, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  line: { fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  ring: { width: 58, height: 58, borderRadius: 29, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  ringNum: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  warn: {
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  warnText: { flex: 1, fontSize: 14, fontWeight: '600' },
  warnBtn: { height: 34, borderRadius: radius.chip, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  warnBtnText: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyBody: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: spacing.sm },
  previewTag: { fontSize: 12, marginBottom: spacing.xs },
  dots: { flexDirection: 'row', gap: 6, marginTop: spacing.sm },
  dotStep: { width: 6, height: 6, borderRadius: 3 },
});
