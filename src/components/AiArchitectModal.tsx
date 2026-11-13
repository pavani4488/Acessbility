import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, X } from 'lucide-react';
import type { ProjectBlueprint } from '../types/blueprint.ts';
import { api } from '../lib/api.ts';

interface AiArchitectModalProps {
  open: boolean;
  onClose: () => void;
  onCreatedProject: (project: ProjectBlueprint) => void;
}

const QUICK_IDEAS = [
  {
    name: 'FleetPulse',
    domain: 'Cold-Chain Logistics & IoT',
    scaleTier: 'Multi-Region Telemetry',
    description:
      'Real-time cold-chain logistics platform monitoring refrigerated truck temperature sensors, alerting dispatchers on thermal excursions within 30 seconds, tracking chain-of-custody handoffs, and scheduling preventative maintenance.',
  },
  {
    name: 'LearnGraph',
    domain: 'EdTech & Adaptive Assessment',
    scaleTier: 'University SaaS',
    description:
      'Adaptive engineering curriculum and mastery tracking platform where instructors author competency graphs, students solve interactive coding labs with automated rubric grading, and advisors detect at-risk learners early.',
  },
  {
    name: 'GridBalance',
    domain: 'Clean Energy & Microgrid Ops',
    scaleTier: 'Utility Enterprise',
    description:
      'Distributed battery storage and solar microgrid orchestration console that forecasts 24-hour demand peaks, automates grid discharge bidding, and tracks inverter health across commercial sites.',
  },
];

export function AiArchitectModal({ open, onClose, onCreatedProject }: AiArchitectModalProps) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [scaleTier, setScaleTier] = useState('Production SaaS');
  const [description, setDescription] = useState('');

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<
    ProjectBlueprint,
    'id' | 'createdAt' | 'updatedAt'
  > | null>(null);

  if (!open) return null;

  async function handleSynthesize(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !domain.trim() || !description.trim()) {
      setError('Please fill in project name, domain, and description.');
      return;
    }
    setGenerating(true);
    setError(null);
    setDraft(null);
    try {
      const { draft: result } = await api.synthesizeBlueprint({
        name: name.trim(),
        domain: domain.trim(),
        scaleTier: scaleTier.trim(),
        description: description.trim(),
      });
      setDraft(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to synthesize blueprint.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveProject() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const { project } = await api.createProject(draft);
      onCreatedProject(project);
      setDraft(null);
      setName('');
      setDomain('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save synthesized project.');
    } finally {
      setSaving(false);
    }
  }

  function applyQuickIdea(idea: (typeof QUICK_IDEAS)[number]) {
    setName(idea.name);
    setDomain(idea.domain);
    setScaleTier(idea.scaleTier);
    setDescription(idea.description);
    setError(null);
    setDraft(null);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              AI Architecture & Plan Synthesizer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transform a product concept into modules, SQL schema, API contracts, and sprint tasks.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close synthesizer modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Starter Templates */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">Quick Example Prompts</div>
            <div className="flex flex-wrap gap-2">
              {QUICK_IDEAS.map((idea) => (
                <button
                  key={idea.name}
                  type="button"
                  onClick={() => applyQuickIdea(idea)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  {idea.name} · {idea.domain}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSynthesize} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. FleetPulse"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. Logistics & IoT"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Scale
                </label>
                <select
                  value={scaleTier}
                  onChange={(e) => setScaleTier(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="MVP / Startup">MVP / Startup</option>
                  <option value="Production SaaS">Production SaaS</option>
                  <option value="Enterprise Multi-Region">Enterprise Multi-Region</option>
                  <option value="High-Throughput Telemetry">High-Throughput Telemetry</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Project Idea, Target Users & Core Requirements
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the real-world problem, who uses the platform, and the critical workflows required..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
                required
              />
            </div>

            {error && (
              <div className="p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg cursor-pointer"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Synthesizing Architecture...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Blueprint</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Draft Preview */}
          {draft && (
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Blueprint Synthesized</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-1">{draft.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={handleSaveProject}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg shrink-0 cursor-pointer"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save & Open Workspace</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{draft.proposedSolution}</p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-center">
                <div>
                  <div className="text-base font-bold text-slate-900 tabular-nums">
                    {draft.modules.length}
                  </div>
                  <div className="text-[11px] text-slate-500">Modules</div>
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900 tabular-nums">
                    {draft.requirements.length}
                  </div>
                  <div className="text-[11px] text-slate-500">Requirements</div>
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900 tabular-nums">
                    {draft.entities.length}
                  </div>
                  <div className="text-[11px] text-slate-500">SQL Tables</div>
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900 tabular-nums">
                    {draft.endpoints.length}
                  </div>
                  <div className="text-[11px] text-slate-500">Endpoints</div>
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900 tabular-nums">
                    {draft.tasks.length}
                  </div>
                  <div className="text-[11px] text-slate-500">Sprint Tasks</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
