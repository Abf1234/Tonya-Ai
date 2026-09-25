import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getLiveness } from '../services/api';

export default function SystemStatus() {
  const [state, setState] = useState({ status: 'checking', message: 'Checking API foundation' });

  useEffect(() => {
    const controller = new AbortController();

    getLiveness(controller.signal)
      .then(() => setState({ status: 'online', message: 'API foundation online' }))
      .catch((error) => {
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          setState({ status: 'offline', message: 'API foundation unavailable' });
        }
      });

    return () => controller.abort();
  }, []);

  const Icon = {
    checking: LoaderCircle,
    online: CheckCircle2,
    offline: CircleAlert,
  }[state.status];

  const color = {
    checking: 'text-slate-500',
    online: 'text-guardian-700',
    offline: 'text-amber-700',
  }[state.status];

  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500" role="status">
      <Icon className={`h-4 w-4 ${color} ${state.status === 'checking' ? 'animate-spin' : ''}`} />
      {state.message}
    </div>
  );
}
