import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ConfirmThumb } from '@/components/ConfirmThumb.tsx';
import { Chip, FlowScreen, flowStyles } from '@/components/flow.tsx';
import { SaveResult } from '@/components/SaveResult.tsx';
import { EASE } from '@/components/ui.tsx';
import { MESSAGE_MAX, saveDraft, setDraft, useDraft } from '@/features/draft.ts';
import { GRACE_CHOICES } from '@/lib/rules.ts';
import { Intervention } from '@/modules/intervention';
import { radius, spacing } from '@/theme/tokens.ts';
import { usePalette } from '@/theme/useTheme.ts';

/**
 * 실행 전 확인 · 메시지 · 규칙 이름 · 다시 묻기 유예 + 확인 화면 미리보기 · 시안 원모어 #10 · #11 · 진행 4/4.
 * 🔴 메시지는 쓴 그대로 저장한다(다듬기 · 추천 · 자동 완성 없음 · 기둥 4).
 * 🔴 미리보기는 그림이다. 눌러도 안내만 뜨고 기록 · 서버 호출이 없다.
 * [저장]에서 saveDraft(= saveRule) 한 번. 서버 상태 글자는 보이지 않는다(체크만).
 */
export default function NewRuleMessage() {
  const { t } = useTranslation();
  const c = usePalette();
  const d = useDraft();
  const [state, setState] = useState<'edit' | 'saving' | 'saved' | 'failed'>('edit');
  const target = useMemo(() => {
    const first = d.targets[0];
    return Intervention?.listLaunchableApps().find((a) => a.packageName === first)?.label ?? '';
  }, [d.targets]);
  const ready = d.message.trim().length > 0 && d.name.trim().length > 0;

  const hint = useRef(new Animated.Value(0)).current;
  const showHint = () =>
    Animated.sequence([
      Animated.timing(hint, { toValue: 1, duration: 180, easing: EASE, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(hint, { toValue: 0, duration: 200, easing: EASE, useNativeDriver: true }),
    ]).start();

  const save = async () => {
    if (!ready || state === 'saving' || state === 'saved') return;
    setState('saving');
    const r = await saveDraft();
    if (r === 'failed') {
      setState('failed');
      return;
    }
    setState('saved');
    setTimeout(() => router.dismissTo('/'), 900);
  };

  if (state === 'saved') return <SaveResult label={t('new.saved')} />;

  const field = [styles.field, { backgroundColor: c.surfaceGlass, borderColor: c.surfaceLine, color: c.text }];
  return (
    <FlowScreen
      step={4}
      total={4}
      title={t('rule.message_q')}
      sub={t('rule.message_sub')}
      cta={t('new.save')}
      ctaDisabled={!ready || state === 'saving'}
      onCta={() => void save()}
      footer={state === 'failed' ? <Text style={[styles.fail, { color: c.warn }]}>{t('new.saveFailed')}</Text> : null}>
      <View>
        <TextInput
          value={d.message}
          onChangeText={(message) => setDraft({ message })}
          maxLength={MESSAGE_MAX}
          multiline
          placeholder={t('rule.message_ph')}
          placeholderTextColor={c.text3}
          selectionColor={c.accent}
          cursorColor={c.accent}
          style={[field, styles.message]}
        />
        <Text style={[styles.count, { color: c.text3 }]}>
          {[...d.message].length} / {MESSAGE_MAX}
        </Text>
      </View>

      <View>
        <Text style={[flowStyles.label, { color: c.text2 }]}>{t('rule.name')}</Text>
        <TextInput
          value={d.name}
          onChangeText={(name) => setDraft({ name, nameTouched: true })}
          maxLength={20}
          placeholder={t('rule.name_ph')}
          placeholderTextColor={c.text3}
          selectionColor={c.accent}
          cursorColor={c.accent}
          style={[field, styles.name]}
        />
      </View>

      <Pressable onPress={showHint} accessibilityHint={t('rule.preview_hint')}>
        <Text style={[flowStyles.label, { color: c.text2 }]}>{t('rule.preview_tag')}</Text>
        <View style={styles.thumbs}>
          <ConfirmThumb message={d.message} ruleName={d.name.trim()} targetLabel={target} />
          <ConfirmThumb message={d.message} ruleName={d.name.trim()} targetLabel={target} landscape />
        </View>
        <Animated.View pointerEvents="none" style={[styles.hint, { backgroundColor: c.text, opacity: hint }]}>
          <Text style={[styles.hintText, { color: c.bg }]}>{t('rule.preview_hint')}</Text>
        </Animated.View>
      </Pressable>

      <View>
        <Text style={[flowStyles.label, { color: c.text2 }]}>{t('rule.grace_q')}</Text>
        <View style={flowStyles.row}>
          {GRACE_CHOICES.map((g) => (
            <Chip key={g} label={t('rule.grace_min', { count: g })} on={d.graceMin === g} onPress={() => setDraft({ graceMin: g })} />
          ))}
        </View>
      </View>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  field: { borderRadius: radius.input, borderWidth: 1, paddingHorizontal: spacing.lg, fontSize: 17 },
  message: { minHeight: 88, paddingTop: 14, paddingBottom: 14, fontSize: 20, fontWeight: '600', textAlignVertical: 'top' },
  name: { height: 48 },
  count: { fontSize: 12, textAlign: 'right', marginTop: 6, fontVariant: ['tabular-nums'] },
  thumbs: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  hint: { position: 'absolute', alignSelf: 'center', bottom: spacing.md, borderRadius: radius.chip, paddingHorizontal: 14, paddingVertical: 8 },
  hintText: { fontSize: 13, fontWeight: '600' },
  fail: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
