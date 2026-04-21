[English](README.md) | [한국어](README.ko.md) | 中文

# Mission Spec

[![GitHub](https://img.shields.io/github/license/chquandogong/mission-spec)](https://github.com/chquandogong/mission-spec)

面向 AI 代理工作流的 **任务契约层（Task Contract Layer）**。这不是编排框架，而是一个可移植的、运行级别的任务契约，运行在现有工具之上。提供 TypeScript 库、Claude Code 技能包，以及 **Living Asset Registry**。

**仓库地址：** https://github.com/chquandogong/mission-spec

## 核心流程

```text
自然语言 → mission.yaml 草案 → 评估脚手架 → 运行报告
                    ↕
           mission-history.yaml（变更台账）
```

## 5 分钟安装指南

### 方式 1：从 Claude Code Marketplace 安装（推荐）

```bash
# 在 Claude Code 中运行
/plugin marketplace add chquandogong/mission-spec
/plugin install mission-spec@mission-spec
```

安装后可直接使用以下技能：

- `/mission-spec:ms-init` — 自然语言 → mission.yaml 草案自动生成
- `/mission-spec:ms-eval` — 根据 done_when 标准评估当前状态
- `/mission-spec:ms-status` — 任务进度摘要
- `/mission-spec:ms-report` — 生成运行报告（Markdown）
- `/mission-spec:ms-context` — 为 AI 代理生成项目上下文提示（v1.7.0+）
- `/mission-spec:ms-decide` — 从自然语言决策描述生成 MDR（Mission Decision Record）草稿（v1.14.0+）

### 方式 2：从源码安装

```bash
git clone https://github.com/chquandogong/mission-spec.git
cd mission-spec
npm install
npm run build
```

### 方式 3：作为本地插件链接

```bash
# 在项目目录中
git clone https://github.com/chquandogong/mission-spec.git .mission-spec
cd .mission-spec && npm install && npm run build && cd ..
```

在 `.claude/settings.json` 中添加插件路径：

```json
{
  "plugins": [".mission-spec"]
}
```

## 使用方法

### 生成任务草案（`ms-init`）

```typescript
import { generateMissionDraft } from "mission-spec";

const result = generateMissionDraft({
  goal: "实现用户认证系统",
  projectDir: ".",
});

console.log(result.yaml);
```

### 评估进度（`ms-eval`）

```typescript
import { evaluateMission } from "mission-spec";

const result = evaluateMission(".");
console.log(result.summary);
```

对于 fresh clone 或共享仓库审阅，可使用
`evaluateMission(".", { scope: "shared" })` 或 `npx mission-spec eval --shared`。
shared mode 会把那些只引用缺失且被 gitignore 的本地专用 artifact 的 criteria
视为 skip/pass。

### 状态摘要（`ms-status`）

```typescript
import { getMissionStatus } from "mission-spec";

const status = getMissionStatus(".");
console.log(status.markdown);
```

`getMissionStatus(".", { scope: "shared" })` 与 `npx mission-spec status --shared`
也会把同样的 shared-clone 规则应用到状态/漂移报告。

### 生成报告（`ms-report`）

```typescript
import { generateMissionReport } from "mission-spec";

const report = generateMissionReport(".");
console.log(report.markdown);
```

### 生成 AI 代理上下文（`ms-context`）

```typescript
import { generateContext } from "mission-spec";

const ctx = generateContext(".");
console.log(ctx.markdown); // 统一提示：mission + history + architecture + API
console.log(ctx.sections); // ["mission", "design_refs", "history", "decisions", "architecture", "api"]
```

### 生成 MDR 草稿（`ms-decide`）

```typescript
import { generateMdrDraft } from "mission-spec";

const result = generateMdrDraft({
  title: "采用厂商中立的平台适配器",
  projectDir: ".",
});

console.log(result.suggestedPath); // .mission/decisions/MDR-00N-...md
console.log(result.nextMdrNumber); // 下一个 MDR 编号
console.log(result.markdown); // Context / Decision / Rationale / Consequences / Alternatives 各节的脚手架
```

文件名通过 Unicode NFC + `/u` 标志进行 slugify，中文/韩文/日文标题也能稳定生成不冲突的文件名（v1.14.1+）。

也支持子路径导入：

```typescript
import { evaluateMission } from "mission-spec/commands/eval";
```

Migration 脚本必须显式传入目标 schema 版本：

```bash
npm run migrate:dry-run -- <toVersion>
npm run migrate:apply -- <toVersion>
```

目前还没有注册任何 migrator；在定义 schema v2 之前，registry 会保持为空。

## mission.yaml 格式

```yaml
mission:
  title: "任务标题"
  goal: "任务目标"
  done_when:
    - "完成条件 1"
    - "完成条件 2"
  constraints:
    - "约束条件"
  approvals:
    - gate: "review"
      approver: "human"
  execution_hints:
    topology: "sequential"
  design_refs: # v1.7.0+
    architecture: "docs/internal/ARCHITECTURE.md"
    api_surface: "src/index.ts"
    type_definitions: "src/core/parser.ts"
    component_protocol: "docs/internal/DATA_FLOW.md"
  lineage: # v1.5.0+
    initial_version: "1.0.0"
    initial_date: "2026-04-02"
    total_revisions: 3
    history: "mission-history.yaml"
```

完整 Schema：[`src/schema/mission.schema.json`](src/schema/mission.schema.json)

## Living Asset Registry（v1.5.0）

将 mission.yaml 的变更历史结构化管理为组织资产。

### 目录结构

```
project-root/
├── mission.yaml                    # 当前权威规范
├── mission-history.yaml            # 结构化变更台账
└── .mission/
    ├── CURRENT_STATE.md            # 当前状态仪表板
    ├── snapshots/                  # 各版本 mission.yaml 归档
    ├── decisions/                  # MDR（Mission Decision Records）
    └── templates/                  # 变更条目 + MDR 模板
```

### mission-history.yaml

以结构化 YAML 追踪变更意图、影响范围和完成条件变化：

```yaml
timeline:
  - change_id: "MSC-2026-04-08-001"
    semantic_version: "1.5.0"
    date: "2026-04-08"
    author: "Dr. QUAN"
    change_type: "enhancement"
    persistence: "permanent" # permanent | transient | experimental
    intent: "引入 Living Asset Registry"
    done_when_delta: # 追踪完成条件变化
      added: [".claude-plugin/plugin.json exists"]
      removed: []
    impact_scope:
      schema: true
      skills: true
```

### lineage 字段

使用 `ms-init` 创建新任务时，`lineage` 字段会自动包含：

```yaml
lineage:
  initial_version: "1.0.0"
  history: "mission-history.yaml"
```

### 工具集成

- **ms-status**：读取 `mission-history.yaml`，显示当前阶段和演进摘要
- **ms-report**：在报告中包含最近 3 条变更记录
- **ms-init**：创建新任务时自动生成 `lineage` + `version`

### History API

```typescript
import {
  loadHistory,
  getCurrentPhase,
  getLatestEntry,
  validateHistory,
} from "mission-spec";

const history = loadHistory("."); // Schema 错误时抛出异常（v1.6.0+）
if (history) {
  console.log(getCurrentPhase(history)); // { name: "living-asset", theme: "..." }
  console.log(getLatestEntry(history)); // 最新 timeline 条目
}

// 验证任意数据是否符合 mission-history.yaml schema
const { valid, errors } = validateHistory(anyData);
```

## LLM/主观评估（v1.6.0+）

对于无法机械判定的 done_when 条件，可定义为 `llm-eval` 或 `llm-judge` 类型 eval，并在 `.mission/evals/<eval-name>.result.yaml` 中记录外部裁定：

```yaml
# mission.yaml
done_when:
  - "subjective_quality"
evals:
  - name: "subjective_quality"
    type: "llm-eval" # 或 "llm-judge"
    pass_criteria: "UX 直观且无用户困惑"
```

```yaml
# .mission/evals/subjective_quality.result.yaml
passed: true
reason: "3 名审阅者裁定"
evaluated_by: "human" # 或 "llm-claude"、"llm-gpt5" 等
evaluated_at: "2026-04-13"
```

`ms-eval` 读取覆盖文件以确认裁定。如果文件不存在，该条件保持"等待 LLM 评估"状态。

## 快照与 Pre-Commit 钩子（v1.6.0+）

`mission.yaml` 变更时，自动将各版本快照归档至 `.mission/snapshots/`：

```bash
# 手动创建快照
npm run snapshot

# 提交时自动快照（仅需设置一次）
git config core.hooksPath .githooks
```

快照脚本执行基于版本的去重——如果同一 `version` 的快照已存在则跳过。

此外，`npm run validate:history-commits` 可将 `mission-history.yaml` 中的 `related_commits` 与实际 Git 历史进行交叉验证。当前仓库中已提交的 `.githooks/pre-commit` 会执行：

- 生成并暂存快照
- 重新生成并暂存 `CHANGELOG.md`
- 同步并暂存 `.mission/` 元数据头部
- 同步/校验 Architecture snapshot（当 `dist/core` 存在时）
- 通过 `npm run validate:history-commits` 校验 `related_commits` 覆盖情况

该验证还会捕获已提交但历史记录中缺失的相关 commit。为避免自引用问题，有两个例外：首次引入 `mission-history.yaml` 的 **bootstrap commit**，以及 **当前 HEAD** 在修改代码的同时也修改了 `mission-history.yaml` 的情况。后续有新 commit 推入后，之前的 code+history 同时提交也会重新纳入验证范围。

## 提交前校验（v1.17.0+）

在 commit 时强制 `mission.yaml` + `mission-history.yaml` 的 schema 有效性。不调用 evaluator，仅做 schema 检查 — 快速、deterministic — 在 schema drift 进入 repo 之前阻止 commit。

默认安装（`.git/hooks/`）：

```bash
npm install --save-dev mission-spec
cp node_modules/mission-spec/templates/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

团队共享变体（`.githooks/` + `core.hooksPath`）：

```bash
mkdir -p .githooks
cp node_modules/mission-spec/templates/pre-commit .githooks/pre-commit
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

随包分发的 `templates/pre-commit` hook 调用 `npx mission-spec validate`，同一命令也可独立用于 CI / 手动校验。本仓库自带的 `.githooks/pre-commit` 则在此基础上叠加了维护者自动化步骤。

对于省略空 `changes.*` / `done_when_delta.*` 数组的 legacy
`mission-history.yaml` 条目，验证前会先做 normalize；类型错误仍然会失败。

## 回填 related_commits（v1.18.0+）

扫描 `mission-history.yaml` 中的空 `related_commits: []` 条目，按每条 revision date 的 ±1-day 时间窗匹配 git commit 并回填。默认 dry-run；`--apply` 将单候选结果直接写入文件。

```bash
# 仅查看提案（不写入）
npx mission-spec backfill-commits

# 应用单候选提案
npx mission-spec backfill-commits --apply
git add mission-history.yaml
git commit -m "chore: backfill related_commits via ms-backfill-commits"
```

每条分类：

- **auto-apply** — 窗口内恰好 1 个 commit；`--apply` 时写入。
- **ambiguous** — 窗口内 ≥2 个 commit；列出但不写入（手动编辑）。
- **no-candidates** — 窗口内 0 个 commit；列出，无需处理。

已填充的 `related_commits` 数组**绝不会**被覆盖。

## 提交时快照（v1.19.0+）

在 `.mission/snapshots/` 下生成 `mission.yaml` 的逐版本副本。按 `mission.version` 幂等——相同版本再次调用返回已存在的快照（不产生重复文件）。语言无关——任何安装了 Node 与 mission-spec 的项目都可使用。

```bash
# 独立调用
npx mission-spec snapshot
```

adopter 最小 hook 示例（结合 v1.17.0 validate 与 v1.19.0 snapshot）：

```sh
#!/bin/sh
set -e
npx mission-spec validate
npx mission-spec snapshot
git add .mission/snapshots/
```

已安装 v1.17.0 的采用者：编辑本地 `.git/hooks/pre-commit`，仅添加 `snapshot` 与 `git add` 两行即可。包内 `templates/pre-commit` 保持不变（单步 validate），无需 `cp` 重装。

## 跨平台转换

```bash
node scripts/convert-platforms.js mission.yaml
```

生成文件（v1.14.0+ — 6 个平台）：

- `.cursorrules` — Cursor 用
- `AGENTS.md` — Codex 用
- `opencode.toml` — OpenCode 用
- `.clinerules` — Cline 用（v1.14.0+）
- `.continuerules` — Continue 用（v1.14.0+）
- `.aider.conf.yml` + `.aider-mission.md` — Aider 用（v1.14.0+）

仅验证模式：

```bash
node scripts/convert-platforms.js --verify
```

## 测试

```bash
npm test
npm run test:watch
npm run build
```

## 当前范围

- 提供中：Schema 验证、任务草案生成、基于规则的评估、状态/报告生成
- 提供中：跨平台转换 — Cursor、Codex、OpenCode、Cline、Continue、Aider（v1.14.0+）
- 提供中：Claude Code 技能文件 `ms-init`、`ms-eval`、`ms-status`、`ms-report`、`ms-context`、`ms-decide`
- 提供中：CLI — `npx mission-spec <context|status|eval|report|validate|backfill-commits|snapshot>`（v1.12.0+，后续版本继续扩展）
- 提供中：Living Asset Registry — `lineage` Schema、`mission-history.yaml` 变更台账、MDR、快照
- 提供中：History API — `loadHistory()`、`getCurrentPhase()`、`getLatestEntry()`、`validateHistory()`
- 提供中：LLM/主观评估覆盖（`llm-eval`、`llm-judge` + `.mission/evals/<name>.result.yaml`）
- 提供中：快照自动化（`npm run snapshot`、`.githooks/pre-commit`）
- 提供中：`design_refs` Schema 字段 + `architecture_delta` history 字段（v1.7.0+）
- 提供中：Architecture Registry、Dependency Graph、API Registry、Traceability Matrix（`.mission/` 下）
- 提供中：Architecture/plugin drift detector — `extractArchitecture()`、`validatePlugin()`、`arch:sync`/`check`/`verify`（v1.10.0+、v1.11.0+）
- 提供中：MDR 撰写助手 — `ms-decide` 技能 + `generateMdrDraft()`（v1.14.0+）
- 提供中：Schema 迁移基础设施 — `detectSchemaVersion()`、`registerMigration()`、`migrateMission()` + CLI wrapper `npm run migrate:dry-run -- <toVersion>` / `npm run migrate:apply -- <toVersion>`（v1.14.0+，schema v2 之前 registry 为空）
- 提供中：Reconstruction verifier — `verifyReconstructionReferences()` + `reconstruction:verify [--cold-build]`（v1.14.0+）
- 提供中：Release pipeline — `.github/workflows/{test,pre-commit-parity,release}.yml`（v1.9.0+、v1.13.0+）
- 提供中：`.mission/` 元数据自动同步 — `scripts/bump-metadata.js` 将 Version 头部和 CURRENT_STATE Title 行从 `mission.yaml` 自动同步（`npm run metadata:sync` / `metadata:check`，v1.15.0+、v1.16.3+ Title、v1.16.10+ CURRENT_STATE 专属 filename guard）
- 提供中：Registry 新鲜度验证器 — `scripts/verify-registry.js` 通过 TypeScript AST 核对 `REBUILD_PLAYBOOK.md`、`TRACE_MATRIX.yaml`、`CURRENT_STATE.md`（Title 行、完成计数标题 `완료 조건 (N/M PASS)`、近期发布标题 `최근 구현 (vA ~ vB)` — 韩文标签由 MDR-007 locale 策略保留为韩文，因为 `.mission/` 是维护者面向资产）与 live source（`npm run registry:check`，v1.16.0+、v1.16.2+ CURRENT_STATE、v1.16.9+ locale-tolerant Title + version range、v1.16.13+ 可选 `--verify-live` 模式将声明的 PASS 与 `evaluateMission()` 结果机械对齐）
- 提供中：Cold-build release gate — `reconstruction:verify --cold-build` 作为 release workflow 步骤运行，证明 tagged commit 可仅依赖源码重建（v1.16.1+）
- 提供中：`arch:verify` deep-compare — `package.json.exports` 的嵌套 conditional exports 结构递归比较（v1.14.3+ key-set、v1.16.2+ value shape、v1.16.11+ nested depth）
- 提供中：`plugin-validator` `package-lock.json` drift 检测 — 捕获 lockfile 停留在过去 release 版本的情况（v1.16.7+）
- 提供中：`vitest.config.ts` 确定性 test timeout — `testTimeout: 15000` 消除 `describe.concurrent` 的 order-dependent flakiness（v1.16.8+）
- 提供中：Governance MDR 系列 — `MDR-005` meta-tooling 范围（v1.14.2+）、`MDR-006` SemVer 等级策略（v1.16.4+）、`MDR-007` playbook 语言 Hold+Trigger（v1.16.5+）
- 不包含：GitHub/PR 集成运行时、独立编排框架、SaaS/UI

## 设计原则

1. **仅任务契约** — 不涉及编排、运行时或能力层
2. **execution_hints 是建议** — 运行时可以忽略
3. **融入现有工作流** — 适配现有环境而非要求独立平台
4. **最小依赖** — Node.js + Ajv + yaml
5. **TDD 优先** — 用测试锁定当前范围

## 许可证

MIT
