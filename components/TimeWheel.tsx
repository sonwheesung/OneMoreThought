import WheelPicker, { type PickerItem } from '@quidone/react-native-wheel-picker';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { usePalette } from '@/theme/useTheme.ts';

/**
 * 시각 휠 · 시안 원모어 #9(한 시간 단위 · 5칸) · #13(30분 단위 · 3칸).
 * 2026-10-09 사용자 «스크롤하는데 시간이 회귀하거나 이상하게 된다» → 손으로 짠 휠(3바퀴 이어 붙이고 가운데로 되돌리기)을 버리고
 * 검증된 `@quidone/react-native-wheel-picker`(순수 JS · ScrollView 기반이라 화면 ScrollView 안에서도 가상 목록 경고가 없다)로 바꿨다.
 * 끝없이 돌지 않는다(00:00 ~ 23:00 한 바퀴). 되돌리기 점프가 회귀의 원인이었다.
 * 값은 휠이 멈추고 손이 떨어진 뒤에만 올린다(onValueChanged). 칸을 누르면 그 시각으로 간다.
 * 가운데 띠는 accentSoft · 출렁임 없음.
 */
interface Props {
  /** 분(0 ~ 1439) */
  value: number;
  onChange: (min: number) => void;
  stepMin?: 60 | 30;
  item?: number;
  visible?: 3 | 5;
  label: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const hhmm = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

export function TimeWheel({ value, onChange, stepMin = 60, item = 44, visible = 5, label }: Props) {
  const c = usePalette();
  const n = (24 * 60) / stepMin;
  const idx = Math.round(value / stepMin) % n;
  const data = useMemo<PickerItem<number>[]>(
    () => Array.from({ length: n }, (_, i) => ({ value: i * stepMin, label: hhmm(i * stepMin) })),
    [n, stepMin],
  );
  const step = (d: 1 | -1) => onChange(((((idx + d) % n) + n) % n) * stepMin);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: hhmm(idx * stepMin) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <View importantForAccessibility="no-hide-descendants">
        <WheelPicker
          data={data}
          value={idx * stepMin}
          onValueChanged={({ item: it }) => {
            if (it.value !== idx * stepMin) onChange(it.value);
          }}
          itemHeight={item}
          visibleItemCount={visible}
          enableScrollByTapOnItem
          itemTextStyle={[
            styles.text,
            { color: c.text, fontSize: visible === 3 ? 22 : 20, fontWeight: visible === 3 ? '700' : '600' },
          ]}
          // 가운데 띠: 라이브러리 띠(글자 위에 덮인다)를 옅은 보라로. 띠를 따로 깔면 칸 수에 따라 자리가 어긋났다(3칸에서 실측)
          overlayItemStyle={[styles.band, { backgroundColor: c.accentSolid }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { borderRadius: 14, opacity: 0.12 },
  text: { textAlign: 'center', fontVariant: ['tabular-nums'] },
});
