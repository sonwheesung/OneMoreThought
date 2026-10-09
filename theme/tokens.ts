/**
 * 디자인 토큰 · 결정 #33 «새벽 호수» · `docs/review/2026-10-09-ui-direction.md` §6.
 *
 * 색 값의 정본: 시안 세션(연출 사전) `C:\game\common\animation\tools\qa\out\omt_life\calm_tokens.md` §5(2026-10-09 받음 · 대비 AA).
 * 쓰임 규칙(같은 문서 §4):
 *   - 그라데이션은 주 버튼(accent → accentEnd · 120°)과 배경 번짐(bgGlowA/B/C)에만. 못 그리면 accentSolid.
 *   - 강조 인디고는 선 · 글자 · 작은 점에만. 넓은 면은 accentSoft.
 *   - 민트는 사실 · 안심(요약 고리 · 권한 안내 '안 보는 것' · '보내는 것' 아이콘 · 번짐 B)에만. 버튼 · 선택 상태에 쓰지 않는다.
 *   - 호박(warn*)은 지금 손봐야 하는 경고에만.
 * 🔴 화면에서 raw 색 · raw 숫자를 쓰지 않는다. 이 토큰만 쓴다(mission UI_GUIDE §1 승계).
 * 🔴 Kotlin 확인 화면도 같은 이름의 색을 쓴다: `modules/intervention/android/src/main/res/values(-night)/colors.xml` 의 `omt_*`.
 * 🚫 빨강을 쓰지 않는다(기둥 2).
 * 🚫 fontFamily 를 지정하지 않는다(시스템 글꼴 · 안드로이드에서 fontFamily + fontWeight 를 같이 주면 굵기가 깨진다).
 */

export type Palette = {
  bg: string; surface: string; line: string;
  text: string; text2: string; text3: string;
  /** CTA 그라데이션 시작 = 강조색. 그라데이션을 못 그리면 accentSolid 단색으로 대체 */
  accent: string; accentEnd: string; onAccent: string;
  warn: string; warnBg: string;
  // 추가
  bgGlowA: string; bgGlowB: string; bgGlowC: string;
  surfaceGlass: string; surfaceLine: string; lineStrong: string;
  accentSolid: string; accentStrong: string; accentSoft: string; accentGlow: string;
  mint: string; mint2: string; mintText: string; mintSoft: string;
  switchOn: string; switchOffTrack: string; switchOffLine: string; knob: string;
  chip: string; chipSelected: string; chipSelectedText: string; chipSelectedLine: string;
  warnLine: string; warnDot: string; onWarn: string;
  focus: string; disabled: string; disabledText: string;
  confirmBtn: string; confirmBtnLine: string;
};

export const light: Palette = {
  bg: '#F6F5FB', surface: '#FFFFFF', line: 'rgba(30,29,69,0.08)',
  text: '#1E1D45', text2: '#57567C', text3: '#6C6B8E',
  accent: '#5F52D3', accentEnd: '#7656D2', onAccent: '#FFFFFF',
  warn: '#8A5208', warnBg: '#FFF3DF',
  bgGlowA: '#E6E2FC', bgGlowB: '#DAF1E9', bgGlowC: '#F0DFF3',
  surfaceGlass: 'rgba(255,255,255,0.78)', surfaceLine: 'rgba(255,255,255,0.96)', lineStrong: '#8C8BAA',
  accentSolid: '#6A54D3', accentStrong: '#4C40BA', accentSoft: '#E9E7FD', accentGlow: 'rgba(95,82,211,0.42)',
  mint: '#3E9E83', mint2: '#8DD1BB', mintText: '#256856', mintSoft: '#DAF1E9',
  switchOn: '#5F52D3', switchOffTrack: '#EEEDF6', switchOffLine: '#8C8BAA', knob: '#FFFFFF',
  chip: '#FFFFFF', chipSelected: '#E9E7FD', chipSelectedText: '#4C40BA', chipSelectedLine: '#5F52D3',
  warnLine: '#F1D9AE', warnDot: '#E09A2E', onWarn: '#2B1A00',
  focus: '#7D71E3', disabled: '#EEEDF6', disabledText: '#A5A4BE',
  confirmBtn: 'rgba(255,255,255,0.72)', confirmBtnLine: '#FFFFFF',
};

export const dark: Palette = {
  bg: '#131231', surface: '#1F1E3D', line: 'rgba(255,255,255,0.08)',
  text: '#ECEBFA', text2: '#ABAACB', text3: '#8C8BAE',
  accent: '#ADA9F8', accentEnd: '#B79CF3', onAccent: '#16173A',
  warn: '#F2BE6E', warnBg: 'rgba(242,190,110,0.09)',
  bgGlowA: '#29265E', bgGlowB: '#123A33', bgGlowC: '#382447',
  surfaceGlass: 'rgba(255,255,255,0.06)', surfaceLine: 'rgba(255,255,255,0.09)', lineStrong: '#73729A',
  accentSolid: '#B2A3F6', accentStrong: '#D6D2FA', accentSoft: 'rgba(173,169,248,0.16)', accentGlow: 'rgba(158,149,240,0.30)',
  mint: '#8DD1BB', mint2: '#3E9E83', mintText: '#8DD1BB', mintSoft: 'rgba(141,209,187,0.14)',
  switchOn: '#9E95F0', switchOffTrack: 'rgba(255,255,255,0.06)', switchOffLine: '#73729A', knob: '#FFFFFF',
  chip: 'rgba(255,255,255,0.06)', chipSelected: 'rgba(173,169,248,0.18)', chipSelectedText: '#D6D2FA', chipSelectedLine: '#9E95F0',
  warnLine: 'rgba(242,190,110,0.22)', warnDot: '#F2BE6E', onWarn: '#2B1A00',
  focus: '#ADA9F8', disabled: 'rgba(255,255,255,0.05)', disabledText: '#5F5E82',
  confirmBtn: 'rgba(255,255,255,0.08)', confirmBtnLine: 'rgba(255,255,255,0.14)',
};

/** 반경(calm_tokens §4 숫자) */
export const radius = {
  /** 2026-10-09 사용자 지시 «카드 radius 가 너무 크다» · 시안 28 → 20 */
  card: 20,
  /** 입력 · 확인 화면 미리보기 · 카드(20)보다 크면 어색해 24 → 16(2026-10-10 · 카드 반경 지시와 같은 결) */
  input: 16,
  /** 아이콘 칸 · 목록 행 */
  row: 16,
  /** 알약 버튼 · 칩 */
  btn: 999,
  chip: 999,
} as const;

/** 높이(dp) */
export const size = {
  btn: 56,
  /** 확인 화면 [취소] [열기] 유리 알약 */
  confirmBtn: 58,
  chip: 38,
  switchW: 48,
  switchH: 28,
  /** 가로 확인 카드 최대 폭 */
  confirmCardMax: 520,
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** 글자(calm_tokens §4 · 메시지 32 / 600 · RN 에 650 이 없어 600) */
export const type = {
  message: { fontSize: 32, fontWeight: '600' as const, lineHeight: 40, letterSpacing: -0.96 },
  title: { fontSize: 26, fontWeight: '700' as const, lineHeight: 34 },
  button: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  sub: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
} as const;

/** 모션(ms · 기본 Animated · 새 의존성 없음 · 결정 #33) · 모션 줄이기 설정이면 즉시 바꾼다 */
export const motion = {
  /** 누름 0.97 */
  fast: 120,
  /** 스위치 */
  base: 200,
  /** 메시지가 6px 떠오르며 나타남 */
  reveal: 240,
  pressScale: 0.97,
  revealRise: 6,
  /** cubic-bezier(.2,.8,.2,1) · Easing.bezier 로 쓴다 */
  ease: [0.2, 0.8, 0.2, 1] as const,
} as const;

/** 손이 닿는 최소 크기(dp) */
export const TOUCH_MIN = 48;
