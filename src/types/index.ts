export interface SurveyQuestion {
  id: string;
  title: string;
  question: string;
  placeholder: string;
  required: boolean;
  category: 'achievement' | 'bottleneck' | 'collaboration' | 'growth' | 'expectation' | 'custom';
}

export interface DiscSubmissionResult {
  primary: 'D' | 'I' | 'S' | 'C';
  code: string; // e.g. 'D', 'D/I', 'S/C'
  patternName: string; // e.g. '감독자형', '관리자형'
  scores?: Record<'D' | 'I' | 'S' | 'C', number>;
  source: 'manual' | 'test';
}

export interface TeamMember {
  id: string;
  token: string;
  name: string;
  department: string;
  role: string;
  status: 'pending' | 'submitted' | 'interviewing' | 'completed';
  discResult?: DiscSubmissionResult;
  answers: Record<string, string>; // questionId -> answer
  submittedAt?: string;
  interviewNotes?: string;
  actionItems?: { id: string; text: string; done: boolean }[];
  evaluationGrade?: 'S' | 'A' | 'B' | 'C' | 'D' | '';
  evaluationComment?: string;
  interviewDate?: string;
  /** Set by the server; used to list newest members first. */
  createdAt?: number;
}

export interface LeaderConfig {
  leaderName: string;
  /** Only used in local demo mode (data kept in this browser). The server never sends it. */
  pin?: string;
  teamTitle: string;
  surveyQuestions: SurveyQuestion[];
}

export interface AiInterviewGuide {
  memberId: string;
  generatedAt: string;
  discTone: {
    primary: 'D' | 'I' | 'S' | 'C';
    code: string;
    title: string;
    atmosphere: string;
    keyAdvice: string;
  };
  openingScript: {
    lead: string;
    iceBreaker: string;
    purposeSetting: string;
  };
  probingQuestions: {
    question: string;
    intent: string;
    targetAnswer: string;
    watchOut: string;
  }[];
  bottleneckCoaching: {
    topic: string;
    coachingQuestion: string;
    psychologicalSafetyTip: string;
    actionGuide: string;
  }[];
  dosAndDonts: {
    dos: string[];
    donts: string[];
  };
  growthAndGoals: {
    question: string;
    alignmentTip: string;
  }[];
}
