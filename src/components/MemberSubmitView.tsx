import React, { useState } from 'react';
import {
  Lock,
  Sparkles,
  CheckCircle2,
  FileCheck,
  Send,
} from 'lucide-react';
import { DiscSubmissionResult, LeaderConfig, TeamMember } from '../types';
import { discLabel, getDisc } from '../data/disc';
import { useLang } from '../i18n/lang';
import { LangToggle } from './LangToggle';
import { DiscTestModal } from './DiscTestModal';
import { CompassLogo } from './CompassLogo';

interface MemberSubmitViewProps {
  member: TeamMember;
  leaderConfig: LeaderConfig;
  /** Saves the answers; resolves to false when saving failed (the caller shows why). */
  onSubmit: (answers: Record<string, string>, discResult?: DiscSubmissionResult) => Promise<boolean>;
  onExit?: () => void;
  /** Name of the review round this survey belongs to. */
  cycleName?: string;
  /** Closed rounds accept no submissions. */
  cycleClosed?: boolean;
}

export const MemberSubmitView: React.FC<MemberSubmitViewProps> = ({
  member,
  leaderConfig,
  onSubmit,
  onExit,
  cycleName,
  cycleClosed = false,
}) => {
  const { lang, t } = useLang();
  const [answers, setAnswers] = useState<Record<string, string>>(member.answers || {});
  const [discResult, setDiscResult] = useState<DiscSubmissionResult | undefined>(member.discResult);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  // Once the interview has started the answers are final (the server refuses changes).
  // A closed round where this member never answered: show only the closed notice.
  const closedUnanswered = cycleClosed && !member.submittedAt;
  const isLocked = cycleClosed || member.status === 'interviewing' || member.status === 'completed';
  const [isSubmitted, setIsSubmitted] = useState(member.status === 'submitted' || isLocked);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const leaderLabel = t.member.leaderLabel(leaderConfig.leaderName);

  const questions = leaderConfig.surveyQuestions;

  const handleAnswerChange = (qid: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: val,
    }));
  };

  const handleDirectDiscSelect = (type: 'D' | 'I' | 'S' | 'C') => {
    const factor = getDisc(lang).factors[type];
    setDiscResult({
      primary: type,
      code: type,
      patternName: factor.name,
      source: 'manual',
    });
  };

  const handleCompleteTest = (result: DiscSubmissionResult) => {
    setDiscResult(result);
  };

  const handleDoSubmit = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const ok = await onSubmit(answers, discResult);
    setIsSaving(false);
    setConfirmSubmitOpen(false);
    if (ok) setIsSubmitted(true);
  };

  const requiredQuestions = questions.filter((q) => q.required);
  const isAllRequiredAnswered = requiredQuestions.every(
    (q) => answers[q.id] && answers[q.id].trim().length > 5
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1013] text-slate-900 dark:text-[#f3f4f6] flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141416] py-3.5 px-4 sm:px-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <CompassLogo size={32} showText={true} />

          <div className="flex items-center space-x-2">
            <LangToggle />
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#A8FF1A] text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60">
              <Lock className="w-3.5 h-3.5" />
              <span>{t.member.secureMode}</span>
            </div>
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
              >
                {t.member.adminView}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {isSubmitted ? (
          <div className="my-12 p-8 rounded-3xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#A8FF1A] flex items-center justify-center mx-auto mb-2 border border-emerald-300/40 dark:border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {closedUnanswered ? t.member.cycleClosed : t.member.doneTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {closedUnanswered ? null : t.member.doneBody(member.name, leaderLabel)}
            </p>

            {isLocked ? (
              closedUnanswered ? null : (
                <p className="pt-2 text-[11px] text-slate-400">{cycleClosed ? t.member.cycleClosed : t.member.locked}</p>
              )
            ) : (
            <div className="pt-4 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {t.member.edit}
              </button>
            </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Header Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-[#A8FF1A]">
                  {cycleName || t.member.eyebrow(new Date().getFullYear())}
                </span>
                <span className="text-xs text-slate-400">{t.member.eyebrowNote}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {t.member.hello(member.name)}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {t.member.intro}
              </p>

              {/* Confidentiality Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 flex items-start space-x-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-[#A8FF1A] flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">{t.member.privacyStrong}</span> {t.member.privacyBefore}
                  <strong className="font-extrabold text-emerald-800 dark:text-[#A8FF1A]">{leaderLabel}</strong>
                  {t.member.privacyAfter}
                </div>
              </div>
            </div>

            {/* Step 1: DISC Section */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-[#A8FF1A]">
                    STEP 1
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {t.member.discTitle}
                  </h3>
                </div>
                {discResult && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#A8FF1A] font-bold border border-emerald-300/40 dark:border-emerald-700/60">
                    {t.member.discSelected} [{discResult.code}] {discLabel(discResult, lang)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.member.discIntro(member.name)}
              </p>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    type: 'D' as const,
                    ...t.member.discCards.D,
                    color: 'hover:border-rose-400',
                  },
                  {
                    type: 'I' as const,
                    ...t.member.discCards.I,
                    color: 'hover:border-amber-400',
                  },
                  {
                    type: 'S' as const,
                    ...t.member.discCards.S,
                    color: 'hover:border-emerald-400',
                  },
                  {
                    type: 'C' as const,
                    ...t.member.discCards.C,
                    color: 'hover:border-sky-400',
                  },
                ].map((item) => {
                  const isSelected = discResult?.primary === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleDirectDiscSelect(item.type)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm ring-2 ring-emerald-500/20'
                          : `border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 ${item.color}`
                      }`}
                    >
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Take test button if unknown */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 text-[11px]">
                  {t.member.discUnsure}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-[#A8FF1A]" />
                  <span>{t.member.discTestCta}</span>
                </button>
              </div>
            </div>

            {/* Step 2: Survey Questions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-[#A8FF1A]">
                  STEP 2
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.member.questionsTitle(questions.length)}
                </h3>
              </div>

              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-6 rounded-3xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{q.title}</span>
                    </h4>
                    {q.required ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 font-bold">
                        {t.common.required}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-medium">
                        {t.common.optional}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {q.question}
                  </p>

                  <textarea
                    rows={4}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full p-3.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed resize-none"
                  />

                  <div className="flex justify-end text-[11px] text-slate-400">
                    <span>{t.member.charCount((answers[q.id] || '').length)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Action Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {!isAllRequiredAnswered ? (
                  <span className="text-rose-500 font-medium">
                    {t.member.needRequired}
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-[#A8FF1A] font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.member.allRequired}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={!isAllRequiredAnswered}
                onClick={() => setConfirmSubmitOpen(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>{t.member.submit}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4">
            <FileCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.member.confirmTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.member.confirmBody(leaderLabel)}
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="flex-1 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleDoSubmit}
                disabled={isSaving}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm"
              >
                {isSaving ? t.member.submitting : t.member.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15-question DISC Test Modal */}
      <DiscTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onComplete={handleCompleteTest}
      />
    </div>
  );
};
