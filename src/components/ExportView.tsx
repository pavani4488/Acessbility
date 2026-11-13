import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import type { ProjectBlueprint } from '../types/blueprint.ts';
import { generateMarkdownSpec } from '../lib/generators.ts';

interface ExportViewProps {
  project: ProjectBlueprint;
}

export function ExportView({ project }: ExportViewProps) {
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  const markdownContent = generateMarkdownSpec(project);
  const jsonContent = JSON.stringify(project, null, 2);
  const activeContent = format === 'markdown' ? markdownContent : jsonContent;

  async function handleCopy() {
    await navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleDownload() {
    const ext = format === 'markdown' ? 'md' : 'json';
    const mime = format === 'markdown' ? 'text/markdown;charset=utf-8' : 'application/json';
    const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const blob = new Blob([activeContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-architecture-plan.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setFormat('markdown')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              format === 'markdown'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Markdown Architecture Plan
          </button>
          <button
            type="button"
            onClick={() => setFormat('json')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              format === 'json'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            JSON Blueprint
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Spec'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .{format === 'markdown' ? 'md' : 'json'}</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            {project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-architecture-plan.
            {format === 'markdown' ? 'md' : 'json'}
          </span>
          <span className="tabular-nums">{activeContent.split('\n').length} lines</span>
        </div>
        <pre className="p-5 text-xs font-mono leading-relaxed overflow-x-auto max-h-[620px] text-slate-200 whitespace-pre-wrap">
          {activeContent}
        </pre>
      </div>
    </div>
  );
}
