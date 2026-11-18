import React, { useCallback, useEffect, useState } from 'react';
import { DiscSubmissionResult, LeaderConfig, TeamMember } from './types';
import {
  deleteLocalMember,
  findMemberByToken,
  getLeaderConfig,
  getTeamMembers,
  INITIAL_LEADER_CONFIG,
  isLeaderAuthenticated,
  saveLeaderConfig,
  setLeaderAuthenticated,
  upsertLocalMember,
} from './utils/storage';
import { ApiError, Backend, cloud, describeError, detectBackend, leaderSession } from './utils/api';
import { LeaderGate, LoginResult } from './components/LeaderGate';
import { LeaderDashboard } from './components/LeaderDashboard';
import { MemberSubmitView } from './components/MemberSubmitView';
import { AlertCircle, Loader2, X } from 'lucide-react';

const FullScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-[#0f1013] flex items-center justify-center p-4">{children}</div>
);

const Loading: React.FC<{ label: string }> = ({ label }) => (
  <FullScreen>
    <div className="flex flex-col items-center space-y-3">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  </FullScreen>
);

export const App: React.FC = () => {
  const [backend, setBackend] = useState<Backend | null>(null);
  const [config, setConfig] = useState<LeaderConfig>(INITIAL_LEADER_CONFIG);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);
  const [urlToken, setUrlToken] = useState<string | null>(() => new URLSearchParams(window.location.search).get('token'));
  // undefined = still loading, null = no member for this link
  const [tokenMember, setTokenMember] = useState<TeamMember | null | undefined>(undefined);
  const [previewMember, setPreviewMember] = useState<TeamMember | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isCloud = backend?.mode === 'cloud';

  useEffect(() => {
    detectBackend().then((b) => {
      setBackend(b);
      if (b.mode === 'cloud') {
        const { pin: _pin, ...defaults } = INITIAL_LEADER_CONFIG;
        setConfig({ ...defaults, ...(b.config ?? {}) });
        setIsAuthed(Boolean(leaderSession.get()));
      } else {
        setConfig(getLeaderConfig());
        setMembers(getTeamMembers());
        setIsAuthed(isLeaderAuthenticated());
      }
    });
  }, []);

  const logout = useCallback(() => {
    setIsAuthed(false);
    setMembers([]);
    leaderSession.clear();
    setLeaderAuthenticated(false);
  }, []);

  const report = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) logout();
      setNotice(describeError(err));
    },
    [logout],
  );

  // A member's private link
  useEffect(() => {
    if (!backend || !urlToken) return;
    if (backend.mode === 'local') {
      setTokenMember(findMemberByToken(urlToken) ?? null);
      return;
    }
    cloud
      .getMemberByToken(urlToken)
      .then(setTokenMember)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 404)) setNotice(describeError(err));
        setTokenMember(null);
      });
  }, [backend, urlToken]);

  // The leader's member list
  useEffect(() => {
    if (backend?.mode !== 'cloud' || !isAuthed) return;
    cloud.listMembers().then(setMembers).catch(report);
  }, [backend, isAuthed, report]);

  const login = async (pin: string): Promise<LoginResult> => {
    if (backend?.mode === 'local') {
      if (pin !== (config.pin ?? INITIAL_LEADER_CONFIG.pin)) return { ok: false, message: '비밀번호가 일치하지 않습니다.' };
      setLeaderAuthenticated(true);
      setIsAuthed(true);
      return { ok: true };
    }
    try {
      await cloud.login(pin);
      setIsAuthed(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: describeError(err) };
    }
  };

  const changePin = async (current: string, next: string): Promise<string | null> => {
    if (backend?.mode === 'local') {
      if (current !== (config.pin ?? INITIAL_LEADER_CONFIG.pin)) return '현재 비밀번호가 일치하지 않습니다.';
      const updated = { ...config, pin: next };
      setConfig(updated);
      saveLeaderConfig(updated);
      return null;
    }
    try {
      await cloud.changePin(current, next);
      return null;
    } catch (err) {
      if (err instanceof ApiError && err.code === 'wrong_pin') return '현재 비밀번호가 일치하지 않습니다.';
      return describeError(err);
    }
  };

  const updateConfig = (next: LeaderConfig) => {
    const previous = config;
    setConfig(next);
    if (backend?.mode === 'local') {
      saveLeaderConfig(next);
      return;
    }
    const { leaderName, teamTitle, surveyQuestions } = next;
    cloud.saveConfig({ leaderName, teamTitle, surveyQuestions }).catch((err) => {
      setConfig(previous);
      report(err);
    });
  };

  const upsertMember = (member: TeamMember) => {
    if (backend?.mode === 'local') {
      setMembers(upsertLocalMember(member));
      return;
    }
    const replace = (m: TeamMember) => (list: TeamMember[]) =>
      list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [m, ...list];
    setMembers(replace(member));
    cloud
      .upsertMember(member)
      .then((saved) => setMembers(replace(saved)))
      .catch((err) => {
        report(err);
        cloud.listMembers().then(setMembers).catch(() => undefined);
      });
  };

  const deleteMember = (id: string) => {
    if (backend?.mode === 'local') {
      setMembers(deleteLocalMember(id));
      return;
    }
    setMembers((list) => list.filter((m) => m.id !== id));
    cloud.deleteMember(id).catch((err) => {
      report(err);
      cloud.listMembers().then(setMembers).catch(() => undefined);
    });
  };

  /** Saves a member's answers. Resolves to the saved member, or null (with a notice) on failure. */
  const submitAnswers = async (
    member: TeamMember,
    answers: Record<string, string>,
    discResult?: DiscSubmissionResult,
  ): Promise<TeamMember | null> => {
    if (backend?.mode === 'local') {
      const saved: TeamMember = { ...member, answers, discResult, status: 'submitted', submittedAt: new Date().toISOString() };
      setMembers(upsertLocalMember(saved));
      return saved;
    }
    try {
      const saved = await cloud.submitAnswers(member.token, answers, discResult);
      if (isAuthed) setMembers((list) => list.map((m) => (m.id === saved.id ? { ...m, ...saved } : m)));
      return saved;
    } catch (err) {
      setNotice(describeError(err));
      return null;
    }
  };

  const noticeBar = notice && (
    <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] max-w-md w-[calc(100%-2rem)] px-4 py-3 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-xl flex items-start gap-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span className="flex-1">{notice}</span>
      <button type="button" aria-label="닫기" onClick={() => setNotice(null)}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const demoBar = backend?.mode === 'local' && (
    <div className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-[11px] font-semibold text-center px-4 py-1.5 border-b border-amber-300/60 dark:border-amber-800/60">
      로컬 데모 모드: 모든 데이터가 이 브라우저에만 저장되고, 구성원 링크도 이 브라우저에서만 열립니다. 팀에서 쓰려면 README의 배포 안내를 따라 주세요.
    </div>
  );

  if (!backend) return <Loading label="불러오는 중입니다..." />;

  // Case 1: a member opened their private link (?token=...)
  if (urlToken) {
    if (tokenMember === undefined) return <Loading label="설문지를 불러오는 중입니다..." />;
    if (!tokenMember) {
      return (
        <FullScreen>
          <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">유효하지 않은 링크입니다</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              전달받은 링크 주소를 다시 확인하시거나, 담당 리더{config.leaderName ? `(${config.leaderName})` : ''}에게 새 링크를 요청해 주세요.
            </p>
            <button
              onClick={() => {
                window.location.href = window.location.pathname;
              }}
              className="mt-3 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900"
            >
              홈으로 이동
            </button>
          </div>
          {noticeBar}
        </FullScreen>
      );
    }
    return (
      <>
        {demoBar}
        <MemberSubmitView
          member={tokenMember}
          leaderConfig={config}
          onSubmit={async (answers, disc) => {
            const saved = await submitAnswers(tokenMember, answers, disc);
            if (saved) setTokenMember(saved);
            return Boolean(saved);
          }}
          onExit={
            isAuthed
              ? () => {
                  setUrlToken(null);
                  window.history.pushState({}, '', window.location.pathname);
                }
              : undefined
          }
        />
        {noticeBar}
      </>
    );
  }

  // Case 2: the leader previews a member's survey
  if (previewMember && isAuthed) {
    return (
      <>
        {demoBar}
        <MemberSubmitView
          member={previewMember}
          leaderConfig={config}
          onSubmit={async (answers, disc) => {
            const saved = await submitAnswers(previewMember, answers, disc);
            if (saved) setPreviewMember({ ...previewMember, ...saved });
            return Boolean(saved);
          }}
          onExit={() => setPreviewMember(null)}
        />
        {noticeBar}
      </>
    );
  }

  // Case 3: sign-in
  if (!isAuthed) {
    return (
      <>
        {demoBar}
        <LeaderGate
          onLogin={login}
          demoPin={backend.mode === 'local' && (config.pin ?? INITIAL_LEADER_CONFIG.pin) === INITIAL_LEADER_CONFIG.pin ? INITIAL_LEADER_CONFIG.pin : undefined}
          setupRequired={isCloud && backend.mode === 'cloud' && backend.setupRequired}
        />
      </>
    );
  }

  // Case 4: dashboard
  return (
    <>
      {demoBar}
      <LeaderDashboard
        config={config}
        members={members}
        onUpdateConfig={updateConfig}
        onUpsertMember={upsertMember}
        onDeleteMember={deleteMember}
        onChangePin={changePin}
        onLogout={logout}
        onPreviewMember={(m) => setPreviewMember(m)}
      />
      {noticeBar}
    </>
  );
};
