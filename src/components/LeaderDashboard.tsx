import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Settings,
  Sparkles,
  Search,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  LogOut,
  Brain,
  Trash2,
  KeyRound,
} from 'lucide-react';
import { LeaderConfig, SurveyQuestion, TeamMember } from '../types';
import { CompassLogo } from './CompassLogo';
import { SuiteFooter } from './SuiteFooter';
import { AddMemberModal } from './AddMemberModal';
import { QuestionSettingsModal } from './QuestionSettingsModal';
import { DiscTestModal } from './DiscTestModal';
import { MemberDetailModal } from './MemberDetailModal';
import { FeedbackModal } from './FeedbackModal';
import { DonationModal } from './DonationModal';
import { ChangePinModal } from './ChangePinModal';

interface LeaderDashboardProps {
  config: LeaderConfig;
  members: TeamMember[];
  onUpdateConfig: (config: LeaderConfig) => void;
  onUpsertMember: (member: TeamMember) => void;
  onDeleteMember: (id: string) => void;
  onChangePin: (current: string, next: string) => Promise<string | null>;
  onLogout: () => void;
  onPreviewMember: (member: TeamMember) => void;
}

export const LeaderDashboard: React.FC<LeaderDashboardProps> = ({
  config,
  members,
  onUpdateConfig,
  onUpsertMember,
  onDeleteMember,
  onChangePin,
  onLogout,
  onPreviewMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'pending' | 'completed'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isDiscTestOpen, setIsDiscTestOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'submitted') return m.status === 'submitted';
    if (statusFilter === 'pending') return m.status === 'pending';
    if (statusFilter === 'completed') return m.status === 'completed';
    return true;
  });

  const submittedCount = members.filter((m) => m.status === 'submitted' || m.status === 'interviewing').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;
  const completedCount = members.filter((m) => m.status === 'completed').length;

  const handleAddMember = (newMem: TeamMember) => {
    onUpsertMember(newMem);
  };

  const handleUpdateSingleMember = (updated: TeamMember) => {
    onUpsertMember(updated);
    setSelectedMember(updated);
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`'${name}' 구성원을 삭제하시겠습니까? 관련 답변과 면담 기록이 모두 삭제됩니다.`)) {
      onDeleteMember(id);
      if (selectedMember?.id === id) {
        setSelectedMember(null);
      }
    }
  };

  const handleSaveQuestions = (questions: SurveyQuestion[], team: { leaderName: string; teamTitle: string }) => {
    onUpdateConfig({
      ...config,
      ...team,
      surveyQuestions: questions,
    });
  };

  const handleCopyLink = (token: string, memberId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(memberId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDiscBadgeColor = (p?: string) => {
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
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1013] text-slate-900 dark:text-[#f3f4f6] flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141416] py-3.5 px-4 sm:px-8 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <CompassLogo size={36} showText={true} />

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsDiscTestOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 transition"
              title="15문항 DISC 정밀 진단 검사기"
            >
              <Brain className="w-3.5 h-3.5 text-emerald-600 dark:text-[#A8FF1A]" />
              <span className="hidden sm:inline">DISC 자가진단</span>
            </button>

            <button
              type="button"
              onClick={() => setIsQuestionsOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>질문지 설정 ({config.surveyQuestions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsChangePinOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 transition"
              title="리더 관리자 비밀번호 변경"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-[#A8FF1A]" />
              <span>비밀번호 변경</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>팀원 추가 &amp; 링크</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="리더 세션 로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Banner Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900/10 via-slate-900/5 to-transparent border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#18191d] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-[#A8FF1A]">
                Leader Management Console
              </span>
              {config.teamTitle && <span className="text-xs text-slate-400">• {config.teamTitle}</span>}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              성과 평가 &amp; DISC 맞춤 1:1 면담 대시보드
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              팀원에게 개별 전용 링크를 보내 비공개 답변을 받고, DISC 성향과 답변 내용을 결합한 
              <strong> 날카롭고 따뜻한 1:1 면담 질문지</strong>를 AI 코파일럿으로 즉시 추출하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-extrabold flex items-center justify-center space-x-2 transition shadow-md flex-shrink-0"
          >
            <UserPlus className="w-4 h-4 text-emerald-500 dark:text-emerald-600" />
            <span>새 팀원 등록 및 링크 발급</span>
          </button>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md'
                : 'bg-white dark:bg-[#18191d] border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
              전체 구성원
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black">{members.length}</span>
              <Users className="w-4 h-4 opacity-50" />
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('submitted')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'submitted'
                ? 'bg-emerald-600 text-white border-transparent shadow-md'
                : 'bg-white dark:bg-[#18191d] border-slate-200 dark:border-slate-800 hover:border-emerald-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
              답변 제출 완료
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black">{submittedCount}</span>
              <Sparkles className="w-4 h-4 opacity-70" />
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('pending')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white border-transparent shadow-md'
                : 'bg-white dark:bg-[#18191d] border-slate-200 dark:border-slate-800 hover:border-amber-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
              작성 대기 중
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black">{pendingCount}</span>
              <span className="text-[11px] opacity-70">링크 전달됨</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('completed')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-indigo-600 text-white border-transparent shadow-md'
                : 'bg-white dark:bg-[#18191d] border-slate-200 dark:border-slate-800 hover:border-indigo-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
              면담 &amp; 평가 완료
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black">{completedCount}</span>
              <span className="text-[11px] opacity-70">기록 완료</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 부서, 직무 검색..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18191d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs w-full sm:w-auto justify-end">
            <span className="text-slate-400 text-[11px]">필터:</span>
            {(['all', 'submitted', 'pending', 'completed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition text-[11px] ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-[#18191d] text-slate-500 hover:text-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {st === 'all'
                  ? '전체보기'
                  : st === 'submitted'
                  ? '답변 완료'
                  : st === 'pending'
                  ? '작성 대기'
                  : '면담 완료'}
              </button>
            ))}
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => {
            const hasSubmitted = m.status === 'submitted' || m.status === 'completed' || m.status === 'interviewing';
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18191d] p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Name & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                        {m.name.slice(0, 1)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <span>{m.name}</span>
                          {m.evaluationGrade && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                              {m.evaluationGrade}
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {m.department} • {m.role}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMember(m.id, m.name)}
                      className="p-1 text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 transition"
                      title="팀원 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status & DISC Pills */}
                  <div className="flex items-center space-x-2 mt-3 text-xs">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getDiscBadgeColor(
                        m.discResult?.primary
                      )}`}
                    >
                      {m.discResult
                        ? `[${m.discResult.code}] ${m.discResult.patternName}`
                        : 'DISC 미입력'}
                    </span>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        m.status === 'completed'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : m.status === 'submitted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#A8FF1A]'
                          : m.status === 'interviewing'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {m.status === 'completed'
                        ? '면담 완료'
                        : m.status === 'submitted'
                        ? '답변 완료'
                        : m.status === 'interviewing'
                        ? '면담 진행'
                        : '작성 대기'}
                    </span>
                  </div>

                  {/* Preview Snippet */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      핵심 성과 요약 (Q1)
                    </span>
                    <p className="line-clamp-2 leading-relaxed text-[11px]">
                      {m.answers['q1'] || '아직 답변이 제출되지 않았습니다.'}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(m.token, m.id)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold flex items-center space-x-1 transition"
                    title="전용 프라이빗 제출 링크 복사"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === m.id ? '복사됨!' : '링크 복사'}</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onPreviewMember(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="구성원 화면으로 열기"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMember(m)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-[11px] flex items-center space-x-1 transition shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{hasSubmitted ? 'AI 면담 가이드' : '상세 보기'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-semibold">해당 조건의 팀원이 없습니다.</p>
            <p className="text-xs">우측 상단 '팀원 추가 &amp; 링크' 버튼을 눌러 팀원을 등록해 보세요.</p>
          </div>
        )}
      </main>

      {/* Shared Suite Footer */}
      <SuiteFooter
        appName="1on1 Compass • Systematic Performance &amp; DISC Copilot"
        emblem={<CompassLogo size={36} showText={false} />}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenDonation={() => setIsDonationOpen(true)}
      />

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddMember}
      />

      <QuestionSettingsModal
        isOpen={isQuestionsOpen}
        questions={config.surveyQuestions}
        leaderName={config.leaderName}
        teamTitle={config.teamTitle}
        onClose={() => setIsQuestionsOpen(false)}
        onSave={handleSaveQuestions}
      />

      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        onChangePin={onChangePin}
      />

      <DiscTestModal
        isOpen={isDiscTestOpen}
        onClose={() => setIsDiscTestOpen(false)}
        onComplete={(res) => {
          alert(`자가진단 완료!\n당신의 유형: [${res.code}] ${res.patternName}`);
        }}
      />

      <MemberDetailModal
        isOpen={Boolean(selectedMember)}
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onUpdateMember={handleUpdateSingleMember}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
      />
    </div>
  );
};
