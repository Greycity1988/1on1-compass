import React, { useState } from 'react';
import {
  Lock,
  Sparkles,
  CheckCircle2,
  FileCheck,
  Send,
} from 'lucide-react';
import { DiscSubmissionResult, LeaderConfig, TeamMember } from '../types';
import { PRIMARY_FACTORS } from '../data/discData';
import { DiscTestModal } from './DiscTestModal';
import { CompassLogo } from './CompassLogo';

interface MemberSubmitViewProps {
  member: TeamMember;
  leaderConfig: LeaderConfig;
  /** Saves the answers; resolves to false when saving failed (the caller shows why). */
  onSubmit: (answers: Record<string, string>, discResult?: DiscSubmissionResult) => Promise<boolean>;
  onExit?: () => void;
}

export const MemberSubmitView: React.FC<MemberSubmitViewProps> = ({
  member,
  leaderConfig,
  onSubmit,
  onExit,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>(member.answers || {});
  const [discResult, setDiscResult] = useState<DiscSubmissionResult | undefined>(member.discResult);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  // Once the interview has started the answers are final (the server refuses changes).
  const isLocked = member.status === 'interviewing' || member.status === 'completed';
  const [isSubmitted, setIsSubmitted] = useState(member.status === 'submitted' || isLocked);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const leaderLabel = leaderConfig.leaderName ? `담당 리더(${leaderConfig.leaderName})` : '담당 리더';

  const questions = leaderConfig.surveyQuestions;

  const handleAnswerChange = (qid: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: val,
    }));
  };

  const handleDirectDiscSelect = (type: 'D' | 'I' | 'S' | 'C') => {
    const factor = PRIMARY_FACTORS[type];
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
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#A8FF1A] text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60">
              <Lock className="w-3.5 h-3.5" />
              <span>비공개 보안 모드</span>
            </div>
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
              >
                관리자 화면
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
              소중한 답변이 안전하게 제출되었습니다!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {member.name} 님의 사전 답변은 {leaderLabel}에게만 안전하게 전달되었습니다. 
              작성해 주신 내용을 바탕으로 편안하고 건설적인 1:1 면담을 준비하겠습니다.
            </p>

            {isLocked ? (
              <p className="pt-2 text-[11px] text-slate-400">면담이 시작되어 답변은 더 이상 수정할 수 없습니다.</p>
            ) : (
            <div className="pt-4 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                작성한 내용 다시 확인 및 수정
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
                  2026 성과 리뷰 &amp; 성장 1:1 면담
                </span>
                <span className="text-xs text-slate-400">• 사전 질문지</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                안녕하세요, {member.name} 님!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                올 한 해 동안 팀과 함께 치열하게 만들어낸 성과와 배움, 그리고 앞으로의 성장을 진솔하게 나누기 위한 사전 질문지입니다. 
                부담 없이 편안하고 솔직하게 작성해 주세요.
              </p>

              {/* Confidentiality Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 flex items-start space-x-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-[#A8FF1A] flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">철저한 비밀 보장:</span> 본 설문의 모든 답변 내용은 동료나 타 부서에 일체 공개되지 않으며, 
                  오직 <strong className="font-extrabold text-emerald-800 dark:text-[#A8FF1A]">{leaderLabel}</strong>만 열람하여 보다 건설적이고 편안한 1:1 면담을 준비하는 용도로만 안전하게 활용됩니다.
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
                    나의 DISC 행동유형 확인
                  </h3>
                </div>
                {discResult && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#A8FF1A] font-bold border border-emerald-300/40 dark:border-emerald-700/60">
                    선택됨: [{discResult.code}] {discResult.patternName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                본인의 업무 스타일과 소통 방식을 알려주시면, 담당 리더가 {member.name} 님에게 가장 편안한 맞춤 대화 방식으로 면담을 준비합니다.
              </p>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    type: 'D' as const,
                    name: 'D 주도형',
                    desc: '빠른 결정 · 성과 & 도전 지향',
                    color: 'hover:border-rose-400',
                  },
                  {
                    type: 'I' as const,
                    name: 'I 사교형',
                    desc: '열정 · 사람 중심 & 분위기 메이커',
                    color: 'hover:border-amber-400',
                  },
                  {
                    type: 'S' as const,
                    name: 'S 안정형',
                    desc: '꾸준함 · 배려 & 팀 지원',
                    color: 'hover:border-emerald-400',
                  },
                  {
                    type: 'C' as const,
                    name: 'C 신중형',
                    desc: '분석 · 정확성 & 품질 기준',
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
                  내 유형을 잘 모르시나요? 약 3~5분이면 진단할 수 있습니다.
                </span>
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-[#A8FF1A]" />
                  <span>간이 15문항 정밀 진단하기</span>
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
                  사전 면담 질문지 작성 ({questions.length}문항)
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
                        필수
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-medium">
                        선택
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
                    <span>{(answers[q.id] || '').length}자 입력됨</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Action Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {!isAllRequiredAnswered ? (
                  <span className="text-rose-500 font-medium">
                    * 필수 항목을 작성해 주시면 제출 버튼이 활성화됩니다.
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-[#A8FF1A] font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>모든 필수 문항이 작성되었습니다. 제출하실 수 있습니다.</span>
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
                <span>답변 비공개 제출하기</span>
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
              답변을 최종 제출하시겠습니까?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              제출된 답변은 {leaderLabel}에게 비공개로 전달되며, 면담이 시작되기 전까지는 이 링크에서 다시 수정하실 수 있습니다.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="flex-1 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDoSubmit}
                disabled={isSaving}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm"
              >
                {isSaving ? '제출하는 중...' : '확인 및 제출'}
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
