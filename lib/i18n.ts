import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import ko from '@/locales/ko.json';

/**
 * 🔴 기본(폴백) 언어는 `en` 이다(결정 #14 · 2026-10-08 확인). 기기 언어가 한국어면 `ko` 를 쓴다.
 * 승계: mission `lib/i18n.ts`.
 */
export const SUPPORTED = ['en', 'ko'] as const;
export type Lang = (typeof SUPPORTED)[number];
export const FALLBACK: Lang = 'en';

export function resolveDeviceLang(): Lang {
  for (const t of Localization.getLocales()) {
    const code = t.languageCode;
    if (code && (SUPPORTED as readonly string[]).includes(code)) return code as Lang;
  }
  return FALLBACK;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  lng: resolveDeviceLang(),
  fallbackLng: FALLBACK,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
