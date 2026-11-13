import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ProjectBlueprint, ProjectSummary, WorkspaceSection } from './types/blueprint.ts';
import { api } from './lib/api.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { TopHeader } from './components/TopHeader.tsx';
import { OverviewView } from './components/OverviewView.tsx';
import { TopologyView } from './components/TopologyView.tsx';
import { RequirementsView } from './components/RequirementsView.tsx';
import { DataApiView } from './components/DataApiView.tsx';
import { DeliveryView } from './components/DeliveryView.tsx';
import { ExportView } from './components/ExportView.tsx';
import { AiArchitectModal } from './components/AiArchitectModal.tsx';
import { NewProjectModal } from './components/NewProjectModal.tsx';

export default function App() {
  const [summaries, setSummaries] = useState<ProjectSummary[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectBlueprint | null>(null);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);

  const refreshSummaries = useCallback(async () => {
    const { projects } = await api.listProjects();
    setSummaries(projects);
    return projects;
  }, []);

  const loadProject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { project } = await api.getProject(id);
      setActiveProject(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await refreshSummaries();
        if (list.length > 0) {
          await loadProject(list[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to reach workspace server.');
        setLoading(false);
      }
    })();
  }, [refreshSummaries, loadProject]);

  function handleProjectUpdated(updated: ProjectBlueprint) {
    setActiveProject(updated);
    setSummaries((prev) =>
      prev.map((s) =>
        s.id === updated.id
          ? {
              id: updated.id,
              name: updated.name,
              title: updated.title,
              domain: updated.domain,
              scaleTier: updated.scaleTier,
              updatedAt: updated.updatedAt,
              moduleCount: updated.modules.length,
              requirementCount: updated.requirements.length,
              taskCount: updated.tasks.length,
              completedTaskCount: updated.tasks.filter((t) => t.status === 'Done').length,
            }
          : s
      )
    );
  }

  async function handleProjectCreated(created: ProjectBlueprint) {
    await refreshSummaries();
    setActiveProject(created);
    setActiveSection('overview');
  }

  async function handleDeleteProject(id: string) {
    try {
      await api.deleteProject(id);
      const list = await refreshSummaries();
      if (activeProject?.id === id && list.length > 0) {
        await loadProject(list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project.');
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        projects={summaries}
        activeProjectId={activeProject?.id ?? ''}
        activeSection={activeSection}
        onSelectProject={(id) => loadProject(id)}
        onSelectSection={(sec) => setActiveSection(sec)}
        onOpenNewProject={() => setNewProjectModalOpen(true)}
        onDeleteProject={handleDeleteProject}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          projectName={activeProject?.name ?? 'Workspace'}
          section={activeSection}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAiSynthesizer={() => setAiModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              <div className="h-8 w-80 bg-slate-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="h-80 bg-white border border-slate-200 rounded-xl animate-pulse" />
            </div>
          ) : !activeProject ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
              <h1 className="text-lg font-semibold text-slate-900">No project workspace open</h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Create a blank engineering workspace or synthesize a full system blueprint from an idea.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setNewProjectModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
                >
                  Create Blank
                </button>
                <button
                  type="button"
                  onClick={() => setAiModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Synthesize Blueprint
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeSection === 'overview' && (
                <OverviewView
                  key={activeProject.id}
                  project={activeProject}
                  onUpdateProject={handleProjectUpdated}
                  onNavigate={setActiveSection}
                />
              )}
              {activeSection === 'topology' && (
                <TopologyView
                  key={activeProject.id}
                  project={activeProject}
                  onUpdateProject={handleProjectUpdated}
                />
              )}
              {activeSection === 'requirements' && (
                <RequirementsView
                  key={activeProject.id}
                  project={activeProject}
                  onUpdateProject={handleProjectUpdated}
                />
              )}
              {activeSection === 'data' && (
                <DataApiView
                  key={activeProject.id}
                  project={activeProject}
                  onUpdateProject={handleProjectUpdated}
                />
              )}
              {activeSection === 'delivery' && (
                <DeliveryView
                  key={activeProject.id}
                  project={activeProject}
                  onUpdateProject={handleProjectUpdated}
                />
              )}
              {activeSection === 'export' && <ExportView project={activeProject} />}
            </>
          )}
        </main>
      </div>

      <AiArchitectModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onCreatedProject={handleProjectCreated}
      />

      <NewProjectModal
        open={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}
