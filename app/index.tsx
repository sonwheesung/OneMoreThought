import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppState,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cachedRules, putDevice, saveRule, syncNow } from '@/features/rules';
import { subjectId } from '@/features/server';
import { GRACE_DEFAULT, type Rule } from '@/lib/rules.ts';
import { Intervention, type LaunchableApp } from '@/modules/intervention';

/**
 * ⚠ Phase 0 스파이크 화면(`docs/ANDROID_PLATFORM.md` §9 S1 ~ S7). 출시 화면이 아니다.
 * 실제 홈 · 규칙 편집은 Phase 2 에서 `ui-design-reference` 를 먼저 보고 만든다(CLAUDE §13).
 *
 * Phase 1(결정 #30): 저장은 기기 캐시(rules.json) → 서버. 이 화면은 실행 전 확인 규칙 하나를 시간대와 함께 만든다.
 * 🔴 접근성 설정으로 보내기 전에 공개 화면을 거친다(§7.1 · 실제 반려 사례 R2 의 반대):
 *    전체 화면 · 두 버튼 · 동의 전에는 아무것도 켜진 것처럼 보이지 않는다 · 뒤로가기는 동의가 아니다.
 */

interface LogEntry {
  kind: string;
  pkg?: string;
  result?: string;
  detectToDrawMs?: number;
  at?: number;
  error?: string;
}

interface Status {
  service: boolean;
  usage: boolean;
  advanced: 'on' | 'off' | 'unknown';
  sdk: number;
}

function readStatus(): Status | null {
  if (!Intervention) return null;
  return {
    service: Intervention.isServiceEnabled(),
    usage: Intervention.hasUsageAccess(),
    advanced: Intervention.advancedProtection(),
    sdk: Intervention.sdkInt(),
  };
}

/** "HH:MM" → 분. 틀리면 null */
function toMin(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  return h < 24 && mi < 60 ? h * 60 + mi : null;
}

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

function parseLog(raw: string): LogEntry[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? (v as LogEntry[]) : [];
  } catch {
    return [];
  }
}

export default function Spike() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status | null>(() => readStatus());
  const [apps] = useState<LaunchableApp[]>(() => Intervention?.listLaunchableApps() ?? []);
  // 스파이크는 실행 전 확인 규칙 하나만 고친다(첫 번째 것 · 없으면 새로)
  const [rule0] = useState<Rule | undefined>(() => cachedRules().find((r) => r.kind === 'intercept'));
  const [targets, setTargets] = useState<string[]>(rule0?.targets ?? []);
  const [message, setMessage] = useState(rule0?.message ?? '');
  const [start, setStart] = useState(hhmm(rule0?.startMin ?? 0));
  const [end, setEnd] = useState(hhmm(rule0?.endMin ?? 1439));
  const [log, setLog] = useState<LogEntry[]>([]);
  const [disclosure, setDisclosure] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [sync, setSync] = useState('');
  const [queued, setQueued] = useState(0);

  const refresh = useCallback(() => {
    setStatus(readStatus());
    if (Intervention) {
      setLog(parseLog(Intervention.getLog()));
      setQueued(Intervention.queueCount());
    }
  }, []);

  const runSync = useCallback(async () => {
    const r = await syncNow();
    const f = r.flush.ok ? `↑${r.flush.value.sent}` : `↑✕ ${r.flush.reason}`;
    const p = r.pull.ok ? `↓${r.pull.value.length}` : `↓✕ ${r.pull.reason}`;
    setSync(`${f} · ${p} · ${new Date().toLocaleTimeString()}`);
    refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
    void runSync();
    if (Intervention) {
      const c = Platform.constants as { Model?: string; Manufacturer?: string };
      void putDevice({
        model: [c.Manufacturer, c.Model].filter(Boolean).join(' '),
        sdkInt: Intervention.sdkInt(),
        appVersion: '0.1.0',
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        advProtection: Intervention.advancedProtection(),
      });
    }
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        refresh();
        void runSync();
      }
    });
    return () => sub.remove();
  }, [refresh, runSync]);

  const opened = useMemo(() => {
    if (!Intervention || !status?.usage) return [];
    return targets.map((p) => ({ pkg: p, at: Intervention!.firstOpenedToday(p) }));
  }, [targets, status?.usage, log]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!Intervention || !status) {
    return (
      <SafeAreaView style={styles.page}>
        <Text style={styles.h1}>{t('spike.title')}</Text>
        <Text style={styles.body}>{t('spike.noNative')}</Text>
      </SafeAreaView>
    );
  }

  const toggle = (pkg: string) => {
    setSaved(null);
    setTargets((cur) => (cur.includes(pkg) ? cur.filter((p) => p !== pkg) : [...cur, pkg]));
  };

  const save = async () => {
    const s0 = toMin(start);
    const e0 = toMin(end);
    if (s0 === null || e0 === null || s0 === e0 || targets.length === 0 || !message.trim()) {
      setSaved(t('spike.invalid'));
      return;
    }
    const rule: Rule = {
      id: rule0?.id ?? Intervention!.uuid(),
      kind: 'intercept',
      name: 'spike',
      enabled: true,
      days: 127,
      startMin: s0,
      endMin: e0,
      targets,
      message,
      graceMin: rule0?.graceMin ?? GRACE_DEFAULT,
      updatedAt: Date.now(),
    };
    const r = await saveRule(rule);
    setSaved(t(`spike.saved_${r}`));
    refresh();
  };

  const onOff = (v: boolean) => (v ? t('spike.on') : t('spike.off'));

  return (
    <SafeAreaView style={styles.page}>
      <FlatList
        data={apps}
        keyExtractor={(a) => a.packageName}
        ListHeaderComponent={
          <View>
            <Text style={styles.h1}>{t('spike.title')}</Text>

            <Text style={styles.h2}>{t('spike.status')}</Text>
            <Text style={styles.body}>
              {t('spike.service')}: {onOff(status.service)} · {t('spike.usage')}: {onOff(status.usage)}
            </Text>
            <Text style={styles.body}>
              {t('spike.advanced')}: {status.advanced} · SDK {status.sdk}
            </Text>
            <Text style={styles.small}>
              {t('spike.sync')}: {sync || '…'} · {t('spike.queued')} {queued} · {subjectId()?.slice(0, 8) ?? '-'}
            </Text>
            <Pressable onPress={() => void runSync()}>
              <Text style={styles.link}>{t('spike.syncNow')}</Text>
            </Pressable>
            {!status.service && (
              <Pressable style={styles.btn} onPress={() => setDisclosure(true)}>
                <Text style={styles.btnText}>{t('spike.enableService')}</Text>
              </Pressable>
            )}
            {!status.usage && (
              <Pressable style={styles.btn} onPress={() => Intervention!.openUsageAccessSettings()}>
                <Text style={styles.btnText}>{t('spike.enableUsage')}</Text>
              </Pressable>
            )}

            <Text style={styles.h2}>{t('spike.message')}</Text>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={(v) => {
                setSaved(null);
                setMessage(v);
              }}
            />
            <Text style={styles.h2}>{t('spike.window')}</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, styles.flex]} value={start} onChangeText={setStart} placeholder="09:00" />
              <Text style={styles.body}>~</Text>
              <TextInput style={[styles.input, styles.flex]} value={end} onChangeText={setEnd} placeholder="18:00" />
            </View>
            <Pressable style={styles.btn} onPress={() => void save()}>
              <Text style={styles.btnText}>{saved ?? t('spike.save')}</Text>
            </Pressable>

            {opened.map((o) => (
              <Text key={o.pkg} style={styles.body}>
                {o.pkg}: {o.at ? `${t('spike.openedToday')} ${new Date(o.at).toLocaleTimeString()}` : t('spike.notOpenedToday')}
              </Text>
            ))}

            <View style={styles.row}>
              <Text style={styles.h2}>{t('spike.log')}</Text>
              <Pressable onPress={refresh}>
                <Text style={styles.link}>{t('spike.refresh')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Intervention!.clearLog();
                  refresh();
                }}>
                <Text style={styles.link}>{t('spike.clear')}</Text>
              </Pressable>
            </View>
            {log.slice(0, 15).map((e, i) => (
              <Text key={i} style={styles.mono}>
                {e.kind} {e.pkg ?? ''} {e.result ?? ''} {e.detectToDrawMs != null ? `${e.detectToDrawMs}ms` : ''}{' '}
                {e.error ?? ''}
              </Text>
            ))}

            <Text style={styles.h2}>{t('spike.targets')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => toggle(item.packageName)} style={styles.app}>
            <Text style={styles.body}>
              {targets.includes(item.packageName) ? '☑' : '☐'} {item.label}
            </Text>
            <Text style={styles.small}>{item.packageName}</Text>
          </Pressable>
        )}
      />

      {/* S6 공개 화면 초안(ANDROID_PLATFORM §7.1). 뒤로가기(onRequestClose)는 동의가 아니다 */}
      <Modal visible={disclosure} animationType="slide" onRequestClose={() => setDisclosure(false)}>
        <SafeAreaView style={[styles.page, styles.disclosure]}>
          <Text style={styles.h1}>{t('disclosure.title')}</Text>
          <Text style={styles.body}>{t('disclosure.sees')}</Text>
          <Text style={styles.body}>{t('disclosure.notSees')}</Text>
          <Text style={styles.body}>{t('disclosure.why')}</Text>
          <Text style={styles.body}>{t('disclosure.where')}</Text>
          <Text style={styles.small}>{t('disclosure.path')}</Text>
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.flex]} onPress={() => setDisclosure(false)}>
              <Text style={styles.btnText}>{t('disclosure.later')}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.flex, styles.primary]}
              onPress={() => {
                setDisclosure(false);
                Intervention!.openAccessibilitySettings();
              }}>
              <Text style={styles.btnText}>{t('disclosure.agree')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, backgroundColor: '#fff' },
  disclosure: { justifyContent: 'center', gap: 12 },
  h1: { fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  h2: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 4 },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 12, color: '#777' },
  mono: { fontSize: 12, fontFamily: 'monospace' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
  btn: { backgroundColor: '#333', borderRadius: 8, padding: 12, marginTop: 8, alignItems: 'center' },
  primary: { backgroundColor: '#1d4ed8' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  link: { color: '#1d4ed8', marginTop: 12 },
  app: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ddd' },
});
