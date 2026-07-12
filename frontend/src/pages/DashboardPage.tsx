import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, UploadCloud, FileAudio } from 'lucide-react';
import { useAnalysis } from '@/contexts/AnalysisContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const { setAudio } = useAnalysis();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((f: File) => {
    setAudio(f, {
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
    });
    navigate('/upload', { state: { autoStart: true } });
  }, [setAudio, navigate]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type.startsWith('audio/') || dropped?.name.match(/\.(mp3|wav|m4a|ogg|flac|webm)$/i)) {
      processFile(dropped);
    }
  }, [processFile]);

  return (
    <div className="min-h-full flex flex-col items-center px-8 py-12 md:py-24 w-full max-w-5xl mx-auto space-y-12">
      
      {/* Hero */}
      <div className="text-center w-full max-w-2xl space-y-4">
        <h1 className="text-[42px] font-extrabold tracking-tight text-[var(--color-text)] font-heading leading-tight">
          Podcast Intelligence
        </h1>
        <p className="text-[16px] text-[var(--color-text-secondary)] leading-relaxed">
          Transform audio into transcripts, semantic chapters, and deep AI insights.
        </p>
      </div>

      {/* Large Upload Card */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-6 p-20 border-2 border-dashed cursor-pointer rounded-[24px]
            transition-all duration-300 shadow-sm
            ${isDragging
              ? 'border-[var(--color-primary)] bg-[rgba(139,92,246,0.08)] shadow-lg'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-hover)] hover:-translate-y-1 hover:shadow-xl'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.webm"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          />
          <div className="w-16 h-16 rounded-full bg-[var(--color-bg)] flex items-center justify-center border border-[var(--color-border)] shadow-sm">
            <UploadCloud className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <div className="text-center space-y-3">
            <h3 className="text-[20px] font-bold text-[var(--color-text)] font-heading">Drag & Drop Audio File</h3>
            <p className="text-[14px] text-[var(--color-text-secondary)]">
              or <span className="text-[var(--color-primary)] font-semibold hover:underline">browse computer files</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-[13px] font-semibold text-[var(--color-muted)] font-mono uppercase tracking-wider pt-2">
              <span>MP3</span>
              <div className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
              <span>WAV</span>
              <div className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
              <span>M4A</span>
              <div className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
              <span>FLAC</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid: Recent Podcasts & How It Works */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
        
        {/* Recent Podcasts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--color-text)] font-heading tracking-tight">Recent Podcasts</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 flex items-center justify-between cursor-pointer group bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <FileAudio className="w-5 h-5 text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                  </div>
                  <div className="min-w-0 pr-4">
                    <p className="text-base font-bold text-[var(--color-text)] mb-1.5 truncate group-hover:text-[var(--color-primary)] transition-colors">
                      {i === 1 ? 'YCombinator Interview with Sam Altman' : i === 2 ? 'Lex Fridman Podcast #400' : 'Latent Space AI Podcast'}
                    </p>
                    <div className="flex items-center gap-4 text-[13px] text-[var(--color-muted)] font-mono">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {i === 1 ? '45:20' : '1:20:00'}</span>
                      <span>{i}d ago</span>
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                  <ArrowRight className="w-4 h-4 text-[var(--color-primary)]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--color-text)] font-heading tracking-tight">How It Works</h2>
          <div className="space-y-4">
            
            <div className="card p-5 flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center text-[14px] font-bold text-[var(--color-primary)] shrink-0 shadow-sm">
                1
              </div>
              <div className="space-y-0.5">
                <h3 className="text-[15px] font-bold text-[var(--color-text)]">Upload Audio</h3>
                <p className="text-[13px] text-[var(--color-text-secondary)]">Provide any podcast audio format up to 500MB.</p>
              </div>
            </div>
            
            <div className="card p-5 flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center text-[14px] font-bold text-[var(--color-primary)] shrink-0 shadow-sm">
                2
              </div>
              <div className="space-y-0.5">
                <h3 className="text-[15px] font-bold text-[var(--color-text)]">AI Transcription</h3>
                <p className="text-[13px] text-[var(--color-text-secondary)]">High accuracy word-level transcript using OpenAI Whisper.</p>
              </div>
            </div>

            <div className="card p-5 flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center text-[14px] font-bold text-[var(--color-primary)] shrink-0 shadow-sm">
                3
              </div>
              <div className="space-y-0.5">
                <h3 className="text-[15px] font-bold text-[var(--color-text)]">Semantic Chapters</h3>
                <p className="text-[13px] text-[var(--color-text-secondary)]">Automatic segmentation and descriptive keyword highlights.</p>
              </div>
            </div>

            <div className="card p-5 flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center text-[14px] font-bold text-[var(--color-primary)] shrink-0 shadow-sm">
                4
              </div>
              <div className="space-y-0.5">
                <h3 className="text-[15px] font-bold text-[var(--color-text)]">Interactive AI Chat</h3>
                <p className="text-[13px] text-[var(--color-text-secondary)]">Ask direct questions and export customizable reports.</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
