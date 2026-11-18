import type { Lang } from '../i18n/lang';
import type { InterviewCycle, LeaderConfig, TeamMember } from '../types';

/** Records saved before rounds existed belong to this round. The server uses the same id. */
export const INITIAL_CYCLE_ID = 'cycle-initial';

export const cycleOf = (m: Pick<TeamMember, 'cycleId'>) => m.cycleId || INITIAL_CYCLE_ID;
export const personOf = (m: Pick<TeamMember, 'personId' | 'id'>) => m.personId || m.id;

type Period = { year: number; part: 'h1' | 'h2' | 'end' };

const periodOf = (date: Date): Period => {
  const m = date.getMonth() + 1;
  return { year: date.getFullYear(), part: m >= 10 ? 'end' : m <= 6 ? 'h1' : 'h2' };
};
const nextPeriod = ({ year, part }: Period): Period =>
  part === 'h1' ? { year, part: 'h2' } : part === 'h2' ? { year, part: 'end' } : { year: year + 1, part: 'h1' };
const periodName = (lang: Lang, { year, part }: Period) =>
  lang === 'ko'
    ? `${year}년 ${part === 'h1' ? '상반기' : part === 'h2' ? '하반기' : '연말'} 면담`
    : `${year} ${part === 'h1' ? 'H1' : part === 'h2' ? 'H2' : 'year-end'} review`;

/**
 * A name for a new round: the period of the date (H1 Jan–Jun, H2 Jul–Sep, year-end Oct–Dec),
 * moved on to the next period while the name is already taken.
 */
export function suggestCycleName(lang: Lang, date = new Date(), taken: string[] = []): string {
  let period = periodOf(date);
  for (let i = 0; i < 12 && taken.includes(periodName(lang, period)); i++) period = nextPeriod(period);
  return periodName(lang, period);
}

/**
 * The rounds of a config. Configs saved before rounds existed get one round holding their
 * questions; the app saves it once a leader signs in so its name stays fixed.
 */
export function cyclesOf(config: LeaderConfig, lang: Lang): InterviewCycle[] {
  if (config.cycles?.length) return config.cycles;
  return [
    {
      id: INITIAL_CYCLE_ID,
      name: suggestCycleName(lang),
      createdAt: Date.now(),
      surveyQuestions: config.surveyQuestions ?? [],
      closed: false,
    },
  ];
}

/** Newest round first. */
export const sortCycles = (cycles: InterviewCycle[]) => [...cycles].sort((a, b) => b.createdAt - a.createdAt);

export const newCycleId = () => `cycle_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
