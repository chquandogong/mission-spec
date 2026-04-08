// ms-init — 자연어 → mission.yaml 초안 자동 생성
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";
import { validateMission } from "../schema/validator.js";

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
  lineage?: {
    initial_version: string;
    initial_date: string;
    total_revisions: number;
    history: string;
  };
}

function detectProjectContext(projectDir: string): ProjectContext {
  const ctx: ProjectContext = {
    hasPackageJson: false,
    hasReadme: false,
  };

  const pkgPath = join(projectDir, "package.json");
  if (existsSync(pkgPath)) {
    ctx.hasPackageJson = true;
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      ctx.projectName = pkg.name;
      ctx.projectDescription = pkg.description;
    } catch {
      // malformed package.json — ignore
    }
  }

  const readmePath = join(projectDir, "README.md");
  if (existsSync(readmePath)) {
    ctx.hasReadme = true;
  }

  return ctx;
}

function deriveTitleFromGoal(goal: string): string {
  // 첫 문장을 제목으로 사용, 50자 이내로 자름
  const firstLine = goal.split("\n")[0].trim();
  if (firstLine.length <= 50) return firstLine;
  return firstLine.slice(0, 47) + "...";
}

function deriveDoneWhenFromGoal(goal: string): string[] {
  const criteria: string[] = [];
  const goalText = goal.trim();
  const firstLine = goalText.split("\n")[0].trim();

  // 1. 핵심 목표
  criteria.push(firstLine);

  // 2. 동사 기반 추론 (구현, 추가, 생성 등)
  if (/구현|개발|작성|추가|생성|implement|add|create|write/i.test(goalText)) {
    criteria.push("코드 구현 완료 및 작동 확인");
  }

  // 3. 테스트/검증
  if (/테스트|검증|verify|test/i.test(goalText)) {
    criteria.push("모든 단위 테스트 통과");
  } else {
    criteria.push("npm test 또는 핵심 로직 검증 완료");
  }

  // 4. 문서화
  if (/문서|가이드|README|doc/i.test(goalText)) {
    criteria.push("README.md 또는 관련 문서 업데이트");
  }

  return criteria;
}

export function generateMissionDraft(options: InitOptions): InitResult {
  if (!options.goal || options.goal.trim() === "") {
    throw new Error("goal은 필수입니다");
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

  const today = new Date().toISOString().slice(0, 10);
  missionData.version = "1.0.0";
  missionData.lineage = {
    initial_version: "1.0.0",
    initial_date: today,
    total_revisions: 1,
    history: "mission-history.yaml",
  };

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
