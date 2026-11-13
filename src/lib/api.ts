import type {
  ApiEndpoint,
  ArchitecturalRisk,
  ArchitectureReviewResult,
  DataEntity,
  ProjectBlueprint,
  ProjectSummary,
  RequirementItem,
  SprintTask,
  SynthesisRequest,
  SystemModule,
} from '../types/blueprint.ts';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((payload as { error?: string }).error || `Request failed (${res.status})`);
  }
  return payload as T;
}

export const api = {
  listProjects: () => requestJson<{ projects: ProjectSummary[] }>('/api/projects'),

  getProject: (id: string) => requestJson<{ project: ProjectBlueprint }>(`/api/projects/${id}`),

  createProject: (body: Partial<ProjectBlueprint>) =>
    requestJson<{ project: ProjectBlueprint }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateProject: (id: string, body: Partial<ProjectBlueprint>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteProject: (id: string) =>
    requestJson<{ ok: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),

  addModule: (projectId: string, mod: Partial<SystemModule>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/modules`, {
      method: 'POST',
      body: JSON.stringify(mod),
    }),

  updateModule: (projectId: string, moduleId: string, mod: Partial<SystemModule>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(mod),
    }),

  deleteModule: (projectId: string, moduleId: string) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/modules/${moduleId}`, {
      method: 'DELETE',
    }),

  addRequirement: (projectId: string, req: Partial<RequirementItem>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/requirements`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  updateRequirement: (projectId: string, reqId: string, req: Partial<RequirementItem>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/requirements/${reqId}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    }),

  deleteRequirement: (projectId: string, reqId: string) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/requirements/${reqId}`, {
      method: 'DELETE',
    }),

  addEntity: (projectId: string, entity: Partial<DataEntity>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/entities`, {
      method: 'POST',
      body: JSON.stringify(entity),
    }),

  updateEntity: (projectId: string, entityId: string, entity: Partial<DataEntity>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/entities/${entityId}`, {
      method: 'PUT',
      body: JSON.stringify(entity),
    }),

  deleteEntity: (projectId: string, entityId: string) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/entities/${entityId}`, {
      method: 'DELETE',
    }),

  addEndpoint: (projectId: string, endpoint: Partial<ApiEndpoint>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/endpoints`, {
      method: 'POST',
      body: JSON.stringify(endpoint),
    }),

  deleteEndpoint: (projectId: string, endpointId: string) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/endpoints/${endpointId}`, {
      method: 'DELETE',
    }),

  addTask: (projectId: string, task: Partial<SprintTask>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  updateTask: (projectId: string, taskId: string, task: Partial<SprintTask>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }),

  deleteTask: (projectId: string, taskId: string) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  addRisk: (projectId: string, risk: Partial<ArchitecturalRisk>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/risks`, {
      method: 'POST',
      body: JSON.stringify(risk),
    }),

  updateRisk: (projectId: string, riskId: string, risk: Partial<ArchitecturalRisk>) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/risks/${riskId}`, {
      method: 'PUT',
      body: JSON.stringify(risk),
    }),

  deleteRisk: (projectId: string, riskId: string) =>
    requestJson<{ project: ProjectBlueprint }>(`/api/projects/${projectId}/risks/${riskId}`, {
      method: 'DELETE',
    }),

  synthesizeBlueprint: (req: SynthesisRequest) =>
    requestJson<{ draft: Omit<ProjectBlueprint, 'id' | 'createdAt' | 'updatedAt'> }>(
      '/api/ai/synthesize',
      {
        method: 'POST',
        body: JSON.stringify(req),
      }
    ),

  reviewArchitecture: (projectId: string) =>
    requestJson<{ review: ArchitectureReviewResult }>('/api/ai/review', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),
};
