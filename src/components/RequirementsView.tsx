import { useState, type FormEvent } from 'react';
import { Plus, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import type {
  PriorityLevel,
  ProjectBlueprint,
  RequirementCategory,
  RequirementStatus,
  RiskSeverity,
} from '../types/blueprint.ts';
import { api } from '../lib/api.ts';

interface RequirementsViewProps {
  project: ProjectBlueprint;
  onUpdateProject: (updated: ProjectBlueprint) => void;
}

export function RequirementsView({ project, onUpdateProject }: RequirementsViewProps) {
  const [activeTab, setActiveTab] = useState<'requirements' | 'risks'>('requirements');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | RequirementCategory>('all');
  const [showAddReq, setShowAddReq] = useState(false);
  const [showAddRisk, setShowAddRisk] = useState(false);

  // Requirement form
  const [reqCode, setReqCode] = useState('');
  const [reqTitle, setReqTitle] = useState('');
  const [reqCategory, setReqCategory] = useState<RequirementCategory>('Functional');
  const [reqPriority, setReqPriority] = useState<PriorityLevel>('P0');
  const [reqModuleId, setReqModuleId] = useState(project.modules[0]?.id ?? '');
  const [reqCriteria, setReqCriteria] = useState('');

  // Risk form
  const [riskTitle, setRiskTitle] = useState('');
  const [riskLikelihood, setRiskLikelihood] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [riskImpact, setRiskImpact] = useState<'Low' | 'Medium' | 'High'>('High');
  const [riskSeverity, setRiskSeverity] = useState<RiskSeverity>('High');
  const [riskMitigation, setRiskMitigation] = useState('');

  const moduleMap = new Map(project.modules.map((m) => [m.id, m.name]));

  const filteredReqs = project.requirements.filter((r) => {
    const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      r.code.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.acceptanceCriteria.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const filteredRisks = project.risks.filter((rk) => {
    const q = search.trim().toLowerCase();
    return !q || rk.title.toLowerCase().includes(q) || rk.mitigation.toLowerCase().includes(q);
  });

  async function handleAddRequirement(e: FormEvent) {
    e.preventDefault();
    if (!reqCode.trim() || !reqTitle.trim()) return;
    const { project: updated } = await api.addRequirement(project.id, {
      code: reqCode.trim().toUpperCase(),
      title: reqTitle.trim(),
      category: reqCategory,
      priority: reqPriority,
      status: 'Draft',
      moduleId: reqModuleId,
      acceptanceCriteria: reqCriteria.trim(),
    });
    onUpdateProject(updated);
    setReqCode('');
    setReqTitle('');
    setReqCriteria('');
    setShowAddReq(false);
  }

  async function handleUpdateReqStatus(reqId: string, status: RequirementStatus) {
    const { project: updated } = await api.updateRequirement(project.id, reqId, { status });
    onUpdateProject(updated);
  }

  async function handleDeleteReq(reqId: string) {
    const { project: updated } = await api.deleteRequirement(project.id, reqId);
    onUpdateProject(updated);
  }

  async function handleAddRisk(e: FormEvent) {
    e.preventDefault();
    if (!riskTitle.trim()) return;
    const { project: updated } = await api.addRisk(project.id, {
      title: riskTitle.trim(),
      likelihood: riskLikelihood,
      impact: riskImpact,
      severity: riskSeverity,
      mitigation: riskMitigation.trim(),
      mitigated: false,
    });
    onUpdateProject(updated);
    setRiskTitle('');
    setRiskMitigation('');
    setShowAddRisk(false);
  }

  async function handleToggleRiskMitigated(riskId: string, mitigated: boolean) {
    const { project: updated } = await api.updateRisk(project.id, riskId, { mitigated });
    onUpdateProject(updated);
  }

  async function handleDeleteRisk(riskId: string) {
    const { project: updated } = await api.deleteRisk(project.id, riskId);
    onUpdateProject(updated);
  }

  return (
    <div className="space-y-5">
      {/* Segmented Switch + Search + Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('requirements')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'requirements'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Requirements ({project.requirements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('risks')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'risks'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Risk Register ({project.risks.length})
            </button>
          </div>

          {activeTab === 'requirements' && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['all', 'Functional', 'Non-Functional'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'all' ? 'All Types' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter items..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-700 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => (activeTab === 'requirements' ? setShowAddReq(true) : setShowAddRisk(true))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{activeTab === 'requirements' ? 'Add Requirement' : 'Add Risk'}</span>
          </button>
        </div>
      </div>

      {/* Requirements Table */}
      {activeTab === 'requirements' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredReqs.length === 0 ? (
            <div className="py-12 text-center px-4">
              <p className="text-sm font-medium text-slate-800">No requirements match your filter</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Add functional or non-functional specifications with testable acceptance criteria.
              </p>
              <button
                type="button"
                onClick={() => setShowAddReq(true)}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
              >
                Log First Requirement
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-2.5 px-4 whitespace-nowrap">Code</th>
                    <th className="py-2.5 px-4">Specification</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Type</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Module</th>
                    <th className="py-2.5 px-4 text-right whitespace-nowrap">Priority</th>
                    <th className="py-2.5 px-4 text-right whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredReqs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-slate-700 tabular-nums whitespace-nowrap align-top">
                        {r.code}
                      </td>
                      <td className="py-3 px-4 align-top max-w-md">
                        <div className="font-medium text-slate-900 text-sm">{r.title}</div>
                        {r.acceptanceCriteria && (
                          <div className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                            {r.acceptanceCriteria}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap align-top">
                        {r.category}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap align-top">
                        {moduleMap.get(r.moduleId) ?? 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums whitespace-nowrap align-top">
                        <span
                          className={
                            r.priority === 'P0'
                              ? 'text-red-700'
                              : r.priority === 'P1'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                          }
                        >
                          {r.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap align-top">
                        <select
                          aria-label={`Status for ${r.code}`}
                          value={r.status}
                          onChange={(e) =>
                            handleUpdateReqStatus(r.id, e.target.value as RequirementStatus)
                          }
                          className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-800"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Approved">Approved</option>
                          <option value="Implemented">Implemented</option>
                          <option value="Verified">Verified</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap align-top">
                        <button
                          type="button"
                          onClick={() => handleDeleteReq(r.id)}
                          aria-label={`Delete ${r.code}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Risk Mitigation Register */}
      {activeTab === 'risks' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredRisks.length === 0 ? (
            <div className="py-12 text-center px-4">
              <p className="text-sm font-medium text-slate-800">No architectural risks logged</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Document single points of failure, scalability bottlenecks, and security mitigations.
              </p>
              <button
                type="button"
                onClick={() => setShowAddRisk(true)}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
              >
                Log First Risk
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredRisks.map((rk) => {
                const sevClass =
                  rk.severity === 'Critical' || rk.severity === 'High'
                    ? 'text-red-700'
                    : rk.severity === 'Medium'
                      ? 'text-amber-700'
                      : 'text-slate-600';
                return (
                  <div
                    key={rk.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/60"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`font-semibold ${sevClass}`}>{rk.severity} Severity</span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="text-slate-500">
                          Likelihood: {rk.likelihood} / Impact: {rk.impact}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className={rk.mitigated ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                          {rk.mitigated ? 'Mitigated' : 'Active Risk'}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{rk.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Mitigation: {rk.mitigation}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRiskMitigated(rk.id, !rk.mitigated)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          rk.mitigated
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{rk.mitigated ? 'Mitigated' : 'Mark Mitigated'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRisk(rk.id)}
                        aria-label={`Delete risk ${rk.title}`}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Requirement Modal */}
      {showAddReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Add Requirement</h3>
              <button type="button" onClick={() => setShowAddReq(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddRequirement} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={reqCode}
                    onChange={(e) => setReqCode(e.target.value)}
                    placeholder="FR-04"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value as RequirementCategory)}
                    className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Functional">Functional</option>
                    <option value="Non-Functional">Non-Functional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value as PriorityLevel)}
                    className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="P0">P0</option>
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="Short requirement summary"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Module</label>
                <select
                  value={reqModuleId}
                  onChange={(e) => setReqModuleId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Unassigned</option>
                  {project.modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Acceptance Criteria
                </label>
                <textarea
                  rows={3}
                  value={reqCriteria}
                  onChange={(e) => setReqCriteria(e.target.value)}
                  placeholder="Measurable verification criteria..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReq(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Save Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Risk Modal */}
      {showAddRisk && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Log Architectural Risk</h3>
              <button type="button" onClick={() => setShowAddRisk(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddRisk} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Risk Title</label>
                <input
                  type="text"
                  value={riskTitle}
                  onChange={(e) => setRiskTitle(e.target.value)}
                  placeholder="e.g. Webhook replay storm during failover"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Likelihood</label>
                  <select
                    value={riskLikelihood}
                    onChange={(e) => setRiskLikelihood(e.target.value as 'Low' | 'Medium' | 'High')}
                    className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Impact</label>
                  <select
                    value={riskImpact}
                    onChange={(e) => setRiskImpact(e.target.value as 'Low' | 'Medium' | 'High')}
                    className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Severity</label>
                  <select
                    value={riskSeverity}
                    onChange={(e) => setRiskSeverity(e.target.value as RiskSeverity)}
                    className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mitigation Strategy
                </label>
                <textarea
                  rows={3}
                  value={riskMitigation}
                  onChange={(e) => setRiskMitigation(e.target.value)}
                  placeholder="Concrete engineering mitigation..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRisk(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Log Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
