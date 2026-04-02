# Mission Spec 구현 — Claude Code CLI 부트스트랩 프롬프트

## 이 파일의 용도

Ubuntu 컴퓨터에서 Claude Code CLI를 실행할 때, 이 프롬프트를 초기 입력으로 사용합니다.

---

## 실행 전 환경 준비 (1회)

```bash
# 1. 프로젝트 디렉토리 생성
mkdir -p ~/projects/mission-spec && cd ~/projects/mission-spec
git init

# 2. 이 bootstrap 파일들 복사
cp /path/to/mission-spec-bootstrap/* .
# (CLAUDE.md, mission.yaml, BOOTSTRAP-PROMPT.md, SETUP-GUIDE.md)

# 3. Plugin 설치 (선택적이지만 권장)
claude /plugin install superpowers@claude-plugins-official
claude /plugin install compound-engineering@claude-plugins-official

# 4. Codex 설치 (교차 검증용)
npm install -g @openai/codex
codex setup  # API key 설정

# 5. tmux 세션 시작
tmux new-session -s mission-spec

# 6. Claude Code 실행 (자율 모드)
claude --dangerously-skip-permissions \
       --disallowed-tools "AskUserQuestion,EnterPlanMode" \
       --add-dir ~/projects/mission-spec
```

---

## Claude Code에 입력할 초기 프롬프트

아래를 Claude Code CLI에 붙여넣으세요:

```
이 프로젝트는 Mission Spec — AI 에이전트 워크플로를 위한 task contract layer — 의 Claude Code plugin 구현입니다.

CLAUDE.md와 mission.yaml을 읽고, 아래 순서대로 작업하세요.

## 전체 작업 흐름

### Phase 1: Schema + CLI Skeleton
1. mission.yaml을 읽어 프로젝트 목표와 제약 확인
2. package.json, tsconfig.json 초기화 (TypeScript, minimal deps)
3. mission.schema.json 작성 (JSON Schema draft-07)
   - 필수: title, goal, done_when
   - 선택: constraints, approvals, evals, budget_hint, execution_hints, skills_needed, artifacts, version, author
4. validator.ts 작성 + 테스트
5. .claude-plugin/manifest.json 작성 (commands: ms:init, ms:eval, ms:status, ms:report)
6. Git commit: "feat: initial schema and CLI skeleton"

### Phase 2: /ms:init Command
1. init.test.ts 작성 (TDD)
2. init.ts 구현: 현재 프로젝트 컨텍스트(README, package.json, git log 등)를 읽어 mission.yaml 초안 생성
3. 자연어 입력 → YAML 변환 로직
4. schema validation 통합
5. Git commit: "feat: /ms:init command"

### Phase 3: /ms:eval + /ms:status
1. eval.test.ts, status.test.ts 작성
2. evaluator.ts: done_when 조건을 체크리스트로 평가 (rule-based)
3. eval.ts: /ms:eval 커맨드 — mission.yaml의 done_when 기준 대비 현재 상태
4. status.ts: /ms:status 커맨드 — 진행 상황 요약
5. Git commit: "feat: /ms:eval and /ms:status commands"

### Phase 4: /ms:report
1. report.test.ts 작성
2. reporter.ts: run report 생성 (markdown)
3. report.ts: /ms:report 커맨드
4. Git commit: "feat: /ms:report command"

### Phase 5: Cross-Platform Conversion
1. platforms.ts: Cursor, Codex, OpenCode 포맷 변환
2. convert-platforms.js 스크립트
3. Git commit: "feat: cross-platform conversion"

### Phase 6: README + Dogfooding
1. README.md 작성 (5분 이내 설치·사용 가이드)
2. 이 프로젝트의 mission.yaml로 /ms:eval 실행하여 dogfooding
3. examples/ 디렉토리에 예제 3개 작성
4. Git commit: "docs: README and examples"

### Phase 7: Adversarial Review
1. 모든 테스트 실행, lint 확인
2. 스스로 코드 리뷰 (security, edge cases, error handling)
3. mission.yaml의 done_when 전체 점검
4. Git commit: "chore: final review and cleanup"

## 작업 규칙
- 각 Phase 시작 전 mission.yaml의 해당 done_when을 확인
- TDD: 항상 테스트 먼저
- 한 번에 하나의 파일만 수정
- 매 Phase 완료 시 git commit
- execution_hints는 advisory only — orchestration 로직 금지
- 외부 API 호출 없음 (v1은 rule-based eval만)

지금 Phase 1부터 시작하세요. CLAUDE.md를 읽은 후 mission.yaml을 읽고, 작업을 시작하세요.
```

---

## Codex 교차 검증 (별도 터미널에서)

Phase가 완료될 때마다 Codex로 교차 검증:

```bash
# tmux의 다른 pane에서
cd ~/projects/mission-spec
codex "이 프로젝트의 최근 커밋을 adversarial review해줘. mission.yaml의 constraints를 위반하는 코드가 있는지, schema 설계가 적절한지, TDD가 제대로 되었는지 확인해줘."
```

---

## Telegram 알림 설정 (선택)

```bash
# Telegram Bot API로 Phase 완료 알림
TELEGRAM_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"

notify() {
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
    -d chat_id="${TELEGRAM_CHAT_ID}" \
    -d text="🤖 Mission Spec: $1" > /dev/null
}

# 사용 예: notify "Phase 1 완료 — Schema + CLI Skeleton"
```

---

## 예상 소요 시간

| Phase | 예상 시간 | 주요 산출물 |
|-------|----------|------------|
| Phase 1 | 30-45분 | schema, validator, manifest |
| Phase 2 | 45-60분 | /ms:init command |
| Phase 3 | 45-60분 | /ms:eval, /ms:status |
| Phase 4 | 30-45분 | /ms:report |
| Phase 5 | 30분 | cross-platform |
| Phase 6 | 30분 | README, examples |
| Phase 7 | 45-60분 | review, cleanup |
| **합계** | **약 4-6시간** | **v1.0 릴리스 가능** |
