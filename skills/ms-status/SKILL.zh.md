---
name: ms-status
description: >
  基于 mission.yaml 以 Markdown 格式汇总任务进度。
  由"任务状态"、"进度"、"完成了多少"等请求触发。
user-invocable: true
allowed-tools:
  - Read
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

[English](SKILL.md) | [한국어](SKILL.ko.md) | [中文](SKILL.zh.md)

# ms-status — 任务进度摘要

## 行为

1. 读取 `mission.yaml` 并验证 Schema。
2. 提取任务元数据（title、goal、constraints）。
3. 评估每个 done_when 条件以计算进度。
4. 以 Markdown 格式输出摘要。

## 运行方法

```bash
node -e "
import { getMissionStatus } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/status.js';
const s = getMissionStatus('.');
console.log(s.markdown);
"
```

## 输出格式

```markdown
# 任务标题

**Goal:** 任务目标文本

**Progress:** 3/5

## Constraints

- 约束条件 1
- 约束条件 2

## Done When

- [x] 已完成条件
- [ ] 未完成条件
  - 失败原因
```

## Evolution 部分（v1.5.0+）

如果项目根目录存在 `mission-history.yaml`，输出中将添加 Evolution 部分：

```markdown
## Evolution

**Phase:** living-asset — 引入 Living Asset Registry
**Revisions:** 5

- **initial-release** (1.0.0): 核心功能实现
- **stabilization** (1.1.0): 解决命名冲突
- **hardening** (1.2.0): 反映对抗性审查
- **marketplace-ready** (1.4.0): 发布准备，确立身份
- **living-asset** (1.5.0): 引入 Living Asset Registry
```

返回值中包含 `phase`、`phaseTheme` 和 `totalRevisions` 字段。

## Scaffolding 部分（v1.16.17+）

如果 `.mission/decisions/` 或 `.mission/snapshots/` **存在但为空**，将附加一个 Scaffolding 部分，并为每个目录给出 remediation 提示：

```markdown
## Scaffolding

- ⚠ `.mission/decisions/` exists but empty — run `ms-decide` to record material decisions as MDRs
- ⚠ `.mission/snapshots/` exists but empty — run `npm run snapshot` (or wire into pre-commit) to capture per-revision snapshots
```

背景：qmonster 采用审计（2026-04-21）发现采用者常常 scaffold Living Asset Registry 目录却从不填充，形成"记录契约充实但验证契约失效"的复发模式。警告**仅在目录存在时**触发；目录缺失视为 opt-out，不会警告。返回值通过 `scaffoldingWarnings: Array<{ path, hint }>` 字段提供同一数据。

## done_when drift 部分（v1.16.18+）

当前 evaluator 无法自动评估的 `done_when` 条目（`TEST_PATTERN` 命中但缺少对应 `evals[]` 的路径 + 最终 fallback 路径，两者的 reason 都包含 "manual verification required"）一旦出现，就会附加 `## done_when drift` 部分列出这些条目。

**Layout — drift 1–3 条（inline colon）：**

```markdown
## done_when drift

⚠ 2/5 done_when entries cannot be auto-evaluated:

- "design_refs documented"
- "API is well-designed"

Fix: add a matching entry to `evals[]`, or rewrite as a file-existence pattern (`X 存在` / `X exists`).
```

**Layout — drift > 3 条（Sample + more）：**

```markdown
## done_when drift

⚠ 50/50 done_when entries cannot be auto-evaluated.

Sample:

- "Phase 3B: advisory rules carry suggested_command where an actionable CLI snippet…"
- "Phase 3B: Recommendation.is_strong flag set on context_pressure_warning…"
- "Phase 3B: cargo build + cargo test (~155 lib + ~16 integration) + cargo clippy…"
  (+47 more — run `ms-eval` for full list)

Fix: add a matching entry to `evals[]`, or rewrite as a file-existence pattern (`X 存在` / `X exists`).
```

背景：2026-04-21 qmonster 二次审计中反复确认的模式——采用者将 `done_when` 写成叙述性文本（"Phase 3B: advisory rules carry suggested_command..."）后，任何 evaluator heuristic 都无法匹配，导致 `ms-eval` 报告 0/N，verification contract 仅在形式上存在。在 `ms-status` 输出中立即 surface，采用者能直接得到"添加 `evals[]`" 或"改写为文件存在模式"两种选择的信号。

超过 80 字符的 Sample 条目为可读性截断为 77 字符 + `…`。原文通过返回值的 `doneWhenDrift: string[]` 字段完整提供。

## 注意

- 如果 `mission.yaml` 不存在则返回错误。
- 如果没有定义约束条件则省略 Constraints 部分。
- 如果 `mission-history.yaml` 不存在则省略 Evolution 部分。
- 如果 `mission-history.yaml` 不符合 Schema（v1.6.0+），不会失败，而是在 Evolution 部分显示 `History unavailable: ...` 警告并继续正常执行状态评估。也可通过返回值中的 `historyWarning` 字段获取。
- 如果未检测到 scaffolded-but-empty 目录，则省略 Scaffolding 部分。
- 如果 done_when 每个条目都可自动评估（evals[] 匹配 / 文件存在 / 其他非"manual verification required" reason），则省略 done_when drift 部分。
