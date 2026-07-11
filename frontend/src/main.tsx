import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AnalysisProvider } from './contexts/AnalysisContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AudioProvider } from './contexts/AudioContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <AnalysisProvider>
          <AudioProvider>
            <App />
          </AudioProvider>
        </AnalysisProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>
);
