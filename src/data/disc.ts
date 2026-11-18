import type { Lang } from '../i18n/lang';
import type { DiscSubmissionResult } from '../types';
import {
  COMBINATION_PATTERNS,
  DISC_AVG_SCORE,
  DISC_ORDER,
  DISC_QUESTIONS,
  DiscPattern,
  DiscQuestion,
  PRIMARY_FACTORS,
  PrimaryDiscFactor,
} from './discData';
import { COMBINATION_PATTERNS_EN, DISC_QUESTIONS_EN, PRIMARY_FACTORS_EN } from './discData.en';

export type DiscKey = 'D' | 'I' | 'S' | 'C';

export interface DiscContent {
  questions: DiscQuestion[];
  factors: Record<DiscKey, PrimaryDiscFactor>;
  patterns: Record<string, DiscPattern>;
}

const CONTENT: Record<Lang, DiscContent> = {
  ko: { questions: DISC_QUESTIONS, factors: PRIMARY_FACTORS, patterns: COMBINATION_PATTERNS },
  en: { questions: DISC_QUESTIONS_EN, factors: PRIMARY_FACTORS_EN, patterns: COMBINATION_PATTERNS_EN },
};

export const getDisc = (lang: Lang): DiscContent => CONTENT[lang];

/** Pattern for a code, or a generic one built from the primary factor when the code has no named pattern. */
export function patternFor(code: string, primary: DiscKey, lang: Lang): DiscPattern {
  const { factors, patterns } = CONTENT[lang];
  const factor = factors[primary] ?? factors.S;
  return (
    patterns[code] ?? {
      n: lang === 'ko' ? `${primary}형 (복합)` : `${primary} (blended)`,
      s: factor.tag,
      k: factor.kw,
      w:
        lang === 'ko'
          ? '상황에 따라 서로 다른 성향이 교차하여 나타날 수 있습니다.'
          : 'Different tendencies may show up depending on the situation.',
      t:
        lang === 'ko'
          ? '주요 요인의 강점을 살리되, 업무 상황에 맞춘 커뮤니케이션 방식을 확인하세요.'
          : 'Build on the main strengths and check which communication style fits the situation.',
    }
  );
}

/**
 * Display name of a saved DISC result in the viewer's language. The stored patternName is in
 * whatever language the person used, so the name is looked up again from the code.
 */
export function discLabel(disc: Pick<DiscSubmissionResult, 'code' | 'primary' | 'source'>, lang: Lang): string {
  if (disc.source === 'manual' && !disc.code.includes('/')) return CONTENT[lang].factors[disc.primary].name;
  return patternFor(disc.code, disc.primary, lang).n;
}

/**
 * Raw DISC scores from ranked responses. Each answer lists option indices 0..3 from most like me
 * (4 points) to least like me (1 point).
 */
export function calculateDiscScores(answers: number[][]): Record<DiscKey, number> {
  const scores: Record<DiscKey, number> = { D: 0, I: 0, S: 0, C: 0 };
  answers.forEach((ans) => {
    ans.forEach((choiceIdx, rank) => {
      scores[DISC_ORDER[choiceIdx]] += 4 - rank;
    });
  });
  return scores;
}

/** The high-factor pattern (e.g. 'D', 'D/I', 'S/C') from raw scores. */
export function determineDiscType(scores: Record<DiscKey, number>, lang: Lang) {
  const ranked = (['D', 'I', 'S', 'C'] as const).slice().sort((a, b) => {
    const diff = scores[b] - scores[a];
    return diff !== 0 ? diff : DISC_ORDER.indexOf(a) - DISC_ORDER.indexOf(b);
  });
  let hi = ranked.filter((f) => scores[f] > DISC_AVG_SCORE).slice(0, 3);
  if (!hi.length) hi = [ranked[0]];
  const code = hi.join('/');
  return {
    code,
    primary: hi[0],
    hi,
    ranked,
    scores,
    pattern: patternFor(code, hi[0], lang),
    primaryFactor: CONTENT[lang].factors[hi[0]],
  };
}
