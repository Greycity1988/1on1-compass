import React from 'react';
import { X, Coffee, Heart, ExternalLink } from 'lucide-react';
import { DONATION_URL } from '../constants/links';
import { useLang } from '../i18n/lang';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLang();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div role="dialog" aria-modal="true" aria-label={t.donation.aria} className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center">
        <button
          onClick={onClose}
          aria-label={t.common.close}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#A8FF1A] flex items-center justify-center mx-auto mb-4 border border-emerald-300/40 dark:border-emerald-500/30">
          <Coffee className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {t.donation.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {t.donation.body}
        </p>

        <a
          href={DONATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-sm"
        >
          <Coffee className="w-4 h-4" />
          <span>{t.donation.cta}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <div className="mt-5 flex items-center justify-center space-x-1 text-[11px] text-slate-400">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>{t.donation.thanks}</span>
        </div>
      </div>
    </div>
  );
};
