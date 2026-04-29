---
name: ms-init
description: >
  从自然语言目标自动生成 mission.yaml 草案。
  当用户想要开始任务或创建 mission.yaml 时使用。
  由"创建任务"、"生成 mission.yaml"、"新建任务契约"等请求触发。
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

# ms-init — 自然语言 → mission.yaml 草案生成

## 行为

1. 向用户询问自然语言的**任务目标**（如已提供则跳过）。
2. 当前实现会检查 `package.json` 和 `README.md` 是否存在，并从 `package.json` 中读取项目名称和描述。
3. 通过启发式方法从目标中推导 **title** 和 **done_when** 条件。
4. 如果 `package.json` 包含 `scripts.test`，则为生成的测试 criterion scaffold 一个 `evals[]` automated `npm_test` 条目，并添加对应的 `done_when_refs[]` `eval-ref` 绑定。
5. 如果用户提供了约束条件，将其包含在 **constraints** 中。
6. 生成 `mission.yaml` 草案并执行 Schema 验证。

## mission.yaml Schema（必填字段）

```yaml
mission:
  title: string # 必填 — 任务标题
  goal: string # 必填 — 任务目标（自然语言）
  done_when: # 必填 — 完成条件（至少 1 个）
    - "条件 1"
    - "条件 2"
```

## 可选字段

- `constraints`：约束条件列表
- `approvals`：审批门控（`gate`、`approver`：human|ai|codex|ci）
- `evals`：评估项（automated → 需要 command+pass_criteria，manual → 需要 description）
- `budget_hint`：资源提示（仅供参考）
- `execution_hints`：执行提示（仅供参考 — 运行时可忽略）
- `skills_needed`、`artifacts`、`version`、`author`
- `lineage`：变更历史引用（`initial_version`、`history` 必填）— v1.5.0+

## 自动生成字段（v1.5.0+）

`generateMissionDraft()` 自动包含以下字段：

- `version: "1.0.0"`
- `lineage.initial_version: "1.0.0"`
- `lineage.initial_date`：当前日期
- `lineage.history: "mission-history.yaml"`

## Schema 验证

生成后始终执行 Schema 验证：

```bash
node -e "
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { validateMission } from '${CLAUDE_PLUGIN_ROOT}/dist/schema/validator.js';
const doc = parse(readFileSync('mission.yaml', 'utf-8'));
const r = validateMission(doc);
if (r.valid) console.log('mission.yaml: VALID');
else { console.error('INVALID:', r.errors.join(', ')); process.exit(1); }
"
```

## Post-init：安装 pre-commit hook（v1.17.0+）

用 `ms-init` 生成 `mission.yaml` 后，安装 schema 校验 hook，让后续编辑不会把 schema drift 引入 repo：

```bash
npm install --save-dev mission-spec
cp node_modules/mission-spec/templates/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Hook 调用 `npx mission-spec validate`，当 `mission.yaml` 或（如存在）`mission-history.yaml` 的 schema 失败时 non-zero exit。不运行 evaluator，因此每次 commit 都够快。

## 注意

- `execution_hints` 是**建议**而非指令。运行时可以忽略。
- 仅基于规则运行，无外部 API 调用。
- 库函数 `generateMissionDraft()` 返回 YAML 字符串，不直接写入磁盘。
