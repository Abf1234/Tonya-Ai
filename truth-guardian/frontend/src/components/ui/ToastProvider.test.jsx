import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from './ToastProvider';

function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast({ message: 'Saved successfully', type: 'success', duration: 0 })}>
      Show toast
    </button>
  );
}

describe('ToastProvider', () => {
  it('announces a toast and allows it to be dismissed', async () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    expect(await screen.findByText('Saved successfully')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saved successfully');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    await waitFor(() => expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument());
  });

  it('does not leave a timer running for a persistent toast', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    vi.advanceTimersByTime(10_000);
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
