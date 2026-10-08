import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { FlowScreen, flowStyles } from '@/components/flow.tsx';
import { SaveResult } from '@/components/SaveResult.tsx';
import { MESSAGE_MAX, saveDraft, setDraft, useDraft } from '@/features/draft.ts';
import { radius, spacing } from '@/theme/tokens.ts';
import { usePalette } from '@/theme/useTheme.ts';

/**
 * 실행 확인 · 알림 메시지 · 규칙 이름 · 시안 원모어 #13 · 진행 3/3. 저장은 saveDraft(= saveRule) 한 번.
 * 🔴 메시지는 쓴 그대로(기둥 4). 알림 미리보기는 원모어 #14 에서.
 */
export default function NewCheckMessage() {
  const { t } = useTranslation();
  const c = usePalette();
  const d = useDraft();
  const [state, setState] = useState<'edit' | 'saving' | 'saved' | 'failed'>('edit');
  const ready = d.message.trim().length > 0 && d.name.trim().length > 0;

  const save = async () => {
    if (!ready || state === 'saving' || state === 'saved') return;
    setState('saving');
    const r = await saveDraft();
    if (r === 'failed') return setState('failed');
    setState('saved');
    setTimeout(() => router.dismissTo('/'), 900);
  };
  if (state === 'saved') return <SaveResult label={t('new.saved')} />;

  const field = [styles.field, { backgroundColor: c.surfaceGlass, borderColor: c.surfaceLine, color: c.text }];
  return (
    <FlowScreen
      step={3}
      total={3}
      title={t('newCheck.messageQ')}
      sub={t('newCheck.messageSub')}
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
          placeholder={t('newCheck.message_ph')}
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
          placeholder={t('newCheck.name_ph')}
          placeholderTextColor={c.text3}
          selectionColor={c.accent}
          cursorColor={c.accent}
          style={[field, styles.name]}
        />
      </View>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  field: { borderRadius: radius.input, borderWidth: 1, paddingHorizontal: spacing.lg, fontSize: 17 },
  message: { minHeight: 88, paddingTop: 14, paddingBottom: 14, fontSize: 20, fontWeight: '600', textAlignVertical: 'top' },
  name: { height: 48 },
  count: { fontSize: 12, textAlign: 'right', marginTop: 6, fontVariant: ['tabular-nums'] },
  fail: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
