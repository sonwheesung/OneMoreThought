import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { radius } from '@/theme/tokens.ts';
import { usePalette } from '@/theme/useTheme.ts';

/**
 * 확인 화면 미리보기(그림) · 시안 원모어 #10.
 * 🔴 Pressable 이 없다. 버튼은 점선 lineStrong + text3 로 비활성임을 보이고, 눌러도 아무것도 부르지 않는다(기록이 남지 않는다).
 * 🔴 첫 줄은 쓴 그대로(다듬기 · 추천 · 자동 완성 없음 · 기둥 4). [취소][열기]는 같은 크기 · 같은 무게(기둥 2).
 * 실제 화면은 Kotlin `ConfirmView.kt` 다. 그림은 그 배치를 줄여 그린 것이다.
 */
interface Props {
  message: string;
  ruleName: string;
  targetLabel: string;
  landscape?: boolean;
}

export function ConfirmThumb({ message, ruleName, targetLabel, landscape }: Props) {
  const { t } = useTranslation();
  const c = usePalette();
  const ours = Constants.expoConfig?.name ?? '';
  const meta = targetLabel ? `${ours} · ${targetLabel}` : ours;
  const dashed = { borderColor: c.lineStrong };
  const pills = (
    <View style={landscape ? styles.pillsCol : styles.pillsRow}>
      {[t('confirm.cancel'), t('confirm.open')].map((l) => (
        <View key={l} style={[styles.pill, dashed, landscape ? styles.pillL : styles.flex]}>
          <Text style={[styles.pillText, { color: c.text3 }]}>{l}</Text>
        </View>
      ))}
    </View>
  );
  const text = (
    <View style={landscape ? styles.flex : styles.center}>
      <Text style={[styles.meta, { color: c.text2, textAlign: landscape ? 'left' : 'center' }]} numberOfLines={1}>
        {meta}
      </Text>
      <Text
        style={[
          landscape ? styles.msgL : styles.msg,
          { color: message ? c.text : c.disabledText, textAlign: landscape ? 'left' : 'center' },
        ]}>
        {message || t('rule.message_empty')}
      </Text>
      {ruleName ? (
        <Text style={[styles.second, { color: c.text2, textAlign: landscape ? 'left' : 'center' }]}>
          {t('confirm.second', { name: ruleName })}
        </Text>
      ) : null}
    </View>
  );
  return (
    <View
      accessible
      accessibilityLabel={t('rule.preview_tag')}
      style={[
        landscape ? styles.frameL : styles.frame,
        { backgroundColor: c.bg, borderColor: c.line, experimental_backgroundImage: `radial-gradient(circle at 15% 8%, ${c.bgGlowA} 0%, transparent 60%), radial-gradient(circle at 95% 50%, ${c.bgGlowB} 0%, transparent 55%)` },
      ]}>
      {landscape ? (
        <View style={styles.rowL}>
          {text}
          {pills}
        </View>
      ) : (
        <>
          <View style={[styles.flex, styles.centerV]}>{text}</View>
          {pills}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'stretch' },
  centerV: { justifyContent: 'center' },
  frame: { width: 132, height: 236, borderRadius: radius.row, borderWidth: 1, padding: 10 },
  frameL: { flex: 1, height: 132, borderRadius: radius.row, borderWidth: 1, padding: 12, justifyContent: 'center' },
  rowL: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { fontSize: 7.5, fontWeight: '500', marginBottom: 6 },
  msg: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  msgL: { fontSize: 13, fontWeight: '600', lineHeight: 17 },
  second: { fontSize: 7.5, marginTop: 6 },
  pillsRow: { flexDirection: 'row', gap: 5 },
  pillsCol: { width: 64, gap: 5 },
  pill: { height: 22, borderRadius: radius.btn, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  pillL: { alignSelf: 'stretch' },
  pillText: { fontSize: 8.5, fontWeight: '600' },
});
