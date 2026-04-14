---
name: ms-report
description: >
  从任务执行结果生成 Markdown 运行报告。
  由"生成报告"、"任务报告"、"运行报告"等请求触发。
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

[English](SKILL.md) | [한국어](SKILL.ko.md) | [中文](SKILL.zh.md)

# ms-report — 运行报告生成

## 行为

1. 读取 `mission.yaml` 并验证 Schema。
2. 对所有 done_when 条件执行完整评估。
3. 生成带有 PASS/FAIL 裁定的详细报告。
4. 显示报告并可选保存为文件。

## 运行方法

```bash
node -e "
import { generateMissionReport } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/report.js';
const r = generateMissionReport('.');
console.log(r.markdown);
"
```

## 输出格式

```markdown
# Mission Report: 任务标题

**Status:** PASS（或 FAIL）
**Progress:** 4/5
**Generated:** 2026-04-02T12:00:00.000Z
**Author:** author-name
**Version:** 1.0.0

## Evaluation Results

- [x] 条件 1
- [x] 条件 2
- [ ] 条件 3
  - 失败原因

---

Mission Spec Report — 2026-04-02T12:00:00.000Z
```

## 保存为文件

用户请求时将报告保存为文件：

```bash
node -e "
import { generateMissionReport } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/report.js';
import { writeFileSync } from 'node:fs';
const r = generateMissionReport('.');
writeFileSync('mission-report.md', r.markdown);
console.log('Report saved to mission-report.md');
"
```

## Recent Changes 部分（v1.5.0+）

如果项目根目录存在 `mission-history.yaml`，报告中将包含最近 3 条变更记录：

```markdown
## Recent Changes

### 1.5.0 (2026-04-08)

- **Intent:** 引入 Living Asset Registry
- **Type:** enhancement | **Persistence:** permanent
- Added: src/core/history.ts, lineage field, ...
- Modified: ms-status, ms-report, ms-init, ...
```

## Traceability 部分（v1.7.0+）

如果项目根目录存在 `.mission/traceability/TRACE_MATRIX.yaml`，报告中将自动包含 Traceability 表：

```markdown
## Traceability

| Requirement              | Eval Type | Code                       | Tests                |
| ------------------------ | --------- | -------------------------- | -------------------- |
| schema_validation_passes | automated | scripts/validate-schema.js | tests/schema.test.ts |
```

如果 TRACE_MATRIX 不存在，此部分将自动省略。

## 注意

- 报告包含时间戳以区分每次运行。
- 仅当所有 done_when 条件都满足时才显示 PASS。
- 如果 `mission-history.yaml` 不存在则省略 Recent Changes 部分。
- 如果 `mission-history.yaml` 不符合 Schema（v1.6.0+），不会失败，而是在报告中以 `## History` 部分显示 `History unavailable: ...` 警告并继续评估。也可通过返回值中的 `historyWarning` 字段获取。
- `llm-eval` / `llm-judge` 类型条件仅在 `.mission/evals/<name>.result.yaml` 中记录了裁定时才计为 PASS（参见 ms-eval SKILL）。
