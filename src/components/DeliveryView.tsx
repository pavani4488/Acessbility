import { useState, type FormEvent } from 'react';
import { CheckSquare, Plus, Search, Trash2, X } from 'lucide-react';
import type { PriorityLevel, ProjectBlueprint, TaskStatus } from '../types/blueprint.ts';
import { api } from '../lib/api.ts';
import { getTeamMember, TEAM_MEMBERS } from '../data/team.ts';

interface DeliveryViewProps {
  project: ProjectBlueprint;
  onUpdateProject: (updated: ProjectBlueprint) => void;
}

const STAGES: TaskStatus[] = ['Backlog', 'In Progress', 'In Review', 'Done'];

function MemberAvatar({ assigneeId }: { assigneeId: string }) {
  const [err, setErr] = useState(false);
  const member = getTeamMember(assigneeId);
  if (err) {
    return (
      <span
        title={member.name}
        className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold inline-flex items-center justify-center shrink-0"
      >
        {member.initials}
      </span>
    );
  }
  return (
    <img
      src={member.avatarUrl}
      alt={member.name}
      title={`${member.name} (${member.role})`}
      referrerPolicy="no-referrer"
      onError={() => setErr(true)}
      className="h-6 w-6 rounded-full object-cover border border-slate-200 shrink-0"
    />
  );
}

export function DeliveryView({ project, onUpdateProject }: DeliveryViewProps) {
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [showAddTask, setShowAddTask] = useState(false);

  // Add task form
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('P1');
  const [points, setPoints] = useState(3);
  const [assigneeId, setAssigneeId] = useState(TEAM_MEMBERS[0].id);
  const [moduleId, setModuleId] = useState(project.modules[0]?.id ?? '');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');

  const moduleMap = new Map(project.modules.map((m) => [m.id, m.name]));

  const filteredTasks = project.tasks.filter((t) => {
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
    return matchesPriority && matchesSearch;
  });

  const totalPoints = project.tasks.reduce((sum, t) => sum + t.points, 0);
  const stageStats = STAGES.map((stage) => {
    const tasks = project.tasks.filter((t) => t.status === stage);
    const pts = tasks.reduce((sum, t) => sum + t.points, 0);
    return {
      stage,
      count: tasks.length,
      points: pts,
      pct: totalPoints > 0 ? Math.round((pts / totalPoints) * 100) : 0,
    };
  });

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const { project: updated } = await api.updateTask(project.id, taskId, { status });
    onUpdateProject(updated);
  }

  async function handleDeleteTask(taskId: string) {
    const { project: updated } = await api.deleteTask(project.id, taskId);
    onUpdateProject(updated);
  }

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { project: updated } = await api.addTask(project.id, {
      code: code.trim().toUpperCase() || undefined,
      title: title.trim(),
      priority,
      points,
      assigneeId,
      moduleId,
      dueDate,
      notes: notes.trim(),
      status: 'Backlog',
    });
    onUpdateProject(updated);
    setCode('');
    setTitle('');
    setNotes('');
    setShowAddTask(false);
  }

  return (
    <div className="space-y-5">
      {/* Live Delivery Distribution Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Sprint Point Distribution</h2>
          <span className="text-xs text-slate-500 tabular-nums">
            {totalPoints} total story points across {project.tasks.length} tasks
          </span>
        </div>

        {/* Clean Stacked Progress SVG Bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          {stageStats.map((s) => {
            if (s.pct === 0) return null;
            const color =
              s.stage === 'Done'
                ? 'bg-emerald-600'
                : s.stage === 'In Review'
                  ? 'bg-blue-700'
                  : s.stage === 'In Progress'
                    ? 'bg-amber-500'
                    : 'bg-slate-400';
            return (
              <div
                key={s.stage}
                style={{ width: `${s.pct}%` }}
                className={`${color} h-full transition-all duration-200`}
                title={`${s.stage}: ${s.points} pts (${s.pct}%)`}
              />
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {stageStats.map((s) => (
            <div key={s.stage} className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-600 font-medium">{s.stage}</span>
              <span className="font-mono text-slate-900 tabular-nums">
                {s.count} · {s.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kanban Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Task Grid
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'P0', 'P1', 'P2'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  priorityFilter === p
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'all' ? 'All Priorities' : p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-700 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAddTask(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {project.tasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 text-center px-4">
          <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-800">No engineering tasks scheduled</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Break system modules down into sprint deliverables with story points and due dates.
          </p>
          <button
            type="button"
            onClick={() => setShowAddTask(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
          >
            Create First Task
          </button>
        </div>
      ) : viewMode === 'board' ? (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {STAGES.map((stage) => {
            const stageTasks = filteredTasks.filter((t) => t.status === stage);
            return (
              <div
                key={stage}
                className="bg-slate-100/80 border border-slate-200 rounded-xl p-3 space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-slate-800">{stage}</span>
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    {stageTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {stageTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-mono font-medium text-slate-700 tabular-nums">
                          {task.code} · {task.priority}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          aria-label={`Delete task ${task.code}`}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-sm font-medium text-slate-900 leading-snug">
                        {task.title}
                      </div>

                      <div className="text-xs text-slate-500 truncate">
                        {moduleMap.get(task.moduleId) ?? 'Core Platform'}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MemberAvatar assigneeId={task.assigneeId} />
                          <span className="text-xs font-mono text-slate-600 tabular-nums">
                            {task.points} pts
                          </span>
                        </div>
                        <select
                          aria-label={`Move ${task.code} to stage`}
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task.id, e.target.value as TaskStatus)
                          }
                          className="text-[11px] border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-700"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {stageTasks.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No tasks in {stage}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dense Data Grid */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 px-4 whitespace-nowrap">Code</th>
                  <th className="py-2.5 px-4">Deliverable</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Module</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Owner</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">Points</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">Due Date</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">Stage</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredTasks.map((task) => {
                  const member = getTeamMember(task.assigneeId);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-slate-700 tabular-nums whitespace-nowrap">
                        {task.code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{task.title}</td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {moduleMap.get(task.moduleId) ?? 'Core'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs text-slate-700">
                          <MemberAvatar assigneeId={task.assigneeId} />
                          <span>{member.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 tabular-nums">
                        {task.points}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {task.dueDate}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <select
                          aria-label={`Stage for ${task.code}`}
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task.id, e.target.value as TaskStatus)
                          }
                          className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          aria-label={`Delete ${task.code}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">New Engineering Task</h3>
              <button type="button" onClick={() => setShowAddTask(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ARCH-106"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="P0">P0</option>
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Points</label>
                  <input
                    type="number"
                    min={1}
                    max={21}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Implement health check & rate limit middleware"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Owner</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {TEAM_MEMBERS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Module</label>
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Core Platform</option>
                  {project.modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
