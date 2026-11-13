import { useState, type FormEvent } from 'react';
import { Check, Copy, Database, Globe, Plus, Trash2, X } from 'lucide-react';
import type { DataEntity, EntityField, HttpMethod, ProjectBlueprint } from '../types/blueprint.ts';
import { api } from '../lib/api.ts';
import { generateSqlDdl } from '../lib/generators.ts';

interface DataApiViewProps {
  project: ProjectBlueprint;
  onUpdateProject: (updated: ProjectBlueprint) => void;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-emerald-700',
  POST: 'text-blue-700',
  PUT: 'text-amber-700',
  PATCH: 'text-amber-700',
  DELETE: 'text-red-700',
};

export function DataApiView({ project, onUpdateProject }: DataApiViewProps) {
  const [activeTab, setActiveTab] = useState<'schema' | 'apis'>('schema');
  const [copiedSql, setCopiedSql] = useState(false);

  // Add entity modal
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [entityName, setEntityName] = useState('');
  const [entityDesc, setEntityDesc] = useState('');

  // Add field inline modal
  const [fieldTargetEntityId, setFieldTargetEntityId] = useState<string | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('VARCHAR(128)');
  const [fieldNullable, setFieldNullable] = useState(false);
  const [fieldFk, setFieldFk] = useState(false);
  const [fieldRef, setFieldRef] = useState('');
  const [fieldDesc, setFieldDesc] = useState('');

  // Add endpoint modal
  const [showAddEndpoint, setShowAddEndpoint] = useState(false);
  const [epMethod, setEpMethod] = useState<HttpMethod>('POST');
  const [epPath, setEpPath] = useState('');
  const [epSummary, setEpSummary] = useState('');
  const [epAuth, setEpAuth] = useState(true);
  const [epModuleId, setEpModuleId] = useState(project.modules[0]?.id ?? '');
  const [epReq, setEpReq] = useState('{ }');
  const [epRes, setEpRes] = useState('{ ok: true }');

  const moduleMap = new Map(project.modules.map((m) => [m.id, m.name]));
  const sqlText = generateSqlDdl(project.entities);

  async function handleCopySql() {
    await navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 1800);
  }

  async function handleCreateEntity(e: FormEvent) {
    e.preventDefault();
    if (!entityName.trim()) return;
    const { project: updated } = await api.addEntity(project.id, {
      name: entityName.trim(),
      description: entityDesc.trim(),
    });
    onUpdateProject(updated);
    setEntityName('');
    setEntityDesc('');
    setShowAddEntity(false);
  }

  async function handleDeleteEntity(entityId: string) {
    const { project: updated } = await api.deleteEntity(project.id, entityId);
    onUpdateProject(updated);
  }

  async function handleAddField(e: FormEvent) {
    e.preventDefault();
    if (!fieldTargetEntityId || !fieldName.trim()) return;
    const target = project.entities.find((ent) => ent.id === fieldTargetEntityId);
    if (!target) return;

    const newField: EntityField = {
      id: `fld-${Date.now().toString(36)}`,
      name: fieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      type: fieldType.trim().toUpperCase() || 'TEXT',
      nullable: fieldNullable,
      isPrimaryKey: false,
      isForeignKey: fieldFk,
      references: fieldFk && fieldRef.trim() ? fieldRef.trim() : undefined,
      description: fieldDesc.trim(),
    };

    const { project: updated } = await api.updateEntity(project.id, target.id, {
      fields: [...target.fields, newField],
    });
    onUpdateProject(updated);
    setFieldTargetEntityId(null);
    setFieldName('');
    setFieldRef('');
    setFieldDesc('');
  }

  async function handleDeleteField(entity: DataEntity, fieldId: string) {
    const { project: updated } = await api.updateEntity(project.id, entity.id, {
      fields: entity.fields.filter((f) => f.id !== fieldId),
    });
    onUpdateProject(updated);
  }

  async function handleCreateEndpoint(e: FormEvent) {
    e.preventDefault();
    if (!epPath.trim()) return;
    const { project: updated } = await api.addEndpoint(project.id, {
      method: epMethod,
      path: epPath.trim().startsWith('/') ? epPath.trim() : `/${epPath.trim()}`,
      summary: epSummary.trim(),
      authRequired: epAuth,
      moduleId: epModuleId,
      requestShape: epReq.trim(),
      responseShape: epRes.trim(),
    });
    onUpdateProject(updated);
    setEpPath('');
    setEpSummary('');
    setShowAddEndpoint(false);
  }

  async function handleDeleteEndpoint(epId: string) {
    const { project: updated } = await api.deleteEndpoint(project.id, epId);
    onUpdateProject(updated);
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'schema'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Schema & SQL DDL ({project.entities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apis')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'apis'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            API Endpoints ({project.endpoints.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            activeTab === 'schema' ? setShowAddEntity(true) : setShowAddEndpoint(true)
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{activeTab === 'schema' ? 'Add Table Entity' : 'Add Endpoint'}</span>
        </button>
      </div>

      {/* Schema & SQL DDL View */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Entities List */}
          <div className="xl:col-span-7 space-y-4">
            {project.entities.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl py-12 text-center px-4">
                <Database className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-800">No database tables defined</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Define relational entities and columns to automatically generate PostgreSQL DDL.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddEntity(true)}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Create First Table
                </button>
              </div>
            ) : (
              project.entities.map((ent) => (
                <div
                  key={ent.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-mono font-semibold text-slate-900 truncate">
                        {ent.name}
                      </h3>
                      {ent.description && (
                        <p className="text-xs text-slate-500 truncate">{ent.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFieldTargetEntityId(ent.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-md"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Column</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntity(ent.id)}
                        aria-label={`Delete table ${ent.name}`}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                          <th className="py-2 px-4 font-medium">Column</th>
                          <th className="py-2 px-4 font-medium">Type</th>
                          <th className="py-2 px-4 font-medium">Constraints</th>
                          <th className="py-2 px-4 font-medium">Notes</th>
                          <th className="py-2 px-4 text-right font-medium" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ent.fields.map((fld) => (
                          <tr key={fld.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                              {fld.name}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                              {fld.type}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                              {[
                                fld.isPrimaryKey ? 'PK' : null,
                                fld.isForeignKey
                                  ? `FK${fld.references ? ` → ${fld.references}` : ''}`
                                  : null,
                                !fld.nullable && !fld.isPrimaryKey ? 'NOT NULL' : null,
                              ]
                                .filter(Boolean)
                                .join(' · ') || 'NULLABLE'}
                            </td>
                            <td className="py-2.5 px-4 text-slate-500">{fld.description}</td>
                            <td className="py-2.5 px-4 text-right">
                              {!fld.isPrimaryKey && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteField(ent, fld.id)}
                                  aria-label={`Remove column ${fld.name}`}
                                  className="p-1 text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Live SQL DDL Output */}
          <div className="xl:col-span-5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                Generated PostgreSQL DDL
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto max-h-[560px] text-slate-200">
              {sqlText}
            </pre>
          </div>
        </div>
      )}

      {/* API Endpoints View */}
      {activeTab === 'apis' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {project.endpoints.length === 0 ? (
            <div className="py-12 text-center px-4">
              <Globe className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-800">No API endpoints defined</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Document REST routes, authentication requirements, and request/response payloads.
              </p>
              <button
                type="button"
                onClick={() => setShowAddEndpoint(true)}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
              >
                Add First Endpoint
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {project.endpoints.map((ep) => (
                <div key={ep.id} className="p-5 hover:bg-slate-50/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-mono text-xs font-bold w-14 shrink-0 ${
                          METHOD_COLORS[ep.method]
                        }`}
                      >
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono font-semibold text-slate-900 truncate">
                        {ep.path}
                      </code>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                      <span>{moduleMap.get(ep.moduleId) ?? 'API Gateway'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ep.authRequired ? 'Auth Required' : 'Public'}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEndpoint(ep.id)}
                        aria-label={`Delete ${ep.method} ${ep.path}`}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {ep.summary && <p className="text-xs text-slate-600">{ep.summary}</p>}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="text-slate-500 font-medium mb-1">Request Contract</div>
                      <code className="text-slate-800 break-all">{ep.requestShape}</code>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="text-slate-500 font-medium mb-1">Response Contract</div>
                      <code className="text-slate-800 break-all">{ep.responseShape}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Entity Modal */}
      {showAddEntity && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">New Table Entity</h3>
              <button type="button" onClick={() => setShowAddEntity(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateEntity} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Table Name (snake_case)
                </label>
                <input
                  type="text"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="e.g. webhook_events"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={entityDesc}
                  onChange={(e) => setEntityDesc(e.target.value)}
                  placeholder="Purpose of this table..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEntity(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {fieldTargetEntityId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Add Table Column</h3>
              <button
                type="button"
                onClick={() => setFieldTargetEntityId(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddField} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Column Name
                  </label>
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="account_id"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">SQL Type</label>
                  <input
                    type="text"
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                    placeholder="UUID"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldNullable}
                    onChange={(e) => setFieldNullable(e.target.checked)}
                    className="accent-blue-700"
                  />
                  <span>Nullable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldFk}
                    onChange={(e) => setFieldFk(e.target.checked)}
                    className="accent-blue-700"
                  />
                  <span>Foreign Key</span>
                </label>
              </div>

              {fieldFk && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    References (table.column)
                  </label>
                  <input
                    type="text"
                    value={fieldRef}
                    onChange={(e) => setFieldRef(e.target.value)}
                    placeholder="ledger_accounts.id"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={fieldDesc}
                  onChange={(e) => setFieldDesc(e.target.value)}
                  placeholder="Column purpose..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFieldTargetEntityId(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Add Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Endpoint Modal */}
      {showAddEndpoint && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Add API Endpoint</h3>
              <button type="button" onClick={() => setShowAddEndpoint(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateEndpoint} className="mt-4 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Method</label>
                  <select
                    value={epMethod}
                    onChange={(e) => setEpMethod(e.target.value as HttpMethod)}
                    className="w-full px-2.5 py-2 text-sm font-mono border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Path</label>
                  <input
                    type="text"
                    value={epPath}
                    onChange={(e) => setEpPath(e.target.value)}
                    placeholder="/api/v1/resources/:id"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Module</label>
                  <select
                    value={epModuleId}
                    onChange={(e) => setEpModuleId(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">API Gateway</option>
                    {project.modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={epAuth}
                      onChange={(e) => setEpAuth(e.target.checked)}
                      className="accent-blue-700"
                    />
                    <span>Requires Bearer / Session Auth</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Summary</label>
                <input
                  type="text"
                  value={epSummary}
                  onChange={(e) => setEpSummary(e.target.value)}
                  placeholder="What this endpoint does..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Request Shape
                  </label>
                  <textarea
                    rows={2}
                    value={epReq}
                    onChange={(e) => setEpReq(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Response Shape
                  </label>
                  <textarea
                    rows={2}
                    value={epRes}
                    onChange={(e) => setEpRes(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEndpoint(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Save Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
