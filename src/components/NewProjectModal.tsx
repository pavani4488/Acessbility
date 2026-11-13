import { useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import type { ProjectBlueprint } from '../types/blueprint.ts';
import { api } from '../lib/api.ts';

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: ProjectBlueprint) => void;
}

export function NewProjectModal({ open, onClose, onCreated }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [scaleTier, setScaleTier] = useState('Production SaaS');
  const [problemStatement, setProblemStatement] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !domain.trim()) {
      setError('Project name and domain are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { project } = await api.createProject({
        name: name.trim(),
        title: title.trim() || `${name.trim()} — System Architecture`,
        domain: domain.trim(),
        scaleTier,
        problemStatement: problemStatement.trim(),
        targetAudience: targetAudience.trim(),
      });
      onCreated(project);
      setName('');
      setTitle('');
      setDomain('');
      setProblemStatement('');
      setTargetAudience('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Create Blank Workspace</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close new project modal"
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meridian"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Supply Chain"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Project Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional full title"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Scale Tier
              </label>
              <select
                value={scaleTier}
                onChange={(e) => setScaleTier(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="MVP / Startup">MVP / Startup</option>
                <option value="Production SaaS">Production SaaS</option>
                <option value="Enterprise Multi-Region">Enterprise Multi-Region</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Problem Statement
            </label>
            <textarea
              rows={3}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="What operational or technical problem does this system solve?"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Operations Managers, Analysts"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Create Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
