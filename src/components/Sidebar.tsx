import { useState } from 'react';
import {
  CheckSquare,
  Database,
  Download,
  FileText,
  FolderPlus,
  Layers,
  ListChecks,
  Trash2,
  X,
} from 'lucide-react';
import type { ProjectSummary, WorkspaceSection } from '../types/blueprint.ts';
import { TEAM_MEMBERS } from '../data/team.ts';

interface SidebarProps {
  projects: ProjectSummary[];
  activeProjectId: string;
  activeSection: WorkspaceSection;
  onSelectProject: (id: string) => void;
  onSelectSection: (section: WorkspaceSection) => void;
  onOpenNewProject: () => void;
  onDeleteProject: (id: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: WorkspaceSection;
  label: string;
  icon: typeof FileText;
}> = [
  { id: 'overview', label: 'Project Brief', icon: FileText },
  { id: 'topology', label: 'System Topology', icon: Layers },
  { id: 'requirements', label: 'Requirements & Risks', icon: ListChecks },
  { id: 'data', label: 'Data & APIs', icon: Database },
  { id: 'delivery', label: 'Engineering Delivery', icon: CheckSquare },
  { id: 'export', label: 'Export Spec', icon: Download },
];

export function Sidebar({
  projects,
  activeProjectId,
  activeSection,
  onSelectProject,
  onSelectSection,
  onOpenNewProject,
  onDeleteProject,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [avatarError, setAvatarError] = useState(false);
  const lead = TEAM_MEMBERS[0];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200 shrink-0">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
          ArchSpec
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 rounded-md"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Project Switcher */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Workspaces</span>
          <button
            type="button"
            onClick={onOpenNewProject}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 py-1 px-1.5 rounded hover:bg-blue-50 transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
          {projects.map((p) => {
            const isActive = p.id === activeProjectId;
            return (
              <div
                key={p.id}
                className={`group flex items-center justify-between rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectProject(p.id);
                    onCloseMobile();
                  }}
                  className="flex-1 text-left px-3 py-2 min-w-0"
                >
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div
                    className={`text-xs truncate tabular-nums ${
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {p.moduleCount} modules · {p.completedTaskCount}/{p.taskCount} tasks
                  </div>
                </button>
                {projects.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(p.id);
                    }}
                    title={`Delete ${p.name}`}
                    aria-label={`Delete ${p.name}`}
                    className={`p-2 mr-1 rounded transition-opacity ${
                      isActive
                        ? 'text-slate-300 hover:text-white opacity-80 hover:opacity-100'
                        : 'text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100'
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Workspace Navigation */}
      <nav aria-label="Workspace Sections" className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-blue-700' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Architect Profile Footer */}
      <div className="p-4 border-t border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          {!avatarError ? (
            <img
              src={lead.avatarUrl}
              alt={lead.name}
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="h-9 w-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center shrink-0">
              {lead.initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">{lead.name}</div>
            <div className="text-xs text-slate-500 truncate">{lead.role}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
