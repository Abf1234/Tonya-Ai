import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { accountMock } = vi.hoisted(() => ({
  accountMock: {
    get: vi.fn(),
    createEmailPasswordSession: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

vi.mock('../services/appwrite', () => ({
  account: accountMock,
  isAppwriteConfigured: true,
}));

import { AuthProvider, useAuth } from './AuthContext';

function AuthHarness() {
  const { signIn, signOut, user } = useAuth();

  return (
    <div>
      <p>{user ? `Signed in as ${user.email}` : 'Signed out'}</p>
      <button type="button" onClick={() => signIn('  citizen@example.com  ', 'correct horse battery staple')}>
        Sign in
      </button>
      <button type="button" onClick={() => signOut()}>
        Sign out
      </button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthHarness />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    accountMock.get.mockReset();
    accountMock.createEmailPasswordSession.mockReset();
    accountMock.deleteSession.mockReset();
  });

  it('restores an Appwrite session and signs in with trimmed email input', async () => {
    const user = { $id: 'user-1', email: 'citizen@example.com', name: 'Citizen' };
    accountMock.get.mockRejectedValueOnce({ code: 401 }).mockResolvedValueOnce(user);
    accountMock.createEmailPasswordSession.mockResolvedValue({});
    accountMock.deleteSession.mockResolvedValue({});
    const userEventSetup = userEvent.setup();
    renderAuth();

    expect(await screen.findByText('Signed out')).toBeInTheDocument();
    await userEventSetup.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(accountMock.createEmailPasswordSession).toHaveBeenCalledWith({
      email: 'citizen@example.com',
      password: 'correct horse battery staple',
    });
    expect(await screen.findByText('Signed in as citizen@example.com')).toBeInTheDocument();
  });

  it('deletes only the current Appwrite session on sign out', async () => {
    const user = { $id: 'user-1', email: 'citizen@example.com', name: 'Citizen' };
    accountMock.get.mockResolvedValue(user);
    accountMock.deleteSession.mockResolvedValue({});
    const userEventSetup = userEvent.setup();
    renderAuth();

    expect(await screen.findByText('Signed in as citizen@example.com')).toBeInTheDocument();
    await userEventSetup.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(accountMock.deleteSession).toHaveBeenCalledWith('current');
    await waitFor(() => expect(screen.getByText('Signed out')).toBeInTheDocument());
  });
});
