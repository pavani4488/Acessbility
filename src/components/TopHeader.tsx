import { Menu, Sparkles } from 'lucide-react';
import type { WorkspaceSection } from '../types/blueprint.ts';

interface TopHeaderProps {
  projectName: string;
  section: WorkspaceSection;
  onOpenMobileMenu: () => void;
  onOpenAiSynthesizer: () => void;
}

const SECTION_TITLES: Record<WorkspaceSection, string> = {
  overview: 'Project Brief',
  topology: 'System Topology',
  requirements: 'Requirements & Risks',
  data: 'Data & APIs',
  delivery: 'Engineering Delivery',
  export: 'Export Spec',
};

export function TopHeader({
  projectName,
  section,
  onOpenMobileMenu,
  onOpenAiSynthesizer,
}: TopHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8 sticky top-0 z-30">
      {/* Left Zone: Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-500 hidden sm:inline whitespace-nowrap">Projects</span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">/</span>
          <span className="font-medium text-slate-700 truncate max-w-[160px] sm:max-w-[240px]">
            {projectName}
          </span>
          <span className="text-slate-300" aria-hidden="true">/</span>
          <span className="font-semibold text-slate-900 whitespace-nowrap">
            {SECTION_TITLES[section]}
          </span>
        </nav>
      </div>

      {/* Right Zone: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenAiSynthesizer}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Synthesize Blueprint</span>
        </button>
      </div>
    </header>
  );
}
