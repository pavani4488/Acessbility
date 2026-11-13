import { useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import type {
  ArchitectureReviewResult,
  ProjectBlueprint,
  WorkspaceSection,
} from '../types/blueprint.ts';
import { api } from '../lib/api.ts';

interface OverviewViewProps {
  project: ProjectBlueprint;
  onUpdateProject: (updated: ProjectBlueprint) => void;
  onNavigate: (section: WorkspaceSection) => void;
}

export function OverviewView({ project, onUpdateProject, onNavigate }: OverviewViewProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [title, setTitle] = useState(project.title);
  const [domain, setDomain] = useState(project.domain);
  const [scaleTier, setScaleTier] = useState(project.scaleTier);
  const [problemStatement, setProblemStatement] = useState(project.problemStatement);
  const [targetAudience, setTargetAudience] = useState(project.targetAudience);
  const [proposedSolution, setProposedSolution] = useState(project.proposedSolution);
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>(project.techStack);
  const [criteriaText, setCriteriaText] = useState(project.successCriteria.join('\n'));

  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [review, setReview] = useState<ArchitectureReviewResult | null>(null);

  function startEditing() {
    setTitle(project.title);
    setDomain(project.domain);
    setScaleTier(project.scaleTier);
    setProblemStatement(project.problemStatement);
    setTargetAudience(project.targetAudience);
    setProposedSolution(project.proposedSolution);
    setTechStack(project.techStack);
    setCriteriaText(project.successCriteria.join('\n'));
    setSaveError(null);
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !domain.trim() || !problemStatement.trim()) {
      setSaveError('Title, domain, and problem statement are required.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const { project: updated } = await api.updateProject(project.id, {
        title: title.trim(),
        domain: domain.trim(),
        scaleTier: scaleTier.trim(),
        problemStatement: problemStatement.trim(),
        targetAudience: targetAudience.trim(),
        proposedSolution: proposedSolution.trim(),
        techStack,
        successCriteria: criteriaText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      onUpdateProject(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  function addTechItem() {
    const val = techInput.trim();
    if (!val || techStack.includes(val)) return;
    setTechStack([...techStack, val]);
    setTechInput('');
  }

  async function runArchitectureReview() {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const { review: result } = await api.reviewArchitecture(project.id);
      setReview(result);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to run architecture review.');
    } finally {
      setReviewLoading(false);
    }
  }

  const verifiedModules = project.modules.filter((m) => m.status === 'Verified').length;
  const approvedReqs = project.requirements.filter(
    (r) => r.status === 'Approved' || r.status === 'Implemented' || r.status === 'Verified'
  ).length;
  const doneTasks = project.tasks.filter((t) => t.status === 'Done').length;
  const totalPoints = project.tasks.reduce((acc, t) => acc + t.points, 0);
  const donePoints = project.tasks
    .filter((t) => t.status === 'Done')
    .reduce((acc, t) => acc + t.points, 0);
  const openRisks = project.risks.filter((r) => !r.mitigated).length;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
            {project.title}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{project.domain}</span>
            <span aria-hidden="true">·</span>
            <span>{project.scaleTier}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">Updated {project.updatedAt.slice(0, 10)}</span>
          </div>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Edit3 className="h-4 w-4 text-slate-500" />
            <span>Edit Brief</span>
          </button>
        )}
      </div>

      {/* 4-Column Quantitative Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('topology')}
          className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-xs font-medium text-slate-500">System Modules</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {project.modules.length}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {verifiedModules} verified
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('requirements')}
          className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-xs font-medium text-slate-500">Requirements & Risks</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {project.requirements.length}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {approvedReqs} approved · {openRisks} open risks
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('data')}
          className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-xs font-medium text-slate-500">Data Entities & APIs</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {project.entities.length} / {project.endpoints.length}
            </span>
            <span className="text-xs text-slate-500">Tables / Endpoints</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('delivery')}
          className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-xs font-medium text-slate-500">Engineering Delivery</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {doneTasks} / {project.tasks.length}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {donePoints} / {totalPoints} pts
            </span>
          </div>
        </button>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Brief Details or Edit Form */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-base font-semibold text-slate-900">Edit Project Charter</h2>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              {saveError && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {saveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Project Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Domain</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Scale Tier
                  </label>
                  <input
                    type="text"
                    value={scaleTier}
                    onChange={(e) => setScaleTier(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Real-World Problem Statement
                </label>
                <textarea
                  rows={3}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Target Audience
                </label>
                <textarea
                  rows={2}
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Proposed Technical Solution
                </label>
                <textarea
                  rows={3}
                  value={proposedSolution}
                  onChange={(e) => setProposedSolution(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Technology Stack
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTechItem();
                      }
                    }}
                    placeholder="Add technology (e.g. PostgreSQL 16)"
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addTechItem}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {techStack.map((item) => (
                    <div key={item} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-slate-800">{item}</span>
                      <button
                        type="button"
                        onClick={() => setTechStack(techStack.filter((t) => t !== item))}
                        aria-label={`Remove ${item}`}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Success Criteria (one per line)
                </label>
                <textarea
                  rows={3}
                  value={criteriaText}
                  onChange={(e) => setCriteriaText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Brief</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Real-World Problem</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {project.problemStatement}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-sm font-semibold text-slate-900">Target Audience</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {project.targetAudience}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-sm font-semibold text-slate-900">Proposed Solution</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {project.proposedSolution}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-sm font-semibold text-slate-900">Technology Stack</h2>
                <ul className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700">
                  {project.techStack.map((tech) => (
                    <li key={tech} className="flex items-center gap-2 py-1 border-b border-slate-100">
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span>{tech}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {project.successCriteria.length > 0 && (
                <div className="border-t border-slate-100 pt-5">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Measurable Success Criteria
                  </h2>
                  <ul className="mt-2.5 space-y-2 text-sm text-slate-600">
                    {project.successCriteria.map((criterion, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: AI Architecture Audit Panel */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Architecture Audit</h2>
              <p className="mt-1 text-xs text-slate-500">
                Evaluate modules, schema normalization, security, and scalability gaps.
              </p>
            </div>
            <button
              type="button"
              onClick={runArchitectureReview}
              disabled={reviewLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              {reviewLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>{review ? 'Re-run Audit' : 'Run Audit'}</span>
            </button>
          </div>

          {reviewError && (
            <div className="p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{reviewError}</span>
            </div>
          )}

          {reviewLoading && (
            <div className="space-y-3 py-4">
              <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
              <div className="h-20 bg-slate-100 rounded w-full animate-pulse" />
              <div className="h-20 bg-slate-100 rounded w-full animate-pulse" />
            </div>
          )}

          {!reviewLoading && !review && !reviewError && (
            <div className="py-8 text-center space-y-3">
              <ShieldAlert className="h-8 w-8 text-slate-300 mx-auto" />
              <div className="text-sm font-medium text-slate-800">
                No architecture audit run yet
              </div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Run an automated design review against your current modules, SQL entities, and REST endpoints.
              </p>
            </div>
          )}

          {!reviewLoading && review && (
            <div className="space-y-5">
              <p className="text-sm text-slate-700 leading-relaxed">{review.summary}</p>

              {review.strengths.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-semibold text-slate-900 mb-2">Verified Strengths</h3>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {review.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="text-xs font-semibold text-slate-900">Actionable Findings</h3>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {review.findings.map((f) => {
                    const sevColor =
                      f.severity === 'Critical' || f.severity === 'High'
                        ? 'text-red-700'
                        : f.severity === 'Medium'
                          ? 'text-amber-700'
                          : 'text-slate-600';
                    return (
                      <div key={f.id} className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-slate-900">{f.area}</span>
                          <span className={`font-medium ${sevColor}`}>{f.severity} Severity</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">{f.finding}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Recommendation: {f.recommendation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
