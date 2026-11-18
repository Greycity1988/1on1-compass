import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UI, UiStrings } from './ui';

export type Lang = 'ko' | 'en';
export const LANGS: Lang[] = ['ko', 'en'];

const STORAGE_KEY = '1on1_compass_lang';

/** Saved choice first, then the browser language (Korean browsers get Korean, everyone else English). */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ko' || saved === 'en') return saved;
  } catch {
    // storage unavailable
  }
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return prefs.some((l) => l?.toLowerCase().startsWith('ko')) ? 'ko' : 'en';
}

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: UiStrings;
}

const LangContext = createContext<LangContextValue | null>(null);

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = UI[lang].meta.title;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: UI[lang] }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
