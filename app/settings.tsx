import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Dialog,
  Switch,
  Toast,
  useDialog,
  useToast,
} from "@/components/controls.tsx";
import { BackButton, GlassCard } from "@/components/flow.tsx";
import { GlassPill, GlowBackground } from "@/components/ui.tsx";
import { clearLocal } from "@/features/rules";
import { diagSummaryOn, setDiagSummaryOn } from "@/features/settings.ts";
import { radius, size, spacing } from "@/theme/tokens.ts";
import { usePalette } from "@/theme/useTheme.ts";

/**
 * 설정 · 시안 원모어 #16. 묶음 셋: 진단 · 데이터 · 도움.
 * 🔴 진단 자동 요약은 기본 켬 · 여기서 끈다(결정 #20).
 * 🔴 「이 기기에서만 지우기」(결정 #34): clearLocal 하나만 부른다. 서버 사본은 남고 지우는 길(문의)을 창 안에서 같이 말한다.
 *    지우기 버튼은 호박색(warnBg · warnLine · warn) · 빨강 없음 · 확인창은 한 번만.
 */
export default function Settings() {
  const { t } = useTranslation();
  const c = usePalette();
  const [diag, setDiag] = useState(diagSummaryOn);
  const dialog = useDialog();
  const toast = useToast();

  const toggleDiag = (v: boolean) => {
    setDiag(v);
    setDiagSummaryOn(v);
    toast.show(t(v ? "settings.diag_on" : "settings.diag_off"));
  };

  const wipe = () =>
    dialog.hide(() => {
      clearLocal();
      toast.show(t("settings.wiped"));
    });

  return (
    <GlowBackground>
      <SafeAreaView
        style={styles.flex}
        edges={["top", "bottom", "left", "right"]}
      >
        <View style={styles.bar}>
          <BackButton />
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <Text
            style={[styles.title, { color: c.text }]}
            accessibilityRole="header"
          >
            {t("settings.title")}
          </Text>

          <Text style={[styles.group, { color: c.text3 }]}>
            {t("settings.groupDiag")}
          </Text>
          <GlassCard>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: c.text }]}>
                  {t("settings.diag")}
                </Text>
                <Text style={[styles.rowSub, { color: c.text2 }]}>
                  {t("settings.diag_sub")}
                </Text>
              </View>
              <Switch
                value={diag}
                onChange={toggleDiag}
                label={t("settings.diag")}
              />
            </View>
          </GlassCard>

          <Text style={[styles.group, { color: c.text3 }]}>
            {t("settings.groupData")}
          </Text>
          <GlassCard>
            <Pressable
              onPress={dialog.show}
              accessibilityRole="button"
              style={styles.row}
            >
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: c.warn }]}>
                  {t("settings.wipe")}
                </Text>
                <Text style={[styles.rowSub, { color: c.text2 }]}>
                  {t("settings.wipe_sub")}
                </Text>
              </View>
              <Text style={[styles.chev, { color: c.text3 }]}>›</Text>
            </Pressable>
          </GlassCard>

          <Text style={[styles.group, { color: c.text3 }]}>
            {t("settings.groupHelp")}
          </Text>
          <GlassCard>
            {/* 문의 양식(공용 서버 · 진단 첨부 미리보기 · 옛 주체 번호 표시)은 Phase 5. 그 전엔 눌리지 않는다고 밝힌다 */}
            <View
              style={styles.row}
              accessible
              accessibilityState={{ disabled: true }}
            >
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: c.disabledText }]}>
                  {t("settings.contact")}
                </Text>
                <Text style={[styles.rowSub, { color: c.text3 }]}>
                  {t("settings.contact_soon")}
                </Text>
              </View>
            </View>
          </GlassCard>
        </ScrollView>

        <Dialog d={dialog} onClose={() => dialog.hide()}>
          <Text style={[styles.dTitle, { color: c.text }]}>
            {t("settings.wipe_q")}
          </Text>
          <Text style={[styles.dBody, { color: c.text2 }]}>
            {t("settings.wipe_body")}
          </Text>
          <View
            style={[
              styles.note,
              { backgroundColor: c.bg, borderColor: c.line },
            ]}
          >
            <Text style={[styles.noteText, { color: c.text2 }]}>
              {t("settings.wipe_note")}
            </Text>
          </View>
          <View style={styles.dActions}>
            <GlassPill
              label={t("settings.cancel")}
              onPress={() => dialog.hide()}
              style={styles.flex}
            />
            <Pressable
              onPress={wipe}
              accessibilityRole="button"
              style={[
                styles.wipeBtn,
                { backgroundColor: c.warnBg, borderColor: c.warnLine },
              ]}
            >
              <Text style={[styles.wipeText, { color: c.warn }]}>
                {t("settings.wipe_do")}
              </Text>
            </Pressable>
          </View>
        </Dialog>
        <Toast t={toast} />
      </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 30,
    marginBottom: spacing.sm,
  },
  group: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: spacing.md,
    marginLeft: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 48,
  },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowSub: { fontSize: 13, lineHeight: 19, marginTop: 2 },
  chev: { fontSize: 22 },
  dTitle: { fontSize: 19, fontWeight: "700", lineHeight: 26 },
  dBody: { fontSize: 15, lineHeight: 22 },
  note: { borderRadius: radius.row, borderWidth: 1, padding: spacing.md },
  noteText: { fontSize: 13, lineHeight: 19 },
  dActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  wipeBtn: {
    flex: 1,
    height: size.btn,
    borderRadius: radius.btn,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wipeText: { fontSize: 17, fontWeight: "600" },
});
