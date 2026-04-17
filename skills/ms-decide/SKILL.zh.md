---
name: ms-decide
description: >
  从自然语言生成新的 Mission Decision Record (MDR) 草稿。
  用于用户即将做出值得记录的非平凡架构/策略/范围变更时。
---

[English](SKILL.md) | [한국어](SKILL.ko.md) | [中文](SKILL.zh.md)

# ms-decide — 自然语言 → MDR 草稿生成

## 行为

1. 询问用户**决策标题**(必需)以及 context / decision / rationale / consequences / alternatives 的说明。
2. 扫描 `.mission/decisions/` 中已有的 `MDR-NNN-*.md` 文件,取下一个可用编号(3 位零填充)。
3. 将标题 slug 化(小写、连字符、去除标点)作为文件名。
4. 使用 `.mission/templates/MDR_TEMPLATE.md` 模板渲染,未提供的字段保留占位符。
5. 默认值:`Status: Proposed`、今日日期、`[target version]` / `[author]` 占位符。
6. 返回 markdown 与建议路径。**默认不写文件** — 调用方决定何时持久化,用户可先编辑。

## MDR 触发条件

1. `goal` 方向变化
2. `constraints` 策略变化
3. `done_when` 评估哲学变化
4. `evals` ↔ `done_when` 关联方式变化
5. public command surface / 命名规则变化
6. 跨平台契约变化

## 调用

```ts
import { generateMdrDraft } from "mission-spec";

const { markdown, suggestedPath } = generateMdrDraft({
  title: "采用确定性 CHANGELOG 生成",
  context: "CHANGELOG.md 多次与 mission-history.yaml 脱节",
  decision: "在 pre-commit 钩子中从 mission-history.yaml 自动生成 CHANGELOG.md",
  projectDir: ".",
});
```
