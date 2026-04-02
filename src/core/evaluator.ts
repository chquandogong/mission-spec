// done_when 조건 평가 엔진
// Phase 3에서 구현 예정

export interface EvalResult {
  criterion: string;
  passed: boolean;
  reason: string;
}

export function evaluateDoneWhen(_criteria: string[]): EvalResult[] {
  throw new Error('Not implemented — Phase 3');
}
