import { StyleSheet, View } from 'react-native';

/**
 * 작은 선 아이콘(새 의존성 없이 View 로 그린다 · 아이콘 라이브러리는 스택 표에서 아직 ❌).
 * 🔴 색은 부르는 쪽이 토큰으로 준다. 의미 없는 장식이라 접근성에서 숨긴다.
 */
export type GlyphName = 'eye' | 'eyeOff' | 'send' | 'check';

export function Glyph({ name, color, size = 20 }: { name: GlyphName; color: string; size?: number }) {
  const s = size;
  const line = Math.max(1.5, s / 11);
  if (name === 'check') {
    return (
      <View style={{ width: s, height: s }} importantForAccessibility="no-hide-descendants">
        <View
          style={{
            position: 'absolute',
            left: s * 0.22,
            top: s * 0.12,
            width: s * 0.32,
            height: s * 0.58,
            borderRightWidth: line,
            borderBottomWidth: line,
            borderColor: color,
            transform: [{ translateX: s * 0.08 }, { rotate: '45deg' }],
          }}
        />
      </View>
    );
  }
  if (name === 'send') {
    // 위로 나가는 화살표
    return (
      <View style={{ width: s, height: s, alignItems: 'center' }} importantForAccessibility="no-hide-descendants">
        <View style={{ position: 'absolute', top: s * 0.2, width: line, height: s * 0.62, backgroundColor: color }} />
        <View
          style={{
            position: 'absolute',
            top: s * 0.2,
            width: s * 0.42,
            height: s * 0.42,
            borderLeftWidth: line,
            borderTopWidth: line,
            borderColor: color,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    );
  }
  // eye · eyeOff
  return (
    <View style={[styles.center, { width: s, height: s }]} importantForAccessibility="no-hide-descendants">
      <View
        style={[
          styles.center,
          { width: s * 0.92, height: s * 0.56, borderRadius: s, borderWidth: line, borderColor: color },
        ]}>
        <View style={{ width: s * 0.24, height: s * 0.24, borderRadius: s, backgroundColor: color }} />
      </View>
      {name === 'eyeOff' && (
        <View
          style={{
            position: 'absolute',
            width: line,
            height: s * 1.02,
            backgroundColor: color,
            transform: [{ rotate: '-45deg' }],
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
