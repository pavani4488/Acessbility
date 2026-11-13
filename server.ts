import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import {
  createProject,
  deleteProject,
  getProjectById,
  listProjectSummaries,
  updateProject,
} from './server/store.ts';
import { reviewProjectArchitecture, synthesizeBlueprint } from './server/gemini.ts';
import type {
  ApiEndpoint,
  ArchitecturalRisk,
  DataEntity,
  ProjectBlueprint,
  RequirementItem,
  SprintTask,
  SystemModule,
} from './src/types/blueprint.ts';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '2mb' }));

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// List project summaries
app.get('/api/projects', (_req, res) => {
  res.json({ projects: listProjectSummaries() });
});

// Get full project blueprint
app.get('/api/projects/:id', (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project });
});

// Create a project (from manual input or AI-synthesized payload)
app.post('/api/projects', (req, res) => {
  const body = req.body as Partial<ProjectBlueprint>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const domain = typeof body.domain === 'string' ? body.domain.trim() : '';

  if (!name || !domain) {
    res.status(400).json({ error: 'Project name and domain are required.' });
    return;
  }

  const now = new Date().toISOString();
  const project: ProjectBlueprint = {
    id: makeId('proj'),
    name,
    title: body.title?.trim() || `${name} — System Architecture`,
    domain,
    scaleTier: body.scaleTier?.trim() || 'Production SaaS',
    problemStatement: body.problemStatement?.trim() || 'Define the core problem this system addresses.',
    targetAudience: body.targetAudience?.trim() || 'Primary engineering and end-user personas.',
    proposedSolution: body.proposedSolution?.trim() || 'Describe the proposed technical architecture.',
    techStack: Array.isArray(body.techStack) ? body.techStack : ['React + TypeScript', 'Node.js + Express', 'PostgreSQL'],
    successCriteria: Array.isArray(body.successCriteria) ? body.successCriteria : [],
    createdAt: now,
    updatedAt: now,
    modules: Array.isArray(body.modules) ? body.modules : [],
    requirements: Array.isArray(body.requirements) ? body.requirements : [],
    entities: Array.isArray(body.entities) ? body.entities : [],
    endpoints: Array.isArray(body.endpoints) ? body.endpoints : [],
    tasks: Array.isArray(body.tasks) ? body.tasks : [],
    risks: Array.isArray(body.risks) ? body.risks : [],
  };

  createProject(project);
  res.status(201).json({ project });
});

// Update top-level project overview fields
app.put('/api/projects/:id', (req, res) => {
  const body = req.body as Partial<ProjectBlueprint>;
  const updated = updateProject(req.params.id, (existing) => ({
    ...existing,
    name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : existing.name,
    title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : existing.title,
    domain: typeof body.domain === 'string' && body.domain.trim() ? body.domain.trim() : existing.domain,
    scaleTier: typeof body.scaleTier === 'string' ? body.scaleTier.trim() : existing.scaleTier,
    problemStatement: typeof body.problemStatement === 'string' ? body.problemStatement : existing.problemStatement,
    targetAudience: typeof body.targetAudience === 'string' ? body.targetAudience : existing.targetAudience,
    proposedSolution: typeof body.proposedSolution === 'string' ? body.proposedSolution : existing.proposedSolution,
    techStack: Array.isArray(body.techStack) ? body.techStack : existing.techStack,
    successCriteria: Array.isArray(body.successCriteria) ? body.successCriteria : existing.successCriteria,
  }));

  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
  const deleted = deleteProject(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ ok: true });
});

// Modules CRUD
app.post('/api/projects/:id/modules', (req, res) => {
  const body = req.body as Partial<SystemModule>;
  if (!body.name?.trim() || !body.layer) {
    res.status(400).json({ error: 'Module name and layer are required.' });
    return;
  }
  const newModule: SystemModule = {
    id: makeId('mod'),
    name: body.name.trim(),
    layer: body.layer,
    status: body.status || 'Planned',
    technology: body.technology?.trim() || 'TypeScript',
    responsibility: body.responsibility?.trim() || '',
    dependencies: Array.isArray(body.dependencies) ? body.dependencies : [],
    x: typeof body.x === 'number' ? body.x : 320,
    y: typeof body.y === 'number' ? body.y : 120,
  };
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    modules: [...p.modules, newModule],
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.status(201).json({ project: updated, module: newModule });
});

app.put('/api/projects/:id/modules/:moduleId', (req, res) => {
  const body = req.body as Partial<SystemModule>;
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    modules: p.modules.map((m) =>
      m.id === req.params.moduleId
        ? {
            ...m,
            ...body,
            id: m.id,
          }
        : m
    ),
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project or module not found.' });
    return;
  }
  res.json({ project: updated });
});

app.delete('/api/projects/:id/modules/:moduleId', (req, res) => {
  const targetId = req.params.moduleId;
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    modules: p.modules
      .filter((m) => m.id !== targetId)
      .map((m) => ({ ...m, dependencies: m.dependencies.filter((d) => d !== targetId) })),
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

// Requirements CRUD
app.post('/api/projects/:id/requirements', (req, res) => {
  const body = req.body as Partial<RequirementItem>;
  if (!body.title?.trim() || !body.code?.trim()) {
    res.status(400).json({ error: 'Requirement code and title are required.' });
    return;
  }
  const newReq: RequirementItem = {
    id: makeId('req'),
    code: body.code.trim(),
    title: body.title.trim(),
    category: body.category || 'Functional',
    priority: body.priority || 'P1',
    status: body.status || 'Draft',
    moduleId: body.moduleId || '',
    acceptanceCriteria: body.acceptanceCriteria?.trim() || '',
  };
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    requirements: [...p.requirements, newReq],
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.status(201).json({ project: updated });
});

app.put('/api/projects/:id/requirements/:reqId', (req, res) => {
  const body = req.body as Partial<RequirementItem>;
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    requirements: p.requirements.map((r) =>
      r.id === req.params.reqId ? { ...r, ...body, id: r.id } : r
    ),
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

app.delete('/api/projects/:id/requirements/:reqId', (req, res) => {
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    requirements: p.requirements.filter((r) => r.id !== req.params.reqId),
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

// Entities CRUD
app.post('/api/projects/:id/entities', (req, res) => {
  const body = req.body as Partial<DataEntity>;
  if (!body.name?.trim()) {
    res.status(400).json({ error: 'Entity table name is required.' });
    return;
  }
  const newEntity: DataEntity = {
    id: makeId('ent'),
    name: body.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    description: body.description?.trim() || '',
    fields: Array.isArray(body.fields) && body.fields.length > 0
      ? body.fields
      : [
          {
            id: makeId('fld'),
            name: 'id',
            type: 'UUID',
            nullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
            description: 'Primary key',
          },
        ],
  };
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    entities: [...p.entities, newEntity],
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.status(201).json({ project: updated });
});

app.put('/api/projects/:id/entities/:entityId', (req, res) => {
  const body = req.body as Partial<DataEntity>;
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    entities: p.entities.map((e) =>
      e.id === req.params.entityId ? { ...e, ...body, id: e.id } : e
    ),
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

app.delete('/api/projects/:id/entities/:entityId', (req, res) => {
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    entities: p.entities.filter((e) => e.id !== req.params.entityId),
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

// Endpoints CRUD
app.post('/api/projects/:id/endpoints', (req, res) => {
  const body = req.body as Partial<ApiEndpoint>;
  if (!body.path?.trim() || !body.method) {
    res.status(400).json({ error: 'Endpoint method and path are required.' });
    return;
  }
  const newEndpoint: ApiEndpoint = {
    id: makeId('ep'),
    method: body.method,
    path: body.path.trim(),
    summary: body.summary?.trim() || '',
    authRequired: body.authRequired ?? true,
    moduleId: body.moduleId || '',
    requestShape: body.requestShape?.trim() || '{}',
    responseShape: body.responseShape?.trim() || '{}',
  };
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    endpoints: [...p.endpoints, newEndpoint],
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.status(201).json({ project: updated });
});

app.delete('/api/projects/:id/endpoints/:endpointId', (req, res) => {
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    endpoints: p.endpoints.filter((e) => e.id !== req.params.endpointId),
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

// Tasks CRUD
app.post('/api/projects/:id/tasks', (req, res) => {
  const body = req.body as Partial<SprintTask>;
  if (!body.title?.trim()) {
    res.status(400).json({ error: 'Task title is required.' });
    return;
  }
  const newTask: SprintTask = {
    id: makeId('tsk'),
    code: body.code?.trim() || `TASK-${Math.floor(100 + Math.random() * 899)}`,
    title: body.title.trim(),
    status: body.status || 'Backlog',
    priority: body.priority || 'P1',
    points: Number(body.points) || 3,
    assigneeId: body.assigneeId || 'arch-1',
    moduleId: body.moduleId || '',
    dueDate: body.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    notes: body.notes?.trim() || '',
  };
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    tasks: [...p.tasks, newTask],
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.status(201).json({ project: updated });
});

app.put('/api/projects/:id/tasks/:taskId', (req, res) => {
  const body = req.body as Partial<SprintTask>;
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    tasks: p.tasks.map((t) =>
      t.id === req.params.taskId ? { ...t, ...body, id: t.id } : t
    ),
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

app.delete('/api/projects/:id/tasks/:taskId', (req, res) => {
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    tasks: p.tasks.filter((t) => t.id !== req.params.taskId),
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

// Risks CRUD
app.post('/api/projects/:id/risks', (req, res) => {
  const body = req.body as Partial<ArchitecturalRisk>;
  if (!body.title?.trim()) {
    res.status(400).json({ error: 'Risk title is required.' });
    return;
  }
  const newRisk: ArchitecturalRisk = {
    id: makeId('rsk'),
    title: body.title.trim(),
    likelihood: body.likelihood || 'Medium',
    impact: body.impact || 'Medium',
    severity: body.severity || 'Medium',
    mitigation: body.mitigation?.trim() || '',
    mitigated: body.mitigated ?? false,
  };
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    risks: [...p.risks, newRisk],
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.status(201).json({ project: updated });
});

app.put('/api/projects/:id/risks/:riskId', (req, res) => {
  const body = req.body as Partial<ArchitecturalRisk>;
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    risks: p.risks.map((r) =>
      r.id === req.params.riskId ? { ...r, ...body, id: r.id } : r
    ),
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

app.delete('/api/projects/:id/risks/:riskId', (req, res) => {
  const updated = updateProject(req.params.id, (p) => ({
    ...p,
    risks: p.risks.filter((r) => r.id !== req.params.riskId),
  }));
  if (!updated) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project: updated });
});

// AI Synthesis Endpoint
app.post('/api/ai/synthesize', async (req, res) => {
  const { name, domain, scaleTier, description } = req.body as {
    name?: string;
    domain?: string;
    scaleTier?: string;
    description?: string;
  };

  if (!name?.trim() || !domain?.trim() || !description?.trim()) {
    res.status(400).json({ error: 'Project name, domain, and description are required for AI synthesis.' });
    return;
  }

  try {
    const blueprintDraft = await synthesizeBlueprint({
      name: name.trim(),
      domain: domain.trim(),
      scaleTier: scaleTier?.trim() || 'Production SaaS',
      description: description.trim(),
    });
    res.json({ draft: blueprintDraft });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI synthesis failed.';
    res.status(500).json({ error: message });
  }
});

// AI Architecture Review Endpoint
app.post('/api/ai/review', async (req, res) => {
  const { projectId } = req.body as { projectId?: string };
  if (!projectId) {
    res.status(400).json({ error: 'projectId is required.' });
    return;
  }
  const project = getProjectById(projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  try {
    const review = await reviewProjectArchitecture(project);
    res.json({ review });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Architecture review failed.';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ArchSpec server listening on http://localhost:${PORT}`);
  });
}

startServer();
