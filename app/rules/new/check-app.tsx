import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppPicker } from '@/components/AppPicker.tsx';
import { useEdit } from '@/components/flow.tsx';
import { setDraft, useDraft } from '@/features/draft.ts';

/** 실행 확인 · 앱 하나(라디오 · 결정 #3) · 시안 원모어 #13 · 진행 1/3 */
export default function NewCheckApp() {
  const { t } = useTranslation();
  const d = useDraft();
  const edit = useEdit();
  return (
    <AppPicker
      edit={edit}
      step={1}
      total={3}
      single
      title={t('newCheck.appQ')}
      sub={t('newCheck.appSub')}
      value={d.targets.slice(0, 1)}
      onChange={(targets) => setDraft({ targets: targets.slice(0, 1) })}
      onNext={() => router.push('/rules/new/check-time')}
    />
  );
}
