import { useState, useMemo } from 'react';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useAudio } from '@/contexts/AudioContext';
import { EmptyState } from '@/components/EmptyState';
import { formatDuration } from '@/utils';
import { Search, Copy, Download, PlayCircle, CheckCircle2 } from 'lucide-react';
import { podcastApi } from '@/api/podcast';

export function TranscriptPage() {
  const { state: { result, taskId } } = useAnalysis();
  const { seek } = useAudio();
  const [search, setSearch] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const sentences = result?.sentences || [];

  const filtered = useMemo(() => {
    if (!search) return sentences;
    const lower = search.toLowerCase();
    return sentences.filter(s => s.text.toLowerCase().includes(lower));
  }, [sentences, search]);

  if (!result || !taskId) return <EmptyState page="transcript" />;

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(result.full_text);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([result.full_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${taskId.substring(0, 8)}.txt`;
    a.click();
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await podcastApi.downloadPDF(taskId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${taskId.substring(0, 8)}.pdf`;
      a.click();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to highlight search matches
  const renderText = (text: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-[var(--color-primary)] text-white bg-opacity-95 rounded px-1 font-semibold">{part}</mark>
      ) : part
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-12 w-full space-y-8">
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-20 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)] pb-6 pt-4 -mx-8 px-8">
        <div className="flex flex-col sm:flex-row gap-6 justify-between items-center">
          {/* Custom Search bar design */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-[16px] top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search transcript..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-12 pl-[48px] pr-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[16px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all placeholder:align-middle"
            />
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={handleCopyAll} className="btn-secondary h-11 px-5 rounded-xl text-[14px]">
              <Copy className="w-4 h-4" /> Copy All
            </button>
            <button onClick={handleDownloadTxt} className="btn-secondary h-11 px-5 rounded-xl text-[14px]">
              <Download className="w-4 h-4" /> TXT
            </button>
            <button onClick={handleDownloadPdf} className="btn-secondary h-11 px-5 rounded-xl text-[14px]">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filtered.map((sentence, idx) => (
          <div 
            key={idx} 
            className="card p-6 group hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 relative flex flex-col md:flex-row gap-4"
          >
            {/* Left Column: Speaker and Avatar */}
            <div className="flex md:flex-col items-center md:items-center gap-3 md:gap-2 shrink-0 md:w-24">
              <div className="w-10 h-10 rounded-full bg-[var(--color-sidebar)] border border-[var(--color-border)] text-[var(--color-primary)] flex items-center justify-center text-[13px] font-bold shadow-sm">
                SP
              </div>
              <span className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Speaker 1</span>
            </div>

            {/* Right Column: Sentence and Action Buttons */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center justify-between gap-4">
                {/* Timestamp Badge */}
                <span className="px-2.5 py-1 rounded bg-[var(--color-bg)] border border-[var(--color-border)] text-[13px] font-semibold font-mono text-[var(--color-muted)]">
                  {formatDuration(sentence.start)}
                </span>
                
                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleCopyText(sentence.text, idx)}
                    className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
                    title="Copy text"
                  >
                    {copiedIndex === idx ? <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4" />}
                  </button>
                  
                  <button 
                    onClick={() => seek(sentence.start)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[13px] font-semibold font-mono text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-transparent transition-all"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Seek
                  </button>
                </div>
              </div>
              
              <p className="text-[16px] leading-[1.8] text-[var(--color-text-secondary)]">
                {renderText(sentence.text)}
              </p>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-[var(--color-muted)] card p-8">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-1">No Results</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">No matches found for "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
