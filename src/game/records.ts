export interface RunRecords {
  bestScore: number;
  bestStage: number;
  totalVictories: number;
  totalRuns: number;
}

const STORAGE_KEY = 'marrowblade_records_v1';

const DEFAULT_RECORDS: RunRecords = {
  bestScore: 0,
  bestStage: 0,
  totalVictories: 0,
  totalRuns: 0,
};

export function loadRunRecords(): RunRecords {
  if (typeof window === 'undefined') return { ...DEFAULT_RECORDS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_RECORDS };
    const parsed = JSON.parse(raw) as Partial<RunRecords>;
    return {
      bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
      bestStage: typeof parsed.bestStage === 'number' ? parsed.bestStage : 0,
      totalVictories:
        typeof parsed.totalVictories === 'number' ? parsed.totalVictories : 0,
      totalRuns: typeof parsed.totalRuns === 'number' ? parsed.totalRuns : 0,
    };
  } catch {
    return { ...DEFAULT_RECORDS };
  }
}

export function saveRunResult(
  score: number,
  stage: number,
  victory: boolean
): RunRecords {
  const prev = loadRunRecords();
  const next: RunRecords = {
    bestScore: Math.max(prev.bestScore, score),
    bestStage: Math.max(prev.bestStage, stage),
    totalVictories: prev.totalVictories + (victory ? 1 : 0),
    totalRuns: prev.totalRuns + 1,
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}
