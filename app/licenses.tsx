import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/flow.tsx';
import { GlowBackground } from '@/components/ui.tsx';
import { spacing } from '@/theme/tokens.ts';
import { usePalette } from '@/theme/useTheme.ts';

import data from '../assets/licenses.json';

/**
 * 오픈소스 라이선스 · 설정 → 정보. 목록은 생성 파일(`assets/licenses.json` · `npm run licenses:build`)이다.
 * 🚫 번역하지 않는다(이름 · 라이선스 · 본문은 원문 그대로 · `common/PRE_LAUNCH_CHECK.md` §2.1). 줄을 누르면 그 종류의 본문을 펼친다.
 */
type Pkg = { name: string; version: string; license: string; copyright: string };
const PACKAGES = data.packages as Pkg[];
const TEXTS = data.texts as Record<string, string>;

export default function Licenses() {
  const { t } = useTranslation();
  const c = usePalette();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <GlowBackground>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
        <ScreenHeader title={t('settings.licenses')} />
        <FlatList
          data={PACKAGES}
          keyExtractor={(p) => `${p.name}@${p.version}`}
          contentContainerStyle={styles.body}
          ListHeaderComponent={
            <Text style={[styles.lead, { color: c.text2 }]}>{t('settings.licenses_lead', { count: PACKAGES.length })}</Text>
          }
          renderItem={({ item }) => {
            const key = `${item.name}@${item.version}`;
            const text = TEXTS[item.license];
            return (
              <Pressable
                onPress={() => setOpen(open === key ? null : key)}
                disabled={!text}
                accessibilityRole="button"
                style={[styles.row, { borderColor: c.line }]}>
                <Text style={[styles.name, { color: c.text }]}>
                  {item.name} <Text style={{ color: c.text3 }}>{item.version}</Text>
                </Text>
                <Text style={[styles.sub, { color: c.text2 }]}>{item.license}</Text>
                {item.copyright ? <Text style={[styles.sub, { color: c.text3 }]}>{item.copyright}</Text> : null}
                {open === key && text ? (
                  <View style={[styles.textBox, { backgroundColor: c.bg }]}>
                    <Text style={[styles.text, { color: c.text2 }]}>{text}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  lead: { fontSize: 13, lineHeight: 19, marginBottom: spacing.md },
  row: { paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, lineHeight: 17 },
  textBox: { marginTop: spacing.sm, borderRadius: 12, padding: spacing.md },
  text: { fontSize: 11, lineHeight: 16 },
});
