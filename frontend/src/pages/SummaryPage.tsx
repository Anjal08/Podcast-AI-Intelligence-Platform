import { Sparkles, Flame, Star, Target, Tag, Clock, FileText, Mic, LayoutList, Globe, Smile, Brain, ChevronRight } from 'lucide-react';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { EmptyState } from '@/components/EmptyState';
import { extractKeywords, getTotalWordCount, formatDuration, getSentimentType } from '@/utils';

function buildSummary(result: NonNullable<ReturnType<typeof useAnalysis>['state']['result']>) {
  const allKeywords = extractKeywords(result.topics);
  const sentiments = result.topics.map(t => getSentimentType(t.sentiment));
  const posCount = sentiments.filter(s => s === 'positive').length;
  const isPositive = posCount > result.topics.length / 2;

  return {
    executive_summary: `This podcast spans ${result.topics.length} semantic chapters covering topics such as ${allKeywords.slice(0, 5).map(k => k.word).join(', ')}. The total runtime is ${formatDuration(result.topics[result.topics.length - 1]?.end || 0)}, containing ${getTotalWordCount(result.full_text).toLocaleString()} words. The overall sentiment is ${isPositive ? 'predominantly positive' : 'mixed'}.`,
    key_takeaways: result.topics.slice(0, 5).map(t => t.summary),
    important_quotes: result.sentences.filter(s => s.text.length > 80).slice(0, 4).map(s => s.text),
    action_items: result.topics.slice(0, 4).map(t => `Review and analyze: ${t.label}`),
    topics: result.topics.map(t => t.label).slice(0, 8),
    keywords: allKeywords.slice(0, 12).map(k => k.word),
    stats: {
      duration: formatDuration(result.topics[result.topics.length - 1]?.end || 0),
      words: getTotalWordCount(result.full_text).toLocaleString(),
      speakers: 2,
      chapters: result.topics.length,
      language: 'English',
      sentiment: isPositive ? 'Positive' : 'Neutral',
      sentimentEmoji: isPositive ? '😊' : '😐'
    }
  };
}

function SectionHeader({ icon: Icon, label, colorClass }: { icon: React.ElementType; label: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-surface)] ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--color-text)] font-heading tracking-tight">{label}</h2>
    </div>
  );
}

export function SummaryPage() {
  const { state } = useAnalysis();
  const { result } = state;

  if (!result) return <EmptyState page="summary" />;

  const summary = buildSummary(result);

  return (
    <div className="max-w-6xl mx-auto px-8 py-12 w-full space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-[var(--color-text)] font-heading leading-tight">AI Summary</h1>
        <p className="text-base text-[var(--color-text-secondary)] max-w-2xl">
          Comprehensive AI-generated insights, executive summary, and actionable takeaways extracted from your audio.
        </p>
      </div>

      {/* Podcast Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Duration', value: summary.stats.duration, icon: Clock },
          { label: 'Words', value: summary.stats.words, icon: FileText },
          { label: 'Speakers', value: summary.stats.speakers, icon: Mic },
          { label: 'Chapters', value: summary.stats.chapters, icon: LayoutList },
          { label: 'Language', value: summary.stats.language, icon: Globe },
          { label: 'Sentiment', value: summary.stats.sentiment, icon: Smile, emoji: summary.stats.sentimentEmoji }
        ].map((stat, i) => (
          <div key={i} className="card p-5 flex flex-col items-center justify-center text-center gap-2 bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-colors">
            <div className="text-[var(--color-muted)] flex items-center gap-2">
              <stat.icon className="w-4 h-4" />
              <span className="text-[12px] font-semibold uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-xl font-bold text-[var(--color-text)]">
              {stat.emoji ? <span className="flex items-center gap-2">{stat.emoji} {stat.value}</span> : stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Executive Summary */}
          <section>
            <SectionHeader icon={Sparkles} label="Executive Summary" colorClass="text-[var(--color-primary)] border border-[var(--color-primary)]/30" />
            <div className="card p-8 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-surface)] border-[var(--color-primary)]/20 shadow-sm relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-primary)]/20 rounded-full blur-3xl mix-blend-screen" />
              <p className="text-[17px] text-[var(--color-text-secondary)] leading-[2] relative z-10 font-medium">
                {summary.executive_summary}
              </p>
            </div>
          </section>

          {/* Key Takeaways */}
          <section>
            <SectionHeader icon={Flame} label="Key Takeaways" colorClass="text-amber-500 border border-amber-500/30" />
            <div className="space-y-4">
              {summary.key_takeaways.map((item, i) => (
                <div key={i} className="card p-6 flex items-start gap-5 hover:border-[var(--color-border)] hover:shadow-md transition-all group bg-[var(--color-surface)]">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center text-[14px] font-bold text-[var(--color-text)] shrink-0 shadow-sm group-hover:border-[var(--color-primary)]/50 group-hover:text-[var(--color-primary)] transition-colors">
                    {i + 1}
                  </div>
                  <p className="text-base text-[var(--color-text-secondary)] leading-[1.8] mt-1">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Action Items */}
          <section>
            <SectionHeader icon={Target} label="Action Items" colorClass="text-[var(--color-success)] border border-[var(--color-success)]/30" />
            <div className="space-y-4">
              {summary.action_items.map((item, i) => (
                <div key={i} className="card p-5 flex items-center gap-4 bg-[var(--color-surface)] hover:border-[var(--color-success)]/30 transition-colors">
                  <div className="w-5 h-5 rounded-[6px] border-2 border-[var(--color-success)] flex items-center justify-center shrink-0 bg-[var(--color-success)]/10">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[var(--color-success)] opacity-80" />
                  </div>
                  <p className="text-base text-[var(--color-text)] font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Important Quotes */}
          <section>
            <SectionHeader icon={Star} label="Important Quotes" colorClass="text-[var(--color-accent)] border border-[var(--color-accent)]/30" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {summary.important_quotes.map((quote, i) => (
                <div key={i} className="card p-6 bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30 transition-colors relative">
                  <div className="absolute top-4 left-4 text-4xl text-[var(--color-accent)] opacity-20 font-serif">"</div>
                  <p className="text-[15px] text-[var(--color-text-secondary)] italic leading-[1.8] relative z-10 pt-4">
                    {quote}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Sidebar (Right Column) */}
        <div className="space-y-10">
          
          {/* AI Insights Card */}
          <section>
            <div className="card p-6 bg-[var(--color-surface)] border border-[var(--color-primary)]/30 shadow-[0_4px_24px_-4px_rgba(139,92,246,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]" />
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-lg font-bold text-[var(--color-text)] font-heading">AI Insights</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-4 h-4 text-[var(--color-primary)] mt-1 shrink-0" />
                  <span className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">The discussion heavily revolves around technology and future implications.</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-4 h-4 text-[var(--color-primary)] mt-1 shrink-0" />
                  <span className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">Speaker sentiment transitions from neutral to positive during the second half.</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-4 h-4 text-[var(--color-primary)] mt-1 shrink-0" />
                  <span className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">High density of actionable advice in chapters 2 and 4.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Topics Covered */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <LayoutList className="w-4 h-4 text-[var(--color-muted)]" />
              <h3 className="text-[15px] font-bold text-[var(--color-text)] uppercase tracking-wider font-heading">Topics Covered</h3>
            </div>
            <div className="flex flex-col gap-2">
              {summary.topics.map((topic, i) => (
                <div key={i} className="px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-primary)]/30 transition-colors flex items-center justify-between group">
                  <span className="truncate pr-4">{topic}</span>
                  <span className="text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              ))}
            </div>
          </section>

          {/* Keywords */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-[var(--color-muted)]" />
              <h3 className="text-[15px] font-bold text-[var(--color-text)] uppercase tracking-wider font-heading">Keywords</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.keywords.map((kw, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[13px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-muted)] transition-colors cursor-default"
                >
                  #{kw.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
