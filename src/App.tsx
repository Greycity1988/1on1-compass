import React, { useCallback, useEffect, useState } from 'react';
import { DiscSubmissionResult, LeaderConfig, TeamMember } from './types';
import {
  deleteLocalMember,
  findMemberByToken,
  getLeaderConfig,
  getTeamMembers,
  INITIAL_LEADER_CONFIG,
  LOCAL_DEMO_PIN,
  isLeaderAuthenticated,
  defaultQuestions,
  saveLeaderConfig,
  saveTeamMembers,
  setLeaderAuthenticated,
  upsertLocalMember,
} from './utils/storage';
import { ApiError, Backend, cloud, describeError, detectBackend, leaderSession } from './utils/api';
import { useLang } from './i18n/lang';
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
  const { lang, t } = useLang();
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
  // Until the leader saves their own questions, show the defaults in the viewer's language.
  const viewConfig: LeaderConfig = config.surveyQuestions.length
    ? config
    : { ...config, surveyQuestions: defaultQuestions(lang) };

  useEffect(() => {
    detectBackend().then((b) => {
      setBackend(b);
      if (b.mode === 'cloud') {
        const { pin: _pin, ...defaults } = INITIAL_LEADER_CONFIG;
        setConfig({ ...defaults, ...(b.config ?? {}) });
        setIsAuthed(Boolean(leaderSession.get()));
      } else {
        setConfig(getLeaderConfig());
        const initial = getTeamMembers(lang);
        saveTeamMembers(initial); // keep the samples in the language of the first visit
        setMembers(initial);
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
      setNotice(describeError(err, t));
    },
    [logout, t],
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
        if (!(err instanceof ApiError && err.status === 404)) setNotice(describeError(err, t));
        setTokenMember(null);
      });
  }, [backend, urlToken, t]);

  // The leader's member list
  useEffect(() => {
    if (backend?.mode !== 'cloud' || !isAuthed) return;
    cloud.listMembers().then(setMembers).catch(report);
  }, [backend, isAuthed, report]);

  const login = async (pin: string): Promise<LoginResult> => {
    if (backend?.mode === 'local') {
      // Demo mode always uses the demo password, so nobody can lock a shared browser out.
      if (pin !== LOCAL_DEMO_PIN) return { ok: false, message: t.errors.wrongPin };
      setLeaderAuthenticated(true);
      setIsAuthed(true);
      return { ok: true };
    }
    try {
      await cloud.login(pin);
      setIsAuthed(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: describeError(err, t) };
    }
  };

  const changePin = async (current: string, next: string): Promise<string | null> => {
    if (backend?.mode === 'local') {
      // The password can't be changed in demo mode (the dialog explains this; this is a backstop).
      return t.pin.demoDisabledBody;
    }
    try {
      await cloud.changePin(current, next);
      return null;
    } catch (err) {
      if (err instanceof ApiError && err.code === 'wrong_pin') return t.errors.wrongCurrentPin;
      return describeError(err, t);
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
      setNotice(describeError(err, t));
      return null;
    }
  };

  const noticeBar = notice && (
    <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] max-w-md w-[calc(100%-2rem)] px-4 py-3 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-xl flex items-start gap-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span className="flex-1">{notice}</span>
      <button type="button" aria-label={t.common.close} onClick={() => setNotice(null)}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const demoBar = backend?.mode === 'local' && (
    <div className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-[11px] font-semibold text-center px-4 py-1.5 border-b border-amber-300/60 dark:border-amber-800/60">
      {t.app.demoBanner}
    </div>
  );

  if (!backend) return <Loading label={t.common.loading} />;

  // Case 1: a member opened their private link (?token=...)
  if (urlToken) {
    if (tokenMember === undefined) return <Loading label={t.common.loadingSurvey} />;
    if (!tokenMember) {
      return (
        <FullScreen>
          <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.app.invalidLinkTitle}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.app.invalidLinkBody(config.leaderName)}
            </p>
            <button
              onClick={() => {
                window.location.href = window.location.pathname;
              }}
              className="mt-3 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900"
            >
              {t.app.goHome}
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
          leaderConfig={viewConfig}
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
          leaderConfig={viewConfig}
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
          demoPin={backend.mode === 'local' ? LOCAL_DEMO_PIN : undefined}
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
        config={viewConfig}
        members={members}
        onUpdateConfig={updateConfig}
        onUpsertMember={upsertMember}
        onDeleteMember={deleteMember}
        onChangePin={changePin}
        isDemo={backend.mode === 'local'}
        onLogout={logout}
        onPreviewMember={(m) => setPreviewMember(m)}
      />
      {noticeBar}
    </>
  );
};
