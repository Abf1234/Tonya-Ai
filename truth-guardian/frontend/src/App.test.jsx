import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BandwidthProvider } from './context/BandwidthContext';

vi.mock('./services/api', () => ({
  getLiveness: vi.fn().mockResolvedValue({ status: 'ok' }),
}));

function renderAt(path) {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <BandwidthProvider>
          <App />
        </BandwidthProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('application routing', () => {
  it('renders the verification workspace', () => {
    renderAt('/verify');

    expect(
      screen.getByRole('heading', { name: 'What would you like to verify?' }),
    ).toBeInTheDocument();
  });

  it('renders a safe not-found page', () => {
    renderAt('/not-a-real-page');

    expect(
      screen.getByRole('heading', { name: 'This page could not be found' }),
    ).toBeInTheDocument();
  });
});
