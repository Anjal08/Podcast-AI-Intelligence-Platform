import { useSettings } from '@/contexts/SettingsContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { Monitor, Moon, Sun, Server, Cpu, Webhook, RefreshCcw, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { podcastApi } from '@/api/podcast';

export function SettingsPage() {
  const { theme, setTheme, backendUrl, setBackendUrl } = useSettings();
  const { reset } = useAnalysis();
  const navigate = useNavigate();

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [modelStatus, setModelStatus] = useState<any>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const isHealthy = await podcastApi.health();
        setBackendStatus(isHealthy ? 'online' : 'offline');
        setModelStatus(isHealthy ? { groq: 'connected', whisper: 'connected' } : null);
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    checkStatus();
  }, [backendUrl]);

  const handleReset = () => {
    reset();
    navigate('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-12 w-full space-y-12">
      <div className="space-y-2">
        <h1 className="text-[42px] font-extrabold tracking-tight text-[var(--color-text)] font-heading leading-tight">Settings</h1>
        <p className="text-[16px] text-[var(--color-text-secondary)]">
          Manage your application preferences and backend connections.
        </p>
      </div>

      <div className="space-y-8">
        {/* Appearance */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-bold text-[var(--color-text)] font-heading flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[var(--color-muted)]" /> Appearance
          </h2>
          <div className="card p-2 bg-[var(--color-surface)] border-[var(--color-border)]">
            <div className="grid grid-cols-3 gap-2 p-1">
              {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'system', icon: Monitor, label: 'System' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id as any)}
                  className={`flex items-center justify-center gap-2 h-11 rounded-lg text-[14px] font-bold transition-all ${theme === id ? 'bg-[var(--color-surface-hover)] shadow-sm text-[var(--color-text)] border border-[var(--color-border)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] border border-transparent'}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Backend Configuration */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-bold text-[var(--color-text)] font-heading flex items-center gap-2">
            <Server className="w-5 h-5 text-[var(--color-muted)]" /> Backend Configuration
          </h2>
          <div className="card p-6 space-y-6 bg-[var(--color-surface)] border-[var(--color-border)]">
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider font-heading">
                API Endpoint URL
              </label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                className="w-full h-11 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[14px] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                placeholder="http://localhost:8000"
              />
            </div>

            <div className="space-y-4 pt-6 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[var(--color-text-secondary)] flex items-center gap-2 font-medium">
                  <Server className="w-4 h-4 text-[var(--color-muted)]" /> Platform API
                </span>
                <span className={`font-semibold ${backendStatus === 'online' ? 'text-[var(--color-success)]' : backendStatus === 'offline' ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'}`}>
                  {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[var(--color-text-secondary)] flex items-center gap-2 font-medium">
                  <Cpu className="w-4 h-4 text-[var(--color-muted)]" /> Groq LLM API
                </span>
                <span className={`font-semibold ${modelStatus?.groq === 'connected' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                  {modelStatus ? (modelStatus.groq === 'connected' ? 'Connected' : 'Disconnected') : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[var(--color-text-secondary)] flex items-center gap-2 font-medium">
                  <Webhook className="w-4 h-4 text-[var(--color-muted)]" /> Whisper API
                </span>
                <span className={`font-semibold ${modelStatus?.whisper === 'connected' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                  {modelStatus ? (modelStatus.whisper === 'connected' ? 'Connected' : 'Disconnected') : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-bold text-[var(--color-danger)] font-heading flex items-center gap-2">
            <Info className="w-5 h-5" /> Danger Zone
          </h2>
          <div className="card p-6 border-[var(--color-danger)] bg-[rgba(239,68,68,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-[16px] font-bold text-[var(--color-text)] font-heading mb-1">Reset Session</h3>
                <p className="text-[14px] text-[var(--color-text-secondary)]">
                  Clear the current podcast analysis from memory.
                </p>
              </div>
              <button 
                onClick={handleReset}
                className="h-11 px-5 rounded-lg bg-[var(--color-danger)] hover:bg-red-600 text-white text-[14px] font-bold transition-all flex items-center gap-2 shadow-sm shrink-0"
              >
                <RefreshCcw className="w-4 h-4" /> Reset Data
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
