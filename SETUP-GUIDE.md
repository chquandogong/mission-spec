# Agent OS 구성 가이드 — 자율 장시간 작업 환경

## 1. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Ubuntu Workstation                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    tmux session: mission-spec             │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │ │
│  │  │  Pane 1:    │  │  Pane 2:     │  │  Pane 3:      │  │ │
│  │  │  Claude Code │  │  Codex       │  │  Monitor      │  │ │
│  │  │  (Main AI)  │  │  (Reviewer)  │  │  (Status/Log) │  │ │
│  │  │             │  │              │  │               │  │ │
│  │  │  Plugins:   │  │  역할:       │  │  역할:        │  │ │
│  │  │  -superpowers│  │  -교차검증   │  │  -git log     │  │ │
│  │  │  -compound  │  │  -adversarial│  │  -test watch  │  │ │
│  │  │  -ms:* (우리)│  │  -품질 리뷰 │  │  -telegram    │  │ │
│  │  └─────────────┘  └──────────────┘  └───────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Project Directory                          │ │
│  │  ~/projects/mission-spec/                                 │ │
│  │  ├── CLAUDE.md          (프로젝트 가이드)                 │ │
│  │  ├── mission.yaml       (작업 계약 — dogfooding)          │ │
│  │  ├── .claude/           (auto memory, rules)              │ │
│  │  ├── src/               (구현 코드)                       │ │
│  │  ├── tests/             (TDD 테스트)                      │ │
│  │  └── .git/              (버전 관리)                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Notification Layer                          │ │
│  │  Telegram Bot → Phase 완료/실패/승인 요청 알림            │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 2. 사전 요구사항

```bash
# System
sudo apt update && sudo apt install -y tmux git curl jq

# Node.js (v20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Codex CLI (교차 검증용)
npm install -g @openai/codex

# TypeScript
npm install -g typescript ts-node

# 선택: Telegram notify 도구
# (아래 Telegram 섹션 참조)
```

## 3. 프로젝트 초기화

```bash
# 디렉토리 생성
mkdir -p ~/projects/mission-spec
cd ~/projects/mission-spec
git init

# Bootstrap 파일 복사 (이 패키지의 파일들)
# CLAUDE.md, mission.yaml을 프로젝트 루트에 복사

# Node.js 프로젝트 초기화
npm init -y

# 기본 dev dependencies
npm install --save-dev typescript @types/node ajv ajv-formats
npm install --save-dev vitest @vitest/coverage-v8
npm install --save-dev yaml

# tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF
```

## 4. Plugin 설치

```bash
# Superpowers — 구조화된 개발 워크플로우
claude /plugin install superpowers@claude-plugins-official

# Compound Engineering — 복합 학습
claude /plugin install compound-engineering@claude-plugins-official

# 확인
claude /plugin list
```

## 5. tmux 세션 구성

```bash
# 세션 생성
tmux new-session -d -s mission-spec -c ~/projects/mission-spec

# Pane 분할
# Pane 0: Claude Code (메인 작업자)
# Pane 1: Codex (교차 검증)
# Pane 2: Monitor (상태/로그)

tmux split-window -h -t mission-spec
tmux split-window -v -t mission-spec:0.1

# 각 Pane에 이름 지정
tmux select-pane -t mission-spec:0.0 -T "Claude"
tmux select-pane -t mission-spec:0.1 -T "Codex"
tmux select-pane -t mission-spec:0.2 -T "Monitor"

# 접속
tmux attach -t mission-spec
```

## 6. Claude Code 실행 (자율 모드)

```bash
# Pane 0 (Claude)에서:
cd ~/projects/mission-spec

claude --dangerously-skip-permissions \
       --disallowed-tools "AskUserQuestion,EnterPlanMode" \
       -p "$(cat BOOTSTRAP-PROMPT.md | sed -n '/^```$/,/^```$/{ /^```$/d; p; }' | head -80)"

# 또는 더 간단하게:
claude --dangerously-skip-permissions \
       --disallowed-tools "AskUserQuestion,EnterPlanMode"
# 그 후 BOOTSTRAP-PROMPT.md의 "Claude Code에 입력할 초기 프롬프트" 섹션을 붙여넣기
```

## 7. Codex 교차 검증 (별도 Pane)

```bash
# Pane 1 (Codex)에서:
cd ~/projects/mission-spec

# Phase 완료 시마다 실행:
codex "이 프로젝트의 최근 변경사항을 adversarial review해줘. \
       1) mission.yaml의 constraints 위반 여부 \
       2) schema 설계 적절성 \
       3) TDD 준수 여부 \
       4) execution_hints가 advisory로 남아있는지 \
       5) scope creep 징후"
```

## 8. Monitor Pane 설정

```bash
# Pane 2 (Monitor)에서:
cd ~/projects/mission-spec

# 간단한 모니터링 루프
watch -n 30 '
echo "=== Git Status ==="
git log --oneline -5
echo ""
echo "=== Test Status ==="
npm test 2>&1 | tail -5
echo ""
echo "=== Mission Progress ==="
if [ -f mission.yaml ]; then
  grep "done_when:" -A 20 mission.yaml | head -15
fi
'
```

## 9. Telegram 알림 설정

```bash
# 1. @BotFather에서 봇 생성 후 TOKEN 획득
# 2. 봇에게 메시지 보내서 CHAT_ID 획득

# 환경변수 설정
echo 'export TELEGRAM_TOKEN="YOUR_BOT_TOKEN"' >> ~/.bashrc
echo 'export TELEGRAM_CHAT_ID="YOUR_CHAT_ID"' >> ~/.bashrc
source ~/.bashrc

# notify 함수
cat >> ~/.bashrc << 'NOTIFY_EOF'
notify() {
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
    -d chat_id="${TELEGRAM_CHAT_ID}" \
    -d text="🤖 Mission Spec: $1" \
    -d parse_mode="Markdown" > /dev/null 2>&1
}
NOTIFY_EOF
source ~/.bashrc

# 테스트
notify "Agent OS 구성 완료 — 작업 준비됨"
```

## 10. Git Hook (Phase 완료 자동 알림)

```bash
# post-commit hook
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
MSG=$(git log -1 --pretty=%B)
source ~/.bashrc
notify "Commit: ${MSG:0:100}"
EOF
chmod +x .git/hooks/post-commit
```

## 11. 장시간 안정성 설정

```bash
# tmux 세션 유지 (서버 재시작 방지)
# /etc/systemd/logind.conf에서:
# KillUserProcesses=no

# Claude Code 자동 재시작 (crash 복구)
cat > ~/restart-claude.sh << 'EOF'
#!/bin/bash
cd ~/projects/mission-spec
while true; do
  claude --dangerously-skip-permissions \
         --disallowed-tools "AskUserQuestion,EnterPlanMode" \
         -c "mission.yaml을 읽고 마지막 git commit 이후의 작업을 이어서 진행하세요."

  notify "⚠️ Claude Code 세션 종료 — 10초 후 재시작"
  sleep 10
done
EOF
chmod +x ~/restart-claude.sh
```

## 12. 작업 흐름 요약

```
1. tmux 세션 시작
2. Pane 0: Claude Code 자율 실행 시작 (BOOTSTRAP-PROMPT)
3. Pane 1: 대기 (Phase 완료 시 Codex 교차 검증)
4. Pane 2: Monitor 실행
5. Telegram으로 진행 상황 알림 수신
6. 승인 게이트 도달 시 → Telegram 알림 → 인간 검토 → 승인/반려
7. Phase 7 완료 시 → v1.0.0 태그 → GitHub 릴리스
```

## 13. 궁극적 목표: Agent OS

이 Mission Spec 구현은 더 큰 목표의 첫 단계입니다:

```
Phase 1 (현재): Mission Spec Plugin — task contract layer
Phase 2: Agent OS Core — mission-driven autonomous execution
Phase 3: Multi-Agent Coordination — 여러 AI가 mission 기반으로 협업
Phase 4: Self-Improving System — mission eval 결과가 다음 mission을 개선
```

Agent OS의 핵심 아이디어:
- **Mission = 운영체제의 Process**: 각 작업이 명시적 계약(mission.yaml)을 가짐
- **Eval = 운영체제의 Exit Code**: 완료 여부가 기계적으로 판정됨
- **Handoff = 운영체제의 IPC**: 에이전트 간 인수인계가 계약 기반으로 이루어짐
- **Auto Memory = 운영체제의 File System**: 지식이 세션을 넘어 누적됨

Mission Spec이 먼저 작동해야 나머지가 가능합니다.
