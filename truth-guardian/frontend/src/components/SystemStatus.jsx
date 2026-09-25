import { CheckCircle2, CircleAlert, LoaderCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { getLiveness } from '../services/api';

export default function SystemStatus({ inverse = false }) {
  const [state, setState] = useState({ status: 'checking', message: 'Checking API service' });

  const checkStatus = useCallback(async (signal) => {
    setState({ status: 'checking', message: 'Checking API service' });
    try {
      await getLiveness(signal);
      setState({ status: 'online', message: 'API online' });
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        setState({ status: 'offline', message: 'API unavailable' });
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void checkStatus(controller.signal);
    return () => controller.abort();
  }, [checkStatus]);

  const Icon = {
    checking: LoaderCircle,
    online: CheckCircle2,
    offline: CircleAlert,
  }[state.status];

  const color = {
    checking: inverse ? 'text-slate-300' : 'text-slate-500',
    online: inverse ? 'text-guardian-300' : 'text-guardian-700',
    offline: inverse ? 'text-amber-300' : 'text-amber-700',
  }[state.status];

  return (
    <div className={`inline-flex items-center gap-2 text-xs font-semibold ${inverse ? 'text-slate-300' : 'text-slate-500'}`} role="status">
      <Icon className={`h-4 w-4 ${color} ${state.status === 'checking' ? 'animate-spin' : ''}`} />
      <span>{state.message}</span>
      {state.status === 'offline' ? (
        <button
          type="button"
          onClick={() => void checkStatus()}
          className="inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 font-extrabold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  );
}
