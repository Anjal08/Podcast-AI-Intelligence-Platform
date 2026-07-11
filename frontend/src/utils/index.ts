import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Topic, SentimentType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function getSentimentType(sentiment: string): SentimentType {
  if (sentiment.toLowerCase().includes('positive')) return 'positive';
  if (sentiment.toLowerCase().includes('negative')) return 'negative';
  return 'neutral';
}

export function getSentimentColor(type: SentimentType): string {
  switch (type) {
    case 'positive': return '#22C55E';
    case 'negative': return '#EF4444';
    default: return '#F59E0B';
  }
}

export function getTopicDuration(topic: Topic): number {
  return topic.end - topic.start;
}

export function getReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getTotalWordCount(fullText: string): number {
  return fullText.trim().split(/\s+/).filter(Boolean).length;
}

export function generateWaveformBars(count = 60): number[] {
  return Array.from({ length: count }, () => Math.random() * 0.8 + 0.1);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-400/30 text-yellow-200 rounded px-0.5">$1</mark>');
}

export function extractKeywords(topics: Topic[]): Array<{ word: string; count: number }> {
  const freq: Record<string, number> = {};
  topics.forEach(t => {
    t.keywords.forEach(kw => {
      freq[kw] = (freq[kw] || 0) + 1;
    });
  });
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getProgressStageLabel(progress: number, status: string): string {
  if (status === 'completed') return 'Complete';
  if (status === 'failed') return 'Failed';
  if (progress <= 10) return 'Preprocessing';
  if (progress <= 30) return 'Transcribing';
  if (progress <= 50) return 'Embedding';
  if (progress <= 80) return 'Segmenting Topics';
  return 'Finalizing';
}
