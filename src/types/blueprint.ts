export type ModuleLayer = 'client' | 'gateway' | 'service' | 'data' | 'integration';
export type ModuleStatus = 'Planned' | 'In Design' | 'In Build' | 'Verified';
export type RequirementCategory = 'Functional' | 'Non-Functional';
export type PriorityLevel = 'P0' | 'P1' | 'P2';
export type RequirementStatus = 'Draft' | 'Approved' | 'Implemented' | 'Verified';
export type TaskStatus = 'Backlog' | 'In Progress' | 'In Review' | 'Done';
export type RiskSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface SystemModule {
  id: string;
  name: string;
  layer: ModuleLayer;
  status: ModuleStatus;
  technology: string;
  responsibility: string;
  dependencies: string[];
  x: number;
  y: number;
}

export interface RequirementItem {
  id: string;
  code: string;
  title: string;
  category: RequirementCategory;
  priority: PriorityLevel;
  status: RequirementStatus;
  moduleId: string;
  acceptanceCriteria: string;
}

export interface EntityField {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: string;
  description: string;
}

export interface DataEntity {
  id: string;
  name: string;
  description: string;
  fields: EntityField[];
}

export interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  authRequired: boolean;
  moduleId: string;
  requestShape: string;
  responseShape: string;
}

export interface SprintTask {
  id: string;
  code: string;
  title: string;
  status: TaskStatus;
  priority: PriorityLevel;
  points: number;
  assigneeId: string;
  moduleId: string;
  dueDate: string;
  notes: string;
}

export interface ArchitecturalRisk {
  id: string;
  title: string;
  likelihood: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  severity: RiskSeverity;
  mitigation: string;
  mitigated: boolean;
}

export interface ProjectBlueprint {
  id: string;
  name: string;
  title: string;
  domain: string;
  scaleTier: string;
  problemStatement: string;
  targetAudience: string;
  proposedSolution: string;
  techStack: string[];
  successCriteria: string[];
  updatedAt: string;
  createdAt: string;
  modules: SystemModule[];
  requirements: RequirementItem[];
  entities: DataEntity[];
  endpoints: ApiEndpoint[];
  tasks: SprintTask[];
  risks: ArchitecturalRisk[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  title: string;
  domain: string;
  scaleTier: string;
  updatedAt: string;
  moduleCount: number;
  requirementCount: number;
  taskCount: number;
  completedTaskCount: number;
}

export interface ArchitectureReviewFinding {
  id: string;
  area: 'Security' | 'Scalability' | 'Data Model' | 'API Design' | 'Delivery';
  severity: RiskSeverity;
  finding: string;
  recommendation: string;
}

export interface ArchitectureReviewResult {
  summary: string;
  strengths: string[];
  findings: ArchitectureReviewFinding[];
}

export interface SynthesisRequest {
  name: string;
  domain: string;
  scaleTier: string;
  description: string;
}

export type WorkspaceSection =
  | 'overview'
  | 'topology'
  | 'requirements'
  | 'data'
  | 'delivery'
  | 'export';
