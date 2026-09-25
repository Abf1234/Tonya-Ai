import { CheckCircle2, FileLock2, Flag, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import FeaturePage from '../components/FeaturePage';
import { createIdempotencyKey, getApiErrorMessage, submitFraudReport } from '../services/api';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ContentHint from '../components/ui/ContentHint';
import CopyButton from '../components/ui/CopyButton';
import FileDropzone, { getImageFileFromClipboard } from '../components/ui/FileDropzone';
import PasteButton from '../components/ui/PasteButton';
import { useToast } from '../components/ui/ToastProvider';

const categories = [
  'Fraud',
  'Phishing',
  'Impersonation',
  'Fake Government Announcement',
  'Fake Scholarship',
  'Fake Recruitment',
  'Fake Investment',
  'Mobile Money Fraud',
  'Social Media Scam',
  'Misinformation',
  'Other',
];

const initialForm = {
  claim: '',
  description: '',
  category: 'Fraud',
  contactEmail: '',
  contactPhone: '',
};

export default function ReportPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [evidence, setEvidence] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const submittingRef = useRef(false);
  const idempotencyKeyRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const invalidateIdempotencyKey = () => {
    idempotencyKeyRef.current = null;
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    invalidateIdempotencyKey();
    setError('');
  };

  const handleEvidenceChange = (file) => {
    setEvidence(file);
    invalidateIdempotencyKey();
    setError('');
  };

  const handleAnonymousChange = (checked) => {
    setIsAnonymous(checked);
    invalidateIdempotencyKey();
    setError('');
    if (checked) {
      setForm((current) => ({ ...current, contactEmail: '', contactPhone: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    setError('');
    setReceipt(null);

    if (!form.claim.trim()) {
      setError('Enter the suspicious message or claim.');
      return;
    }

    const payload = new FormData();
    payload.append('claim', form.claim.trim());
    payload.append('description', form.description.trim());
    payload.append('category', form.category);
    payload.append('is_anonymous', String(isAnonymous));
    if (!isAnonymous) {
      if (form.contactEmail.trim()) payload.append('contact_email', form.contactEmail.trim());
      if (form.contactPhone.trim()) payload.append('contact_phone', form.contactPhone.trim());
    }
    if (evidence) payload.append('evidence', evidence);

    submittingRef.current = true;
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = createIdempotencyKey();
    setSubmitting(true);
    setUploadProgress(evidence ? 0 : null);
    try {
      const result = await submitFraudReport(payload, {
        idempotencyKey: idempotencyKeyRef.current,
        onUploadProgress: (event) => {
          if (event.total && mountedRef.current) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      });
      if (!mountedRef.current) return;
      setUploadProgress(100);
      setReceipt(result);
      idempotencyKeyRef.current = null;
      setForm(initialForm);
      setIsAnonymous(false);
      setEvidence(null);
      showToast({ message: 'Report received. Keep your reference number private.', type: 'success' });
    } catch (requestError) {
      if (!mountedRef.current) return;
      setUploadProgress(null);
      setError(getApiErrorMessage(requestError, 'We could not submit the report. Please try again.'));
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  };

  const pasteUnavailable = () => {
    showToast({ message: "Clipboard access isn't available. You can paste manually using Ctrl+V.", type: 'warning' });
  };

  return (
    <FeaturePage
      eyebrow="Public reporting hub"
      title="Report fraud or suspicious information"
      description="You do not need an account to submit a report. PostgreSQL records the report first; optional private evidence processing and operational synchronization remain disabled until their server-side safety controls are configured."
      showStatusNotice={false}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6 sm:p-8" interactive={false}>
          {receipt ? (
            <div className="animate-scale-in rounded-2xl border border-emerald-200 bg-emerald-50 p-6" role="status">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-emerald-950">Report received</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-900">{receipt.message}</p>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-800">Your reference</p>
              <p className="mt-1 break-all font-mono text-3xl font-extrabold tracking-wider text-emerald-950">{receipt.report_id}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <CopyButton
                  value={receipt.report_id}
                  label="Copy reference"
                  copiedLabel="Reference copied"
                  onSuccess={() => showToast({ message: 'Reference copied to your clipboard.', type: 'success', duration: 2200 })}
                  onError={pasteUnavailable}
                />
                <Button variant="secondary" size="sm" onClick={() => {
                   invalidateIdempotencyKey();
                   setUploadProgress(null);
                   setReceipt(null);
                 }}>
                  Submit another report
                </Button>
                <Button as={Link} to="/" variant="ghost" size="sm">
                  Return home
                </Button>
              </div>
              <p className="mt-5 text-xs leading-5 text-emerald-800">
                Evidence status: {receipt.evidence_processing_status?.replaceAll('_', ' ').toLowerCase() || 'not configured'}. Keep this reference private.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <Flag className="h-7 w-7 text-rose-700" aria-hidden="true" />
              <h2 className="mt-4 font-display text-2xl font-extrabold">Tell us what happened</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Do not include passwords, PINs, one-time codes, or unnecessary personal information.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="report-claim" className="text-sm font-extrabold text-slate-900">
                      Suspicious message or claim
                    </label>
                    <PasteButton onPaste={(value) => updateField('claim', value)} onUnavailable={pasteUnavailable} />
                  </div>
                  <textarea
                    id="report-claim"
                    required
                    value={form.claim}
                    onChange={(event) => updateField('claim', event.target.value)}
                    onPaste={(event) => {
                      const image = getImageFileFromClipboard(event.clipboardData);
                      if (image) {
                        event.preventDefault();
                        handleEvidenceChange(image);
                        showToast({ message: 'Screenshot attached locally. Review the evidence status before submitting.', type: 'info' });
                      }
                    }}
                    rows="5"
                    placeholder="Paste the exact message, claim, or URL..."
                    className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200"
                  />
                  <ContentHint value={form.claim} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="report-description" className="text-sm font-extrabold text-slate-900">
                      What should investigators know? <span className="font-normal text-slate-500">(optional)</span>
                    </label>
                    <PasteButton onPaste={(value) => updateField('description', value)} onUnavailable={pasteUnavailable} />
                  </div>
                  <textarea
                    id="report-description"
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    rows="4"
                    placeholder="Describe what happened, how you were contacted, and what action was requested..."
                    className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200"
                  />
                </div>

                <div>
                  <label htmlFor="report-category" className="text-sm font-extrabold text-slate-900">Category</label>
                  <select
                    id="report-category"
                    value={form.category}
                    onChange={(event) => updateField('category', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200"
                  >
                    {categories.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </div>

                <div>
                  <span className="text-sm font-extrabold text-slate-900">Private evidence <span className="font-normal text-slate-500">(optional)</span></span>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Drop, choose, or paste a screenshot. Files are selected locally; server processing remains unavailable until scanning and private Storage are configured.
                  </p>
                  <FileDropzone
                    id="report-evidence"
                    value={evidence}
                    onChange={handleEvidenceChange}
                    onError={setError}
                    className="mt-3"
                    progress={uploadProgress ?? undefined}
                    label="Drop evidence here"
                    description="or choose a file"
                    hint="PNG, JPEG, WebP or PDF · 10 MB maximum"
                  />
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm transition-colors hover:border-guardian-300">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(event) => handleAnonymousChange(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-guardian-700 focus:ring-guardian-500"
                  />
                  <span>
                    <strong className="text-slate-900">Submit anonymously</strong>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">
                      Anonymous reports do not require a name, phone number, or email. Do not include identifying details in the description.
                    </span>
                  </span>
                </label>

                {!isAnonymous ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="report-email" className="text-sm font-extrabold text-slate-900">Email <span className="font-normal text-slate-500">(optional)</span></label>
                      <input id="report-email" type="email" autoComplete="email" value={form.contactEmail} onChange={(event) => updateField('contactEmail', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200" />
                    </div>
                    <div>
                      <label htmlFor="report-phone" className="text-sm font-extrabold text-slate-900">Phone <span className="font-normal text-slate-500">(optional)</span></label>
                      <input id="report-phone" type="tel" autoComplete="tel" value={form.contactPhone} onChange={(event) => updateField('contactPhone', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200" />
                    </div>
                  </div>
                ) : null}
              </div>

              {error ? <Alert tone="error" className="mt-5" onDismiss={() => setError('')}>{error}</Alert> : null}

              <Button type="submit" size="lg" loading={submitting} disabled={submitting} className="mt-7 w-full sm:w-auto">
                <Flag className="h-5 w-5" aria-hidden="true" />
                {submitting ? 'Submitting securely…' : 'Submit report'}
              </Button>
              <p className="mt-3 text-xs leading-5 text-slate-500">Submitting is disabled while your report is being sent to prevent duplicate submissions.</p>
            </form>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-6" interactive>
            <FileLock2 className="h-6 w-6 text-guardian-700" aria-hidden="true" />
            <h2 className="mt-3 font-extrabold">Your privacy matters</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A report reference is returned without publishing your identity or contact details. Evidence files never receive a public URL.
            </p>
          </Card>
          <Card className="p-6" interactive>
            <ShieldCheck className="h-6 w-6 text-blue-700" aria-hidden="true" />
            <h2 className="mt-3 font-extrabold">What happens next</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The report is stored in PostgreSQL for authorized review. Appwrite Storage and Google Sheets synchronization remain separately marked as not configured until credentials and workers are available.
            </p>
          </Card>
          <Card tone="dark" className="p-6" interactive={false}>
            <h2 className="font-extrabold">Do not send secrets</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Never submit a password, PIN, one-time code, or full payment-card number. Redact screenshots when possible.
            </p>
          </Card>
        </div>
      </div>
    </FeaturePage>
  );
}
