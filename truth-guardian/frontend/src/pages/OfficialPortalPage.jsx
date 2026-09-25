import { CheckCircle2, FileText, Landmark, LogIn, Send, Settings2, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import api, { getApiErrorMessage, withAppwriteAuth } from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import PasteButton from '../components/ui/PasteButton';
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';
import Textarea from '../components/ui/Textarea';
import { useToast } from '../components/ui/ToastProvider';

const initialForm = {
  title: '',
  description: '',
  bodyText: '',
  category: '',
  documentType: 'ANNOUNCEMENT',
  sourceUrl: '',
  institutionId: '',
};

function statusVariant(status) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'PENDING_REVIEW') return 'warning';
  return 'neutral';
}

export default function OfficialPortalPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const mountedRef = useRef(true);
  const userKey = user?.$id || user?.id;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPortal = useCallback(async (signal) => {
    if (!userKey) return;
    setLoading(true);
    setAccessDenied(false);
    setError('');

    const [documentResult, institutionResult, dashboardResult] = await Promise.allSettled([
      api.get('/official/documents/', withAppwriteAuth({ signal })),
      api.get('/official/institutions/', withAppwriteAuth({ signal })),
      api.get('/official/dashboard/', withAppwriteAuth({ signal })),
    ]);
    if (!mountedRef.current || signal?.aborted) return;

    const errors = [];
    let denied = false;
    const handleRejected = (result, fallback) => {
      if (result.status === 'rejected') {
        if (result.reason?.code === 'ERR_CANCELED' || result.reason?.name === 'AbortError') return;
        if ([401, 403].includes(result.reason?.response?.status)) denied = true;
        errors.push(getApiErrorMessage(result.reason, fallback));
      }
    };

    if (documentResult.status === 'fulfilled') setDocuments(documentResult.value.data.results || []);
    else handleRejected(documentResult, 'Your submissions could not be loaded.');
    if (institutionResult.status === 'fulfilled') {
      const results = institutionResult.value.data.results || [];
      setInstitutions(results);
      if (results.length === 1) {
        setForm((current) => ({ ...current, institutionId: current.institutionId || String(results[0].id) }));
      }
    } else handleRejected(institutionResult, 'Institution options could not be loaded.');
    if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value.data);
    else handleRejected(dashboardResult, 'Portal metrics could not be loaded.');

    setAccessDenied(denied && documentResult.status === 'rejected' && institutionResult.status === 'rejected');
    if (errors.length) setError(errors.join(' '));
    setLoading(false);
  }, [userKey]);

  useEffect(() => {
    if (!userKey) {
      setDocuments([]);
      setInstitutions([]);
      setDashboard(null);
      setAccessDenied(false);
      setError('');
      return undefined;
    }
    const controller = new AbortController();
    void loadPortal(controller.signal);
    return () => controller.abort();
  }, [loadPortal, userKey]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setNotice('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!form.title.trim() || !form.category.trim()) {
      setError('Title and category are required.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      body_text: form.bodyText.trim(),
      category: form.category.trim(),
      document_type: form.documentType,
      source_url: form.sourceUrl.trim(),
    };
    if (form.institutionId) payload.institution_id = Number(form.institutionId);

    setSubmitting(true);
    try {
      const response = await api.post('/official/documents/', payload, withAppwriteAuth());
      setDocuments((current) => [response.data, ...current]);
      setForm((current) => ({ ...initialForm, institutionId: current.institutionId }));
      setNotice('Submitted for authorized review. It is not public until approved.');
      showToast({ message: 'Document submitted for authorized review.', type: 'success' });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'The document could not be submitted.'));
    } finally {
      setSubmitting(false);
    }
  };

  const review = async (documentId, action, reason = '') => {
    if (reviewingId) return;
    if (action === 'reject' && !reason.trim()) {
      setRejectingId(documentId);
      setRejectionReason('');
      return;
    }
    setError('');
    setNotice('');
    setReviewingId(documentId);
    try {
      const response = await api.post(
        `/official/documents/review/${documentId}/`,
        { action, ...(action === 'reject' ? { reason: reason.trim() } : {}) },
        withAppwriteAuth(),
      );
      setDocuments((current) => current.map((item) => (item.id === documentId ? response.data : item)));
      setNotice(action === 'approve' ? 'Document approved and published.' : 'Document rejected.');
      showToast({ message: action === 'approve' ? 'Document approved.' : 'Document rejected.', type: action === 'approve' ? 'success' : 'info' });
      setRejectingId(null);
      setRejectionReason('');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'The review action could not be completed.'));
    } finally {
      setReviewingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="bg-slate-50 py-20">
        <div className="page-shell mx-auto max-w-3xl">
          <Card className="p-6 sm:p-8" aria-label="Checking account">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-10 w-3/4" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-slate-50 py-16">
        <div className="page-shell">
          <Card className="mx-auto max-w-2xl p-8 text-center shadow-soft sm:p-12">
            <Landmark className="mx-auto h-10 w-10 text-guardian-700" aria-hidden="true" />
            <h1 className="mt-5 font-display text-3xl font-extrabold text-slate-950">Official Information Portal</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              This area is for manually approved government or organization representatives. Your Appwrite account must be linked to an approved institution and role by an administrator.
            </p>
            <Button as={Link} to="/login?next=/official" size="lg" className="mt-7">
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
            <ShieldCheck className="mx-auto h-10 w-10 text-amber-600" aria-hidden="true" />
            <h1 className="mt-5 font-display text-3xl font-extrabold text-slate-950">Portal access is not approved</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Your account is signed in, but it is not linked to an approved institution and role. Ask an administrator to complete the server-side approval record.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button type="button" onClick={() => void loadPortal()}>Try again</Button>
              <Button as={Link} to="/account" variant="secondary">View account</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const canReview = dashboard?.permissions?.can_review === true;

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="page-shell">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-guardian-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-800">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Authorized portal
              </div>
              <h1 className="mt-4 font-display text-4xl font-extrabold text-slate-950">Official Information Portal</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Submit authoritative material for review. Submissions remain private and unpublished until an authorized reviewer approves them.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {dashboard?.permissions?.is_platform_admin ? (
                <Button as={Link} to="/admin" variant="secondary">
                  <Settings2 className="h-4 w-4" aria-hidden="true" />
                  Admin console
                </Button>
              ) : null}
              {dashboard ? (
                <Card className="min-w-36 p-4 text-right" interactive={false}>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Review queue</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-950">{dashboard.documents?.pending_review ?? 0}</p>
                  <p className="text-xs text-slate-500">pending documents</p>
                </Card>
              ) : null}
            </div>
          </div>

          {error ? <Alert tone="error" className="mt-6" onDismiss={() => setError('')}>{error}</Alert> : null}
          {notice ? <Alert tone="success" className="mt-6" onDismiss={() => setNotice('')}>{notice}</Alert> : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="p-6 sm:p-8" interactive={false}>
              <h2 className="font-display text-2xl font-extrabold text-slate-950">Submit official information</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Manual text is stored for review. URL extraction and file OCR remain disabled until configured.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Input id="official-title" label="Title" required value={form.title} onChange={(event) => updateField('title', event.target.value)} />
                <Input id="official-category" label="Category" required value={form.category} onChange={(event) => updateField('category', event.target.value)} placeholder="Education, health, public safety..." />
                <Select id="official-type" label="Document type" value={form.documentType} onChange={(event) => updateField('documentType', event.target.value)}>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="PRESS_RELEASE">Press release</option>
                  <option value="CIRCULAR">Circular</option>
                  <option value="POLICY">Policy or regulation</option>
                  <option value="PUBLIC_NOTICE">Public notice</option>
                  <option value="FAQ">FAQ</option>
                  <option value="OFFICIAL_STATEMENT">Official statement</option>
                  <option value="OTHER">Other</option>
                </Select>
                {institutions.length > 1 ? (
                  <Select id="official-institution" label="Institution" value={form.institutionId} onChange={(event) => updateField('institutionId', event.target.value)}>
                    <option value="">Select institution</option>
                    {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
                  </Select>
                ) : null}
                <Textarea id="official-description" label="Description" rows={3} value={form.description} onChange={(event) => updateField('description', event.target.value)} />
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="official-body" className="text-sm font-extrabold text-slate-900">Official text</label>
                    <PasteButton
                      onPaste={(value) => updateField('bodyText', value)}
                      onUnavailable={() => showToast({ message: "Clipboard access isn't available. You can paste manually using Ctrl+V.", type: 'warning' })}
                    />
                  </div>
                  <textarea
                    id="official-body"
                    rows={8}
                    value={form.bodyText}
                    onChange={(event) => updateField('bodyText', event.target.value)}
                    placeholder="Paste the approved text or the text that should be reviewed..."
                    className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200"
                  />
                </div>
                <Input id="official-url" label="Official source URL (optional)" type="url" value={form.sourceUrl} onChange={(event) => updateField('sourceUrl', event.target.value)} placeholder="https://official-domain.gov.sl/notice" />
                <Button type="submit" size="lg" loading={submitting} disabled={submitting}>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {submitting ? 'Submitting…' : 'Submit for review'}
                </Button>
              </form>
            </Card>

            <Card className="p-6 sm:p-8" interactive={false}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-extrabold text-slate-950">
                   {canReview ? 'Submissions and review queue' : 'My submissions'}
                 </h2>
                <Badge variant="neutral">{documents.length}</Badge>
              </div>
              {loading ? (
                <div className="mt-6 space-y-3" role="status" aria-label="Loading submissions">
                  {[1, 2].map((item) => <Skeleton key={item} className="h-24 w-full" />)}
                </div>
              ) : null}
              {!loading && documents.length === 0 ? (
                <EmptyState className="mt-6" icon={FileText} title="No submissions yet" description={canReview ? 'The scoped review queue is empty.' : 'Approved public information will appear here after an authorized review.'} />
              ) : null}
              <div className="mt-6 space-y-3">
                {documents.map((document) => (
                  <article key={document.id} className="rounded-2xl border border-slate-200 p-4 transition-[border-color,box-shadow] hover:border-guardian-300 hover:shadow-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900">{document.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">{document.institution_name} · v{document.version_number}</p>
                      </div>
                      <Badge variant={statusVariant(document.status)} dot>{String(document.status || 'UNKNOWN').replaceAll('_', ' ').toLowerCase()}</Badge>
                    </div>
                    {document.status === 'PENDING_REVIEW' && canReview ? (
                      rejectingId === document.id ? (
                        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
                          <Textarea
                            id={`reject-reason-${document.id}`}
                            label="Reason for rejection"
                            rows={3}
                            maxLength={4000}
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            hint="This reason is visible to the submitting official and is required."
                          />
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              loading={reviewingId === document.id}
                              disabled={Boolean(reviewingId)}
                              onClick={() => review(document.id, 'reject', rejectionReason)}
                            >
                              Confirm rejection
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={Boolean(reviewingId)}
                              onClick={() => {
                                setRejectingId(null);
                                setRejectionReason('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" loading={reviewingId === document.id} disabled={Boolean(reviewingId)} onClick={() => review(document.id, 'approve')}>
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Approve
                          </Button>
                          <Button variant="dangerSoft" size="sm" disabled={Boolean(reviewingId)} onClick={() => review(document.id, 'reject')}>
                            Reject
                          </Button>
                        </div>
                      )
                    ) : document.status === 'PENDING_REVIEW' ? (
                      <p className="mt-4 text-xs font-semibold text-amber-800">Pending authorized review.</p>
                    ) : null}
                  </article>
                ))}
              </div>
              <Alert tone="warning" className="mt-6">
                <span className="flex items-start gap-2 text-xs leading-5"><FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Only authorized reviewers can approve content. Approval never bypasses missing text extraction, expiry checks, or source validation.</span>
              </Alert>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
