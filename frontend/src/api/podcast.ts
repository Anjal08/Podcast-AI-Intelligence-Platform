import axios from 'axios';
import type { TaskState, AnalysisResult } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const podcastApi = {
  /**
   * Upload audio file and start analysis
   */
  async analyze(file: File): Promise<{ task_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ task_id: string }>('/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data;
  },

  /**
   * Poll task status
   */
  async getStatus(taskId: string): Promise<TaskState> {
    const { data } = await api.get<TaskState>(`/status/${taskId}`);
    return data;
  },

  /**
   * Send chat message with RAG
   */
  async chat(taskId: string, query: string): Promise<{ answer: string }> {
    const { data } = await api.post<{ answer: string; error?: string }>('/chat', {
      task_id: taskId,
      query,
    });
    if (data.error) throw new Error(data.error);
    return data;
  },

  /**
   * Health check
   */
  async health(): Promise<boolean> {
    try {
      const { data } = await api.get('/');
      return !!data?.message;
    } catch {
      return false;
    }
  },

  /**
   * Export endpoints
   */
  async downloadPDF(taskId: string): Promise<Blob> {
    const { data } = await api.get(`/export/${taskId}/pdf`, { responseType: 'blob' });
    return data;
  },

  async downloadJSON(taskId: string): Promise<Blob> {
    const { data } = await api.get(`/export/${taskId}/json`, { responseType: 'blob' });
    return data;
  },
};

export type { AnalysisResult };
