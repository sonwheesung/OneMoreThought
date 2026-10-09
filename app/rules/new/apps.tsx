import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppPicker } from '@/components/AppPicker.tsx';
import { useEdit } from '@/components/flow.tsx';
import { interceptStep, setDraft, useDraft } from '@/features/draft.ts';

/** 실행 전 확인 · 앱 고르기(여러 개) · 시안 원모어 #8 · 진행 2/4 */
export default function NewRuleApps() {
  const { t } = useTranslation();
  const d = useDraft();
  const edit = useEdit();
  return (
    <AppPicker
      edit={edit}
      {...interceptStep(2)}
      title={t('new.appQ')}
      sub={t('new.appSub')}
      value={d.targets}
      onChange={(targets) => setDraft({ targets })}
      onNext={() => router.push('/rules/new/when')}
    />
  );
}
