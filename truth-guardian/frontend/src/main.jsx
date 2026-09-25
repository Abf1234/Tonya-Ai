import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BandwidthProvider } from './context/BandwidthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { isAppwriteConfigured, pingAppwrite } from './services/appwrite';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <BandwidthProvider>
          <ToastProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </ToastProvider>
        </BandwidthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

async function checkAppwriteConnection() {
  if (!isAppwriteConfigured) {
    console.warn('[Appwrite] SDK is not configured; skipping connection check.');
    return;
  }

  try {
    await pingAppwrite();
    console.info('[Appwrite] connection check succeeded.');
  } catch {
    // Keep the app available while surfacing the setup failure in the console.
    console.warn('[Appwrite] connection check failed.');
  }
}

void checkAppwriteConnection();
