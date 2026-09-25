import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock } = vi.hoisted(() => ({
  authMock: {
    configured: true,
    loading: false,
    signOut: vi.fn(),
    user: { $id: 'user-1', name: 'Example User', email: 'user@example.test' },
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authMock,
}));

import AccountPage from './AccountPage';

function renderAccount() {
  return render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>,
  );
}

describe('AccountPage', () => {
  beforeEach(() => {
    authMock.signOut.mockReset();
  });

  it('shows a safe message when current-session sign-out fails', async () => {
    authMock.signOut.mockRejectedValue(new Error('provider detail must not be shown'));
    const user = userEvent.setup();
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sign-out could not be completed. Please try again.',
    );
    expect(screen.queryByText('provider detail must not be shown')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).not.toBeDisabled();
  });
});
