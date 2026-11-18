import React from 'react';
import { X, Coffee, Heart, ExternalLink } from 'lucide-react';
import { DONATION_URL } from '../constants/links';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div role="dialog" aria-modal="true" aria-label="커피 후원" className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center">
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#A8FF1A] flex items-center justify-center mx-auto mb-4 border border-emerald-300/40 dark:border-emerald-500/30">
          <Coffee className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          개발자에게 커피 한 잔 선물하기 ☕
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          1on1 Compass는 1인 인디 크리에이터가 정성껏 만들고 있습니다. 
          따뜻한 커피 후원은 서버 운영과 기능 개발에 큰 힘이 됩니다!
        </p>

        <a
          href={DONATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-sm"
        >
          <Coffee className="w-4 h-4" />
          <span>Ko-fi로 커피 후원하기</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <div className="mt-5 flex items-center justify-center space-x-1 text-[11px] text-slate-400">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>보내주시는 응원에 진심으로 감사드립니다.</span>
        </div>
      </div>
    </div>
  );
};
