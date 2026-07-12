import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { FileText, BookOpen, Sparkles, Bot, Download, Mic, Check, Music2, HardDrive, PlayCircle } from 'lucide-react';

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
  const navigate = useNavigate();
  const { setAudio } = useAnalysis();
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (f: File) => {
    setAudio(f, {
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
    });
    navigate('/upload', { state: { autoStart: true } });
  };

  return (
    <div className="flex items-center justify-center h-full min-h-[80vh] px-4 py-12">
      <div className="w-full max-w-lg card bg-[var(--color-surface)] border-[var(--color-border)] p-8 sm:p-10 shadow-lg">
        
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.webm"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />

        {/* Top Section */}
        <div className="text-center space-y-6 pb-8 border-b border-[var(--color-border)]">
          <div className="relative w-24 h-24 mx-auto">
             <div className="absolute inset-0 bg-[var(--color-primary)]/20 rounded-full blur-xl animate-pulse" />
             <div className="relative w-full h-full rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shadow-md">
               <Icon className="w-10 h-10 text-[var(--color-primary)]" />
             </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-[24px] font-extrabold text-[var(--color-text)] font-heading tracking-tight">
              {page === 'upload' ? 'No Podcast Processed Yet' : config.title}
            </h2>
            <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed max-w-sm mx-auto">
              {page === 'upload' ? 'Upload a podcast to generate transcripts, detect semantic chapters, and extract AI insights.' : config.description}
            </p>
          </div>
          
          <div className="pt-4">
            <button 
              onClick={() => inputRef.current?.click()}
              className="btn-primary px-8 h-12 text-[15px] font-semibold hover:scale-105 transition-transform shadow-md hover:shadow-lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Upload Podcast
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-8 border-b border-[var(--color-border)]">
          <h3 className="text-[13px] font-bold text-[var(--color-text)] uppercase tracking-widest mb-6 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
            What you'll get
          </h3>
          <ul className="space-y-4">
            {[
              'Accurate Transcript',
              'AI Executive Summary',
              'Semantic Chapters',
              'Ask AI about Podcast',
              'Export PDF / TXT / JSON'
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-4 text-[15px] text-[var(--color-text)] font-medium">
                <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-[var(--color-primary)]" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Specs Section */}
        <div className="py-8 border-b border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[14px] font-bold text-[var(--color-text)]">
              <Music2 className="w-4 h-4 text-[var(--color-muted)]" />
              Supported Formats
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)] font-mono font-medium">
              MP3 • WAV • M4A • FLAC
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[14px] font-bold text-[var(--color-text)]">
              <HardDrive className="w-4 h-4 text-[var(--color-muted)]" />
              Maximum Upload Size
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)] font-mono font-medium">
              500 MB
            </p>
          </div>
        </div>

        {/* Footer Section */}
        <div className="pt-8 text-center space-y-5">
          <div className="space-y-1.5">
            <h3 className="text-[16px] font-bold text-[var(--color-text)]">Need inspiration?</h3>
            <p className="text-[14px] text-[var(--color-text-secondary)]">Try the included sample podcast</p>
          </div>
          <button 
            onClick={() => inputRef.current?.click()}
            className="btn-secondary w-full h-12 text-[14px] hover:border-[var(--color-primary)]/50 transition-colors"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            Analyze Sample Podcast
          </button>
        </div>

      </div>
    </div>
  );
}
