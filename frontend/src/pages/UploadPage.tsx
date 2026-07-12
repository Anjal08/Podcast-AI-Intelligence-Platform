import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { podcastApi } from '@/api/podcast';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

const STAGES = [
  { id: 'queued', label: 'Upload Complete' },
  { id: 'Attempting Preprocessing', label: 'Audio Processing' },
  { id: 'Attempting Transcription', label: 'Whisper Transcription' },
  { id: 'Now Analysis & Embedding', label: 'AI Chapters' },
  { id: 'Segmenting The Topics', label: 'AI Summary' },
  { id: 'completed', label: 'Done' }
];

export function UploadPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setTaskId, updateStatus, setResult, setError, reset } = useAnalysis();
  const { audioFile, status, error, taskId } = state;
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (audioFile && location.state?.autoStart && !isProcessing && !taskId) {
      handleProcess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFile, location.state, isProcessing, taskId]);

  const handleProcess = async () => {
    if (!audioFile) return;
    setIsProcessing(true);
    try {
      const { task_id } = await podcastApi.analyze(audioFile);
      setTaskId(task_id);
      pollStatus(task_id);
    } catch (err: any) {
      setError('Upload failed');
      setIsProcessing(false);
    }
  };

  const pollStatus = async (id: string) => {
    try {
      const data = await podcastApi.getStatus(id);
      updateStatus(data.status, data.progress);

      if (data.status === 'completed' && data.result) {
        setResult(data.result);
        setIsProcessing(false);
        setTimeout(() => navigate('/transcript'), 1000);
      } else if (data.status === 'failed') {
        setError('Processing failed');
        setIsProcessing(false);
      } else {
        setTimeout(() => pollStatus(id), 2000);
      }
    } catch (err: any) {
      setError('Status check failed');
      setIsProcessing(false);
    }
  };

  if (!audioFile) {
    return <EmptyState page="upload" />;
  }

  const getCurrentStageIndex = () => {
    if (status === 'failed') return -1;
    const idx = STAGES.findIndex(s => s.id === status);
    if (idx !== -1) return idx;
    return 1;
  };

  const currentStageIndex = getCurrentStageIndex();
  const progressPercent = status === 'completed' ? 100 : Math.min(95, Math.max(5, (currentStageIndex / (STAGES.length - 1)) * 100));

  const handleRetry = () => {
    reset();
    navigate('/dashboard');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[70vh]">
      <div className="w-full max-w-md card p-10 flex flex-col items-center">
        {error ? (
          <div className="flex flex-col items-center text-center space-y-6 w-full">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[var(--color-text)]">Analysis Failed</h2>
              <p className="text-[14px] text-[var(--color-text-secondary)]">
                We couldn't analyze this audio.<br/>Please try another file.
              </p>
            </div>
            <button onClick={handleRetry} className="btn-secondary w-full">
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            <div className="text-center space-y-3 mb-8">
              <h2 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">✨ Analyzing Your Podcast</h2>
              <p className="text-[14px] text-[var(--color-muted)] font-mono truncate max-w-xs mx-auto">
                {audioFile.name}
              </p>
            </div>

            <div className="w-full h-2 bg-[var(--color-bg)] rounded-full overflow-hidden mb-8 border border-[var(--color-border)]">
              <div 
                className="h-full bg-[var(--color-primary)] transition-all duration-700 ease-out relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              {STAGES.slice(0, 5).map((stage, idx) => {
                const isCompleted = idx < currentStageIndex || status === 'completed';
                const isCurrent = idx === currentStageIndex && status !== 'completed';
                
                return (
                  <div key={stage.id} className="flex items-center gap-4">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--color-border)]" />
                      )}
                    </div>
                    <span className={`text-[14px] font-medium transition-colors ${
                      isCompleted ? 'text-[var(--color-text)]' : 
                      isCurrent ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'
                    }`}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
              <p className="text-[13px] text-[var(--color-muted)] flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Estimated Time Remaining: ~2 min
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
