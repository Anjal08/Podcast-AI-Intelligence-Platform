import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { UploadPage } from '@/pages/UploadPage';
import { TranscriptPage } from '@/pages/TranscriptPage';
import { ChaptersPage } from '@/pages/ChaptersPage';
import { SummaryPage } from '@/pages/SummaryPage';
import { ChatPage } from '@/pages/ChatPage';
import { DownloadsPage } from '@/pages/DownloadsPage';
import { SettingsPage } from '@/pages/SettingsPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/transcript" element={<TranscriptPage />} />
        <Route path="/chapters" element={<ChaptersPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
