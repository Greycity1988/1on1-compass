import React, { useState } from 'react';
import { X, UserPlus, Copy, Check, Sparkles } from 'lucide-react';
import { TeamMember } from '../types';
import { getDisc } from '../data/disc';
import { useLang } from '../i18n/lang';
import { generateSecureToken } from '../utils/storage';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: TeamMember) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const { lang, t } = useLang();
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [presetDisc, setPresetDisc] = useState<string>('none');
  const [createdMember, setCreatedMember] = useState<TeamMember | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const token = generateSecureToken();
    const id = `mem_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

    let discResult = undefined;
    if (presetDisc !== 'none' && (presetDisc === 'D' || presetDisc === 'I' || presetDisc === 'S' || presetDisc === 'C')) {
      discResult = {
        primary: presetDisc as 'D' | 'I' | 'S' | 'C',
        code: presetDisc,
        patternName: getDisc(lang).factors[presetDisc as 'D' | 'I' | 'S' | 'C'].name,
        source: 'manual' as const,
      };
    }

    const newMember: TeamMember = {
      id,
      token,
      name: name.trim(),
      department: department.trim(),
      role: role.trim(),
      status: 'pending',
      discResult,
      answers: {},
      actionItems: [],
    };

    onAdd(newMember);
    setCreatedMember(newMember);
  };

  const getPrivateUrl = (token: string) => {
    return `${window.location.origin}${window.location.pathname}?token=${token}`;
  };

  const handleCopyLink = () => {
    if (!createdMember) return;
    const url = getPrivateUrl(createdMember.token);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseAndReset = () => {
    setName('');
    setCreatedMember(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-left">
        <button
          onClick={handleCloseAndReset}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {createdMember ? (
          <div className="py-2 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#A8FF1A] flex items-center justify-center mx-auto mb-2 border border-emerald-300/40 dark:border-emerald-500/30">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.addMember.createdTitle(createdMember.name)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t.addMember.createdBody}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 block">
                {t.addMember.urlLabel}
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={getPrivateUrl(createdMember.token)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 flex-shrink-0 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.common.copied : t.common.copy}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition"
              >
                {t.addMember.backToDashboard}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-[#A8FF1A]">
                  {t.addMember.eyebrow}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {t.addMember.title}
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.addMember.name} <span className="text-emerald-500">*</span>
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.addMember.namePlaceholder}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.addMember.department}
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={t.addMember.departmentPlaceholder}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.addMember.role}
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={t.addMember.rolePlaceholder}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.addMember.discPreset}
              </label>
              <select
                value={presetDisc}
                onChange={(e) => setPresetDisc(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="none">{t.addMember.discNone}</option>
                {(['D', 'I', 'S', 'C'] as const).map((k) => (
                  <option key={k} value={k}>
                    {k} - {getDisc(lang).factors[k].name} ({getDisc(lang).factors[k].eng} · {t.addMember.discOption[k]})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                {t.addMember.discHint}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t.addMember.submit}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
