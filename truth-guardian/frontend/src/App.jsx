import { Route, Routes } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import AboutPage from './pages/AboutPage';
import AccountPage from './pages/AccountPage';
import AlertsPage from './pages/AlertsPage';
import ChatPage from './pages/ChatPage';
import FactChecksPage from './pages/FactChecksPage';
import HomePage from './pages/HomePage';
import LearnPage from './pages/LearnPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ReportPage from './pages/ReportPage';
import SourcesPage from './pages/SourcesPage';
import VerifiedInformationPage from './pages/VerifiedInformationPage';
import VerifyPage from './pages/VerifyPage';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="verify" element={<VerifyPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="truth-guardian" element={<ChatPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="fact-checks" element={<FactChecksPage />} />
        <Route path="verified-information" element={<VerifiedInformationPage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="learn" element={<LearnPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
