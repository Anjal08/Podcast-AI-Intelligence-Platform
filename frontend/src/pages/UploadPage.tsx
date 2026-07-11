import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { podcastApi } from '@/api/podcast';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { useAudio } from '@/contexts/AudioContext';
import { AudioPlayer } from '@/components/AudioPlayer';

const STAGES = [
  { id: 'queued', label: 'Upload' },
  { id: 'Attempting Preprocessing', label: 'Preprocessing' },
  { id: 'Attempting Transcription', label: 'Whisper AI' },
  { id: 'Now Analysis & Embedding', label: 'Chapters & Summary' },
  { id: 'Segmenting The Topics', label: 'Semantic Segments' },
  { id: 'completed', label: 'AI Ready' },
];

export function UploadPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setTaskId, updateStatus, setResult, setError } = useAnalysis();
  const { audioFile, status, error, taskId } = state;
  const [isProcessing, setIsProcessing] = useState(false);
  const { audioUrl } = useAudio();

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
      setError(err.message || 'Upload failed');
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
        setError(data.error || 'Processing failed');
        setIsProcessing(false);
      } else {
        setTimeout(() => pollStatus(id), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Status check failed');
      setIsProcessing(false);
    }
  };

  if (!audioFile) {
    return <EmptyState page="upload" />;
  }

  // Determine current stage index based on exact status matches or fallback
  const getCurrentStageIndex = () => {
    if (status === 'failed') return -1;
    const idx = STAGES.findIndex(s => s.id === status);
    if (idx !== -1) return idx;
    return 1; // Default to preprocessing if unknown intermediate state
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[70vh]">
      <div className="w-full max-w-3xl space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-[42px] font-extrabold text-[var(--color-text)] tracking-tight font-heading leading-tight">Processing Audio</h1>
          <p className="text-[16px] text-[var(--color-muted)] font-mono truncate max-w-xl mx-auto mb-4">{audioFile.name}</p>
          {audioUrl && <AudioPlayer />}
        </div>

        {error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center space-y-3">
            <h3 className="text-red-500 font-bold font-heading text-[18px]">Processing Failed</h3>
            <p className="text-red-400/80 text-[14px]">{error}</p>
          </div>
        ) : (
          <div className="relative pt-6">
            {/* Background Line */}
            <div className="absolute top-[50px] left-8 right-8 h-[2px] bg-[var(--color-border)] z-0" />
            
            {/* Active Progress Line */}
            <div 
              className="absolute top-[50px] left-8 h-[2px] bg-[var(--color-primary)] z-0 transition-all duration-1000 ease-in-out"
              style={{ width: `calc(${(currentStageIndex / (STAGES.length - 1)) * 100}% - 3rem)` }}
            />

            <div className="flex justify-between relative z-10">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex || status === 'completed';
                const isCurrent = idx === currentStageIndex && status !== 'completed';
                
                return (
                  <div key={stage.id} className="flex flex-col items-center gap-4 w-24">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-bg)] border-4 transition-all duration-500
                      ${isCompleted ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 
                        isCurrent ? 'border-[var(--color-primary)] text-[var(--color-primary)] shadow-[0_0_16px_rgba(139,92,246,0.4)]' : 
                        'border-[var(--color-border)] text-[var(--color-muted)]'}`
                    }>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 fill-current bg-[var(--color-bg)] rounded-full" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Circle className="w-3 h-3 fill-current" />
                      )}
                    </div>
                    <span className={`text-[12px] font-bold text-center leading-tight transition-colors duration-500 font-heading
                      ${(isCompleted || isCurrent) ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}`
                    }>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
