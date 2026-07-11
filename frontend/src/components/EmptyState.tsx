import { Link } from 'react-router-dom';
import { FileText, BookOpen, Sparkles, Bot, Download, Mic } from 'lucide-react';

const pageConfig: Record<string, {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  to: string;
}> = {
  transcript: {
    icon: FileText,
    title: 'No Transcript Available',
    description: 'Upload and process a podcast to view its interactive transcript with timestamps and speaker labels.',
    action: 'Upload Podcast',
    to: '/upload',
  },
  chapters: {
    icon: BookOpen,
    title: 'No Chapters Found',
    description: 'Upload and process a podcast to detect semantic chapter boundaries and summaries.',
    action: 'Upload Podcast',
    to: '/upload',
  },
  summary: {
    icon: Sparkles,
    title: 'No Insights Available',
    description: 'Upload and process a podcast to generate an AI executive summary with key takeaways.',
    action: 'Upload Podcast',
    to: '/upload',
  },
  chat: {
    icon: Bot,
    title: 'No Podcast Loaded',
    description: 'Upload and process a podcast before asking questions. The AI will use the transcript as context.',
    action: 'Upload Podcast',
    to: '/upload',
  },
  downloads: {
    icon: Download,
    title: 'Nothing to Export',
    description: 'Complete a podcast analysis to unlock export formats like PDF, JSON, and Markdown.',
    action: 'Upload Podcast',
    to: '/upload',
  },
};

export function EmptyState({ page }: { page: string }) {
  const config = pageConfig[page] || pageConfig.transcript;
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] px-8">
      <div className="text-center max-w-sm space-y-6">
        <div className="w-16 h-16 rounded-[16px] bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto shadow-lg">
          <Icon className="w-7 h-7 text-[var(--color-primary)]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-[20px] font-bold text-[var(--color-text)] font-heading">{config.title}</h2>
          <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">{config.description}</p>
        </div>
        <div className="pt-2">
          <Link to={config.to}>
            <button className="btn-primary">
              <Mic className="w-4 h-4" />
              {config.action}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
