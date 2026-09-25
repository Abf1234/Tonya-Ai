import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock } = vi.hoisted(() => ({
  authMock: {
    configured: true,
    error: '',
    loading: false,
    signIn: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  getAuthErrorMessage: (error) => error?.message || 'Authentication failed.',
  useAuth: () => authMock,
}));

import LoginPage from './LoginPage';

function renderLogin(next = '/verify') {
  return render(
    <MemoryRouter initialEntries={[`/login?next=${encodeURIComponent(next)}`]}>
      <Routes>
        <Route path="/" element={<div>Home destination</div>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<div>Verification destination</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    authMock.signIn.mockReset();
    authMock.signIn.mockResolvedValue({ $id: 'user-1' });
  });

  it('submits credentials to Appwrite and follows a safe internal next path', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText('Email address'), 'citizen@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(authMock.signIn).toHaveBeenCalledWith('citizen@example.com', 'correct horse battery staple');
    expect(await screen.findByText('Verification destination')).toBeInTheDocument();
  });

  it('does not follow an external next URL after sign-in', async () => {
    const user = userEvent.setup();
    renderLogin('//malicious.example/steal');

    await user.type(screen.getByLabelText('Email address'), 'citizen@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Home destination')).toBeInTheDocument();
  });

  it('does not submit an incomplete form', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(authMock.signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Email address')).toBeInvalid();
    expect(screen.getByLabelText('Password')).toBeInvalid();
  });
});
