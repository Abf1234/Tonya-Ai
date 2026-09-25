import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const BandwidthContext = createContext(null);

function getInitialValue() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    if (typeof window.localStorage?.getItem === 'function') {
      return window.localStorage.getItem('truth-guardian-lite-mode') === 'true';
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browsers and test runtimes.
  }

  return false;
}

export function BandwidthProvider({ children }) {
  const [liteMode, setLiteMode] = useState(getInitialValue);

  useEffect(() => {
    document.documentElement.dataset.liteMode = String(liteMode);
    try {
      if (typeof window.localStorage?.setItem === 'function') {
        window.localStorage.setItem('truth-guardian-lite-mode', String(liteMode));
      }
    } catch {
      // Lite Mode still works for the current session when storage is unavailable.
    }
  }, [liteMode]);

  const value = useMemo(
    () => ({
      liteMode,
      setLiteMode,
      toggleLiteMode: () => setLiteMode((current) => !current),
    }),
    [liteMode],
  );

  return <BandwidthContext.Provider value={value}>{children}</BandwidthContext.Provider>;
}

export function useBandwidth() {
  const context = useContext(BandwidthContext);
  if (!context) {
    throw new Error('useBandwidth must be used within BandwidthProvider');
  }

  return context;
}
