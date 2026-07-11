import { useAudio } from '@/contexts/AudioContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { formatDuration } from '@/utils';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Music } from 'lucide-react';

export function AudioPlayer() {
  const { 
    audioUrl, isPlaying, togglePlay, 
    currentTime, duration, seek, 
    volume, setVolume,
    playbackRate, setPlaybackRate 
  } = useAudio();
  
  const { state: { audioFile } } = useAnalysis();

  if (!audioUrl) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    seek(percentage * duration);
  };

  const skip = (amount: number) => {
    seek(Math.max(0, Math.min(currentTime + amount, duration)));
  };

  const toggleMute = () => {
    if (volume === 0) setVolume(1);
    else setVolume(0);
  };

  const toggleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  return (
    <div className="h-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-6 flex items-center justify-between shrink-0 shadow-md z-10 w-full max-w-xl mx-auto mt-6 relative overflow-hidden">
      {/* Absolute Progress Bar on top of the player */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-border)] cursor-pointer group transition-all"
        onClick={handleProgressBarClick}
      >
        <div 
          className="h-full bg-[var(--color-primary)] transition-all duration-100 ease-linear relative group-hover:h-1.5"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--color-primary)] border border-white rounded-full shadow opacity-0 group-hover:opacity-100 transform translate-x-1/2 transition-opacity" />
        </div>
      </div>

      {/* Left: Track Details */}
      <div className="flex items-center gap-3 min-w-[200px] max-w-[280px]">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-[var(--color-text)] truncate leading-none mb-1">
            {audioFile?.name || 'Unknown Episode'}
          </p>
          <p className="text-[11px] text-[var(--color-muted)] font-medium font-mono leading-none">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </p>
        </div>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => skip(-15)}
          className="p-2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          title="Skip backward 15s"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        
        <button 
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
        
        <button 
          onClick={() => skip(15)}
          className="p-2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          title="Skip forward 15s"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Sound & Speed Controls */}
      <div className="flex items-center gap-4 min-w-[200px] justify-end">
        <button 
          onClick={toggleSpeed}
          className="h-7 px-2.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[12px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-muted)] transition-colors font-mono"
        >
          {playbackRate}x
        </button>

        <div className="flex items-center gap-2 group">
          <button onClick={toggleMute} className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
            {volume === 0 ? <VolumeX className="w-4 h-4 text-[var(--color-danger)]" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 accent-[var(--color-primary)] h-1 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
