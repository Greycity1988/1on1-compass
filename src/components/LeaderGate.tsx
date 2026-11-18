import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { CompassLogo } from './CompassLogo';

export type LoginResult = { ok: true } | { ok: false; message: string };

interface LeaderGateProps {
  onLogin: (pin: string) => Promise<LoginResult>;
  /** Shown as a hint only in local demo mode while the demo password is unchanged. */
  demoPin?: string;
  /** Server mode with no password configured yet. */
  setupRequired?: boolean;
}

export const LeaderGate: React.FC<LeaderGateProps> = ({ onLogin, demoPin, setupRequired }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || isVerifying) return;
    setIsVerifying(true);
    const result = await onLogin(pin);
    setIsVerifying(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1013] flex flex-col items-center justify-center p-4 selection:bg-emerald-500/20">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-center space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <CompassLogo size={48} showText={false} />
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            1on1 <span className="text-emerald-600 dark:text-[#A8FF1A]">Compass</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            성과 평가 &amp; DISC 맞춤 면담 코파일럿
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#A8FF1A] flex-shrink-0" />
          <span className="text-left leading-tight">
            구성원 평가 및 답변 보호를 위해 리더 비밀번호 인증이 필요합니다.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                placeholder="리더 비밀번호 입력"
                aria-label="리더 비밀번호"
                maxLength={64}
                autoFocus
                className={`w-full pl-10 pr-4 py-3 text-center text-sm font-bold tracking-widest rounded-2xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                  error
                    ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-600'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            {error && (
              <span className="text-[11px] text-rose-500 font-semibold block mt-1.5">
                {error}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying || setupRequired}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md"
          >
            <Lock className="w-4 h-4" />
            <span>{isVerifying ? '인증 확인 중...' : '리더 대시보드 로그인'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {setupRequired && (
          <p role="alert" className="text-[11px] text-rose-500 leading-relaxed">
            아직 리더 비밀번호가 설정되지 않았습니다. 배포 환경 변수에 LEADER_PIN을 추가한 뒤 다시 배포해 주세요.
          </p>
        )}

        {demoPin && (
          <p className="text-[11px] text-slate-400">
            데모 비밀번호: <strong className="text-slate-700 dark:text-slate-300 font-mono">{demoPin}</strong>
          </p>
        )}
      </div>
    </div>
  );
};
