// Cross-platform 변환: Cursor, Codex, OpenCode
export interface MissionSpec {
  title: string;
  goal: string;
  done_when: string[];
  constraints?: string[];
}

export function convertToCursor(mission: MissionSpec): string {
  const lines: string[] = [
    `# ${mission.title}`,
    '',
    `## Goal`,
    mission.goal,
    '',
    '## Done When',
  ];
  mission.done_when.forEach((c) => lines.push(`- ${c}`));

  if (mission.constraints && mission.constraints.length > 0) {
    lines.push('', '## Constraints');
    mission.constraints.forEach((c) => lines.push(`- ${c}`));
  }

  return lines.join('\n');
}

export function convertToCodex(mission: MissionSpec): string {
  const lines: string[] = [
    `# ${mission.title}`,
    '',
    mission.goal,
    '',
    '## Checklist',
  ];
  mission.done_when.forEach((c) => lines.push(`- [ ] ${c}`));

  if (mission.constraints && mission.constraints.length > 0) {
    lines.push('', '## Constraints');
    mission.constraints.forEach((c) => lines.push(`- ${c}`));
  }

  return lines.join('\n');
}

function tomlString(value: string): string {
  if (value.includes('\n')) {
    // TOML multiline basic string: quotes are allowed inside without escaping
    return `"""\n${value}"""`;
  }
  // TOML basic string: escape backslashes first, then double quotes
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

export function convertToOpenCode(mission: MissionSpec): string {
  const lines: string[] = [
    `[mission]`,
    `title = ${tomlString(mission.title)}`,
    `goal = ${tomlString(mission.goal)}`,
    '',
    '[mission.done_when]',
  ];
  mission.done_when.forEach((c, i) => lines.push(`item_${i + 1} = ${tomlString(c)}`));

  if (mission.constraints && mission.constraints.length > 0) {
    lines.push('', '[mission.constraints]');
    mission.constraints.forEach((c, i) =>
      lines.push(`item_${i + 1} = ${tomlString(c)}`),
    );
  }

  return lines.join('\n');
}
