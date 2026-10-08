/**
 * 디자인 토큰 · 결정 #33 «새벽 호수» · `docs/review/2026-10-09-ui-direction.md` §6.
 *
 * ⏳ 자리만 잡았다(2026-10-09). 색 값은 시안 세션(연출 사전)이 대비 AA 로 정리해 보낸다. 지금 값은 결정 #33 에 적힌
 *    것만 넣은 임시값이다. 받으면 이 파일 한 곳만 바꾼다.
 * 🔴 화면에서 raw 색 · raw 숫자를 쓰지 않는다. 이 토큰만 쓴다(mission UI_GUIDE §1 승계).
 * 🔴 Kotlin 확인 화면도 같은 이름의 색을 쓴다: `modules/intervention/android/src/main/res/values(-night)/colors.xml` 의 `omt_*`.
 * 🚫 빨강을 쓰지 않는다(기둥 2). 경고는 호박색(warn).
 * 🚫 fontFamily 를 지정하지 않는다(시스템 글꼴 · 안드로이드에서 fontFamily + fontWeight 를 같이 주면 굵기가 깨진다).
 */

export interface Palette {
  /** 화면 바탕(안개빛 라벤더) */
  bg: string;
  /** 반투명 흰 카드 · 시트 */
  surface: string;
  /** 얇은 구분선 · 테두리 */
  line: string;
  /** 글자 3단계: 본문 · 보조 · 흐림 */
  text: string;
  text2: string;
  text3: string;
  /** 강조(주 버튼 그라데이션의 시작 · 끝) */
  accent: string;
  accentEnd: string;
  /** 주 버튼 위 글자 */
  onAccent: string;
  /** 권한 꺼짐 등 경고(호박색 · 빨강 아님) */
  warn: string;
  warnBg: string;
}

// ⏳ 임시값 — 시안 세션 값으로 바꾼다
export const light: Palette = {
  bg: '#F6F4FB',
  surface: 'rgba(255,255,255,0.72)',
  line: 'rgba(60,50,110,0.10)',
  text: '#1D1B2A',
  text2: '#55526A',
  text3: '#8E8BA3',
  accent: '#4F6BFF',
  accentEnd: '#8A5CF6',
  onAccent: '#FFFFFF',
  warn: '#B7791F',
  warnBg: 'rgba(183,121,31,0.12)',
};

// ⏳ 임시값 — 같은 색조의 어두운 판
export const dark: Palette = {
  bg: '#14131C',
  surface: 'rgba(255,255,255,0.08)',
  line: 'rgba(255,255,255,0.10)',
  text: '#F2F0FA',
  text2: '#B9B5CC',
  text3: '#7D7993',
  accent: '#6F86FF',
  accentEnd: '#A07BFF',
  onAccent: '#FFFFFF',
  warn: '#E0A54A',
  warnBg: 'rgba(224,165,74,0.16)',
};

export const radius = {
  card: 28,
  /** 알약 버튼 */
  btn: 999,
  row: 16,
  chip: 999,
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** 글자: 크기 · 굵기(결정 #33 메시지 32 / 650 · 나머지 단계는 ⏳ 시안 값) */
export const type = {
  message: { fontSize: 32, fontWeight: '600' as const, lineHeight: 40 },
  title: { fontSize: 26, fontWeight: '700' as const, lineHeight: 34 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
} as const;

/** 모션(ms · 기본 Animated · 새 의존성 없음 · 결정 #33) */
export const motion = {
  fast: 120,
  base: 200,
  /** cubic-bezier(.2,.8,.2,1) 에 가까운 감속 · Animated.Easing.bezier 로 쓴다 */
  ease: [0.2, 0.8, 0.2, 1] as const,
} as const;

/** 손이 닿는 최소 크기(dp) */
export const TOUCH_MIN = 48;
