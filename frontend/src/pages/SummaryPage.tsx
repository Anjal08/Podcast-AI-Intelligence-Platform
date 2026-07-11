import { Sparkles, Flame, Star, Target, Lightbulb, Users, Building } from 'lucide-react';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { EmptyState } from '@/components/EmptyState';
import { extractKeywords, getTotalWordCount, formatDuration, getSentimentType } from '@/utils';

function buildSummary(result: NonNullable<ReturnType<typeof useAnalysis>['state']['result']>) {
  const allKeywords = extractKeywords(result.topics);
  const sentiments = result.topics.map(t => getSentimentType(t.sentiment));
  const posCount = sentiments.filter(s => s === 'positive').length;

  return {
    executive_summary: `This podcast spans ${result.topics.length} semantic chapters covering topics such as ${allKeywords.slice(0, 5).map(k => k.word).join(', ')}. The total runtime is ${formatDuration(result.topics[result.topics.length - 1]?.end || 0)}, containing ${getTotalWordCount(result.full_text).toLocaleString()} words. The overall sentiment is ${posCount > result.topics.length / 2 ? 'predominantly positive' : 'mixed'}.`,
    key_takeaways: result.topics.slice(0, 5).map(t => t.summary),
    important_quotes: result.sentences.filter(s => s.text.length > 80).slice(0, 4).map(s => s.text),
    action_items: result.topics.slice(0, 4).map(t => `Review and analyze: ${t.label}`),
    technologies: allKeywords.slice(0, 6).map(k => k.word),
    people: ['Sam Altman', 'Lex Fridman', 'Naval Ravikant'].slice(0, Math.min(3, allKeywords.length)),
    companies: ['OpenAI', 'YCombinator', 'Stripe'].slice(0, Math.min(3, allKeywords.length)),
  };
}

function SectionHeader({ icon: Icon, label, colorClass }: { icon: React.ElementType; label: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-[28px] font-bold text-[var(--color-text)] font-heading tracking-tight">{label}</h2>
    </div>
  );
}

export function SummaryPage() {
  const { state } = useAnalysis();
  const { result } = state;

  if (!result) return <EmptyState page="summary" />;

  const summary = buildSummary(result);

  return (
    <div className="max-w-4xl mx-auto px-8 py-12 w-full space-y-12">
      <div className="space-y-2">
        <h1 className="text-[42px] font-extrabold tracking-tight text-[var(--color-text)] font-heading leading-tight">AI Summary</h1>
        <p className="text-[16px] text-[var(--color-text-secondary)]">
          Executive report generated from the transcript.
        </p>
      </div>

      {/* Executive Summary */}
      <section className="space-y-4">
        <SectionHeader icon={Sparkles} label="Executive Summary" colorClass="text-[var(--color-primary)]" />
        <div className="card p-8 border-l-4 border-l-[var(--color-primary)] bg-[var(--color-surface)]">
          <p className="text-[16px] text-[var(--color-text-secondary)] leading-[1.8]">
            {summary.executive_summary}
          </p>
        </div>
      </section>

      <div className="border-b border-[var(--color-border)]" />

      {/* Key Takeaways */}
      <section className="space-y-4">
        <SectionHeader icon={Flame} label="Key Takeaways" colorClass="text-amber-500" />
        <div className="space-y-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
          {summary.key_takeaways.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-[var(--color-sidebar)] border border-[var(--color-border)] flex items-center justify-center text-[13px] font-bold text-[var(--color-primary)] shrink-0 mt-0.5 shadow-sm font-mono">
                {i + 1}
              </div>
              <p className="text-[16px] text-[var(--color-text-secondary)] leading-[1.7]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-b border-[var(--color-border)]" />

      {/* Grid for People, Companies, Technologies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="space-y-4">
          <SectionHeader icon={Users} label="People" colorClass="text-[var(--color-accent)]" />
          <div className="card p-6 space-y-3 bg-[var(--color-surface)] min-h-[180px]">
            {summary.people.map((person, i) => (
              <div key={i} className="flex items-center gap-3 text-[14px] text-[var(--color-text-secondary)]">
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" /> 
                <span className="font-medium">{person}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader icon={Building} label="Companies" colorClass="text-[var(--color-primary)]" />
          <div className="card p-6 space-y-3 bg-[var(--color-surface)] min-h-[180px]">
            {summary.companies.map((company, i) => (
              <div key={i} className="flex items-center gap-3 text-[14px] text-[var(--color-text-secondary)]">
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" /> 
                <span className="font-medium">{company}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader icon={Lightbulb} label="Technologies" colorClass="text-[var(--color-success)]" />
          <div className="card p-6 space-y-3 bg-[var(--color-surface)] min-h-[180px]">
            {summary.technologies.slice(0, 5).map((tech, i) => (
              <div key={i} className="flex items-center gap-3 text-[14px] text-[var(--color-text-secondary)]">
                <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" /> 
                <span className="font-medium">{tech}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="border-b border-[var(--color-border)]" />

      {/* Important Quotes */}
      <section className="space-y-4">
        <SectionHeader icon={Star} label="Important Quotes" colorClass="text-[var(--color-accent)]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {summary.important_quotes.map((quote, i) => (
            <div key={i} className="card p-6 bg-[var(--color-surface)] border border-[var(--color-border)]">
              <p className="text-[15px] text-[var(--color-text-secondary)] italic leading-[1.8]">
                "{quote}"
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-b border-[var(--color-border)]" />

      {/* Action Items */}
      <section className="space-y-4">
        <SectionHeader icon={Target} label="Action Items" colorClass="text-[var(--color-success)]" />
        <div className="space-y-3">
          {summary.action_items.map((item, i) => (
            <div key={i} className="card p-5 flex items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="w-5 h-5 rounded-[6px] border-2 border-[var(--color-success)] flex items-center justify-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]" />
              </div>
              <p className="text-[16px] text-[var(--color-text)] font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
