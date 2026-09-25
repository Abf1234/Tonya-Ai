import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { askPublicAssistantMock } = vi.hoisted(() => ({
  askPublicAssistantMock: vi.fn(),
}));

vi.mock('../services/api', () => ({
  askPublicAssistant: askPublicAssistantMock,
  getApiErrorMessage: (_error, fallback) => fallback,
}));

import { ToastProvider } from '../components/ui/ToastProvider';
import ChatPage from './ChatPage';

function renderChat() {
  return render(
    <ToastProvider>
      <ChatPage />
    </ToastProvider>,
  );
}

describe('ChatPage', () => {
  afterEach(() => {
    askPublicAssistantMock.mockReset();
    vi.restoreAllMocks();
  });

  it('sends one question at a time and copies an assistant response', async () => {
    let resolveRequest;
    askPublicAssistantMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderChat();
    const composer = screen.getByRole('textbox', { name: 'Ask a question' });
    fireEvent.change(composer, { target: { value: 'Is this notice official?' } });
    const sendButton = screen.getByRole('button', { name: 'Send question' });
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);

    expect(askPublicAssistantMock).toHaveBeenCalledTimes(1);
    expect(askPublicAssistantMock).toHaveBeenCalledWith(
      'Is this notice official?',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    resolveRequest({
      answer: 'Approved material was found, but this does not verify every statement.',
      evidence: [],
      evidence_strength: 'moderate',
      limitations: 'This lookup is limited to approved official records.',
    });

    expect(await screen.findByText(/Approved material was found/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy response' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Approved material was found'));
  });

  it('sends the selected language and labels grounded AI wording', async () => {
    askPublicAssistantMock.mockResolvedValue({
      answer: 'Krio wording with a careful limitation.',
      evidence: [],
      evidence_strength: 'limited',
      limitations: 'Review the source.',
      ai_generated: true,
      ai_status: 'grounded',
      language: 'krio',
    });

    renderChat();
    fireEvent.change(screen.getByRole('combobox', { name: 'Response language' }), {
      target: { value: 'krio' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Ask a question' }), {
      target: { value: 'Explain this notice' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));

    expect(await screen.findByText(/Krio wording/)).toBeInTheDocument();
    expect(askPublicAssistantMock).toHaveBeenCalledWith(
      'Explain this notice',
      expect.objectContaining({ language: 'krio' }),
    );
    expect(screen.getByText('AI-assisted wording · check the source cards')).toBeInTheDocument();
  });

  it('turns a malformed provider response into a safe visible error', async () => {
    askPublicAssistantMock.mockResolvedValue({ unexpected: true });

    renderChat();
    fireEvent.change(screen.getByRole('textbox', { name: 'Ask a question' }), {
      target: { value: 'Malformed response' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));

    expect(await screen.findByText('The evidence assistant is temporarily unavailable.')).toBeInTheDocument();
  });

  it('adds a stopped message and does not leave the request in a loading state', async () => {
    askPublicAssistantMock.mockImplementation((_query, { signal }) => {
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    renderChat();
    fireEvent.change(screen.getByRole('textbox', { name: 'Ask a question' }), {
      target: { value: 'Stop this lookup' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Stop searching' }));

    expect(await screen.findByText('The search was stopped. No answer was added.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Truth Guardian is checking available evidence…')).not.toBeInTheDocument());
  });
});
