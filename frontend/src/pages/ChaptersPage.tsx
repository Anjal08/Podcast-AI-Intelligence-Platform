import { useState } from 'react';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useAudio } from '@/contexts/AudioContext';
import { EmptyState } from '@/components/EmptyState';
import { formatDuration } from '@/utils';
import { PlayCircle, Copy, ChevronDown, ChevronUp, Clock, BookOpen, Tag, CheckCircle2 } from 'lucide-react';

interface Topic {
  label: string;
  start: number;
  end: number;
  summary: string;
  keywords: string[];
  sentiment: string | number;
}

function ChapterCard({ topic, idx, isExpanded, onToggle }: { topic: Topic; idx: number; isExpanded: boolean; onToggle: () => void }) {
  const { seek } = useAudio();
  const [copied, setCopied] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const duration = topic.end - topic.start;

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlay = (e: React.MouseEvent, start: number) => {
    e.stopPropagation();
    seek(start);
  };

  // Truncation check
  const wordLimit = 40;
  const words = topic.summary.split(' ');
  const isLongSummary = words.length > wordLimit;
  const displaySummary = isLongSummary && !isSummaryExpanded 
    ? words.slice(0, wordLimit).join(' ') + '...'
    : topic.summary;

  return (
    <div 
      className={`card overflow-hidden transition-all duration-300 ${isExpanded ? 'border-[var(--color-primary)] bg-[var(--color-surface)] shadow-md' : 'hover:border-[var(--color-muted)]'}`}
    >
      {/* Accordion Header */}
      <div 
        onClick={onToggle}
        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[rgba(139,92,246,0.15)] text-[var(--color-primary)] flex items-center justify-center font-bold text-[14px] shrink-0 border border-[var(--color-border)]">
            {idx + 1}
          </div>
          
          <div className="min-w-0">
            <h3 className="text-[18px] font-bold text-[var(--color-text)] font-heading truncate">{topic.label}</h3>
            <div className="flex items-center gap-4 mt-1 text-[13px] text-[var(--color-muted)] font-mono">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[var(--color-muted)]" /> {formatDuration(duration)}</span>
              <span>{formatDuration(topic.start)} - {formatDuration(topic.end)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 justify-end">
          <button 
            onClick={(e) => handlePlay(e, topic.start)}
            className="flex items-center justify-center w-10 h-10 rounded-full text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-border)] hover:border-transparent transition-all"
            title="Play segment"
          >
            <PlayCircle className="w-5 h-5" />
          </button>
          <div className="text-[var(--color-muted)] w-6 h-6 flex items-center justify-center">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Accordion Body */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-3 border-t border-[var(--color-border)] bg-[var(--color-sidebar)] space-y-6">
          {/* Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-bold text-[var(--color-text)] uppercase tracking-wider flex items-center gap-2 font-heading">
                <BookOpen className="w-4 h-4 text-[var(--color-primary)]" /> Summary
              </h4>
              <button 
                onClick={(e) => handleCopy(e, topic.summary)}
                className="text-[13px] font-semibold flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-[16px] text-[var(--color-text-secondary)] leading-[1.8]">
                {displaySummary}
              </p>
              {isLongSummary && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsSummaryExpanded(!isSummaryExpanded); }}
                  className="text-[14px] font-bold text-[var(--color-primary)] hover:underline mt-1 block"
                >
                  {isSummaryExpanded ? 'Read Less' : 'Read More'}
                </button>
              )}
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold text-[var(--color-text)] uppercase tracking-wider flex items-center gap-2 font-heading">
              <Tag className="w-4 h-4 text-[var(--color-primary)]" /> Keywords
            </h4>
            <div className="flex flex-wrap gap-2">
              {topic.keywords.map((kw, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text-secondary)]"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChaptersPage() {
  const { state: { result } } = useAnalysis();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!result) return <EmptyState page="chapters" />;

  return (
    <div className="max-w-4xl mx-auto px-8 py-12 w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-[42px] font-extrabold tracking-tight text-[var(--color-text)] font-heading leading-tight">Semantic Chapters</h1>
        <p className="text-[16px] text-[var(--color-text-secondary)]">
          Auto-detected topics and logical segments with AI summaries.
        </p>
      </div>

      <div className="space-y-4">
        {result.topics.map((topic, idx) => (
          <ChapterCard 
            key={idx}
            topic={topic}
            idx={idx}
            isExpanded={expandedId === idx}
            onToggle={() => setExpandedId(expandedId === idx ? null : idx)}
          />
        ))}
      </div>
    </div>
  );
}
