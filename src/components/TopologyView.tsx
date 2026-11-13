import { useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { Layers, Link2, Plus, Trash2, X } from 'lucide-react';
import type { ModuleLayer, ModuleStatus, ProjectBlueprint, SystemModule } from '../types/blueprint.ts';
import { api } from '../lib/api.ts';

interface TopologyViewProps {
  project: ProjectBlueprint;
  onUpdateProject: (updated: ProjectBlueprint) => void;
}

const LAYER_LABELS: Record<ModuleLayer, string> = {
  client: 'Client UI',
  gateway: 'API Gateway',
  service: 'Core Service',
  data: 'Data Store',
  integration: 'External / AI',
};

const LAYER_ORDER: ModuleLayer[] = ['client', 'gateway', 'service', 'data', 'integration'];

const STATUS_TEXT_COLOR: Record<ModuleStatus, string> = {
  Planned: 'text-slate-500',
  'In Design': 'text-amber-700',
  'In Build': 'text-blue-700',
  Verified: 'text-emerald-700',
};

export function TopologyView({ project, onUpdateProject }: TopologyViewProps) {
  const [layerFilter, setLayerFilter] = useState<'all' | ModuleLayer>('all');
  const [selectedId, setSelectedId] = useState<string>(project.modules[0]?.id ?? '');
  const [showAddModal, setShowAddModal] = useState(false);

  // Dragging state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});

  // New module form state
  const [newName, setNewName] = useState('');
  const [newLayer, setNewLayer] = useState<ModuleLayer>('service');
  const [newTech, setNewTech] = useState('');
  const [newResp, setNewResp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedModule = project.modules.find((m) => m.id === selectedId) ?? project.modules[0];

  const visibleModules =
    layerFilter === 'all'
      ? project.modules
      : project.modules.filter((m) => m.layer === layerFilter);

  function getPos(mod: SystemModule) {
    return localPositions[mod.id] ?? { x: mod.x, y: mod.y };
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>, mod: SystemModule) {
    if ((e.target as HTMLElement).closest('button')) return;
    setSelectedId(mod.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = getPos(mod);
    setDraggingId(mod.id);
    setDragOffset({
      x: e.clientX - rect.left - pos.x,
      y: e.clientY - rect.top - pos.y,
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(16, Math.min(rect.width - 224, e.clientX - rect.left - dragOffset.x));
    const y = Math.max(16, Math.min(rect.height - 116, e.clientY - rect.top - dragOffset.y));
    setLocalPositions((prev) => ({
      ...prev,
      [draggingId]: { x: Math.round(x), y: Math.round(y) },
    }));
  }

  async function handlePointerUp() {
    if (!draggingId) return;
    const modId = draggingId;
    const finalPos = localPositions[modId];
    setDraggingId(null);
    if (!finalPos) return;
    try {
      const { project: updated } = await api.updateModule(project.id, modId, finalPos);
      onUpdateProject(updated);
    } catch {
      // Revert local override if request fails
      setLocalPositions((prev) => {
        const next = { ...prev };
        delete next[modId];
        return next;
      });
    }
  }

  async function handleAddModule(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const layerXMap: Record<ModuleLayer, number> = {
        client: 50,
        gateway: 280,
        service: 510,
        data: 750,
        integration: 750,
      };
      const existingInLayer = project.modules.filter((m) => m.layer === newLayer).length;
      const { project: updated } = await api.addModule(project.id, {
        name: newName.trim(),
        layer: newLayer,
        status: 'Planned',
        technology: newTech.trim() || 'TypeScript',
        responsibility: newResp.trim(),
        x: layerXMap[newLayer],
        y: 50 + existingInLayer * 135,
      });
      onUpdateProject(updated);
      const added = updated.modules[updated.modules.length - 1];
      if (added) setSelectedId(added.id);
      setNewName('');
      setNewTech('');
      setNewResp('');
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateSelected(patch: Partial<SystemModule>) {
    if (!selectedModule) return;
    const { project: updated } = await api.updateModule(project.id, selectedModule.id, patch);
    onUpdateProject(updated);
  }

  async function handleToggleDependency(targetId: string) {
    if (!selectedModule || targetId === selectedModule.id) return;
    const exists = selectedModule.dependencies.includes(targetId);
    const nextDeps = exists
      ? selectedModule.dependencies.filter((d) => d !== targetId)
      : [...selectedModule.dependencies, targetId];
    await handleUpdateSelected({ dependencies: nextDeps });
  }

  async function handleDeleteSelected() {
    if (!selectedModule) return;
    const { project: updated } = await api.deleteModule(project.id, selectedModule.id);
    onUpdateProject(updated);
    setSelectedId(updated.modules[0]?.id ?? '');
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setLayerFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              layerFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Layers
          </button>
          {LAYER_ORDER.map((layer) => (
            <button
              key={layer}
              type="button"
              onClick={() => setLayerFilter(layer)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                layerFilter === layer
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {LAYER_LABELS[layer]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Module</span>
        </button>
      </div>

      {/* Main Canvas + Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Interactive Topology Canvas */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Drag module blocks to arrange layout · Click to inspect dependencies</span>
            <span className="tabular-nums">{visibleModules.length} visible nodes</span>
          </div>

          {project.modules.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center p-6 text-center">
              <Layers className="h-8 w-8 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-800">No system modules defined</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Add your first client, gateway, service, or data module to map the architecture.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
              >
                Add First Module
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div
                ref={canvasRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative min-w-[980px] h-[480px] bg-slate-50/70 select-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              >
                {/* SVG Dependency Edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                    </marker>
                    <marker
                      id="arrow-active"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#1d4ed8" />
                    </marker>
                  </defs>

                  {visibleModules.map((mod) => {
                    const from = getPos(mod);
                    return mod.dependencies.map((depId) => {
                      const target = visibleModules.find((m) => m.id === depId);
                      if (!target) return null;
                      const to = getPos(target);
                      const startX = from.x + 208;
                      const startY = from.y + 46;
                      const endX = to.x;
                      const endY = to.y + 46;
                      const dx = Math.max(40, Math.abs(endX - startX) * 0.45);
                      const isHighlighted =
                        selectedModule?.id === mod.id || selectedModule?.id === target.id;
                      const d = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
                      return (
                        <path
                          key={`${mod.id}-${depId}`}
                          d={d}
                          fill="none"
                          stroke={isHighlighted ? '#1d4ed8' : '#94a3b8'}
                          strokeWidth={isHighlighted ? 2 : 1.5}
                          markerEnd={isHighlighted ? 'url(#arrow-active)' : 'url(#arrow)'}
                        />
                      );
                    });
                  })}
                </svg>

                {/* Draggable Module Nodes */}
                {visibleModules.map((mod) => {
                  const pos = getPos(mod);
                  const isSelected = selectedModule?.id === mod.id;
                  return (
                    <div
                      key={mod.id}
                      onPointerDown={(e) => handlePointerDown(e, mod)}
                      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                      className={`absolute top-0 left-0 w-52 bg-white rounded-lg border p-3.5 cursor-grab active:cursor-grabbing transition-shadow ${
                        isSelected
                          ? 'border-blue-700 ring-2 ring-blue-100 z-20'
                          : 'border-slate-200 hover:border-slate-300 z-10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{LAYER_LABELS[mod.layer]}</span>
                        <span className={`font-medium ${STATUS_TEXT_COLOR[mod.status]}`}>
                          {mod.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 truncate">
                        {mod.name}
                      </div>
                      <div className="mt-1 text-xs font-mono text-slate-500 truncate">
                        {mod.technology}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Module Inspector */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
          {selectedModule ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">{LAYER_LABELS[selectedModule.layer]}</div>
                  <h2 className="text-base font-semibold text-slate-900 truncate">
                    {selectedModule.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  aria-label="Delete selected module"
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Layer</label>
                  <select
                    value={selectedModule.layer}
                    onChange={(e) =>
                      handleUpdateSelected({ layer: e.target.value as ModuleLayer })
                    }
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {LAYER_ORDER.map((l) => (
                      <option key={l} value={l}>
                        {LAYER_LABELS[l]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={selectedModule.status}
                    onChange={(e) =>
                      handleUpdateSelected({ status: e.target.value as ModuleStatus })
                    }
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Design">In Design</option>
                    <option value="In Build">In Build</option>
                    <option value="Verified">Verified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Technology Stack
                </label>
                <input
                  type="text"
                  value={selectedModule.technology}
                  onChange={(e) => handleUpdateSelected({ technology: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Responsibility
                </label>
                <textarea
                  rows={3}
                  value={selectedModule.responsibility}
                  onChange={(e) => handleUpdateSelected({ responsibility: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-2">
                  <Link2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Outbound Dependencies</span>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {project.modules
                    .filter((m) => m.id !== selectedModule.id)
                    .map((other) => {
                      const linked = selectedModule.dependencies.includes(other.id);
                      return (
                        <label
                          key={other.id}
                          className="flex items-center justify-between px-2.5 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <span className="truncate text-slate-800">{other.name}</span>
                          <input
                            type="checkbox"
                            checked={linked}
                            onChange={() => handleToggleDependency(other.id)}
                            className="h-4 w-4 accent-blue-700"
                          />
                        </label>
                      );
                    })}
                  {project.modules.length <= 1 && (
                    <p className="text-xs text-slate-400">
                      Add another module to connect dependencies.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-8 text-center">
              Select a module on the canvas to inspect or edit its properties.
            </p>
          )}
        </div>
      </div>

      {/* Add Module Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Add System Module</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddModule} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Module Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Notification Worker"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Layer</label>
                <select
                  value={newLayer}
                  onChange={(e) => setNewLayer(e.target.value as ModuleLayer)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {LAYER_ORDER.map((l) => (
                    <option key={l} value={l}>
                      {LAYER_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Technology
                </label>
                <input
                  type="text"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  placeholder="e.g. Node.js + BullMQ"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Responsibility
                </label>
                <textarea
                  rows={2}
                  value={newResp}
                  onChange={(e) => setNewResp(e.target.value)}
                  placeholder="Core architectural responsibility..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
