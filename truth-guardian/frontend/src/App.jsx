import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import ChatPage from './pages/ChatPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ReportPage from './pages/ReportPage';
import VerifyPage from './pages/VerifyPage';
import Skeleton from './components/ui/Skeleton';

const AboutPage = lazy(() => import('./pages/AboutPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const FactChecksPage = lazy(() => import('./pages/FactChecksPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const OfficialPortalPage = lazy(() => import('./pages/OfficialPortalPage'));
const SourcesPage = lazy(() => import('./pages/SourcesPage'));
const VerifiedInformationPage = lazy(() => import('./pages/VerifiedInformationPage'));

function RouteFallback() {
  return (
    <div className="bg-slate-50 py-16" role="status" aria-label="Loading page">
      <div className="page-shell mx-auto max-w-5xl">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-5 h-12 w-4/5" />
        <Skeleton className="mt-4 h-5 w-full" />
        <Skeleton className="mt-2 h-5 w-3/4" />
        <Skeleton className="mt-10 h-64 w-full" />
      </div>
    </div>
  );
}

function Deferred({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="verify" element={<VerifyPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="account" element={<Deferred><AccountPage /></Deferred>} />
        <Route path="official" element={<Deferred><OfficialPortalPage /></Deferred>} />
        <Route path="admin" element={<Deferred><AdminPage /></Deferred>} />
        <Route path="admin/monitoring" element={<Deferred><AdminPage /></Deferred>} />
        <Route path="official/admin" element={<Deferred><AdminPage /></Deferred>} />
        <Route path="truth-guardian" element={<ChatPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="alerts" element={<Deferred><AlertsPage /></Deferred>} />
        <Route path="fact-checks" element={<Deferred><FactChecksPage /></Deferred>} />
        <Route path="verified-information" element={<Deferred><VerifiedInformationPage /></Deferred>} />
        <Route path="sources" element={<Deferred><SourcesPage /></Deferred>} />
        <Route path="learn" element={<Deferred><LearnPage /></Deferred>} />
        <Route path="about" element={<Deferred><AboutPage /></Deferred>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
