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
  History,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Plus,
  Trash2,
} from 'lucide-react';
import { AiInterviewGuide, InterviewCycle, TeamMember } from '../types';
import { getDisc, patternFor } from '../data/disc';
import { useLang } from '../i18n/lang';
import { formatDateTime } from '../utils/storage';
import { generateAiInterviewGuide } from '../utils/aiGenerator';

interface MemberDetailModalProps {
  isOpen: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onUpdateMember: (updated: TeamMember) => void;
  /** The same person's records from other review rounds, newest first. */
  history?: { member: TeamMember; cycle?: InterviewCycle }[];
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  member,
  onClose,
  onUpdateMember,
  history = [],
}) => {
  const { lang, t } = useLang();
  const [activeTab, setActiveTab] = useState<'copilot' | 'answers' | 'disc' | 'notes' | 'history'>('copilot');
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
      const guide = generateAiInterviewGuide(member, lang);
      setAiGuide(guide);
    }
  }, [member, lang]);

  if (!isOpen || !member) return null;

  const disc = member.discResult || {
    primary: 'S' as const,
    code: 'S',
    patternName: getDisc(lang).factors.S.name,
    source: 'manual' as const,
  };
  const primaryFactor = getDisc(lang).factors[disc.primary] || getDisc(lang).factors.S;
  const pattern = patternFor(disc.code, disc.primary, lang);

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
                  {member.submittedAt ? t.detail.submittedAt(formatDateTime(member.submittedAt, lang)) : t.detail.waiting}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[11px] text-emerald-600 dark:text-[#A8FF1A] hover:underline flex items-center space-x-0.5 font-medium"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedLink ? t.detail.linkCopied : t.detail.personalLink}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons & Status selector */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 pl-2">{t.detail.status}</span>
              <select
                value={member.status}
                onChange={(e) => handleStatusChange(e.target.value as TeamMember['status'])}
                className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                {(['pending', 'submitted', 'interviewing', 'completed'] as const).map((st) => (
                  <option key={st} value={st}>
                    {t.status[st]}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center space-x-1 transition"
              title={t.detail.printTitle}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{t.detail.print}</span>
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
            <span>{t.detail.tabGuide}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-[#A8FF1A] font-bold">
              {t.detail.recommended}
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
            <span>{t.detail.tabAnswers(Object.keys(member.answers).length)}</span>
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
            <span>{t.detail.tabDisc}</span>
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
            <span>{t.detail.tabNotes}</span>
            {grade && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold">
                {grade}
              </span>
            )}
          </button>
          {history.length > 0 && (
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-3 sm:px-4 border-b-2 flex items-center space-x-1.5 transition ${
                activeTab === 'history'
                  ? 'border-emerald-600 text-emerald-700 dark:border-[#A8FF1A] dark:text-[#A8FF1A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{t.detail.tabHistory(history.length)}</span>
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Tab 1: interview guide */}
          {activeTab === 'copilot' && aiGuide && (
            <div className="space-y-6 animate-fade-in">
              {/* DISC Tone Callout */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30">
                <div className="flex items-center space-x-2 text-emerald-700 dark:text-[#A8FF1A] font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>{t.detail.guideTitle(member.name)}</span>
                </div>
                <div className="mt-2 grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      {t.detail.atmosphere}
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {aiGuide.discTone.atmosphere}
                    </p>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      {t.detail.keyTip}
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
                    {t.detail.openingTitle}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t.detail.openingBody}
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-[#A8FF1A] block mb-0.5">
                      {t.detail.step1}
                    </span>
                    <p className="text-slate-700 dark:text-slate-200 italic font-medium">
                      {aiGuide.openingScript.lead}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-[#A8FF1A] block mb-0.5">
                      {t.detail.step2}
                    </span>
                    <p className="text-slate-700 dark:text-slate-200 italic font-medium">
                      {aiGuide.openingScript.iceBreaker}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-[#A8FF1A] block mb-0.5">
                      {t.detail.step3}
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
                    {t.detail.probingTitle}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t.detail.probingBody}
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
                          <span className="text-slate-400 block font-semibold">{t.detail.intent}</span>
                          <span className="text-slate-600 dark:text-slate-300">{q.intent}</span>
                        </div>
                        <div>
                          <span className="text-amber-600 dark:text-amber-400 block font-semibold">
                            {t.detail.watchOut}
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
                    {t.detail.coachingTitle}
                  </h4>
                </div>

                <div className="space-y-3">
                  {aiGuide.bottleneckCoaching.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2 text-xs"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {t.detail.topic(b.topic)}
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white leading-relaxed">
                        {b.coachingQuestion}
                      </p>
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-800/40 text-[11px] space-y-1">
                        <div>
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            {t.detail.safety}
                          </span>{' '}
                          <span className="text-slate-700 dark:text-slate-300">
                            {b.psychologicalSafetyTip}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            {t.detail.actionGuide}
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
                    {t.detail.feedbackTitle}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t.detail.feedbackBody(disc.code)}
                </p>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                    <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-[#A8FF1A] font-bold">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{t.detail.dos}</span>
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
                      <span>{t.detail.donts}</span>
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
                    {t.detail.growthTitle}
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
                        🎯 <span className="font-semibold">{t.detail.alignment}</span> {g.alignmentTip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: submitted answers */}
          {activeTab === 'answers' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-slate-400 font-medium">
                  {t.detail.answersIntro(member.name)}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#A8FF1A] font-bold">
                  {t.detail.answeredCount(Object.keys(member.answers).length)}
                </span>
              </div>

              {Object.keys(member.answers).length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-sm font-semibold">{t.detail.noAnswersTitle}</p>
                  <p className="text-xs">
                    {t.detail.noAnswersBody}
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
                        {t.detail.answerHeading(qid.toUpperCase())}
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

          {/* Tab 3: DISC profile */}
          {activeTab === 'disc' && (
            <div className="space-y-5 animate-fade-in text-xs">
              {/* Type Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t.detail.discResult}
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
                  {t.detail.traits}
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
                    <span>{t.detail.motivators}</span>
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
                    <span>{t.detail.stressors}</span>
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
                    <span>{t.detail.roles}</span>
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {primaryFactor.adRoles || t.detail.rolesFallback}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: notes and review */}
          {activeTab === 'notes' && (
            <div className="space-y-6 animate-fade-in text-xs">
              {/* Live Notepad */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>{t.detail.notesTitle}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {t.detail.notesHint}
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  placeholder={t.detail.notesPlaceholder}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
                />
              </div>

              {/* Action Items */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {t.detail.actionsTitle}
                </span>

                <form onSubmit={handleAddAction} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newActionText}
                    onChange={(e) => setNewActionText(e.target.value)}
                    placeholder={t.detail.actionPlaceholder}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.detail.add}</span>
                  </button>
                </form>

                <div className="space-y-1.5 pt-1">
                  {actionItems.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-2 text-center">
                      {t.detail.noActions}
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
                  {t.detail.evalTitle}
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    {t.detail.grade}
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
                    {t.detail.comment}
                  </label>
                  <textarea
                    rows={3}
                    value={evalComment}
                    onChange={(e) => setEvalComment(e.target.value)}
                    onBlur={handleSaveNotes}
                    placeholder={t.detail.commentPlaceholder}
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: the same person's earlier rounds */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <p className="text-slate-500 dark:text-slate-400">{t.detail.historyIntro(member.name)}</p>
              {history.map(({ member: past, cycle }) => {
                const answers = Object.entries(past.answers || {}).filter(([, v]) => v.trim());
                const actions = past.actionItems || [];
                const empty = !answers.length && !past.interviewNotes && !actions.length && !past.evaluationComment;
                const titleOf = (qid: string) => cycle?.surveyQuestions.find((q) => q.id === qid)?.title || qid.toUpperCase();
                return (
                  <section key={past.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{cycle?.name ?? '—'}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {t.status[past.status]}
                      </span>
                      {past.evaluationGrade && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                          {t.detail.historyGrade} {past.evaluationGrade}
                        </span>
                      )}
                      {past.submittedAt && (
                        <span className="text-[10px] text-slate-400">{t.detail.submittedAt(formatDateTime(past.submittedAt, lang))}</span>
                      )}
                    </div>
                    {empty && <p className="text-slate-400">{t.detail.historyNothing}</p>}
                    {past.evaluationComment && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-1">{t.detail.historyComment}</p>
                        <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{past.evaluationComment}</p>
                      </div>
                    )}
                    {actions.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-1">{t.detail.historyActions}</p>
                        <ul className="space-y-1">
                          {actions.map((a) => (
                            <li key={a.id} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-200">
                              <span className={a.done ? 'text-emerald-600' : 'text-slate-400'}>{a.done ? '✓' : '○'}</span>
                              <span className={a.done ? 'line-through opacity-70' : ''}>{a.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {past.interviewNotes && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-1">{t.detail.historyNotes}</p>
                        <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{past.interviewNotes}</p>
                      </div>
                    )}
                    {answers.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer text-[11px] font-bold text-emerald-700 dark:text-[#A8FF1A]">
                          {t.detail.historyAnswers} ({answers.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {answers.map(([qid, text]) => (
                            <div key={qid} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                              <p className="text-[10px] font-bold text-slate-500 mb-0.5">{titleOf(qid)}</p>
                              <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{text}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl print:hidden">
          <span className="text-slate-400 text-[11px]">
            {t.detail.privacy}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold transition shadow-sm"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
