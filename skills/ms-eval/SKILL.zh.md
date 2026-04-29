---
name: ms-eval
description: >
  根据 mission.yaml 中的 done_when 标准评估当前项目状态。
  由"评估任务"、"检查 done_when"、"验证完成条件"等请求触发。
user-invocable: true
allowed-tools:
  - Read
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

[English](SKILL.md) | [한국어](SKILL.ko.md) | [中文](SKILL.zh.md)

# ms-eval — done_when 标准评估

## 行为

1. 读取当前目录的 `mission.yaml` 并验证 Schema。
2. 评估 `done_when` 列表中的每个条件：
   - **显式 gate 绑定（v1.21.0+）**：如果 `mission.done_when_refs[]` 绑定了该 criterion 的 index，该 ref 优先于所有 heuristic。支持的 ref kind 为 `command`、`file-exists`、`file-contains`、`eval-ref`。
     - `command`：运行 shell command，退出码 0 即 PASS。
     - `file-exists`：路径存在即 PASS。
     - `file-contains`：按 `path::substring` 格式检查文件中是否包含 substring。
     - `eval-ref`：委托到 `mission.evals[].name`。
   - **Manual/LLM 主观评估关联**：如果 `evals[].name` 匹配条件且 `type: manual`、`llm-eval` 或 `llm-judge`，则查找 `.mission/evals/<name>.result.yaml` 覆盖文件。文件存在则使用该裁定，否则标记为等待已记录 verdict。
   - **自动化评估关联**：如果 `evals[].name` 与条件完全匹配且 `type: automated`，则运行对应命令。
   - **文件存在检查**："X file exists"、"X 存在" → 检查文件是否存在于项目中。
   - **测试相关短语**：如果没有明确的自动化评估，则标记为需要手动验证。
   - **其他**：无法自动评估 → 标记为需要手动验证。
3. 以清单形式输出结果。

## 运行方法

```bash
node -e "
import { evaluateMission } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/eval.js';
const r = evaluateMission('.');
console.log(r.summary);
r.criteria.forEach(c => {
  const icon = c.passed ? '[x]' : '[ ]';
  console.log(icon + ' ' + c.criterion);
  if (!c.passed) console.log('  → ' + c.reason);
});
"
```

## 输出格式

```
3/5 criteria passed
[x] package.json exists
[x] README.md file exists
[ ] All tests passing
  → Manual verification required: check npm test results
[x] src/index.ts exists
[ ] Deployment complete
  → Cannot auto-evaluate — manual verification required
```

## Manual/LLM 主观评估覆盖

对于无法机械判定的 `manual`、`llm-eval` 或 `llm-judge` 类型评估，在 `.mission/evals/<eval-name>.result.yaml` 中记录外部裁定：

```yaml
# .mission/evals/subjective_quality.result.yaml
passed: true
reason: "3 名审阅者裁定，全部同意"
evaluated_by: "human" # 或 "llm-claude"、"llm-gpt5" 等
evaluated_at: "2026-04-13"
```

- 文件存在 + `passed: true` → PASS
- 文件存在 + `passed: false` → FAIL（显示裁定原因）
- 文件不存在 → "等待 manual/LLM 评估"（pending）
- `passed` 字段缺失/类型错误 → "格式错误"

## 注意

- 如果 `mission.yaml` 不存在则返回错误。
- 如果 Schema 无效则返回错误。
- 对长期维护的完成条件，推荐使用 `done_when_refs[].kind: eval-ref`：让 `done_when` 保持可读 prose，把具体 command 或外部 verdict 契约放在 `evals[]` 中。
- `eval`、`status`、`report` 可能执行受信任 `mission.yaml` 中声明的 shell command。对于不受信任的仓库，请先使用 schema-only 的 `mission-spec validate`。
- 如果 `evals[].name` 与 `done_when` 不匹配，则不执行自动化评估。
- `manual` / `llm-eval` / `llm-judge` 类型条件在记录覆盖文件之前保持 pending 状态。
- `architecture_doc_freshness` 评估（v1.7.0+）可验证 `design_refs` 所引用设计文档的最新性。
