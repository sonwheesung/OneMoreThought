import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Toast, useToast } from "@/components/controls.tsx";
import {
  Chip,
  GlassCard,
  ScreenHeader,
  flowStyles,
} from "@/components/flow.tsx";
import { GlowBackground, PrimaryButton } from "@/components/ui.tsx";
import {
  CATEGORIES,
  CONTENT_MAX,
  CONTENT_MIN,
  SUPPORT_EMAIL,
  buildDiagnostics,
  contactAllowed,
  sendContact,
  type Category,
  type SendResult,
} from "@/features/contact.ts";
import { radius, spacing } from "@/theme/tokens.ts";
import { usePalette } from "@/theme/useTheme.ts";

/**
 * 문의하기 · `docs/DIAGNOSTICS_SYSTEM.md` §5 · 결정 #20 · #24 · #34 · #35.
 * 진단 첨부는 항상 붙이고, [보낼 내용 보기]로 실제 보낼 값을 그대로 보여 준다(보내는 순간 다시 만든다).
 * 🔴 만 14세 미만 · 나이 답 전(결정 #41): 양식 대신 메일 길만 보여 준다(서버로 아무것도 보내지 않는다).
 * 🔴 답장 길이 없다(공용 서버 단방향) → 답을 약속하는 문구를 쓰지 않는다(결정 #33).
 */
export default function Contact() {
  const { t } = useTranslation();
  const c = usePalette();
  const toast = useToast();
  const allowed = contactAllowed();
  const [category, setCategory] = useState<Category>("bug");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<"edit" | "sending" | SendResult>("edit");
  const ready =
    content.trim().length >= CONTENT_MIN &&
    state !== "sending" &&
    state !== "ok";
  const mail = () => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);

  const send = async () => {
    if (!ready) return;
    setState("sending");
    const r = await sendContact(category, content);
    setState(r);
    if (r === "ok") {
      toast.show(t("contact.sent"));
      setTimeout(() => router.back(), 1200);
    }
  };

  const field = {
    backgroundColor: c.surfaceGlass,
    borderColor: c.surfaceLine,
    color: c.text,
  };
  const fail =
    state === "rate-limited"
      ? t("contact.failBusy")
      : state === "offline" || state === "error"
        ? t("contact.fail")
        : null;

  return (
    <GlowBackground>
      <SafeAreaView
        style={styles.flex}
        edges={["top", "bottom", "left", "right"]}
      >
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScreenHeader title={t("settings.contact")} />
          {!allowed ? (
            <View style={styles.body}>
              <Text style={[styles.lead, { color: c.text2 }]}>
                {t("contact.localLead")}
              </Text>
              <GlassCard>
                <Pressable
                  onPress={mail}
                  accessibilityRole="button"
                  style={styles.mailRow}
                >
                  <Text style={[styles.mail, { color: c.text }]}>
                    {SUPPORT_EMAIL}
                  </Text>
                  <Text style={[styles.chev, { color: c.text3 }]}>›</Text>
                </Pressable>
              </GlassCard>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
              >
                <View>
                  <Text style={[flowStyles.label, { color: c.text2 }]}>
                    {t("contact.kind")}
                  </Text>
                  <View style={styles.chips}>
                    {CATEGORIES.map((k) => (
                      <Chip
                        key={k}
                        label={t(`contact.cat_${k}`)}
                        on={category === k}
                        onPress={() => setCategory(k)}
                      />
                    ))}
                  </View>
                </View>

                <View>
                  <TextInput
                    value={content}
                    onChangeText={setContent}
                    maxLength={CONTENT_MAX}
                    multiline
                    textAlignVertical="top"
                    placeholder={t("contact.ph")}
                    placeholderTextColor={c.text3}
                    selectionColor={c.accent}
                    cursorColor={c.accent}
                    style={[styles.field, field]}
                  />
                  <Text style={[styles.count, { color: c.text3 }]}>
                    {content.length} / {CONTENT_MAX}
                  </Text>
                </View>

                <View>
                  <Text style={[styles.note, { color: c.text2 }]}>
                    {t("contact.attachNote")}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setPreview(
                        preview
                          ? null
                          : JSON.stringify(buildDiagnostics(), null, 2),
                      )
                    }
                    accessibilityRole="button"
                    style={styles.previewBtn}
                  >
                    <Text
                      style={[styles.previewBtnText, { color: c.accentStrong }]}
                    >
                      {preview
                        ? t("contact.previewHide")
                        : t("contact.preview")}
                    </Text>
                  </Pressable>
                  {preview ? (
                    <ScrollView
                      nestedScrollEnabled
                      style={[
                        styles.previewBox,
                        {
                          backgroundColor: c.surfaceGlass,
                          borderColor: c.surfaceLine,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.previewText, { color: c.text2 }]}
                        selectable
                      >
                        {preview}
                      </Text>
                    </ScrollView>
                  ) : null}
                </View>
              </ScrollView>
              <View style={styles.foot}>
                {fail ? (
                  <Pressable onPress={mail} accessibilityRole="button">
                    <Text style={[styles.fail, { color: c.warn }]}>{fail}</Text>
                    <Text style={[styles.failMail, { color: c.text2 }]}>
                      {SUPPORT_EMAIL}
                    </Text>
                  </Pressable>
                ) : null}
                <PrimaryButton
                  label={t("contact.send")}
                  onPress={() => void send()}
                  disabled={!ready}
                />
              </View>
            </>
          )}
        </KeyboardAvoidingView>
        <Toast t={toast} />
      </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  lead: { fontSize: 15, lineHeight: 22 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  field: {
    minHeight: 160,
    borderRadius: radius.input,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    lineHeight: 22,
  },
  count: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
  note: { fontSize: 13, lineHeight: 19 },
  previewBtn: { paddingVertical: spacing.sm, alignSelf: "flex-start" },
  previewBtnText: { fontSize: 14, fontWeight: "600" },
  previewBox: {
    borderRadius: radius.input,
    borderWidth: 1,
    padding: spacing.md,
    maxHeight: 360,
  },
  previewText: { fontSize: 11, lineHeight: 15, fontFamily: "monospace" },
  foot: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  fail: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  failMail: { fontSize: 13, textAlign: "center", marginTop: 2 },
  mailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  mail: { flex: 1, fontSize: 16, fontWeight: "600" },
  chev: { fontSize: 20 },
});
