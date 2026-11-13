import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  ArchitectureReviewResult,
  ProjectBlueprint,
  SynthesisRequest,
} from '../src/types/blueprint.ts';

const MODEL_NAME = 'gemini-4-hydrogen';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Add your Gemini API key in the Settings > Secrets panel.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('403') || message.includes('PERMISSION_DENIED') || message.includes('API_KEY_INVALID')) {
    return new Error(
      'Gemini API key was rejected (403/400). Verify your API key in Settings > Secrets.'
    );
  }
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
    return new Error(
      'Gemini API rate limit reached (429). Please retry in a few moments.'
    );
  }
  if (message.includes('404') || message.includes('NOT_FOUND')) {
    return new Error(
      `Requested Gemini model (${MODEL_NAME}) was not found or is unavailable.`
    );
  }
  return new Error(message || 'Failed to communicate with Gemini API.');
}

export async function synthesizeBlueprint(
  req: SynthesisRequest
): Promise<Omit<ProjectBlueprint, 'id' | 'createdAt' | 'updatedAt'>> {
  const ai = getClient();

  const prompt = `Design a complete, production-ready software system architecture and development blueprint for:
Project Name: ${req.name}
Domain: ${req.domain}
Target Scale: ${req.scaleTier}
Description & Goals:
${req.description}

Generate realistic, specific technical specifications:
- Concise problem statement, target audience, proposed solution, 5-6 tech stack items, and 3-4 measurable success criteria.
- 5-6 system modules spanning layers ("client", "gateway", "service", "data", "integration") with realistic technologies and dependencies (reference module index 0..N-1 in dependencyIndices).
- 5-6 functional and non-functional requirements with clear acceptance criteria.
- 3-4 normalized relational database entities with realistic SQL column types, PK/FK flags, and descriptions.
- 3-5 REST API endpoints with method, path, request/response shapes.
- 5-6 prioritized sprint tasks across "Backlog", "In Progress", "In Review", and "Done" (mostly Backlog/In Progress for a new blueprint).
- 2-4 architectural risks with likelihood, impact, severity, and concrete mitigation.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a Principal Software Architect and Staff Systems Engineer. Produce realistic, concrete, non-generic technical architectures tailored strictly to the stated domain.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            problemStatement: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            proposedSolution: { type: Type.STRING },
            techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
            successCriteria: { type: Type.ARRAY, items: { type: Type.STRING } },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  layer: {
                    type: Type.STRING,
                    enum: ['client', 'gateway', 'service', 'data', 'integration'],
                  },
                  status: {
                    type: Type.STRING,
                    enum: ['Planned', 'In Design', 'In Build', 'Verified'],
                  },
                  technology: { type: Type.STRING },
                  responsibility: { type: Type.STRING },
                  dependencyIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                },
                required: ['name', 'layer', 'status', 'technology', 'responsibility', 'dependencyIndices'],
              },
            },
            requirements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['Functional', 'Non-Functional'] },
                  priority: { type: Type.STRING, enum: ['P0', 'P1', 'P2'] },
                  status: {
                    type: Type.STRING,
                    enum: ['Draft', 'Approved', 'Implemented', 'Verified'],
                  },
                  moduleIndex: { type: Type.INTEGER },
                  acceptanceCriteria: { type: Type.STRING },
                },
                required: ['code', 'title', 'category', 'priority', 'status', 'moduleIndex', 'acceptanceCriteria'],
              },
            },
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  fields: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        type: { type: Type.STRING },
                        nullable: { type: Type.BOOLEAN },
                        isPrimaryKey: { type: Type.BOOLEAN },
                        isForeignKey: { type: Type.BOOLEAN },
                        references: { type: Type.STRING },
                        description: { type: Type.STRING },
                      },
                      required: ['name', 'type', 'nullable', 'isPrimaryKey', 'isForeignKey', 'description'],
                    },
                  },
                },
                required: ['name', 'description', 'fields'],
              },
            },
            endpoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  method: { type: Type.STRING, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
                  path: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  authRequired: { type: Type.BOOLEAN },
                  moduleIndex: { type: Type.INTEGER },
                  requestShape: { type: Type.STRING },
                  responseShape: { type: Type.STRING },
                },
                required: ['method', 'path', 'summary', 'authRequired', 'moduleIndex', 'requestShape', 'responseShape'],
              },
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  title: { type: Type.STRING },
                  status: {
                    type: Type.STRING,
                    enum: ['Backlog', 'In Progress', 'In Review', 'Done'],
                  },
                  priority: { type: Type.STRING, enum: ['P0', 'P1', 'P2'] },
                  points: { type: Type.INTEGER },
                  moduleIndex: { type: Type.INTEGER },
                  notes: { type: Type.STRING },
                },
                required: ['code', 'title', 'status', 'priority', 'points', 'moduleIndex', 'notes'],
              },
            },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  likelihood: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                  impact: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                  severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
                  mitigation: { type: Type.STRING },
                },
                required: ['title', 'likelihood', 'impact', 'severity', 'mitigation'],
              },
            },
          },
          required: [
            'title',
            'problemStatement',
            'targetAudience',
            'proposedSolution',
            'techStack',
            'successCriteria',
            'modules',
            'requirements',
            'entities',
            'endpoints',
            'tasks',
            'risks',
          ],
        },
      },
    });

    const text = (response.text ?? '{}').trim();
    const parsed = JSON.parse(text) as {
      title: string;
      problemStatement: string;
      targetAudience: string;
      proposedSolution: string;
      techStack: string[];
      successCriteria: string[];
      modules: Array<{
        name: string;
        layer: 'client' | 'gateway' | 'service' | 'data' | 'integration';
        status: 'Planned' | 'In Design' | 'In Build' | 'Verified';
        technology: string;
        responsibility: string;
        dependencyIndices: number[];
      }>;
      requirements: Array<{
        code: string;
        title: string;
        category: 'Functional' | 'Non-Functional';
        priority: 'P0' | 'P1' | 'P2';
        status: 'Draft' | 'Approved' | 'Implemented' | 'Verified';
        moduleIndex: number;
        acceptanceCriteria: string;
      }>;
      entities: Array<{
        name: string;
        description: string;
        fields: Array<{
          name: string;
          type: string;
          nullable: boolean;
          isPrimaryKey: boolean;
          isForeignKey: boolean;
          references?: string;
          description: string;
        }>;
      }>;
      endpoints: Array<{
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        path: string;
        summary: string;
        authRequired: boolean;
        moduleIndex: number;
        requestShape: string;
        responseShape: string;
      }>;
      tasks: Array<{
        code: string;
        title: string;
        status: 'Backlog' | 'In Progress' | 'In Review' | 'Done';
        priority: 'P0' | 'P1' | 'P2';
        points: number;
        moduleIndex: number;
        notes: string;
      }>;
      risks: Array<{
        title: string;
        likelihood: 'Low' | 'Medium' | 'High';
        impact: 'Low' | 'Medium' | 'High';
        severity: 'Low' | 'Medium' | 'High' | 'Critical';
        mitigation: string;
      }>;
    };

    const stamp = Date.now().toString(36);
    const layerX: Record<string, number> = {
      client: 60,
      gateway: 290,
      service: 530,
      data: 780,
      integration: 780,
    };
    const layerCounts: Record<string, number> = {};

    const moduleIds = parsed.modules.map((_, i) => `mod-${stamp}-${i + 1}`);
    const modules = parsed.modules.map((m, i) => {
      const count = layerCounts[m.layer] ?? 0;
      layerCounts[m.layer] = count + 1;
      const baseY = m.layer === 'integration' ? 230 : 50;
      return {
        id: moduleIds[i],
        name: m.name,
        layer: m.layer,
        status: m.status,
        technology: m.technology,
        responsibility: m.responsibility,
        dependencies: (m.dependencyIndices || [])
          .filter((idx) => idx >= 0 && idx < moduleIds.length && idx !== i)
          .map((idx) => moduleIds[idx]),
        x: layerX[m.layer] ?? 300,
        y: baseY + count * 155,
      };
    });

    const assignees = ['arch-1', 'eng-1', 'pm-1'];
    const baseDate = new Date();

    return {
      name: req.name,
      title: parsed.title || `${req.name} — System Architecture`,
      domain: req.domain,
      scaleTier: req.scaleTier,
      problemStatement: parsed.problemStatement,
      targetAudience: parsed.targetAudience,
      proposedSolution: parsed.proposedSolution,
      techStack: parsed.techStack ?? [],
      successCriteria: parsed.successCriteria ?? [],
      modules,
      requirements: (parsed.requirements ?? []).map((r, i) => ({
        id: `req-${stamp}-${i + 1}`,
        code: r.code,
        title: r.title,
        category: r.category,
        priority: r.priority,
        status: r.status,
        moduleId: moduleIds[r.moduleIndex] ?? moduleIds[0] ?? '',
        acceptanceCriteria: r.acceptanceCriteria,
      })),
      entities: (parsed.entities ?? []).map((e, ei) => ({
        id: `ent-${stamp}-${ei + 1}`,
        name: e.name,
        description: e.description,
        fields: (e.fields ?? []).map((f, fi) => ({
          id: `fld-${stamp}-${ei}-${fi}`,
          name: f.name,
          type: f.type,
          nullable: f.nullable,
          isPrimaryKey: f.isPrimaryKey,
          isForeignKey: f.isForeignKey,
          references: f.references,
          description: f.description,
        })),
      })),
      endpoints: (parsed.endpoints ?? []).map((ep, i) => ({
        id: `ep-${stamp}-${i + 1}`,
        method: ep.method,
        path: ep.path,
        summary: ep.summary,
        authRequired: ep.authRequired,
        moduleId: moduleIds[ep.moduleIndex] ?? moduleIds[0] ?? '',
        requestShape: ep.requestShape,
        responseShape: ep.responseShape,
      })),
      tasks: (parsed.tasks ?? []).map((t, i) => {
        const due = new Date(baseDate.getTime() + (i + 3) * 3 * 86400000);
        return {
          id: `tsk-${stamp}-${i + 1}`,
          code: t.code,
          title: t.title,
          status: t.status,
          priority: t.priority,
          points: Math.max(1, Math.min(13, t.points || 3)),
          assigneeId: assignees[i % assignees.length],
          moduleId: moduleIds[t.moduleIndex] ?? moduleIds[0] ?? '',
          dueDate: due.toISOString().slice(0, 10),
          notes: t.notes,
        };
      }),
      risks: (parsed.risks ?? []).map((rk, i) => ({
        id: `rsk-${stamp}-${i + 1}`,
        title: rk.title,
        likelihood: rk.likelihood,
        impact: rk.impact,
        severity: rk.severity,
        mitigation: rk.mitigation,
        mitigated: false,
      })),
    };
  } catch (err) {
    throw formatGeminiError(err);
  }
}

export async function reviewProjectArchitecture(
  project: ProjectBlueprint
): Promise<ArchitectureReviewResult> {
  const ai = getClient();

  const compactSpec = {
    name: project.name,
    domain: project.domain,
    scaleTier: project.scaleTier,
    techStack: project.techStack,
    modules: project.modules.map((m) => ({
      name: m.name,
      layer: m.layer,
      technology: m.technology,
      dependenciesCount: m.dependencies.length,
    })),
    entities: project.entities.map((e) => ({
      name: e.name,
      fields: e.fields.map((f) => `${f.name}:${f.type}`),
    })),
    endpoints: project.endpoints.map((ep) => `${ep.method} ${ep.path} (auth:${ep.authRequired})`),
    requirementsCount: project.requirements.length,
    unmitigatedRisks: project.risks.filter((r) => !r.mitigated).map((r) => r.title),
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Conduct an engineering architecture review on this system specification:\n${JSON.stringify(compactSpec, null, 2)}`,
      config: {
        systemInstruction:
          'You are a Principal Systems Architect conducting a constructive technical design review. Identify concrete strengths and 3-5 specific, actionable gaps across security, scalability, data modeling, API design, or delivery.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: {
                    type: Type.STRING,
                    enum: ['Security', 'Scalability', 'Data Model', 'API Design', 'Delivery'],
                  },
                  severity: {
                    type: Type.STRING,
                    enum: ['Low', 'Medium', 'High', 'Critical'],
                  },
                  finding: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ['area', 'severity', 'finding', 'recommendation'],
              },
            },
          },
          required: ['summary', 'strengths', 'findings'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      summary: string;
      strengths: string[];
      findings: Array<{
        area: 'Security' | 'Scalability' | 'Data Model' | 'API Design' | 'Delivery';
        severity: 'Low' | 'Medium' | 'High' | 'Critical';
        finding: string;
        recommendation: string;
      }>;
    };

    return {
      summary: parsed.summary || 'Architecture review completed.',
      strengths: parsed.strengths ?? [],
      findings: (parsed.findings ?? []).map((f, idx) => ({
        id: `rev-${Date.now().toString(36)}-${idx}`,
        ...f,
      })),
    };
  } catch (err) {
    throw formatGeminiError(err);
  }
}
