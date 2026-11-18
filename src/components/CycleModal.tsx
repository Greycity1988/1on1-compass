import React, { useEffect, useState } from 'react';
import { X, CalendarPlus, Settings2 } from 'lucide-react';
import { InterviewCycle } from '../types';
import { useLang } from '../i18n/lang';

interface CycleModalProps {
  isOpen: boolean;
  /** 'create' starts a new round; 'edit' renames or closes the given one. */
  mode: 'create' | 'edit';
  cycle: InterviewCycle;
  /** Name offered for a new round. */
  suggestedName: string;
  /** Members in the current round (offered to bring over to a new one). */
  memberCount: number;
  onClose: () => void;
  onCreate: (name: string, copyMembers: boolean, copyQuestions: boolean) => void;
  onSave: (cycle: InterviewCycle) => void;
}

const inputCls =
  'mt-1 w-full px-3 py-2 text-xs font-normal rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

export const CycleModal: React.FC<CycleModalProps> = ({
  isOpen,
  mode,
  cycle,
  suggestedName,
  memberCount,
  onClose,
  onCreate,
  onSave,
}) => {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [copyMembers, setCopyMembers] = useState(true);
  const [copyQuestions, setCopyQuestions] = useState(true);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(mode === 'create' ? suggestedName : cycle.name);
    setClosed(cycle.closed);
    setCopyMembers(memberCount > 0);
    setCopyQuestions(true);
    setError(null);
  }, [isOpen, mode, cycle, suggestedName, memberCount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.cycles.nameRequired);
      return;
    }
    if (mode === 'create') onCreate(trimmed, copyMembers, copyQuestions);
    else onSave({ ...cycle, name: trimmed, closed });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? t.cycles.createTitle : t.cycles.editTitle}
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-left"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-[#A8FF1A]">
            {mode === 'create' ? <CalendarPlus className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {mode === 'create' ? t.cycles.createTitle : t.cycles.editTitle}
            </h3>
          </div>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.cycles.name}
            <input
              value={name}
              maxLength={60}
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={t.cycles.namePlaceholder}
              className={inputCls}
            />
          </label>
          {error && <p className="text-[11px] text-rose-500 font-semibold">{error}</p>}

          {mode === 'create' ? (
            <div className="space-y-2.5">
              {memberCount > 0 && (
                <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={copyMembers}
                    onChange={(e) => setCopyMembers(e.target.checked)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <span>{t.cycles.copyMembers(memberCount)}</span>
                </label>
              )}
              <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={copyQuestions}
                  onChange={(e) => setCopyQuestions(e.target.checked)}
                  className="mt-0.5 accent-emerald-600"
                />
                <span>{t.cycles.copyQuestions}</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{t.cycles.createHint}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={closed}
                  onChange={(e) => setClosed(e.target.checked)}
                  className="mt-0.5 accent-emerald-600"
                />
                <span>{t.cycles.closed}</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-5">{t.cycles.closedHint}</p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
            >
              {mode === 'create' ? t.cycles.create : t.cycles.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
