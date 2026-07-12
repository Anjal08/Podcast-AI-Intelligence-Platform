import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { formatDuration, getTotalWordCount } from '@/utils';
import { Clock, Globe, FileText, CheckCircle2, Users, BookOpen } from 'lucide-react';
import { useEffect } from 'react';
import { useAudio } from '@/contexts/AudioContext';

function MetadataBar() {
  const { state } = useAnalysis();
  const { result, status, audioFile } = state;

  if (status !== 'completed' || !result) return null;

  const totalDuration = result.topics[result.topics.length - 1]?.end || 0;
  const wordCount = getTotalWordCount(result.full_text);
  const chapterCount = result.topics.length;

  return (
    <div className="shrink-0 h-14 bg-[var(--color-sidebar)] border-b border-[var(--color-border)] px-8 flex items-center justify-between z-10 relative">
      <div className="flex items-center gap-8 text-[13px]">
        <span className="font-semibold text-[var(--color-text)] truncate max-w-[280px]">
          {audioFile?.name || 'Podcast Analysis'}
        </span>
        <div className="flex items-center gap-6 text-[var(--color-muted)] font-medium">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--color-muted)]" />
            {formatDuration(totalDuration)}
          </span>
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--color-muted)]" />
            English
          </span>
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--color-muted)]" />
            {wordCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--color-muted)]" />
            2
          </span>
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--color-muted)]" />
            {chapterCount}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-success)] bg-[#22C55E]/10 px-3 py-1 rounded-full">
        <CheckCircle2 className="w-4 h-4" />
        Analysis Complete
      </div>
    </div>
  );
}

export function AppLayout() {
  const { state: { audioFile } } = useAnalysis();
  const { setAudioUrl } = useAudio();

  // Create ObjectURL for the audio file when it's set
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [audioFile, setAudioUrl]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <MetadataBar />
        <div className="flex-1 overflow-y-auto" id="main-scroll-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
