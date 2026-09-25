import {
  Activity,
  BookOpen,
  CheckCircle2,
  Database,
  ExternalLink,
  FilePlus2,
  Gauge,
  Link2,
  LogIn,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import {
  createKnowledgeSource,
  fetchAdminOverview,
  fetchKnowledgeSources,
  fetchOfficialInstitutions,
  getApiErrorMessage,
  submitOfficialDocument,
} from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';
import Textarea from '../components/ui/Textarea';
import { useToast } from '../components/ui/ToastProvider';

const initialSourceForm = {
  institutionId: '',
  url: '',
  title: '',
  notes: '',
};

const initialDocumentForm = {
  institutionId: '',
  title: '',
  category: '',
  bodyText: '',
  sourceUrl: '',
  documentType: 'ANNOUNCEMENT',
};

function formatDate(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function formatCount(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString() : '0';
}

function statusLabel(value) {
  return String(value || 'UNKNOWN')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusVariant(value) {
  const status = String(value || '').toUpperCase();
  if (['COMPLETED', 'APPROVED', 'SUCCESS', 'READY'].includes(status)) return 'success';
  if (['FAILED', 'REJECTED', 'ERROR'].includes(status)) return 'danger';
  if (['PENDING', 'PENDING_REVIEW', 'PROCESSING', 'RUNNING', 'QUEUED'].includes(status)) return 'warning';
  return 'neutral';
}

function isAbortError(error) {
  return error?.code === 'ERR_CANCELED' || error?.name === 'AbortError' || error?.name === 'CanceledError';
}

function IntegrationCard({ icon: Icon, title, status, message }) {
  return (
    <Card className="p-4" interactive={false}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
            <Badge variant={statusVariant(status)} dot>{statusLabel(status)}</Badge>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">{message}</p>
        </div>
      </div>
    </Card>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const userKey = user?.$id || user?.id;
  const mountedRef = useRef(true);

  const [overview, setOverview] = useState(null);
  const [sources, setSources] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [sourceForm, setSourceForm] = useState(initialSourceForm);
  const [documentForm, setDocumentForm] = useState(initialDocumentForm);
  const [sourceSubmitting, setSourceSubmitting] = useState(false);
  const [documentSubmitting, setDocumentSubmitting] = useState(false);
  const activeControllerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeControllerRef.current?.abort();
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!userKey) return;
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;
    setLoading(true);
    setLoadError('');
    setAccessDenied(false);

    const [overviewResult, sourcesResult, institutionsResult] = await Promise.allSettled([
      fetchAdminOverview({ signal: controller.signal }),
      fetchKnowledgeSources({}, { signal: controller.signal }),
      fetchOfficialInstitutions({ signal: controller.signal }),
    ]);
    if (!mountedRef.current || controller.signal.aborted) return;
    if (activeControllerRef.current === controller) activeControllerRef.current = null;

    const errors = [];
    let denied = false;
    const handleRejected = (result, fallback) => {
      if (result.status === 'rejected') {
        if (isAbortError(result.reason)) return;
        if ([401, 403].includes(result.reason?.response?.status)) denied = true;
        errors.push(getApiErrorMessage(result.reason, fallback));
      }
    };

    if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
    else handleRejected(overviewResult, 'Monitoring data is temporarily unavailable.');
    if (sourcesResult.status === 'fulfilled') setSources(sourcesResult.value.results || []);
    else handleRejected(sourcesResult, 'Knowledge-source data is temporarily unavailable.');
    if (institutionsResult.status === 'fulfilled') setInstitutions(institutionsResult.value.results || []);
    else handleRejected(institutionsResult, 'Institution data is temporarily unavailable.');

    setAccessDenied(denied);
    if (errors.length) setLoadError(errors.join(' '));
    setLoading(false);
  }, [userKey]);

  useEffect(() => {
    if (!userKey) {
      setOverview(null);
      setSources([]);
      setInstitutions([]);
      return undefined;
    }
    void loadData();
    return () => activeControllerRef.current?.abort();
  }, [loadData, userKey]);

  useEffect(() => {
    if (institutions.length === 1) {
      const institutionId = String(institutions[0].id);
      setSourceForm((current) => ({ ...current, institutionId: current.institutionId || institutionId }));
      setDocumentForm((current) => ({ ...current, institutionId: current.institutionId || institutionId }));
    }
  }, [institutions]);

  const reportMetrics = useMemo(() => [
    { label: 'Total reports', value: overview?.reports?.total, detail: 'All public reports' },
    { label: 'Under review', value: overview?.reports?.under_review, detail: 'Awaiting staff action' },
    { label: 'Evidence failed', value: overview?.reports?.evidence_failed, detail: 'Requires operational review' },
  ], [overview]);
  const knowledgeMetrics = useMemo(() => [
    { label: 'Documents', value: overview?.knowledge_base?.documents?.total, detail: 'Manual and reviewed records' },
    { label: 'Pending review', value: overview?.knowledge_base?.documents?.pending_review, detail: 'Not public yet' },
    { label: 'Registered URLs', value: overview?.knowledge_base?.sources?.total, detail: 'No extraction implied' },
  ], [overview]);

  const updateSource = (field, value) => {
    setSourceForm((current) => ({ ...current, [field]: value }));
    setActionError('');
    setNotice('');
  };

  const updateDocument = (field, value) => {
    setDocumentForm((current) => ({ ...current, [field]: value }));
    setActionError('');
    setNotice('');
  };

  const handleSourceSubmit = async (event) => {
    event.preventDefault();
    setActionError('');
    setNotice('');
    if (!sourceForm.institutionId || !sourceForm.url.trim()) {
      setActionError('Choose an institution and enter an HTTPS source URL.');
      return;
    }

    setSourceSubmitting(true);
    try {
      const response = await createKnowledgeSource({
        institution_id: Number(sourceForm.institutionId),
        url: sourceForm.url.trim(),
        title: sourceForm.title.trim(),
        notes: sourceForm.notes.trim(),
      });
      setSources((current) => [response, ...current]);
      setSourceForm((current) => ({ ...initialSourceForm, institutionId: current.institutionId }));
      setNotice(response.message || 'URL recorded for review. No scraper ran.');
      showToast({ message: 'Source URL recorded. No extraction was started.', type: 'success' });
      void loadData();
    } catch (requestError) {
      if (!isAbortError(requestError)) {
        setActionError(getApiErrorMessage(requestError, 'The source URL could not be recorded.'));
      }
    } finally {
      setSourceSubmitting(false);
    }
  };

  const handleDocumentSubmit = async (event) => {
    event.preventDefault();
    setActionError('');
    setNotice('');
    const hasBody = documentForm.bodyText.trim();
    const hasUrl = documentForm.sourceUrl.trim();
    if (!documentForm.institutionId || !documentForm.title.trim() || !documentForm.category.trim() || (!hasBody && !hasUrl)) {
      setActionError('Institution, title, category, and either official text or a source URL are required.');
      return;
    }

    setDocumentSubmitting(true);
    try {
      await submitOfficialDocument({
        institution_id: Number(documentForm.institutionId),
        title: documentForm.title.trim(),
        category: documentForm.category.trim(),
        body_text: documentForm.bodyText.trim(),
        source_url: documentForm.sourceUrl.trim(),
        document_type: documentForm.documentType,
      });
      setDocumentForm((current) => ({ ...initialDocumentForm, institutionId: current.institutionId }));
      setNotice('Knowledge-base record submitted for authorized review. It is not public until approved.');
      showToast({ message: 'Record submitted for review.', type: 'success' });
      void loadData();
    } catch (requestError) {
      if (!isAbortError(requestError)) {
        setActionError(getApiErrorMessage(requestError, 'The knowledge-base record could not be submitted.'));
      }
    } finally {
      setDocumentSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="bg-slate-50 py-16">
        <div className="page-shell mx-auto max-w-6xl">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-5 h-12 w-2/3" />
          <Skeleton className="mt-4 h-5 w-full" />
          <Skeleton className="mt-10 h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-slate-50 py-16">
        <div className="page-shell">
          <Card className="mx-auto max-w-2xl p-8 text-center shadow-soft sm:p-12">
            <ShieldCheck className="mx-auto h-10 w-10 text-guardian-700" aria-hidden="true" />
            <h1 className="mt-5 font-display text-3xl font-extrabold text-slate-950">Admin console</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">Sign in with an approved platform administrator account to monitor operations and manage approved knowledge-base sources.</p>
            <Button as={Link} to="/login?next=/admin" size="lg" className="mt-7">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign in to continue
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="bg-slate-50 py-16">
        <div className="page-shell">
          <Card className="mx-auto max-w-2xl p-8 text-center shadow-soft sm:p-12">
            <TriangleAlert className="mx-auto h-10 w-10 text-amber-600" aria-hidden="true" />
            <h1 className="mt-5 font-display text-3xl font-extrabold text-slate-950">Admin access is restricted</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">Your account is signed in, but it is not linked to an approved platform administrator role. The server rejected this request.</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button type="button" onClick={() => void loadData()}>Try again</Button>
              <Button as={Link} to="/official" variant="secondary">Open official portal</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 py-10 sm:py-14">
      <div className="page-shell">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-guardian-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-800">
                <Gauge className="h-4 w-4" aria-hidden="true" />
                Operations console
              </div>
              <h1 className="mt-4 font-display text-4xl font-extrabold text-slate-950">Admin monitoring</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Monitor service boundaries, submit manual knowledge-base records, and register approved URLs for a future extraction worker. PostgreSQL remains the source of truth.</p>
            </div>
            <Button variant="secondary" onClick={() => void loadData()} loading={loading} aria-label="Refresh monitoring data">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </Button>
          </div>

          {loadError ? <Alert tone="error" className="mt-6" onDismiss={() => setLoadError('')}>{loadError}</Alert> : null}
          {actionError ? <Alert tone="error" className="mt-6" onDismiss={() => setActionError('')}>{actionError}</Alert> : null}
          {notice ? <Alert tone="success" className="mt-6" onDismiss={() => setNotice('')}>{notice}</Alert> : null}

          {loading && !overview ? (
            <div className="mt-8 space-y-4" role="status" aria-label="Loading monitoring data">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 w-full" />)}
              </div>
              <Skeleton className="h-80 w-full" />
            </div>
          ) : null}

          {overview ? (
            <>
              <section className="mt-8" aria-labelledby="report-metrics-heading">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="report-metrics-heading" className="font-display text-2xl font-extrabold text-slate-950">Service health</h2>
                  <span className="text-xs text-slate-500">Updated {formatDate(overview.generated_at)}</span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {reportMetrics.map((metric) => (
                    <Card key={metric.label} className="p-5" interactive={false}>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{metric.label}</p>
                      <p className="mt-2 text-3xl font-extrabold text-slate-950">{formatCount(metric.value)}</p>
                      <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="mt-8" aria-labelledby="knowledge-metrics-heading">
                <h2 id="knowledge-metrics-heading" className="font-display text-2xl font-extrabold text-slate-950">Knowledge base</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {knowledgeMetrics.map((metric) => (
                    <Card key={metric.label} className="p-5" interactive={false}>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{metric.label}</p>
                      <p className="mt-2 text-3xl font-extrabold text-slate-950">{formatCount(metric.value)}</p>
                      <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="mt-8" aria-labelledby="integrations-heading">
                <h2 id="integrations-heading" className="font-display text-2xl font-extrabold text-slate-950">Integration boundaries</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <IntegrationCard icon={Link2} title="Knowledge scraper" status={overview.integrations?.knowledge_scraper?.status} message={overview.integrations?.knowledge_scraper?.message} />
                  <IntegrationCard icon={Activity} title="Assistant provider" status={overview.integrations?.huggingface?.status} message={overview.integrations?.huggingface?.message} />
                  <IntegrationCard icon={Database} title="Private evidence storage" status={overview.integrations?.private_storage?.status} message={overview.integrations?.private_storage?.message} />
                  <IntegrationCard icon={BookOpen} title="Google Sheets" status={overview.integrations?.google_sheets?.status} message={overview.integrations?.google_sheets?.message} />
                </div>
              </section>
            </>
          ) : null}

          <div className="mt-10 grid gap-6 xl:grid-cols-2">
            <Card className="p-6 sm:p-8" interactive={false}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-guardian-50 text-guardian-700">
                  <Link2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-slate-950">Register a knowledge source</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Only active, verified institution domains are accepted. Adding a URL records review intent; it does not fetch or index a page.</p>
                </div>
              </div>
              <form onSubmit={handleSourceSubmit} className="mt-6 space-y-4">
                <Select id="admin-source-institution" label="Institution" required value={sourceForm.institutionId} onChange={(event) => updateSource('institutionId', event.target.value)}>
                  <option value="">Select institution</option>
                  {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
                </Select>
                <Input id="admin-source-url" label="HTTPS source URL" type="url" required value={sourceForm.url} onChange={(event) => updateSource('url', event.target.value)} placeholder="https://official-domain.gov.sl/notice" />
                <Input id="admin-source-title" label="Title (optional)" value={sourceForm.title} onChange={(event) => updateSource('title', event.target.value)} />
                <Textarea id="admin-source-notes" label="Review notes (optional)" rows={3} value={sourceForm.notes} onChange={(event) => updateSource('notes', event.target.value)} hint="Do not paste credentials or reporter contact details." />
                <Button type="submit" loading={sourceSubmitting} disabled={sourceSubmitting}>
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                  Record source URL
                </Button>
              </form>
              <Alert tone="warning" className="mt-5">
                <span className="flex items-start gap-2 text-xs leading-5"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />No extraction worker is configured. New links remain pending review and are not searchable knowledge until a reviewed document is approved.</span>
              </Alert>
            </Card>

            <Card className="p-6 sm:p-8" interactive={false}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <FilePlus2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-slate-950">Add knowledge-base data</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Create a manually authored record. It enters the authorized review queue and is not public immediately.</p>
                </div>
              </div>
              <form onSubmit={handleDocumentSubmit} className="mt-6 space-y-4">
                <Select id="admin-document-institution" label="Institution" required value={documentForm.institutionId} onChange={(event) => updateDocument('institutionId', event.target.value)}>
                  <option value="">Select institution</option>
                  {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
                </Select>
                <Input id="admin-document-title" label="Title" required value={documentForm.title} onChange={(event) => updateDocument('title', event.target.value)} />
                <Input id="admin-document-category" label="Category" required value={documentForm.category} onChange={(event) => updateDocument('category', event.target.value)} placeholder="Education, health, public safety..." />
                <Select id="admin-document-type" label="Document type" value={documentForm.documentType} onChange={(event) => updateDocument('documentType', event.target.value)}>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="PUBLIC_NOTICE">Public notice</option>
                  <option value="PRESS_RELEASE">Press release</option>
                  <option value="CIRCULAR">Circular</option>
                  <option value="POLICY">Policy or regulation</option>
                  <option value="FAQ">FAQ</option>
                  <option value="OTHER">Other</option>
                </Select>
                <Textarea id="admin-document-body" label="Official text" rows={7} value={documentForm.bodyText} onChange={(event) => updateDocument('bodyText', event.target.value)} hint="Manual text is required for approval unless a reviewed extraction pipeline supplies it later." />
                <Input id="admin-document-url" label="Official source URL (optional)" type="url" value={documentForm.sourceUrl} onChange={(event) => updateDocument('sourceUrl', event.target.value)} placeholder="https://official-domain.gov.sl/notice" />
                <Button type="submit" loading={documentSubmitting} disabled={documentSubmitting}>
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                  Submit for review
                </Button>
              </form>
            </Card>
          </div>

          <section className="mt-10" aria-labelledby="registered-sources-heading">
            <Card className="p-6 sm:p-8" interactive={false}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="registered-sources-heading" className="font-display text-2xl font-extrabold text-slate-950">Registered source links</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Newest links first. A processing status of <strong>not configured</strong> is an honest operational state, not a failed scrape.</p>
                </div>
                <Badge variant="neutral">{sources.length} shown</Badge>
              </div>
              {sources.length === 0 ? (
                <EmptyState className="mt-6" icon={Link2} title="No source links registered" description="Add an approved institution URL above to record it for future review." />
              ) : (
                <div className="mt-6 divide-y divide-slate-200">
                  {sources.map((source) => (
                    <article key={source.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-slate-900">{source.title || 'Untitled source'}</h3>
                          <Badge variant={statusVariant(source.status)} dot>{statusLabel(source.status)}</Badge>
                          <Badge variant={statusVariant(source.processing_status)}>{statusLabel(source.processing_status)}</Badge>
                        </div>
                        <a href={source.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1 break-all text-sm font-semibold text-guardian-700 underline underline-offset-2 hover:text-guardian-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guardian-500">
                          <span className="truncate">{source.url}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        </a>
                        <p className="mt-2 text-xs text-slate-500">{source.institution_name} · Added {formatDate(source.created_at)}</p>
                        {source.notes ? <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">{source.notes}</p> : null}
                        {source.last_error_code ? <p className="mt-2 text-xs font-semibold text-rose-700">Last error code: {source.last_error_code}</p> : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <Alert tone="info" className="mt-6">
            <span className="flex items-start gap-2 text-xs leading-5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />For review decisions and institution queues, use the <Link to="/official" className="font-bold underline underline-offset-2">Official Information Portal</Link>. This console never publishes citizen reports or bypasses review.</span>
          </Alert>
        </div>
      </div>
    </div>
  );
}
