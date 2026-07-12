import { FileText, FileJson, FileType, BookOpen, ArrowDown } from 'lucide-react';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { EmptyState } from '@/components/EmptyState';
import { podcastApi } from '@/api/podcast';

const FORMATS = [
  {
    id: 'pdf',
    icon: FileText,
    colorClass: 'text-[var(--color-primary)] bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.2)]',
    label: 'PDF Report',
    desc: 'Professional report with executive summary, chapters, and full transcript.',
    size: '1.2 MB'
  },
  {
    id: 'json',
    icon: FileJson,
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    label: 'JSON Data',
    desc: 'Complete analysis payload including timestamps, vectors, and metadata.',
    size: '4.5 MB'
  },
  {
    id: 'txt',
    icon: FileType,
    colorClass: 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20',
    label: 'Text Transcript',
    desc: 'Clean text transcript with timestamps and speaker labels.',
    size: '320 KB'
  },
  {
    id: 'md',
    icon: BookOpen,
    colorClass: 'text-[var(--color-accent)] bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20',
    label: 'Markdown Notes',
    desc: 'Formatted notes ready for Obsidian, Notion, or Roam Research.',
    size: '45 KB'
  },
];

export function DownloadsPage() {
  const { state } = useAnalysis();
  const { result, taskId } = state;

  if (!result || !taskId) return <EmptyState page="downloads" />;

  const handleDownload = async (formatId: string) => {
    try {
      if (formatId === 'pdf') {
        const blob = await podcastApi.downloadPDF(taskId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `podcast-analysis-${taskId.substring(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (formatId === 'json') {
        const blob = await podcastApi.downloadJSON(taskId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `podcast-analysis-${taskId.substring(0, 8)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (formatId === 'txt') {
        const text = result.sentences.map(s => s.text).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${taskId.substring(0, 8)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (formatId === 'md') {
        const text = `# Podcast Analysis\n\n## Chapters\n${result.topics.map(t => `### ${t.label}\n${t.summary}`).join('\n\n')}\n\n## Transcript\n${result.sentences.map(s => s.text).join('\n')}`;
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes-${taskId.substring(0, 8)}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-12 w-full space-y-10">
      <div className="space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-[var(--color-text)] font-heading leading-tight">Export Data</h1>
        <p className="text-base text-[var(--color-text-secondary)]">
          Download your processed analysis in multiple formats for integration into your workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {FORMATS.map(({ id, icon: Icon, colorClass, label, desc, size }) => (
          <div
            key={id}
            onClick={() => handleDownload(id)}
            className="card p-8 cursor-pointer group flex flex-col justify-between min-h-[220px] bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${colorClass}`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-[13px] font-mono font-bold text-[var(--color-muted)] px-3 py-1.5 bg-[var(--color-bg)] rounded-md border border-[var(--color-border)] shadow-sm">
                  {size}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)] font-heading mb-3">{label}</h3>
              <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">{desc}</p>
            </div>

            <div className="flex justify-end mt-8 relative z-10">
              <div className="btn-secondary h-11 px-5 text-[14px] bg-[var(--color-bg)] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 group-hover:border-[var(--color-primary)]/30 group-hover:text-[var(--color-primary)]">
                <ArrowDown className="w-4 h-4 group-hover:animate-bounce" />
                Download
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
