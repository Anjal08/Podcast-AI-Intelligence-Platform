// Core domain types for Podcast Intelligence Platform

export interface Sentence {
  text: string;
  start: number;
  end: number;
}

export interface Topic {
  label: string;
  summary: string;
  sentences: Sentence[];
  keywords: string[];
  sentiment: 'Positive 😊' | 'Negative 😟' | 'Neutral 😐' | string;
  start: number;
  end: number;
}

export interface AnalysisMetadata {
  safety_check: string;
  cost_estimate: string;
  model_used: string;
}

export interface AnalysisResult {
  full_text: string;
  topics: Topic[];
  sentences: Sentence[];
  embeddings: number[][];
  metadata: AnalysisMetadata;
}

export type TaskStatus =
  | 'queued'
  | 'Attempting Preprocessing'
  | 'Attempting Transcription'
  | 'Now Analysis & Embedding'
  | 'Segmenting The Topics'
  | 'completed'
  | 'failed'
  | 'not_found';

export interface TaskState {
  status: TaskStatus;
  progress: number;
  result?: AnalysisResult;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface HistoryItem {
  id: string;
  filename: string;
  analyzedAt: Date;
  duration: number;
  wordCount: number;
  chapterCount: number;
  topicLabels: string[];
  taskId: string;
}

export interface AudioMetadata {
  name: string;
  size: number;
  duration?: number;
  type: string;
  lastModified: number;
}

export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface DashboardStats {
  duration: string;
  wordCount: number;
  characterCount: number;
  chapterCount: number;
  topicCount: number;
  language: string;
  confidence: string;
  modelUsed: string;
}

export interface AnalysisState {
  taskId: string | null;
  status: TaskStatus | null;
  progress: number;
  result: AnalysisResult | null;
  audioFile: File | null;
  audioMetadata: AudioMetadata | null;
  error: string | null;
}
