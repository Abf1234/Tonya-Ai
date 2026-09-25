import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { BandwidthProvider } from '../context/BandwidthContext';
import HomePage from './HomePage';

vi.mock('../services/api', () => ({
  getLiveness: vi.fn().mockResolvedValue({ status: 'ok' }),
}));

function renderHome() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <BandwidthProvider>
        <HomePage />
      </BandwidthProvider>
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('presents the public verification purpose and tagline', async () => {
    renderHome();

    expect(
      screen.getByRole('heading', { name: 'Verify Before You Share.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Check suspicious claims, government announcements, scams/i),
    ).toBeInTheDocument();
    expect(await screen.findByText('API foundation online')).toBeInTheDocument();
  });

  it('enables verification only when input is provided', async () => {
    const user = userEvent.setup();
    renderHome();

    const input = screen.getByLabelText('Message, claim or URL');
    const verifyButton = screen.getByRole('button', { name: 'VERIFY' });

    expect(verifyButton).toBeDisabled();
    await user.type(input, 'Is this recruitment message genuine?');
    expect(verifyButton).toBeEnabled();
    expect(await screen.findByText('API foundation online')).toBeInTheDocument();
  });
});
