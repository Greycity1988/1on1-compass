import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Check, HelpCircle } from 'lucide-react';
import { SurveyQuestion } from '../types';
import { defaultQuestions } from '../utils/storage';
import { useLang } from '../i18n/lang';

interface QuestionSettingsModalProps {
  isOpen: boolean;
  questions: SurveyQuestion[];
  leaderName: string;
  teamTitle: string;
  onClose: () => void;
  onSave: (questions: SurveyQuestion[], team: { leaderName: string; teamTitle: string }) => void;
}

export const QuestionSettingsModal: React.FC<QuestionSettingsModalProps> = ({
  isOpen,
  questions,
  leaderName,
  teamTitle,
  onClose,
  onSave,
}) => {
  const { lang, t } = useLang();
  const [list, setList] = useState<SurveyQuestion[]>(questions);
  const [name, setName] = useState(leaderName);
  const [title, setTitle] = useState(teamTitle);

  // Start from the current saved settings each time the modal opens (they may have loaded from
  // the server after this component mounted).
  useEffect(() => {
    if (isOpen) {
      setList(questions);
      setName(leaderName);
      setTitle(teamTitle);
    }
  }, [isOpen, questions, leaderName, teamTitle]);

  if (!isOpen) return null;

  const handleChange = (id: string, field: keyof SurveyQuestion, value: any) => {
    setList((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleAdd = () => {
    const newId = `q_${Date.now()}`;
    const newQ: SurveyQuestion = {
      id: newId,
      title: t.settings.newQuestionTitle(list.length + 1),
      question: '',
      placeholder: t.settings.newQuestionPlaceholder,
      required: true,
      category: 'custom',
    };
    setList([...list, newQ]);
  };

  const handleDelete = (id: string) => {
    if (list.length <= 1) {
      alert(t.settings.keepOne);
      return;
    }
    setList(list.filter((q) => q.id !== id));
  };

  const handleReset = () => {
    if (confirm(t.settings.confirmReset)) {
      setList(defaultQuestions(lang));
    }
  };

  const handleSave = () => {
    onSave(list, { leaderName: name.trim(), teamTitle: title.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-[#A8FF1A]">
                {t.settings.eyebrow}
              </span>
              <span className="text-xs text-slate-400">{t.settings.count(list.length)}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {t.settings.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tip Box */}
        <div className="p-3 my-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/50 flex items-start space-x-2 text-xs text-emerald-900 dark:text-emerald-200">
          <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-[#A8FF1A] flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">{t.settings.tipStrong}</span> {t.settings.tip}
          </div>
        </div>

        {/* Team info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.settings.leaderName}
            <input
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.settings.leaderNamePlaceholder}
              className="mt-1 w-full px-3 py-2 text-xs font-normal rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.settings.teamTitle}
            <input
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.settings.teamTitlePlaceholder}
              className="mt-1 w-full px-3 py-2 text-xs font-normal rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {list.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={q.title}
                  onChange={(e) => handleChange(q.id, 'title', e.target.value)}
                  className="font-bold text-sm bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:outline-none text-slate-900 dark:text-white w-2/3 pb-0.5"
                  placeholder={t.settings.titlePlaceholder}
                />
                <div className="flex items-center space-x-2">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => handleChange(q.id, 'required', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{t.settings.requiredToggle}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDelete(q.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition"
                    title={t.settings.deleteTitle}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  {t.settings.body}
                </label>
                <textarea
                  rows={2}
                  value={q.question}
                  onChange={(e) => handleChange(q.id, 'question', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder={t.settings.bodyPlaceholder}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  {t.settings.hint}
                </label>
                <input
                  type="text"
                  value={q.placeholder}
                  onChange={(e) => handleChange(q.id, 'placeholder', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder={t.settings.hintPlaceholder}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAdd}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t.settings.add}</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center space-x-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.settings.reset}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t.common.close}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{t.settings.save}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
