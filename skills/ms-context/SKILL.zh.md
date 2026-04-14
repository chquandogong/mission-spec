---
name: ms-context
description: >
  综合 Mission Spec 资产，为 AI 代理生成项目上下文提示。
  由"给我上下文"、"项目摘要"、"新代理简报"等请求触发。
user-invocable: true
allowed-tools:
  - Read
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

[English](SKILL.md) | [한국어](SKILL.ko.md) | [中文](SKILL.zh.md)

# ms-context — AI 代理上下文提示生成

## 行为

1. 读取 `mission.yaml` 并提取目标、约束和完成条件。
2. 如果存在 `design_refs`，包含设计文档位置。
3. 从 `mission-history.yaml` 中提取演进摘要和最新变更。
4. 从 `.mission/decisions/MDR-*.md` 中收集关键决策标题。
5. 从 `.mission/architecture/ARCHITECTURE_CURRENT.yaml` 将模块结构渲染为表格。
6. 从 `.mission/interfaces/API_REGISTRY.yaml` 中提取公共 API 列表。
7. 将所有信息组合成单一 Markdown 输出。

## 运行方法

```bash
node -e "
import { generateContext } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/context.js';
const c = generateContext('.');
console.log(c.markdown);
"
```

## 输出格式

```markdown
# Project Context

## Mission: 任务标题

**Goal:** 任务目标
**Version:** 1.7.0

### Constraints

- 约束条件 1

### Done When

- 完成条件 1

## Design References

- **architecture:** `docs/internal/ARCHITECTURE.md`

## Evolution Summary

**Current Phase:** architecture-assetization — 架构知识资产化
**Total Revisions:** 7

## Key Decisions (MDR)

- **MDR-001-task-contract-only.md:** MDR-001: Task Contract Only

## Architecture

| Module | Path                 | Responsibility        | Depends On |
| ------ | -------------------- | --------------------- | ---------- |
| parser | `src/core/parser.ts` | YAML parse + validate | validator  |

## Public API

- `evaluateMission(projectDir: string) => EvalResult`
```

## 注意

- 如果 `mission.yaml` 不存在则返回错误。
- 每个可选部分（history、architecture、API 等）在对应文件不存在时会自动省略。
- 输出可用作新 AI 代理的系统提示或首条消息。
- 返回值中的 `sections` 数组表示包含了哪些部分。
