import { AiInterviewGuide, TeamMember } from '../types';
import type { Lang } from '../i18n/lang';
import { DiscKey, getDisc, patternFor } from '../data/disc';

type ByType = Record<DiscKey, string>;

/** Shorten an answer to a quotable snippet. */
const snip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}...` : text);

/** All generated copy, per language. Functions take the member name and/or an answer snippet. */
interface GuideText {
  /** Placeholders used when an answer is empty. */
  defaults: { q1: string; q2: string; q3: string };
  /** Title used when the DISC code has no named pattern. */
  fallbackTitle: (primary: DiscKey, savedName?: string) => string;
  atmosphere: ByType;
  keyAdvice: ByType;
  opening: {
    lead: (name: string) => string;
    iceBreaker: Record<DiscKey, (name: string, q1: string) => string>;
    purposeSetting: Record<DiscKey, (name: string) => string>;
  };
  probing: {
    question: Record<DiscKey, (name: string, q2: string) => string>;
    intent: string;
    targetAnswer: (q2: string) => string;
    watchOut: ByType;
    q4: { question: (name: string, q4: string) => string; intent: string; targetAnswer: string; watchOut: string };
  };
  coaching: {
    topic: (q3: string) => string;
    question: ByType;
    safetyTipSupportive: string;
    safetyTipObjective: string;
    actionGuide: string;
    q8: {
      topic: (q8: string) => string;
      question: (name: string, q8: string) => string;
      safetyTip: string;
      actionGuide: string;
    };
  };
  growth: {
    question: Record<DiscKey, (name: string, q6: string) => string>;
    alignmentTip: (q6: string) => string;
    synergyQuestion: (snippet: string) => string;
    synergyTip: string;
  };
}

const TEXT: Record<Lang, GuideText> = {
  ko: {
    defaults: {
      q1: '보람 있었던 프로젝트 내용',
      q2: '핵심 성과 작성 내용',
      q3: '아쉬웠던 성과 및 병목 내용',
    },
    fallbackTitle: (primary, savedName) => savedName || `${primary}형`,
    atmosphere: {
      D: '빠른 템포 · 결론 및 성과 지향 · 주도권 존중',
      I: '밝고 활기찬 분위기 · 긍정적 공감 · 에너지 인정',
      S: '심리적 안정감 우선 · 차분한 경청 · 보이지 않는 헌신 인정',
      C: '객관적 사실 중심 · 데이터 및 근거 기반 · 논리적 존중',
    },
    keyAdvice: {
      D: '서론은 짧게 마무리하고, 핵심 성과 지표와 다음 도전 목표에 초점을 맞추세요. 세부 과정을 따지기보다 권한과 책임 범위를 명확히 제시할 때 가장 동기부여됩니다.',
      I: '먼저 고객 대응과 팀 분위기 메이커로서의 열정적 기여를 진심으로 칭찬하여 라포를 형성하세요. 풍부한 아이디어가 흐지부지되지 않도록 구체적인 마일스톤과 마감일을 리더가 함께 잡아주는 것이 핵심입니다.',
      S: '평가 자리가 아닌 "성장을 돕는 안전한 대화"임을 강조하세요. 묵묵히 업무를 빈틈없이 운영하고 지탱해 준 노고를 구체적으로 언급하고, 갈등이나 부담을 속으로 삭이고 있지 않은지 세심하게 물어보세요.',
      C: '감정적인 칭찬보다는 데이터 분석과 높은 품질 기준을 세운 전문성을 인정하세요. 비판에 방어적이 되지 않도록 사전에 논리적 기준을 제시하고, 완벽주의로 인한 실행 지연을 덜어주세요.',
    },
    opening: {
      lead: (name) => `"${name} 님, 한 해 동안 정신없이 바쁘셨을 텐데, 사전 질문지를 꼼꼼하게 작성해 주셔서 진심으로 감사합니다."`,
      iceBreaker: {
        D: (name, q1) => `"${name} 님께서 작성해 주신 보람찼던 순간 ("${q1}")을 보며, 치열한 환경에서도 강력한 추진력으로 목표를 쟁취해 주셨다는 것을 실감했습니다. 오늘 시간 낭비 없이 핵심 위주로 깔끔하게 이야기 나눠보죠."`,
        I: (name, q1) => `"${name} 님이 올해 일하며 가장 보람찼다고 적어주신 내용 ("${q1}")을 읽으면서 저도 덩달아 가슴이 뛰었습니다. 팀에 불어넣어 주신 밝은 에너지와 적극성에 감사드립니다!"`,
        S: (name, q1) => `"${name} 님, 올 한 해 묵묵히 맡은 일을 든든하게 지켜주셔서 항상 감사한 마음입니다. 가장 보람찼던 순간 ("${q1}")을 보며 그간의 깊은 정성을 느꼈습니다. 요즘 컨디션은 편안하신가요?"`,
        C: (name, q1) => `"${name} 님께서 사전에 정리해 주신 보람찼던 순간 ("${q1}")과 분석적인 답변을 보며 업무에 대한 깊은 고민과 전문성을 확인할 수 있었습니다."`,
      },
      purposeSetting: {
        D: (name) => `"오늘 면담의 목적은 지난 성과를 짚어보는 것을 넘어, 다음 기간에 ${name} 님이 더 큰 권한과 재량을 가지고 주도할 수 있는 프로젝트와 지원책을 함께 설계하는 것입니다."`,
        I: (name) => `"오늘 면담은 ${name} 님의 뛰어난 역량과 아이디어가 어떻게 하면 더 빛나는 결실로 이어질 수 있을지, 편안하고 유쾌하게 미래를 그려보는 시간입니다."`,
        S: () => `"오늘 자리는 어떤 평가나 지적을 위한 자리가 절대 아닙니다. 평소 말하기 어려웠던 고민이나 리더로서 제가 도와드릴 부분을 편하게 털어놓는 시간으로 생각해 주세요."`,
        C: () => `"오늘 면담은 지난 업무의 진행 과정과 기준을 객관적으로 돌아보고, 향후 업무 효율성과 데이터 전문성을 더 체계적으로 발휘할 수 있는 방안을 논의하는 자리입니다."`,
      },
    },
    probing: {
      question: {
        D: (name, q2) => `"${name} 님, 작성해 주신 핵심 성과 ("${q2}")에서 본인이 내린 가장 결정적인 승부수나 결단은 무엇이었나요? 팀 성과에 어떤 정량적 임팩트를 가져왔다고 보시나요?"`,
        I: (name, q2) => `"${name} 님, 핵심 성과 ("${q2}")를 만들어가는 과정에서 고객이나 팀원들의 공감을 얻기 위해 어떤 커뮤니케이션 노력을 기울이셨나요?"`,
        S: (name, q2) => `"${name} 님, 이 성과 ("${q2}")를 달성하기까지 보이지 않는 곳에서 꾸준히 챙기셨던 가장 중요한 운영 디테일은 무엇이었나요?"`,
        C: (name, q2) => `"${name} 님, 이 성과 ("${q2}")에서 효율 최적화와 품질을 검증하기 위해 어떤 구체적인 데이터 지표와 방법론을 활용하셨는지 설명해 주실 수 있나요?"`,
      },
      intent: '단순 결과 나열을 넘어 문제 해결 방식과 비즈니스 기여도 심층 검증',
      targetAnswer: (q2) => `사전 작성 핵심 성과 ("${q2}")에 대한 구체적 역할과 차별화된 기여도`,
      watchOut: {
        D: '동료들의 기여를 간과하고 독단적인 성과로만 포장하는지 관찰',
        I: '성과 지표나 구체적 팩트보다 분위기나 인상 위주로 말하는지 관찰',
        S: '본인의 주도적 공헌을 겸손하게 축소하여 말하지 않는지 관찰',
        C: '세부 과정 설명에 매몰되어 전체적인 비즈니스 임팩트를 놓치지 않는지 관찰',
      },
      q4: {
        question: (name, q4) => `"${name} 님, 실행 과정에서 발휘한 강점과 개선점 ("${q4}")에 대해 적어주셨는데, 만약 같은 이슈를 다시 마주한다면 첫 번째로 취할 액션은 무엇인가요?"`,
        intent: '경험을 통한 회고 역량 및 위기 대응 시스템화 가능성 평가',
        targetAnswer: '재현 가능한 실행 프로세스 및 사전 리스크 차단 전략',
        watchOut: '단순히 열심히 하겠다는 다짐인지, 구체적인 프로세스 개선안을 가졌는지 확인',
      },
    },
    coaching: {
      topic: (q3) => `아쉬웠던 점 & 병목 회고 ("${q3}")`,
      question: {
        D: `"작성해 주신 아쉬운 부분에 대해, 만약 그때로 다시 돌아간다면 이해관계자에게 어떤 결정을 다르게 요구하시겠습니까? 리더로서 제가 즉시 제거해 드릴 수 있는 권한 장벽은 무엇인가요?"`,
        I: `"일정이나 피드백 조율 과정에서 변수가 생겼을 때 마음고생이 있으셨을 텐데, 다음번에는 어떤 체크리스트를 미리 세워두면 더 매끄럽게 마무리될 수 있을까요?"`,
        S: `"당시 상황에서 혼자서 속앓이를 하거나 부담을 감당하셨던 부분은 없으셨나요? 앞으론 저에게 언제든 편하게 에스컬레이션할 수 있는 신호를 약속해 볼까요?"`,
        C: `"병목이 발생했던 근본 원인(Root Cause)을 외부 정책이나 운영 시스템 측면에서 어떻게 분석하셨나요? 사전에 리스크를 탐지할 수 있었던 지표는 무엇이었을까요?"`,
      },
      safetyTipSupportive: '실패에 대한 자책을 덜어주고, "조직의 시스템적 문제"로 전환하여 편안하게 대화하도록 지지',
      safetyTipObjective: '자존심을 건드리지 않으면서, 결과에 대한 객관적 회고와 배움을 이끌어냄',
      actionGuide: '실패에 대한 문책이 아닌, 재발 방지를 위한 팀 가이드라인 수립으로 연결',
      q8: {
        topic: (q8) => `현업 고충 및 리더 지원 요청 ("${q8}")`,
        question: (name, q8) => `"${name} 님께서 솔직하게 전해주신 현업 애로사항 ("${q8}")에 대해 깊이 공감합니다. 리더인 제가 즉시 조정해 드릴 수 있는 1순위 지원책은 무엇일까요?"`,
        safetyTip: '고충을 털어놓은 용기를 칭찬하고, 리더가 진정성 있게 해결 의지를 보여줌',
        actionGuide: '면담 자리에서 즉각 해결 가능한 조치와 상위 보고가 필요한 조치를 구분하여 로드맵 제시',
      },
    },
    growth: {
      question: {
        D: (name, q6) => `"${name} 님이 적어주신 역량 성장 ("${q6}")을 발판으로, 다음 분기에 더 주도적으로 리딩하고 싶은 영역은 어디인가요?"`,
        I: (name, q6) => `"${name} 님이 강화하고 싶은 역량 ("${q6}")을 발휘할 수 있도록 어떤 새로운 기획이나 프레젠테이션 기회를 지원해 드리면 좋을까요?"`,
        S: (name, q6) => `"${name} 님이 장기적으로 안정적인 전문성을 쌓기 위해 ("${q6}"), 조직에서 지속적으로 지원해야 할 환경이나 교육은 무엇인가요?"`,
        C: (name, q6) => `"${name} 님이 가장 깊이 있게 파고들어 팀 내 독보적 전문성을 인정받고 싶은 분석/최적화 영역 ("${q6}")은 구체적으로 어디인가요?"`,
      },
      alignmentTip: (q6) => `사전 작성한 역량 목표 ("${q6}")와 회사와 팀의 방향성 일치시키기`,
      synergyQuestion: (s) => `"팀원들과의 협업 및 영향력 ("${s}")에 대해 적어주신 점이 참 인상 깊었습니다. 우리 팀의 팀워크와 시너지를 위해 앞으로 어떤 역할을 더 해보고 싶으신가요?"`,
      synergyTip: '동료들과의 선한 영향력을 공식적으로 칭찬하고, 팀 내 롤모델로서의 역할 부여',
    },
  },

  en: {
    defaults: {
      q1: 'your most rewarding project',
      q2: 'the key achievement you described',
      q3: 'the shortfalls you described',
    },
    fallbackTitle: (primary) => `${primary} (blended)`,
    atmosphere: {
      D: 'Brisk pace · Results and outcome focused · Respect their ownership',
      I: 'Bright, upbeat mood · Positive empathy · Recognize their energy',
      S: 'Psychological safety first · Calm, attentive listening · Recognize unseen dedication',
      C: 'Objective facts first · Data and evidence based · Logical respect',
    },
    keyAdvice: {
      D: 'Keep the preamble short and focus on key performance metrics and the next challenge. They are most motivated when you clearly define their authority and scope of responsibility rather than picking over process details.',
      I: 'Build rapport first by sincerely praising their enthusiastic contribution with clients and as the team\'s mood-maker. The key is for the leader to set concrete milestones and deadlines with them so their many ideas do not fizzle out.',
      S: 'Stress that this is "a safe conversation to support growth", not an evaluation. Mention specifically how they quietly kept the work running without gaps, and gently ask whether they are holding in any conflict or pressure.',
      C: 'Rather than emotional praise, recognize their expertise in data analysis and in setting high quality standards. Lay out logical criteria up front so they do not become defensive about criticism, and help ease delays caused by perfectionism.',
    },
    opening: {
      lead: (name) => `"Thanks so much for filling in the questions so carefully, ${name}. I know it has been a really busy year."`,
      iceBreaker: {
        D: (name, q1) => `"${name}, reading the moment you found most rewarding ("${q1}"), I could really see how you drove hard to hit your goals even in a tough environment. Let's not waste any time today and get straight to the key points."`,
        I: (name, q1) => `"${name}, reading what you wrote as the most rewarding part of your year ("${q1}") genuinely got me excited too. Thank you for all the positive energy and drive you bring to the team!"`,
        S: (name, q1) => `"${name}, I'm always grateful for how steadily you've looked after your work this year. Reading about your most rewarding moment ("${q1}"), I could feel how much care you've put in. How are you feeling these days?"`,
        C: (name, q1) => `"${name}, the rewarding moment you laid out ahead of time ("${q1}") and your analytical answers showed me how deeply you think about your work and how much expertise you bring."`,
      },
      purposeSetting: {
        D: (name) => `"The goal today goes beyond reviewing past results. I want us to design the projects and support that will let you, ${name}, lead with more authority and autonomy next period."`,
        I: (name) => `"Today is a relaxed, fun chance to picture the future together, and how your strengths and ideas, ${name}, can turn into even bigger wins."`,
        S: () => `"This is definitely not about evaluating you or pointing out mistakes. Think of it as a time to talk openly about anything that's been hard to bring up, and anything I can help with as your leader."`,
        C: () => `"Today we'll look back objectively at how the work went and the standards behind it, and talk about how you can apply your efficiency and data expertise even more systematically going forward."`,
      },
    },
    probing: {
      question: {
        D: (name, q2) => `"${name}, in the key achievement you described ("${q2}"), what was the most decisive call or bold move you made? What measurable impact do you think it had on the team's results?"`,
        I: (name, q2) => `"${name}, while working toward your key achievement ("${q2}"), what did you do in your communication to win over clients and teammates?"`,
        S: (name, q2) => `"${name}, behind the scenes of this achievement ("${q2}"), what was the most important operational detail you kept on top of along the way?"`,
        C: (name, q2) => `"${name}, could you walk me through the specific data metrics and methods you used to optimize efficiency and verify quality in this achievement ("${q2}")?"`,
      },
      intent: 'Go beyond a list of results to probe their problem-solving approach and business contribution in depth',
      targetAnswer: (q2) => `Their specific role and distinctive contribution to the key achievement they described ("${q2}")`,
      watchOut: {
        D: 'Watch whether they overlook colleagues\' contributions and frame the result as a solo win',
        I: 'Watch whether they talk mostly about mood and impressions rather than metrics and concrete facts',
        S: 'Watch whether they modestly downplay their own leading contribution',
        C: 'Watch whether they get lost in process detail and miss the overall business impact',
      },
      q4: {
        question: (name, q4) => `"${name}, you wrote about the strengths you showed and what you'd improve in how you executed ("${q4}"). If you faced the same issue again, what's the first thing you would do?"`,
        intent: 'Assess their ability to reflect on experience and turn crisis response into a repeatable system',
        targetAnswer: 'A repeatable execution process and a strategy for heading off risks in advance',
        watchOut: 'Check whether it is just a promise to try harder or a concrete process improvement',
      },
    },
    coaching: {
      topic: (q3) => `Shortfalls & bottleneck review ("${q3}")`,
      question: {
        D: `"Looking at what you said didn't go as well, if you could go back, what would you ask stakeholders to decide differently? And what authority roadblocks can I remove for you right away?"`,
        I: `"It must have been stressful when schedules or feedback shifted unexpectedly. Next time, what checklist could we set up in advance so things wrap up more smoothly?"`,
        S: `"Was there anything back then that you were carrying on your own or quietly worrying about? Shall we agree on a signal so you can escalate to me anytime, no pressure?"`,
        C: `"How did you analyze the root cause of the bottleneck in terms of external policy or operating systems? What indicators could have flagged the risk earlier?"`,
      },
      safetyTipSupportive: 'Ease any self-blame about the failure and reframe it as "a systemic issue in the organization" so they feel comfortable talking',
      safetyTipObjective: 'Draw out an objective review of the outcome and the lessons learned without bruising their pride',
      actionGuide: 'Steer it toward team guidelines that prevent a repeat, not toward blame for the failure',
      q8: {
        topic: (q8) => `Day-to-day difficulties & requests for leader support ("${q8}")`,
        question: (name, q8) => `"${name}, I really appreciate you being so honest about the difficulties you're facing ("${q8}"). What's the number one thing I can adjust for you right away?"`,
        safetyTip: 'Praise their courage in raising the issue, and show a genuine commitment as the leader to solving it',
        actionGuide: 'Separate actions that can be resolved on the spot from those that need escalating, and present a roadmap',
      },
    },
    growth: {
      question: {
        D: (name, q6) => `"${name}, building on the growth you described ("${q6}"), which area would you like to take more of a lead on next quarter?"`,
        I: (name, q6) => `"${name}, what new projects or presentation opportunities could I support so you can put the skills you want to build ("${q6}") into practice?"`,
        S: (name, q6) => `"${name}, to keep building solid expertise over the long term ("${q6}"), what environment or training should the organization keep providing for you?"`,
        C: (name, q6) => `"${name}, which analysis or optimization area ("${q6}") do you most want to dig into deeply and be recognized for as the team's go-to expert?"`,
      },
      alignmentTip: (q6) => `Align the skill goals they described ("${q6}") with the direction of the company and the team`,
      synergyQuestion: (s) => `"What you wrote about collaboration and your influence on the team ("${s}") really stood out to me. What role would you like to play from here to strengthen our teamwork and synergy?"`,
      synergyTip: 'Formally praise their positive influence on colleagues and give them a role-model role within the team',
    },
  },
};

export function generateAiInterviewGuide(member: TeamMember, lang: Lang): AiInterviewGuide {
  const T = TEXT[lang];
  const disc = getDisc(lang);

  const discResult = member.discResult || {
    primary: 'S' as const,
    code: 'S',
    patternName: lang === 'ko' ? '팀플레이어형' : disc.factors.S.name,
    source: 'manual' as const,
  };

  const primary = discResult.primary;
  const code = discResult.code;
  const factor = disc.factors[primary] || disc.factors.S;
  // Named pattern for the code; otherwise fall back to the saved name (ko) or a generic blended title.
  const title = disc.patterns[code]
    ? patternFor(code, primary, lang).n
    : T.fallbackTitle(primary, discResult.patternName);

  const q1Ans = member.answers['q1'] || T.defaults.q1;
  const q2Ans = member.answers['q2'] || T.defaults.q2;
  const q3Ans = member.answers['q3'] || T.defaults.q3;
  const q4Ans = member.answers['q4'] || '';
  const q5Ans = member.answers['q5'] || '';
  const q6Ans = member.answers['q6'] || '';
  const q7Ans = member.answers['q7'] || '';
  const q8Ans = member.answers['q8'] || '';

  // 1. DISC tone & atmosphere
  const atmosphere = T.atmosphere[primary];
  const keyAdvice = T.keyAdvice[primary];

  // 2. Opening script (uses Q1)
  const q1Snippet = snip(q1Ans, 35);
  const openingScript = {
    lead: T.opening.lead(member.name),
    iceBreaker: T.opening.iceBreaker[primary](member.name, q1Snippet),
    purposeSetting: T.opening.purposeSetting[primary](member.name),
  };

  // 3. Probing questions (uses Q2 & Q4)
  const q2Snippet = snip(q2Ans, 40);
  const probingQuestions = [
    {
      question: T.probing.question[primary](member.name, q2Snippet),
      intent: T.probing.intent,
      targetAnswer: T.probing.targetAnswer(q2Snippet),
      watchOut: T.probing.watchOut[primary],
    },
  ];

  if (q4Ans) {
    const q4Snippet = snip(q4Ans, 35);
    probingQuestions.push({
      question: T.probing.q4.question(member.name, q4Snippet),
      intent: T.probing.q4.intent,
      targetAnswer: T.probing.q4.targetAnswer,
      watchOut: T.probing.q4.watchOut,
    });
  }

  // 4. Bottleneck & coaching questions (uses Q3 & Q8)
  const q3Snippet = snip(q3Ans, 35);
  const bottleneckCoaching = [
    {
      topic: T.coaching.topic(q3Snippet),
      coachingQuestion: T.coaching.question[primary],
      psychologicalSafetyTip:
        primary === 'S' || primary === 'I' ? T.coaching.safetyTipSupportive : T.coaching.safetyTipObjective,
      actionGuide: T.coaching.actionGuide,
    },
  ];

  if (q8Ans) {
    const q8Snippet = snip(q8Ans, 35);
    bottleneckCoaching.push({
      topic: T.coaching.q8.topic(q8Snippet),
      coachingQuestion: T.coaching.q8.question(member.name, q8Snippet),
      psychologicalSafetyTip: T.coaching.q8.safetyTip,
      actionGuide: T.coaching.q8.actionGuide,
    });
  }

  // 5. DISC do's and don'ts
  const dosAndDonts = {
    dos: factor.dos.slice(0, 4),
    donts: factor.donts.slice(0, 4),
  };

  // 6. Growth and goals (uses Q5, Q6, Q7)
  const growthAndGoals = [];

  if (q6Ans) {
    const q6Snippet = snip(q6Ans, 35);
    growthAndGoals.push({
      question: T.growth.question[primary](member.name, q6Snippet),
      alignmentTip: T.growth.alignmentTip(q6Snippet),
    });
  }

  if (q5Ans || q7Ans) {
    const synergySnippet = snip(q5Ans || q7Ans, 35);
    growthAndGoals.push({
      question: T.growth.synergyQuestion(synergySnippet),
      alignmentTip: T.growth.synergyTip,
    });
  }

  return {
    memberId: member.id,
    generatedAt: new Date().toISOString(),
    discTone: {
      primary,
      code,
      title,
      atmosphere,
      keyAdvice,
    },
    openingScript,
    probingQuestions,
    bottleneckCoaching,
    dosAndDonts,
    growthAndGoals,
  };
}
