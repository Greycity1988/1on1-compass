import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  FileText,
  Brain,
  MessageSquare,
  CheckCircle2,
  Copy,
  Printer,
  ChevronRight,
  ShieldAlert,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Plus,
  Trash2,
} from 'lucide-react';
import { AiInterviewGuide, TeamMember } from '../types';
import { PRIMARY_FACTORS, COMBINATION_PATTERNS } from '../data/discData';
import { formatDateTime } from '../utils/storage';
import { generateAiInterviewGuide } from '../utils/aiGenerator';

interface MemberDetailModalProps {
  isOpen: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onUpdateMember: (updated: TeamMember) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  member,
  onClose,
  onUpdateMember,
}) => {
  const [activeTab, setActiveTab] = useState<'copilot' | 'answers' | 'disc' | 'notes'>('copilot');
  const [aiGuide, setAiGuide] = useState<AiInterviewGuide | null>(null);
  const [notes, setNotes] = useState('');
  const [grade, setGrade] = useState<'S' | 'A' | 'B' | 'C' | 'D' | ''>('');
  const [evalComment, setEvalComment] = useState('');
  const [actionItems, setActionItems] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newActionText, setNewActionText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (member) {
      setNotes(member.interviewNotes || '');
      setGrade(member.evaluationGrade || '');
      setEvalComment(member.evaluationComment || '');
      setActionItems(member.actionItems || []);
      const guide = generateAiInterviewGuide(member);
      setAiGuide(guide);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const disc = member.discResult || {
    primary: 'S' as const,
    code: 'S',
    patternName: '팀플레이어형',
    source: 'manual' as const,
  };
  const primaryFactor = PRIMARY_FACTORS[disc.primary] || PRIMARY_FACTORS['S'];
  const pattern = COMBINATION_PATTERNS[disc.code] || {
    n: disc.patternName,
    s: primaryFactor.tag,
    k: primaryFactor.kw,
    w: '상황에 따라 복합적 성향이 나타납니다.',
    t: '성향의 강점을 살려주세요.',
  };

  const handleSaveNotes = () => {
    const updated: TeamMember = {
      ...member,
      interviewNotes: notes,
      evaluationGrade: grade,
      evaluationComment: evalComment,
      actionItems,
      status: member.status === 'pending' ? 'submitted' : member.status,
    };
    onUpdateMember(updated);
  };

  const handleStatusChange = (newStatus: TeamMember['status']) => {
    const updated: TeamMember = {
      ...member,
      status: newStatus,
    };
    onUpdateMember(updated);
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;
    const item = {
      id: `act_${Date.now()}`,
      text: newActionText.trim(),
      done: false,
    };
    const nextList = [...actionItems, item];
    setActionItems(nextList);
    setNewActionText('');
    onUpdateMember({ ...member, actionItems: nextList });
  };

  const handleToggleAction = (id: string) => {
    const nextList = actionItems.map((a) =>
      a.id === id ? { ...a, done: !a.done } : a
    );
    setActionItems(nextList);
    onUpdateMember({ ...member, actionItems: nextList });
  };

  const handleDeleteAction = (id: string) => {
    const nextList = actionItems.filter((a) => a.id !== id);
    setActionItems(nextList);
    onUpdateMember({ ...member, actionItems: nextList });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?token=${member.token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getDiscBadgeColor = (p: string) => {
    switch (p) {
      case 'D':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/60';
      case 'I':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60';
      case 'S':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#A8FF1A] border-emerald-300 dark:border-emerald-700/60';
      case 'C':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-700/60';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[92vh] print:h-auto print:border-none print:shadow-none">
        {/* Top Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#18191d] rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
              {member.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {member.name}
                </h2>
                <span className="text-xs text-slate-400">
                  {member.department} • {member.role}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${getDiscBadgeColor(
                    disc.primary
                  )}`}
                >
                  [{disc.code}] {pattern.n}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-[11px] text-slate-400">
                  {member.submittedAt ? `제출: ${formatDateTime(member.submittedAt)}` : '답변 대기 중'}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[11px] text-emerald-600 dark:text-[#A8FF1A] hover:underline flex items-center space-x-0.5 font-medium"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedLink ? '링크 복사됨!' : '개인 제출 링크'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons & Status selector */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 pl-2">상태:</span>
              <select
                value={member.status}
                onChange={(e) => handleStatusChange(e.target.value as TeamMember['status'])}
                className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="pending">작성 대기</option>
                <option value="submitted">답변 완료</option>
                <option value="interviewing">면담 진행중</option>
                <option value="completed">면담 완료</option>
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center space-x-1 transition"
              title="리포트 인쇄 및 PDF 저장"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">인쇄</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-xs font-semibold print:hidden">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'copilot'
                ? 'border-emerald-600 text-emerald-700 dark:border-[#A8FF1A] dark:text-[#A8FF1A]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI 맞춤 면담 가이드</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-[#A8FF1A] font-bold">
              추천
            </span>
          </button>

          <button
            onClick={() => setActiveTab('answers')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'answers'
                ? 'border-emerald-600 text-emerald-700 dark:border-[#A8FF1A] dark:text-[#A8FF1A]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>사전 답변 원문 ({Object.keys(member.answers).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('disc')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'disc'
                ? 'border-emerald-600 text-emerald-700 dark:border-[#A8FF1A] dark:text-[#A8FF1A]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>DISC 정밀 분석</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'notes'
                ? 'border-emerald-600 text-emerald-700 dark:border-[#A8FF1A] dark:text-[#A8FF1A]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>면담 기록 &amp; 평가</span>
            {grade && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold">
                {grade}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: AI 면담 가이드 & 코파일럿 */}
          {activeTab === 'copilot' && aiGuide && (
            <div className="space-y-6 animate-fade-in">
              {/* DISC Tone Callout */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30">
                <div className="flex items-center space-x-2 text-emerald-700 dark:text-[#A8FF1A] font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>{member.name} 님의 DISC 성향 맞춤 면담 가이드라인</span>
                </div>
                <div className="mt-2 grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      권장 면담 분위기
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {aiGuide.discTone.atmosphere}
                    </p>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      리더 핵심 대화 팁
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {aiGuide.discTone.keyAdvice}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Opening Script */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    오프닝 스크립트 (라포 형성 &amp; 심리적 안정감 조성)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  면담을 시작할 때 어색함을 깨고, 평가에 대한 긴장을 풀어주는 맞춤형 멘트입니다.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-[#A8FF1A] block mb-0.5">
                      [1단계] 시작 인사 및 감사
                    </span>
                    <p className="text-slate-700 dark:text-slate-200 italic font-medium">
                      {aiGuide.openingScript.lead}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-[#A8FF1A] block mb-0.5">
                      [2단계] DISC 맞춤 아이스브레이킹
                    </span>
                    <p className="text-slate-700 dark:text-slate-200 italic font-medium">
                      {aiGuide.openingScript.iceBreaker}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-[#A8FF1A] block mb-0.5">
                      [3단계] 면담 목적 정의
                    </span>
                    <p className="text-slate-700 dark:text-slate-200 italic font-medium">
                      {aiGuide.openingScript.purposeSetting}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Probing Questions (STAR) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    핵심 성과 검증 심층 질문 (STAR 기법 적용)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  작성된 성과에 대해 구체적인 역할, 기여도, 의사결정 프로세스를 파고드는 질문입니다.
                </p>

                <div className="space-y-3">
                  {aiGuide.probingQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2 text-xs"
                    >
                      <div className="font-bold text-slate-900 dark:text-white flex items-start space-x-2">
                        <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-[#A8FF1A] flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{q.question}</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-400 block font-semibold">질문 의도:</span>
                          <span className="text-slate-600 dark:text-slate-300">{q.intent}</span>
                        </div>
                        <div>
                          <span className="text-amber-600 dark:text-amber-400 block font-semibold">
                            ⚠️ 관찰 포인트:
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">{q.watchOut}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Bottleneck Coaching */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    아쉬움 &amp; 병목 코칭 (심리적 안정감 + 시스템 해결)
                  </h4>
                </div>

                <div className="space-y-3">
                  {aiGuide.bottleneckCoaching.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2 text-xs"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        주제: {b.topic}
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white leading-relaxed">
                        {b.coachingQuestion}
                      </p>
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-800/40 text-[11px] space-y-1">
                        <div>
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            💡 심리적 안정감 지지:
                          </span>{' '}
                          <span className="text-slate-700 dark:text-slate-300">
                            {b.psychologicalSafetyTip}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            🎯 후속 액션 가이드:
                          </span>{' '}
                          <span className="text-slate-700 dark:text-slate-300">
                            {b.actionGuide}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Leader Do's & Don'ts */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    리더를 위한 DISC 맞춤 피드백 화법 (Do's &amp; Don'ts)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  {disc.code} 유형이 반발하거나 위축되지 않고 동기부여를 얻는 피드백 전달 공식입니다.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                    <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-[#A8FF1A] font-bold">
                      <ThumbsUp className="w-4 h-4" />
                      <span>추천 화법 &amp; 태도 (Do)</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 pl-4 list-disc text-[11px] leading-relaxed">
                      {aiGuide.dosAndDonts.dos.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
                    <div className="flex items-center space-x-1.5 text-rose-700 dark:text-rose-400 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>피해야 할 금기어 &amp; 태도 (Don't)</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 pl-4 list-disc text-[11px] leading-relaxed">
                      {aiGuide.dosAndDonts.donts.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 5. Growth & Goals */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                    5
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    차기 목표 &amp; 성장 플랜 합의 질문
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {aiGuide.growthAndGoals.map((g, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1"
                    >
                      <p className="font-bold text-slate-900 dark:text-white">
                        {g.question}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        🎯 <span className="font-semibold">합의 포인트:</span> {g.alignmentTip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 사전 제출 답변 원문 */}
          {activeTab === 'answers' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-slate-400 font-medium">
                  {member.name} 님이 작성한 원문 그대로입니다.
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#A8FF1A] font-bold">
                  {Object.keys(member.answers).length}개 문항 응답됨
                </span>
              </div>

              {Object.keys(member.answers).length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-sm font-semibold">아직 제출된 답변이 없습니다.</p>
                  <p className="text-xs">
                    구성원에게 프라이빗 링크를 전달하여 작성을 요청해 주세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(member.answers).map(([qid, text]) => (
                    <div
                      key={qid}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-[#A8FF1A]">
                        {qid.toUpperCase()} 문항 답변
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DISC 정밀 분석 */}
          {activeTab === 'disc' && (
            <div className="space-y-5 animate-fade-in text-xs">
              {/* Type Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      행동유형 진단 결과
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      [{disc.code}] {pattern.n}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    {pattern.k.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {pattern.s}
                </p>
              </div>

              {/* Strengths vs Blindspots */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  주요 행동 특성 &amp; 강점 vs 주의점
                </h4>
                <div className="space-y-2">
                  {primaryFactor.sw.map(([strength, warning], i) => (
                    <div
                      key={i}
                      className="grid sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px]"
                    >
                      <div className="flex items-start space-x-1.5 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </div>
                      <div className="flex items-start space-x-1.5 text-rose-800 dark:text-rose-300">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <span>{warning}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motives, Stressors, and Agency Roles */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                  <span className="font-bold text-emerald-700 dark:text-[#A8FF1A] flex items-center space-x-1 text-[11px]">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>동기부여 요인</span>
                  </span>
                  <ul className="pl-4 list-disc text-slate-600 dark:text-slate-300 text-[11px] space-y-1">
                    {primaryFactor.motive.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                  <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center space-x-1 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>스트레스 요인</span>
                  </span>
                  <ul className="pl-4 list-disc text-slate-600 dark:text-slate-300 text-[11px] space-y-1">
                    {primaryFactor.stress.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                  <span className="font-bold text-sky-700 dark:text-sky-300 flex items-center space-x-1 text-[11px]">
                    <Brain className="w-3.5 h-3.5" />
                    <span>광고/마케팅 적합 롤</span>
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {primaryFactor.adRoles || '캠페인 운영 및 데이터 최적화'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 면담 기록 & 평가 */}
          {activeTab === 'notes' && (
            <div className="space-y-6 animate-fade-in text-xs">
              {/* Live Notepad */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>면담 라이브 메모</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    면담 중 오고 간 핵심 대화와 합의 사항을 실시간으로 적어두세요.
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  placeholder="예: 
- 11월 프로모션 성과 우수함, 데이터 분석 모델 개선 노력 높이 평가함
- 타 부서와의 일정 협업 가이드라인을 매주 월요일 공유하기로 약속
- 내년 상반기 대형 브랜드 제안 참여 희망 의사 확인함"
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
                />
              </div>

              {/* Action Items */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white block">
                  후속 액션 아이템 (Action Items)
                </span>

                <form onSubmit={handleAddAction} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newActionText}
                    onChange={(e) => setNewActionText(e.target.value)}
                    placeholder="면담 후 실행할 액션 아이템 추가 (예: 신규 매체 교육 자료 전달)"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>추가</span>
                  </button>
                </form>

                <div className="space-y-1.5 pt-1">
                  {actionItems.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-2 text-center">
                      등록된 후속 액션 아이템이 없습니다.
                    </p>
                  ) : (
                    actionItems.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800"
                      >
                        <label className="flex items-center space-x-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={act.done}
                            onChange={() => handleToggleAction(act.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                          />
                          <span
                            className={`text-xs ${
                              act.done
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {act.text}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteAction(act.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Final Grade and Comment */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-4">
                <span className="font-bold text-slate-900 dark:text-white block">
                  종합 평가 등급 &amp; 리더 최종 코멘트
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    평가 등급 선택
                  </label>
                  <div className="flex items-center space-x-2">
                    {(['S', 'A', 'B', 'C', 'D'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setGrade(g);
                          onUpdateMember({ ...member, evaluationGrade: g });
                        }}
                        className={`w-10 h-10 rounded-xl font-extrabold text-sm border transition ${
                          grade === g
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    리더 종합 피드백 코멘트
                  </label>
                  <textarea
                    rows={3}
                    value={evalComment}
                    onChange={(e) => setEvalComment(e.target.value)}
                    onBlur={handleSaveNotes}
                    placeholder="인사 평가표에 반영될 종합 소견을 작성하세요."
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl print:hidden">
          <span className="text-slate-400 text-[11px]">
            🔒 본 화면의 데이터는 오직 평가 리더만 열람할 수 있도록 안전하게 보호됩니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold transition shadow-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
