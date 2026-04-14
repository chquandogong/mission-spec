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

## 注意

- 如果 `mission.yaml` 不存在则返回错误。
- 如果没有定义约束条件则省略 Constraints 部分。
- 如果 `mission-history.yaml` 不存在则省略 Evolution 部分。
- 如果 `mission-history.yaml` 不符合 Schema（v1.6.0+），不会失败，而是在 Evolution 部分显示 `History unavailable: ...` 警告并继续正常执行状态评估。也可通过返回值中的 `historyWarning` 字段获取。
