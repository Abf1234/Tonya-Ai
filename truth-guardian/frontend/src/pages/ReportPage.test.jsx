import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  createIdempotencyKeyMock,
  submitFraudReportMock,
} = vi.hoisted(() => ({
  createIdempotencyKeyMock: vi.fn(() => 'stable-report-key'),
  submitFraudReportMock: vi.fn(),
}));

vi.mock('../services/api', () => ({
  createIdempotencyKey: createIdempotencyKeyMock,
  getApiErrorMessage: (_error, fallback) => fallback,
  submitFraudReport: submitFraudReportMock,
}));

import { ToastProvider } from '../components/ui/ToastProvider';
import ReportPage from './ReportPage';

const receipt = {
  report_id: 'TG-2026-000123',
  status: 'RECEIVED',
  created_at: '2026-01-01T00:00:00Z',
  evidence_processing_status: 'NOT_PROVIDED',
  message: 'Your report was received. Keep this reference for follow-up.',
};

function renderReport() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <ReportPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('ReportPage', () => {
  afterEach(() => {
    createIdempotencyKeyMock.mockClear();
    submitFraudReportMock.mockReset();
    vi.restoreAllMocks();
  });

  it('prevents rapid duplicate submissions and exposes a copyable receipt', async () => {
    let resolveRequest;
    submitFraudReportMock.mockImplementation(
      () => new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderReport();
    fireEvent.change(screen.getByLabelText(/Suspicious message or claim/), {
      target: { value: 'A message asks for an advance payment.' },
    });
    const submitButton = screen.getByRole('button', { name: 'Submit report' });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(submitFraudReportMock).toHaveBeenCalledTimes(1);
    expect(submitFraudReportMock.mock.calls[0][1].idempotencyKey).toBe('stable-report-key');

    resolveRequest(receipt);
    expect(await screen.findByText('Report received')).toBeInTheDocument();
    expect(screen.getByText('TG-2026-000123')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy reference' }));
    expect(writeText).toHaveBeenCalledWith('TG-2026-000123');
  });

  it('reuses the idempotency key when a failed submission is retried', async () => {
    submitFraudReportMock
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(receipt);
    renderReport();

    fireEvent.change(screen.getByLabelText(/Suspicious message or claim/), {
      target: { value: 'Please retry this report safely.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));
    expect(await screen.findByText('We could not submit the report. Please try again.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));
    await waitFor(() => expect(submitFraudReportMock).toHaveBeenCalledTimes(2));
    expect(submitFraudReportMock.mock.calls[0][1].idempotencyKey).toBe(
      submitFraudReportMock.mock.calls[1][1].idempotencyKey,
    );
  });

  it('shows the exact manual-paste fallback when clipboard access is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    renderReport();

    fireEvent.click(screen.getAllByRole('button', { name: 'Paste' })[0]);
    expect(
      await screen.findByText("Clipboard access isn't available. You can paste manually using Ctrl+V."),
    ).toBeInTheDocument();
  });
});
