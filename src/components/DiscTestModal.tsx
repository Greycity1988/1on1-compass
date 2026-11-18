import React, { useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';
import { DISC_QUESTIONS, calculateDiscScores, determineDiscType } from '../data/discData';
import { DiscSubmissionResult } from '../types';

interface DiscTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: DiscSubmissionResult) => void;
}

export const DiscTestModal: React.FC<DiscTestModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  // answers: array of 15 arrays, each containing selected choice indices in order [first, second, third, fourth]
  const [answers, setAnswers] = useState<number[][]>(() =>
    Array(DISC_QUESTIONS.length).fill(null).map(() => [])
  );

  if (!isOpen) return null;

  const currentQ = DISC_QUESTIONS[currentIdx];
  const currentAns = answers[currentIdx];

  const handlePick = (choiceIdx: number) => {
    const existingRank = currentAns.indexOf(choiceIdx);
    if (existingRank >= 0) {
      // remove from that rank onwards
      const nextAns = currentAns.slice(0, existingRank);
      updateCurrentAns(nextAns);
    } else {
      if (currentAns.length < 4) {
        const nextAns = [...currentAns, choiceIdx];
        updateCurrentAns(nextAns);
        // if completed 4 choices and not last question, auto advance after 350ms
        if (nextAns.length === 4 && currentIdx < DISC_QUESTIONS.length - 1) {
          setTimeout(() => {
            setCurrentIdx((prev) => prev + 1);
          }, 350);
        }
      }
    }
  };

  const updateCurrentAns = (newAns: number[]) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentIdx] = newAns;
      return copy;
    });
  };

  const handleResetCurrent = () => {
    updateCurrentAns([]);
  };

  const handleFinish = () => {
    const scores = calculateDiscScores(answers);
    const typed = determineDiscType(scores);
    onComplete({
      primary: typed.primary,
      code: typed.code,
      patternName: typed.pattern.n,
      scores,
      source: 'test',
    });
    onClose();
  };

  const answeredCount = answers.filter((a) => a.length === 4).length;
  const isAllAnswered = answeredCount === DISC_QUESTIONS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-[#A8FF1A]">
                DISC 행동유형 진단 (15문항)
              </span>
              <span className="text-xs font-medium text-slate-400">
                • {answeredCount}/15 응답 완료
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              나의 행동 특성과 의사소통 스타일 진단
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segment Progress Bar */}
        <div className="grid grid-cols-15 gap-1 my-3">
          {DISC_QUESTIONS.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`h-1.5 rounded-full cursor-pointer transition-all ${
                answers[i].length === 4
                  ? 'bg-emerald-500 dark:bg-[#A8FF1A]'
                  : i === currentIdx
                  ? 'bg-slate-400 dark:bg-slate-500 ring-2 ring-emerald-400'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
              title={`Q${i + 1}`}
            />
          ))}
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 mb-4">
            <span className="text-xs font-bold text-emerald-600 dark:text-[#A8FF1A] block mb-1">
              문항 {currentIdx + 1} / 15
            </span>
            <p className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              {currentQ.q}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {currentAns.length === 0
                ? '가장 나다운 문장부터 순서대로 클릭하세요 (먼저 누른 항목이 4점)'
                : currentAns.length < 4
                ? `${currentAns.length + 1}순위를 골라주세요`
                : '순위를 모두 정했습니다. 다음 문항으로 이동하세요.'}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.o.map((optionText, optIdx) => {
              const rankIdx = currentAns.indexOf(optIdx);
              const isSelected = rankIdx >= 0;
              const points = 4 - rankIdx;

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handlePick(optIdx)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-3 pr-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white dark:bg-[#A8FF1A] dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isSelected ? rankIdx + 1 : ''}
                    </span>
                    <span className="text-xs sm:text-sm font-medium leading-relaxed">
                      {optionText}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-[#A8FF1A] flex-shrink-0 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60">
                      {rankIdx + 1}순위 ({points}점)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>이전</span>
            </button>
            {currentAns.length > 0 && (
              <button
                type="button"
                onClick={handleResetCurrent}
                className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs flex items-center space-x-1"
                title="이 문항 순위 초기화"
              >
                <RotateCcw className="w-3 h-3" />
                <span>다시 고르기</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {currentIdx < DISC_QUESTIONS.length - 1 ? (
              <button
                type="button"
                disabled={currentAns.length < 4}
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center space-x-1 disabled:opacity-40 shadow-sm"
              >
                <span>다음 문항</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!isAllAnswered}
                onClick={handleFinish}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 disabled:opacity-40 shadow-md transition"
              >
                <Check className="w-4 h-4" />
                <span>진단 완료 및 유형 반영</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
