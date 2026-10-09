import { StyleSheet, View } from 'react-native';

/**
 * 작은 선 아이콘(새 의존성 없이 View 로 그린다 · 아이콘 라이브러리는 스택 표에서 아직 ❌).
 * 🔴 색은 부르는 쪽이 토큰으로 준다. 의미 없는 장식이라 접근성에서 숨긴다.
 */
export type GlyphName = 'eye' | 'eyeOff' | 'send' | 'check' | 'gear' | 'back';

export function Glyph({
  name,
  color,
  size = 20,
  hole = 'transparent',
}: {
  name: GlyphName;
  color: string;
  size?: number;
  hole?: string;
}) {
  const s = size;
  // 시안 선 굵기 1.6 ~ 1.8 · 끝은 둥글게(막대에 반경)
  const line = 1.7;
  const cap = line / 2;
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
  if (name === 'back') {
    // 뒤로 « < »: 두 변만 그린 사각형을 45° 돌린다
    return (
      <View style={[styles.center, { width: s, height: s }]} importantForAccessibility="no-hide-descendants">
        <View
          style={{
            width: s * 0.46,
            height: s * 0.46,
            borderLeftWidth: 2,
            borderBottomWidth: 2,
            borderColor: color,
            borderBottomLeftRadius: 1,
            marginLeft: s * 0.16,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    );
  }
  if (name === 'gear') {
    // 톱니 근사: 여덟 개의 이 + 원판 + 가운데 구멍(hole = 놓인 바탕색)
    return (
      <View style={[styles.center, { width: s, height: s }]} importantForAccessibility="no-hide-descendants">
        {[0, 45, 90, 135].map((deg) => (
          <View
            key={deg}
            style={{
              position: 'absolute',
              width: s * 0.9,
              height: s * 0.2,
              borderRadius: cap,
              backgroundColor: color,
              transform: [{ rotate: `${deg}deg` }],
            }}
          />
        ))}
        <View
          style={{
            width: s * 0.62,
            height: s * 0.62,
            borderRadius: s,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View style={{ width: s * 0.26, height: s * 0.26, borderRadius: s, backgroundColor: hole }} />
        </View>
      </View>
    );
  }
  if (name === 'send') {
    // 위로 나가는 화살표
    return (
      <View style={{ width: s, height: s, alignItems: 'center' }} importantForAccessibility="no-hide-descendants">
        <View
          style={{ position: 'absolute', top: s * 0.2, width: line, height: s * 0.62, borderRadius: cap, backgroundColor: color }}
        />
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
        style={[styles.center, { width: s * 0.92, height: s * 0.56, borderRadius: s, borderWidth: line, borderColor: color }]}>
        <View style={{ width: s * 0.24, height: s * 0.24, borderRadius: s, backgroundColor: color }} />
      </View>
      {name === 'eyeOff' && (
        <View
          style={{
            position: 'absolute',
            width: line,
            height: s * 1.02,
            borderRadius: cap,
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
