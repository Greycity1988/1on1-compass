import React from 'react';
import { useLang } from '../i18n/lang';

interface SuiteFooterProps {
  appName: string;
  emblem: React.ReactNode;
  onOpenDonation: () => void;
  onOpenFeedback?: () => void;
  onEmblemClick?: () => void;
  emblemTitle?: string;
}

/**
 * SuiteFooter shared by every Marketing Intelligence Suite app.
 * Option 2 (Warm Indie Creator Edition).
 */
export const SuiteFooter: React.FC<SuiteFooterProps> = ({
  appName,
  emblem,
  onOpenDonation,
  onOpenFeedback,
  onEmblemClick,
  emblemTitle,
}) => {
  const { t } = useLang();
  return (
  <footer className="mt-auto border-t border-slate-200 bg-white dark:border-[#26272c] dark:bg-[#141416] py-10 px-4 text-center text-xs text-slate-500 dark:text-[#AEAEAE] space-y-3 flex flex-col items-center justify-center transition-colors">
    {onEmblemClick ? (
      <button
        type="button"
        onClick={onEmblemClick}
        className="group relative p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-[#1a1b1f] transition-all cursor-pointer select-none"
        title={emblemTitle}
      >
        <span className="block opacity-80 group-hover:opacity-100 transition-transform group-hover:scale-105">
          {emblem}
        </span>
      </button>
    ) : (
      <div className="p-2 opacity-90 select-none" aria-hidden="true">
        {emblem}
      </div>
    )}
    <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
      Crafted with passion in 2026 by indie creator{' '}
      <strong className="text-emerald-700 dark:text-[#A8FF1A] font-extrabold">Owen O. Magnus</strong>.
    </p>
    <p className="text-xs text-slate-500 dark:text-[#AEAEAE] font-medium leading-relaxed">
      {onOpenFeedback ? (
        <button
          type="button"
          onClick={onOpenFeedback}
          className="font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 transition cursor-pointer"
          title={t.footer.feedbackTitle}
        >
          Feedbacks &amp; feature ideas
        </button>
      ) : (
        <span>Feedbacks &amp; feature ideas</span>
      )}{' '}
      are warmly welcomed,
      <br />
      and{' '}
      <button
        type="button"
        onClick={onOpenDonation}
        className="text-emerald-700 hover:text-emerald-800 dark:text-[#A8FF1A] dark:hover:text-[#b8ff33] font-bold underline decoration-emerald-500/30 dark:decoration-[#A8FF1A]/30 cursor-pointer inline-flex items-center space-x-1"
        title={t.footer.donationTitle}
      >
        <span>coffee sponsorships</span>
        <span>☕✨</span>
      </button>{' '}
      keep our servers &amp; AI APIs running!
    </p>
    <p className="text-[11px] text-slate-500 dark:text-[#6E6E6E]">
      {appName} • Part of Marketing Intelligence Suite • Desktop Optimized
    </p>
  </footer>
);
};
