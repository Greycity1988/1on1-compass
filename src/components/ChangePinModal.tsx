import React, { useState } from 'react';
import { X, KeyRound, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLang } from '../i18n/lang';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Resolves to an error message, or null when the password was changed. */
  onChangePin: (current: string, next: string) => Promise<string | null>;
  /** Demo mode: explain that the password can't be changed instead of showing the form. */
  isDemo?: boolean;
}

const MIN_LENGTH = 8;

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  onChangePin,
  isDemo = false,
}) => {
  const { t } = useLang();
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
      setError(t.pin.tooShort(MIN_LENGTH));
      return;
    }
    if (next !== confirmPin.trim()) {
      setError(t.pin.mismatch);
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

        {isDemo ? (
          <div className="py-6 text-center space-y-3">
            <KeyRound className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.pin.demoDisabledTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.pin.demoDisabledBody}</p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900"
            >
              {t.common.close}
            </button>
          </div>
        ) : success ? (
          <div className="py-8 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.pin.doneTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.pin.doneBody}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-[#A8FF1A]">
                <KeyRound className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t.pin.eyebrow}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {t.pin.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {t.pin.hint}
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
                {t.pin.current}
              </label>
              <input
                required
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder={t.pin.current}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.pin.next}
              </label>
              <input
                required
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder={t.pin.nextPlaceholder}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.pin.confirm}
              </label>
              <input
                required
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder={t.pin.confirmPlaceholder}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold rounded-xl disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t.pin.save}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
