import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BandwidthProvider } from './context/BandwidthContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <BandwidthProvider>
          <App />
        </BandwidthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
