import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, apiMock } = vi.hoisted(() => ({
  authMock: {
    loading: false,
    user: { $id: 'admin-1', name: 'Platform Admin', email: 'admin@example.test' },
  },
  apiMock: {
    createKnowledgeSource: vi.fn(),
    fetchAdminOverview: vi.fn(),
    fetchKnowledgeSources: vi.fn(),
    fetchOfficialInstitutions: vi.fn(),
    getApiErrorMessage: (_error, fallback) => fallback,
    submitOfficialDocument: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authMock,
}));

vi.mock('../services/api', () => apiMock);

import { ToastProvider } from '../components/ui/ToastProvider';
import AdminPage from './AdminPage';

const overview = {
  generated_at: '2026-09-25T12:00:00Z',
  reports: { total: 12, pending_review: 4, resolved: 3 },
  knowledge_base: {
    documents: { total: 5, approved: 2, pending_review: 3 },
    sources: { total: 2, pending_review: 2, active_count: 2, not_configured: 2, failed: 0 },
  },
  institutions: { total: 3, active_count: 2, verified_count: 2 },
  integrations: {
    knowledge_scraper: {
      status: 'not_configured',
      message: 'URLs can be recorded, but no extraction worker is configured.',
    },
    huggingface: { status: 'disabled', message: 'Optional language model is disabled.' },
    private_storage: { status: 'not_configured', message: 'No private evidence bucket is configured.' },
    google_sheets: { status: 'not_configured', message: 'No sheet sync worker is configured.' },
  },
};

function renderAdmin() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AdminPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.fetchAdminOverview.mockResolvedValue(overview);
    apiMock.fetchKnowledgeSources.mockResolvedValue({
      count: 1,
      results: [
        {
          id: 1,
          institution_name: 'Ministry of Test Information',
          url: 'https://moti.test/notice',
          title: 'Public notice source',
          notes: '',
          status: 'PENDING_REVIEW',
          processing_status: 'NOT_CONFIGURED',
          created_at: '2026-09-25T12:00:00Z',
        },
      ],
    });
    apiMock.fetchOfficialInstitutions.mockResolvedValue({
      count: 1,
      results: [{ id: 1, name: 'Ministry of Test Information' }],
    });
  });

  it('shows monitoring metrics and honest integration states', async () => {
    renderAdmin();

    expect(await screen.findByRole('heading', { name: 'Admin monitoring' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Integration boundaries' })).toBeInTheDocument();
    expect(
      screen.getByText('URLs can be recorded, but no extraction worker is configured.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/No extraction worker is configured/)).toBeInTheDocument();
    expect(screen.getByText('https://moti.test/notice')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps available data visible when one request fails', async () => {
    apiMock.fetchKnowledgeSources.mockRejectedValue({ response: { status: 503 } });

    renderAdmin();

    expect(await screen.findByRole('heading', { name: 'Admin monitoring' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Knowledge-source data is temporarily unavailable.',
    );
    expect(screen.getByRole('heading', { name: 'Knowledge base' })).toBeInTheDocument();
  });

  it('explains a rejected platform-admin request without leaking detail', async () => {
    apiMock.fetchAdminOverview.mockRejectedValue({
      response: { status: 403, data: { error: { message: 'internal detail' } } },
    });

    renderAdmin();

    expect(
      await screen.findByRole('heading', { name: 'Admin access is restricted' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/internal detail/)).not.toBeInTheDocument();
  });
});
