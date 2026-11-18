import { LeaderConfig, SurveyQuestion, TeamMember } from '../types';
import type { Lang } from '../i18n/lang';

/**
 * Default pre-1:1 survey. Leaders can edit, add or remove questions in the dashboard; the edited
 * set is stored with the team settings (server or this browser), not in code.
 */
const DEFAULT_SURVEY_QUESTIONS_KO: SurveyQuestion[] = [
  {
    id: 'q1',
    title: 'Q1. 올 한 해 가장 보람찼던 순간',
    question: '올 한 해 정말 고생 많으셨습니다. 담당 업무를 하면서 "이 일은 정말 뿌듯했다"고 느낀 가장 보람찬 순간은 언제였나요?',
    placeholder: '예: 큰 프로젝트를 일정 안에 무사히 마쳤을 때, 고객이나 동료에게 좋은 피드백을 받았을 때 등',
    required: true,
    category: 'achievement',
  },
  {
    id: 'q2',
    title: 'Q2. 대표 성과와 조직 기여',
    question: '본인이 주도한 일 가운데 스스로 꼽는 가장 대표적인 성과는 무엇인가요? 처음 세운 목표와 실제 결과(숫자 또는 정성적 성과), 그리고 팀과 조직에 준 영향을 함께 적어 주세요.',
    placeholder: '예: 비용 20% 절감과 목표 대비 130% 달성, 반복 업무 자동화로 주당 5시간 단축 등',
    required: true,
    category: 'achievement',
  },
  {
    id: 'q3',
    title: 'Q3. 아쉬웠던 일과 그 원인',
    question: '목표에 못 미쳤거나 계획대로 풀리지 않아 마음에 남는 일이 있다면 무엇인가요? 당시 상황(일정, 리소스, 외부 요청, 협업 등)과 함께 원인을 솔직하게 짚어 주세요.',
    placeholder: '예: 외부 검토 지연으로 출시가 늦어짐, 요구 사항이 자주 바뀌면서 생긴 소통 혼선 등',
    required: true,
    category: 'bottleneck',
  },
  {
    id: 'q4',
    title: 'Q4. 일하면서 발휘한 강점과 다르게 해 보고 싶은 점',
    question: '일을 추진하는 과정에서 가장 잘 발휘한 강점(빠른 대응, 꼼꼼한 검토, 유연한 소통 등)은 무엇이었나요? 같은 상황을 다시 만난다면 다르게 해 보고 싶은 점은 무엇인가요?',
    placeholder: '예: 긴급 이슈에 대안을 빨리 제시해 신뢰를 지킴 / 다음에는 검토 일정을 이틀 더 확보해 위험을 줄이겠음 등',
    required: true,
    category: 'bottleneck',
  },
  {
    id: 'q5',
    title: 'Q5. 동료와 조직에 준 긍정적인 영향',
    question: '노하우 공유, 일하는 방식 개선, 긍정적인 소통 등 본인의 업무 방식이 동료나 조직에 어떤 좋은 영향을 주었다고 생각하나요?',
    placeholder: '예: 점검 체크리스트를 만들어 팀에 공유, 바쁜 기간에 팀 분위기를 끌어올림, 새 도구 스터디를 주도 등',
    required: false,
    category: 'collaboration',
  },
  {
    id: 'q6',
    title: 'Q6. 성장한 역량과 보완하고 싶은 역량',
    question: '올 한 해 스스로 가장 많이 성장했다고 느끼는 역량은 무엇인가요? 앞으로 커리어를 위해 가장 보완하고 싶은 역량은 무엇인가요?',
    placeholder: '예: 데이터 분석 역량이 크게 늘었음 / 앞으로는 기획과 설득(발표) 역량을 키우고 싶음 등',
    required: true,
    category: 'growth',
  },
  {
    id: 'q7',
    title: 'Q7. 든든했던 협업 (도움받은 점과 도움 준 점)',
    question: '올 한 해 가장 든든한 힘이 되어 준 동료는 누구였고 어떤 도움을 받았나요? 반대로 본인은 어떤 동료에게 의미 있는 도움을 주었나요?',
    placeholder: '예: 마감 때 함께 더블체크해 준 OOO 님 덕분에 실수를 막음 / 새로 온 OOO 님의 온보딩을 1:1로 도움 등',
    required: false,
    category: 'collaboration',
  },
  {
    id: 'q8',
    title: 'Q8. 현업의 어려움과 리더에게 바라는 지원',
    question: '일상 업무에서 느끼는 실질적인 어려움(역할 분담, 업무량, 프로세스, 번아웃 등)은 무엇인가요? 이번 1:1 면담에서 리더에게 꼭 지원받고 싶은 부분은 무엇인가요?',
    placeholder: '예: 바쁜 기간 업무 분장 조정, 반복 업무 자동화 도구 지원, 다음 분기 역할(R&R)에 대한 상담 등',
    required: false,
    category: 'expectation',
  },
];

const DEFAULT_SURVEY_QUESTIONS_EN: SurveyQuestion[] = [
  {
    id: 'q1',
    title: 'Q1. Your most rewarding moment this year',
    question: 'Thank you for all your hard work this year. When did you feel most proud of your work, the moment you thought "this was really worth it"?',
    placeholder: 'e.g. Delivering a big project on time, or getting great feedback from a client or a colleague',
    required: true,
    category: 'achievement',
  },
  {
    id: 'q2',
    title: 'Q2. Key achievement and impact',
    question: 'Which piece of work that you led do you see as your most important achievement? Describe the original goal, the actual result (numbers or qualitative), and the impact on the team and the organisation.',
    placeholder: 'e.g. Cut costs by 20% and reached 130% of target; automated a repeating task and saved 5 hours a week',
    required: true,
    category: 'achievement',
  },
  {
    id: 'q3',
    title: "Q3. What didn't go as planned, and why",
    question: 'Is there any work that fell short of its goal or did not go as planned? Tell us honestly what happened (timing, resources, outside requests, collaboration) and what caused it.',
    placeholder: 'e.g. A launch slipped because an external review ran late; requirements kept changing and caused confusion',
    required: true,
    category: 'bottleneck',
  },
  {
    id: 'q4',
    title: "Q4. Strengths you used, and what you'd do differently",
    question: "What strength did you rely on most while getting things done (quick response, careful checking, flexible communication…)? If the same situation came up again, what would you do differently?",
    placeholder: "e.g. Kept the client's trust by proposing a quick plan B / Next time I'd add two extra days for review",
    required: true,
    category: 'bottleneck',
  },
  {
    id: 'q5',
    title: 'Q5. Positive impact on colleagues and the team',
    question: 'How has the way you work (sharing know-how, improving processes, positive communication…) had a good effect on your colleagues or the team?',
    placeholder: 'e.g. Shared a review checklist with the team, lifted the mood in a busy period, led a study of a new tool',
    required: false,
    category: 'collaboration',
  },
  {
    id: 'q6',
    title: 'Q6. How you grew, and what you want to build next',
    question: 'Which skill do you feel grew the most this year? And which skill would you most like to strengthen for your career from here?',
    placeholder: 'e.g. My data analysis improved a lot / Next I want to get better at planning and presenting',
    required: true,
    category: 'growth',
  },
  {
    id: 'q7',
    title: 'Q7. Collaboration: help you got and help you gave',
    question: 'Who supported you most this year, and how? And whom did you help in a meaningful way?',
    placeholder: "e.g. A colleague double-checked my work before a deadline / I onboarded a new teammate one-on-one",
    required: false,
    category: 'collaboration',
  },
  {
    id: 'q8',
    title: 'Q8. Day-to-day challenges and the support you need',
    question: 'What practical difficulties do you face in your daily work (roles, workload, processes, burnout…)? What support would you most like from your team lead in this 1:1?',
    placeholder: 'e.g. Rebalancing work in busy periods, tools to automate repeating tasks, a talk about next quarter\'s role',
    required: false,
    category: 'expectation',
  },
];

/** The default survey in the given language (used until the leader saves their own questions). */
export const defaultQuestions = (lang: Lang): SurveyQuestion[] =>
  lang === 'ko' ? DEFAULT_SURVEY_QUESTIONS_KO : DEFAULT_SURVEY_QUESTIONS_EN;

const STORAGE_KEYS = {
  LEADER_CONFIG: '1on1_compass_leader_config_v2',
  TEAM_MEMBERS: '1on1_compass_team_members_v2',
  LEADER_AUTH: '1on1_compass_leader_authed',
};

/** 128-bit random token for a member's private link, e.g. tk_7f9c2d184a5b60e3d928ac14b1e0f3a2 */
export function generateSecureToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return 'tk_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Password for local demo mode only (nothing leaves the browser). Server mode uses LEADER_PIN. */
export const LOCAL_DEMO_PIN = '1234';

export const INITIAL_LEADER_CONFIG: LeaderConfig = {
  leaderName: '',
  pin: LOCAL_DEMO_PIN,
  teamTitle: '',
  // Empty means "not customised yet": the app shows defaultQuestions(lang).
  surveyQuestions: [],
};

// Fictional people, shown only in local demo mode so a first-time visitor can see a filled dashboard.
const SAMPLE_MEMBERS_KO: TeamMember[] = [
  {
    id: 'sample-1',
    token: 'tk_9a8f2c7d1e4b6092',
    name: '김민준',
    department: '마케팅팀',
    role: '퍼포먼스 마케터 (선임)',
    status: 'submitted',
    submittedAt: '2026-11-17T08:30:00.000Z',
    discResult: {
      primary: 'C',
      code: 'S/C',
      patternName: '관리자형',
      scores: { D: 28, I: 22, S: 44, C: 46 },
      source: 'test',
    },
    answers: {
      q1: '연말 대형 프로모션 기간에 매일 늦게까지 검수와 집행을 챙겼는데, 오류 없이 목표를 달성하고 고객사에서 감사 메일을 받았을 때 가장 보람찼습니다.',
      q2: '광고 매체 조합을 다시 짜는 프로젝트를 이끌어 전환 단가를 전 분기보다 24% 낮췄고, 주간 리포트를 자동화해 팀의 반복 작업을 주당 약 5시간 줄였습니다.',
      q3: '10월 캠페인 시작일에 외부 심사가 늦어져 공개가 반나절 밀렸습니다. 미리 여유 일정을 충분히 협의하지 못한 점이 아쉬웠습니다.',
      q4: '꼼꼼한 체크리스트로 집행 오류를 0건으로 막은 것이 강점이었습니다. 다시 한다면 승인 시점을 최소 이틀 앞당기는 절차를 만들겠습니다.',
      q5: '검수 체크리스트와 규격 가이드를 만들어 팀에 공유했고, 새로 온 동료들이 같은 실수를 하지 않도록 도왔습니다.',
      q6: '데이터 정리와 성과 추적 역량이 크게 늘었습니다. 다음에는 분석을 넘어 새로운 전략을 직접 제안하고 설득하는 역량을 키우고 싶습니다.',
      q7: '바쁜 기간에 함께 최적화를 도와준 이지은 책임님 덕분에 큰 힘이 되었고, 저는 새로 합류한 동료의 대시보드 세팅을 1:1로 도왔습니다.',
      q8: '바쁜 기간에 리포트와 세팅 업무가 몰려 체력 부담이 컸습니다. 반복 업무 자동화 도구나 바쁜 시기 업무 분담을 논의하고 싶습니다.',
    },
    interviewNotes: '',
    actionItems: [],
    evaluationGrade: '',
    evaluationComment: '',
  },
  {
    id: 'sample-2',
    token: 'tk_3b7e1f4a9c2d8051',
    name: '이지은',
    department: '마케팅팀',
    role: 'AE (책임)',
    status: 'submitted',
    submittedAt: '2026-11-18T00:15:00.000Z',
    discResult: {
      primary: 'D',
      code: 'D/I',
      patternName: '결과지향형',
      scores: { D: 48, I: 42, S: 24, C: 26 },
      source: 'manual',
    },
    answers: {
      q1: '신규 시즌 제안 경쟁 발표를 주도해 기존 고객사를 지키고 예산 증액까지 이끌어 냈을 때 가장 큰 보람을 느꼈습니다.',
      q2: '숏폼 광고라는 새 채널을 도입해 첫 주에 목표 매출의 145%를 달성했고, 고객사와의 신뢰를 더 단단하게 만들었습니다.',
      q3: '빠르게 시작하느라 내부 운영팀과 정산 기준을 미리 맞추지 못해 월말 마감 때 혼선이 있었던 점이 아쉬웠습니다.',
      q4: '갑작스러운 요구 변경에도 바로 세 가지 대안을 제시한 순발력이 통했습니다. 다시 한다면 변경 사항을 내부에 더 빨리 공유해 피로도를 줄이겠습니다.',
      q5: '긴장감 높은 발표와 프로모션 기간에도 밝은 에너지로 팀 분위기를 끌어올리고, 고객사 미팅에서 팀의 입장을 분명하게 전했습니다.',
      q6: '협상력과 추진력이 크게 늘었습니다. 앞으로는 후배들의 성장을 이끄는 멘토링과 프로젝트 관리 역량을 보완하고 싶습니다.',
      q7: '탄탄한 데이터로 제안서를 받쳐 준 김민준 선임님 덕분에 이길 수 있었고, 저는 신입 동료에게 고객 커뮤니케이션과 메일 작성법을 코칭했습니다.',
      q8: '비정기 긴급 요청 대응 때문에 장기 전략을 고민할 시간이 부족합니다. 비수기에는 전략 기획에 집중할 시간을 확보해 주시면 좋겠습니다.',
    },
    interviewNotes: '',
    actionItems: [],
    evaluationGrade: '',
    evaluationComment: '',
  },
];

const SAMPLE_MEMBERS_EN: TeamMember[] = [
  {
    ...SAMPLE_MEMBERS_KO[0],
    name: 'Alex Kim',
    department: 'Marketing',
    role: 'Performance marketer (senior)',
    discResult: { ...SAMPLE_MEMBERS_KO[0].discResult!, patternName: 'Administrator' },
    answers: {
      q1: 'During the year-end promotion I checked every launch late into the evening. We hit the target with zero errors and the client sent us a thank-you email. That was the most rewarding moment.',
      q2: 'I led a project to rework our ad channel mix. Cost per conversion dropped 24% versus last quarter, and automating the weekly report saved the team about 5 hours a week.',
      q3: 'In October an external review ran late and the campaign went live half a day behind schedule. I wish I had agreed on more buffer time in advance.',
      q4: 'A thorough checklist kept launch errors at zero. Next time I would set up a process to get approvals at least two days earlier.',
      q5: 'I wrote a review checklist and spec guide and shared it with the team, which helped new colleagues avoid the same mistakes.',
      q6: 'My data preparation and performance tracking improved a lot. Next I want to go beyond analysis and propose and pitch new strategies myself.',
      q7: 'Jamie helped me optimise campaigns during the busy season, which was a huge help. I set up dashboards one-on-one for a teammate who joined in the second half.',
      q8: 'Reporting and setup piled up in busy periods and it was physically tiring. I would like to discuss automation tools or sharing the load in peak season.',
    },
  },
  {
    ...SAMPLE_MEMBERS_KO[1],
    name: 'Jamie Park',
    department: 'Marketing',
    role: 'Account executive (lead)',
    discResult: { ...SAMPLE_MEMBERS_KO[1].discResult!, patternName: 'Results-Oriented' },
    answers: {
      q1: 'I led our pitch for the new season, kept the existing client and even won a bigger budget. That was the most rewarding moment.',
      q2: 'I introduced short-form video as a new channel. In the first week we reached 145% of the sales target, and our partnership with the client got stronger.',
      q3: 'We moved fast and did not align billing rules with the operations team in advance, which caused confusion at month-end close.',
      q4: 'When the client suddenly changed the brief, I offered three alternatives on the spot. Next time I would share changes with the internal team sooner.',
      q5: 'Even during tense pitches and promotions I kept the team upbeat and represented our position clearly in client meetings.',
      q6: 'My negotiation and drive grew a lot. Next I want to build mentoring and project management skills to help junior colleagues grow.',
      q7: 'Alex backed our proposal with solid data, which is why we won. I coached new colleagues on client communication and email writing.',
      q8: 'Urgent ad hoc requests leave little time for long-term strategy. In quieter periods I would like protected time to focus on planning.',
    },
  },
];

// ---------------------------------------------------------------- local demo mode (this browser only)

export function getLeaderConfig(): LeaderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADER_CONFIG);
    if (!raw) return INITIAL_LEADER_CONFIG;
    const parsed = JSON.parse(raw) as Partial<LeaderConfig>;
    return {
      ...INITIAL_LEADER_CONFIG,
      ...parsed,
      surveyQuestions: Array.isArray(parsed.surveyQuestions) ? parsed.surveyQuestions : [],
    };
  } catch {
    return INITIAL_LEADER_CONFIG;
  }
}

export function saveLeaderConfig(config: LeaderConfig): void {
  localStorage.setItem(STORAGE_KEYS.LEADER_CONFIG, JSON.stringify(config));
}

/** Members saved in this browser; on first visit, fictional samples in the given language. */
export function getTeamMembers(lang: Lang = 'ko'): TeamMember[] {
  const samples = lang === 'ko' ? SAMPLE_MEMBERS_KO : SAMPLE_MEMBERS_EN;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
    if (raw === null) return samples;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : samples;
  } catch {
    return samples;
  }
}

export function saveTeamMembers(members: TeamMember[]): void {
  localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(members));
}

export function findMemberByToken(token: string): TeamMember | undefined {
  return getTeamMembers().find((m) => m.token === token);
}

/** Adds or replaces one member and returns the new list. */
export function upsertLocalMember(member: TeamMember): TeamMember[] {
  const list = getTeamMembers();
  const idx = list.findIndex((m) => m.id === member.id);
  const next = idx === -1 ? [member, ...list] : list.map((m) => (m.id === member.id ? member : m));
  saveTeamMembers(next);
  return next;
}

export function deleteLocalMember(id: string): TeamMember[] {
  const next = getTeamMembers().filter((m) => m.id !== id);
  saveTeamMembers(next);
  return next;
}

export function isLeaderAuthenticated(): boolean {
  return sessionStorage.getItem(STORAGE_KEYS.LEADER_AUTH) === 'true';
}

export function setLeaderAuthenticated(auth: boolean): void {
  if (auth) {
    sessionStorage.setItem(STORAGE_KEYS.LEADER_AUTH, 'true');
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.LEADER_AUTH);
  }
}

/** Shows ISO times from the server in local time; older plain-text values pass through unchanged. */
export function formatDateTime(value?: string, lang: Lang = 'ko'): string {
  if (!value) return '';
  const d = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value) || Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
