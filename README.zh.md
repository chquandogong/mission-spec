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

### 状态摘要（`ms-status`）

```typescript
import { getMissionStatus } from "mission-spec";

const status = getMissionStatus(".");
console.log(status.markdown);
```

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

也支持子路径导入：

```typescript
import { evaluateMission } from "mission-spec/commands/eval";
```

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

此外，`npm run validate:history-commits` 可将 `mission-history.yaml` 中的 `related_commits` 与实际 Git 历史进行交叉验证。Pre-commit 钩子同时执行两项操作：

- 生成并暂存新版本快照
- 验证合约相关的暂存变更是否包含 `mission-history.yaml`

该验证还会捕获已提交但历史记录中缺失的相关 commit。为避免自引用问题，有两个例外：首次引入 `mission-history.yaml` 的 **bootstrap commit**，以及 **当前 HEAD** 在修改代码的同时也修改了 `mission-history.yaml` 的情况。后续有新 commit 推入后，之前的 code+history 同时提交也会重新纳入验证范围。

## 跨平台转换

```bash
node scripts/convert-platforms.js mission.yaml
```

生成文件：

- `.cursorrules` - Cursor 用
- `AGENTS.md` - Codex 用
- `opencode.toml` - OpenCode 用

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
- 提供中：Cursor、Codex、OpenCode 跨平台转换
- 提供中：Claude Code 技能文件 `ms-init`、`ms-eval`、`ms-status`、`ms-report`
- 提供中：Living Asset Registry — `lineage` Schema、`mission-history.yaml` 变更台账、MDR、快照
- 提供中：History API — `loadHistory()`、`getCurrentPhase()`、`getLatestEntry()`、`validateHistory()`
- 提供中：LLM/主观评估覆盖（`llm-eval`、`llm-judge` + `.mission/evals/<name>.result.yaml`）
- 提供中：快照自动化（`npm run snapshot`、`.githooks/pre-commit`）
- 提供中：`design_refs` Schema 字段 + `architecture_delta` history 字段（v1.7.0+）
- 提供中：Architecture Registry、Dependency Graph、API Registry、Traceability Matrix（`.mission/` 下）
- 不包含：GitHub/PR 集成运行时、独立编排框架、SaaS/UI

## 设计原则

1. **仅任务契约** — 不涉及编排、运行时或能力层
2. **execution_hints 是建议** — 运行时可以忽略
3. **融入现有工作流** — 适配现有环境而非要求独立平台
4. **最小依赖** — Node.js + Ajv + yaml
5. **TDD 优先** — 用测试锁定当前范围

## 许可证

MIT
