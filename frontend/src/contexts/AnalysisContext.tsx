import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { AnalysisState, AnalysisResult, TaskStatus, AudioMetadata } from '@/types';

type Action =
  | { type: 'SET_AUDIO'; file: File; metadata: AudioMetadata }
  | { type: 'SET_TASK_ID'; taskId: string }
  | { type: 'UPDATE_STATUS'; status: TaskStatus; progress: number }
  | { type: 'SET_RESULT'; result: AnalysisResult }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' };

const initialState: AnalysisState = {
  taskId: null,
  status: null,
  progress: 0,
  result: null,
  audioFile: null,
  audioMetadata: null,
  error: null,
};

function reducer(state: AnalysisState, action: Action): AnalysisState {
  switch (action.type) {
    case 'SET_AUDIO':
      return { ...state, audioFile: action.file, audioMetadata: action.metadata, error: null };
    case 'SET_TASK_ID':
      return { ...state, taskId: action.taskId, status: 'queued', progress: 0 };
    case 'UPDATE_STATUS':
      return { ...state, status: action.status, progress: action.progress };
    case 'SET_RESULT':
      return { ...state, result: action.result, status: 'completed', progress: 100 };
    case 'SET_ERROR':
      return { ...state, error: action.error, status: 'failed' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AnalysisContextValue {
  state: AnalysisState;
  setAudio: (file: File, metadata: AudioMetadata) => void;
  setTaskId: (taskId: string) => void;
  updateStatus: (status: TaskStatus, progress: number) => void;
  setResult: (result: AnalysisResult) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setAudio = useCallback((file: File, metadata: AudioMetadata) =>
    dispatch({ type: 'SET_AUDIO', file, metadata }), []);
  const setTaskId = useCallback((taskId: string) =>
    dispatch({ type: 'SET_TASK_ID', taskId }), []);
  const updateStatus = useCallback((status: TaskStatus, progress: number) =>
    dispatch({ type: 'UPDATE_STATUS', status, progress }), []);
  const setResult = useCallback((result: AnalysisResult) =>
    dispatch({ type: 'SET_RESULT', result }), []);
  const setError = useCallback((error: string) =>
    dispatch({ type: 'SET_ERROR', error }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <AnalysisContext.Provider value={{ state, setAudio, setTaskId, updateStatus, setResult, setError, reset }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
}
