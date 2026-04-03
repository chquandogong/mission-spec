// /mission-spec:ms-init — 자연어 → mission.yaml 초안 자동 생성
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { validateMission } from '../schema/validator.js';

export interface InitOptions {
  goal: string;
  title?: string;
  constraints?: string[];
  projectDir: string;
}

export interface ProjectContext {
  hasPackageJson: boolean;
  hasReadme: boolean;
  projectName?: string;
  projectDescription?: string;
}

export interface InitResult {
  yaml: string;
  parsed: { mission: MissionData };
  valid: boolean;
  errors: string[];
  context: ProjectContext;
}

interface MissionData {
  title: string;
  goal: string;
  done_when: string[];
  constraints?: string[];
  version?: string;
}

function detectProjectContext(projectDir: string): ProjectContext {
  const ctx: ProjectContext = {
    hasPackageJson: false,
    hasReadme: false,
  };

  const pkgPath = join(projectDir, 'package.json');
  if (existsSync(pkgPath)) {
    ctx.hasPackageJson = true;
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      ctx.projectName = pkg.name;
      ctx.projectDescription = pkg.description;
    } catch {
      // malformed package.json — ignore
    }
  }

  const readmePath = join(projectDir, 'README.md');
  if (existsSync(readmePath)) {
    ctx.hasReadme = true;
  }

  return ctx;
}

function deriveTitleFromGoal(goal: string): string {
  // 첫 문장을 제목으로 사용, 50자 이내로 자름
  const firstLine = goal.split('\n')[0].trim();
  if (firstLine.length <= 50) return firstLine;
  return firstLine.slice(0, 47) + '...';
}

function deriveDoneWhenFromGoal(goal: string): string[] {
  // 목표에서 핵심 동사+목적어 패턴 추출하여 완료 조건 생성
  const criteria: string[] = [];
  const goalText = goal.trim();

  // 기본 완료 조건: 목표 자체를 조건으로
  criteria.push(goalText.split('\n')[0].trim());

  // 공통 완료 조건 추가
  criteria.push('모든 관련 테스트 통과');

  return criteria;
}

export function generateMissionDraft(options: InitOptions): InitResult {
  if (!options.goal || options.goal.trim() === '') {
    throw new Error('goal은 필수입니다');
  }

  const context = detectProjectContext(options.projectDir);

  const title = options.title ?? deriveTitleFromGoal(options.goal);
  const doneWhen = deriveDoneWhenFromGoal(options.goal);

  const missionData: MissionData = {
    title,
    goal: options.goal.trim(),
    done_when: doneWhen,
  };

  if (options.constraints && options.constraints.length > 0) {
    missionData.constraints = options.constraints;
  }

  const doc = { mission: missionData };
  const yamlStr = stringify(doc);

  const validation = validateMission(doc);

  return {
    yaml: yamlStr,
    parsed: doc,
    valid: validation.valid,
    errors: validation.errors,
    context,
  };
}
