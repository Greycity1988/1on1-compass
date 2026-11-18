import React, { useState } from 'react';
import { X, KeyRound, Check, ShieldCheck, AlertCircle } from 'lucide-react';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Resolves to an error message, or null when the password was changed. */
  onChangePin: (current: string, next: string) => Promise<string | null>;
}

const MIN_LENGTH = 8;

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  onChangePin,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const next = newPin.trim();
    if (next.length < MIN_LENGTH) {
      setError(`새 비밀번호는 최소 ${MIN_LENGTH}자 이상이어야 합니다.`);
      return;
    }
    if (next !== confirmPin.trim()) {
      setError('새 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
      return;
    }

    setIsSaving(true);
    const message = await onChangePin(currentPin, next);
    setIsSaving(false);
    if (message) {
      setError(message);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-left">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              비밀번호가 성공적으로 변경되었습니다!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              다른 기기의 로그인은 모두 해제되었습니다. 새 비밀번호로 다시 로그인해 주세요.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-[#A8FF1A]">
                <KeyRound className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  보안 설정
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                리더 관리자 비밀번호 변경
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                영문, 숫자, 기호를 섞어 8자 이상으로 입력하세요.
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                현재 비밀번호
              </label>
              <input
                required
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="현재 비밀번호"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                새 비밀번호
              </label>
              <input
                required
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="새로운 비밀번호 (8자 이상)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                새 비밀번호 확인
              </label>
              <input
                required
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="새 비밀번호 다시 입력"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold rounded-xl disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>비밀번호 저장</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
