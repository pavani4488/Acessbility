import type { DataEntity, ProjectBlueprint } from '../types/blueprint.ts';

export function generateSqlDdl(entities: DataEntity[]): string {
  if (entities.length === 0) {
    return '-- No database entities defined yet.';
  }

  return entities
    .map((entity) => {
      const lines = entity.fields.map((field) => {
        const parts: string[] = [`  ${field.name} ${field.type}`];
        if (field.isPrimaryKey) parts.push('PRIMARY KEY');
        if (!field.nullable && !field.isPrimaryKey) parts.push('NOT NULL');
        if (field.isForeignKey && field.references) {
          const [refTable, refCol] = field.references.split('.');
          if (refTable && refCol) {
            parts.push(`REFERENCES ${refTable}(${refCol})`);
          }
        }
        return parts.join(' ');
      });

      return `-- ${entity.description || entity.name}\nCREATE TABLE ${entity.name} (\n${lines.join(',\n')}\n);`;
    })
    .join('\n\n');
}

export function generateMarkdownSpec(project: ProjectBlueprint): string {
  const moduleMap = new Map(project.modules.map((m) => [m.id, m.name]));
  const completedTasks = project.tasks.filter((t) => t.status === 'Done').length;

  const lines: string[] = [
    `# ${project.title}`,
    ``,
    `**Domain:** ${project.domain} | **Scale Tier:** ${project.scaleTier} | **Last Updated:** ${project.updatedAt.slice(0, 10)}`,
    ``,
    `## 1. Core Concept & Problem Statement`,
    project.problemStatement,
    ``,
    `### Target Audience`,
    project.targetAudience,
    ``,
    `### Proposed Solution`,
    project.proposedSolution,
    ``,
    `### Technology Stack`,
    ...project.techStack.map((t) => `- ${t}`),
    ``,
    `### Measurable Success Criteria`,
    ...project.successCriteria.map((c) => `- ${c}`),
    ``,
    `## 2. System Modules (${project.modules.length})`,
    `| Module | Layer | Technology | Status | Responsibility |`,
    `| --- | --- | --- | --- | --- |`,
    ...project.modules.map(
      (m) => `| ${m.name} | ${m.layer} | ${m.technology} | ${m.status} | ${m.responsibility} |`
    ),
    ``,
    `## 3. Requirements Specification (${project.requirements.length})`,
    `| Code | Title | Category | Priority | Status | Module | Acceptance Criteria |`,
    `| --- | --- | --- | --- | --- | --- | --- |`,
    ...project.requirements.map(
      (r) =>
        `| ${r.code} | ${r.title} | ${r.category} | ${r.priority} | ${r.status} | ${moduleMap.get(r.moduleId) ?? 'Unassigned'} | ${r.acceptanceCriteria} |`
    ),
    ``,
    `## 4. Relational Database Schema`,
    '```sql',
    generateSqlDdl(project.entities),
    '```',
    ``,
    `## 5. API Contracts (${project.endpoints.length})`,
    ...project.endpoints.map(
      (ep) =>
        `### \`${ep.method} ${ep.path}\`\n- **Summary:** ${ep.summary}\n- **Auth Required:** ${ep.authRequired ? 'Yes' : 'Public'}\n- **Module:** ${moduleMap.get(ep.moduleId) ?? 'Gateway'}\n- **Request:** \`${ep.requestShape}\`\n- **Response:** \`${ep.responseShape}\`\n`
    ),
    `## 6. Engineering Delivery Plan (${completedTasks}/${project.tasks.length} Done)`,
    `| Code | Task | Status | Priority | Points | Due Date |`,
    `| --- | --- | --- | --- | --- | --- |`,
    ...project.tasks.map(
      (t) => `| ${t.code} | ${t.title} | ${t.status} | ${t.priority} | ${t.points} | ${t.dueDate} |`
    ),
    ``,
    `## 7. Architectural Risk Register (${project.risks.length})`,
    ...project.risks.map(
      (rk) =>
        `- **${rk.title}** (${rk.severity} — ${rk.mitigated ? 'Mitigated' : 'Open'}): ${rk.mitigation}`
    ),
  ];

  return lines.join('\n');
}
