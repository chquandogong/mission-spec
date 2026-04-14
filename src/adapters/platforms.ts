// Cross-platform conversion: Cursor, Codex, OpenCode
export interface MissionSpec {
  title: string;
  goal: string;
  done_when: string[];
  constraints?: string[];
}

export function convertToCursor(mission: MissionSpec): string {
  const lines: string[] = [
    `# ${mission.title}`,
    "",
    `## Goal`,
    mission.goal,
    "",
    "## Done When",
  ];
  mission.done_when.forEach((c) => lines.push(`- ${c}`));

  if (mission.constraints && mission.constraints.length > 0) {
    lines.push("", "## Constraints");
    mission.constraints.forEach((c) => lines.push(`- ${c}`));
  }

  return lines.join("\n");
}

export function convertToCodex(mission: MissionSpec): string {
  const lines: string[] = [
    `# ${mission.title}`,
    "",
    mission.goal,
    "",
    "## Checklist",
  ];
  mission.done_when.forEach((c) => lines.push(`- [ ] ${c}`));

  if (mission.constraints && mission.constraints.length > 0) {
    lines.push("", "## Constraints");
    mission.constraints.forEach((c) => lines.push(`- ${c}`));
  }

  return lines.join("\n");
}

function tomlString(value: string): string {
  if (value.includes("\n")) {
    // TOML multiline basic string: quotes are allowed inside without escaping
    return `"""\n${value}"""`;
  }
  // TOML basic string: escape backslashes first, then double quotes
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function tomlArray(arr: string[]): string {
  return `[ ${arr.map((s) => tomlString(s)).join(", ")} ]`;
}

export function convertToOpenCode(mission: MissionSpec): string {
  const lines: string[] = [
    `[mission]`,
    `title = ${tomlString(mission.title)}`,
    `goal = ${tomlString(mission.goal)}`,
    `done_when = ${tomlArray(mission.done_when)}`,
  ];

  if (mission.constraints && mission.constraints.length > 0) {
    lines.push(`constraints = ${tomlArray(mission.constraints)}`);
  }

  return lines.join("\n");
}
