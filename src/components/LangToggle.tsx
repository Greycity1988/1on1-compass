import React from 'react';
import { Languages } from 'lucide-react';
import { useLang } from '../i18n/lang';

/** Switches between Korean and English; the choice is remembered in this browser. */
export const LangToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, setLang, t } = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
      title={t.meta.langToggleTitle}
      aria-label={t.meta.langToggleTitle}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${className}`}
    >
      <Languages className="w-3.5 h-3.5" />
      <span lang={lang === 'ko' ? 'en' : 'ko'}>{t.meta.langToggle}</span>
    </button>
  );
};
