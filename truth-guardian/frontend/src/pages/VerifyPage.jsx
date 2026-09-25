import { Info, SearchCheck, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { askPublicAssistant, getApiErrorMessage } from '../services/api';
import ContentHint from '../components/ui/ContentHint';
import FileDropzone, { getImageFileFromClipboard } from '../components/ui/FileDropzone';
import PasteButton from '../components/ui/PasteButton';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EvidenceStrength, { VerificationStatus } from '../components/ui/EvidenceStrength';
import SourceCard from '../components/ui/SourceCard';
import { useToast } from '../components/ui/ToastProvider';

export default function VerifyPage() {
  const location = useLocation();
  const { showToast } = useToast();
  const initialFile = location.state?.initialFile || null;
  const [text, setText] = useState(location.state?.initialText || '');
  const [file, setFile] = useState(initialFile);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (nextFile) => {
    setFile(nextFile);
    setResult(null);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);

    if (!text.trim()) {
      setError(file ? 'Enter the claim or message. File analysis is not connected yet.' : 'Enter a claim, message, or URL.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await askPublicAssistant(text.trim());
      setResult(response);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Verification is temporarily unavailable. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const resultStatus = result?.status === 'evidence_found' ? 'evidence_found' : result?.status || 'not_verified';

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="page-shell">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-guardian-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-800">
              <SearchCheck className="h-4 w-4" aria-hidden="true" />
              Public verification
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              What would you like to verify?
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Search a claim against approved, currently valid official records. The result distinguishes evidence found from a claim that could not be verified.
            </p>
          </div>

          <Card className="mt-9 p-5 shadow-soft sm:p-8" interactive={false}>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-7 lg:grid-cols-[1fr_0.42fr]">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <label htmlFor="verification-text" className="text-sm font-extrabold text-slate-900">
                        Message, claim or URL
                      </label>
                      <p className="mt-1 text-sm text-slate-500">Include enough context to understand the claim.</p>
                    </div>
                    <PasteButton
                      onPaste={(value) => {
                        setText(value);
                        setResult(null);
                        setError('');
                        showToast({ message: 'Clipboard text inserted.', type: 'success', duration: 2200 });
                      }}
                      onUnavailable={() => showToast({ message: "Clipboard access isn't available. You can paste manually using Ctrl+V.", type: 'warning' })}
                    />
                  </div>
                  <textarea
                    id="verification-text"
                    value={text}
                    onChange={(event) => {
                      setText(event.target.value);
                      setResult(null);
                      setError('');
                    }}
                    onPaste={(event) => {
                      const image = getImageFileFromClipboard(event.clipboardData);
                      if (image) {
                        event.preventDefault();
                        handleFileChange(image);
                        showToast({ message: 'Screenshot attached locally. File analysis is not connected yet.', type: 'info' });
                      }
                    }}
                    rows="10"
                    placeholder="Paste the exact wording or URL you received..."
                    className="mt-4 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200"
                  />
                  <ContentHint value={text} />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-slate-900">Supporting file</span>
                  <p className="mt-1 text-sm text-slate-500">PNG, JPEG, WebP or PDF, up to 10 MB.</p>
                  <FileDropzone
                    id="verification-file"
                    value={file}
                    onChange={handleFileChange}
                    onError={setError}
                    className="mt-4"
                    label="Drop evidence here"
                    description="Choose a file or paste a screenshot"
                    hint="File analysis will be enabled after private scanning is configured"
                  />
                </div>
              </div>

              {error ? (
                <Alert tone="error" className="mt-5" onDismiss={() => setError('')}>
                  {error}
                </Alert>
              ) : null}

              <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-guardian-700" aria-hidden="true" />
                  No account is required. Citizen reports are not treated as facts.
                </p>
                <Button type="submit" size="lg" loading={submitting} disabled={submitting}>
                  <SearchCheck className="h-5 w-5" aria-hidden="true" />
                  {submitting ? 'Checking approved sources…' : 'Check claim'}
                </Button>
              </div>
            </form>
          </Card>

          {submitting ? (
            <Card className="mt-8 p-6" aria-label="Verification in progress">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-700" role="status">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-guardian-50 text-guardian-700">
                  <span className="h-3 w-3 animate-breathe rounded-full bg-guardian-500" />
                </span>
                Truth Guardian is checking available approved evidence…
              </div>
              <div className="mt-5 space-y-3" aria-hidden="true">
                <div className="skeleton h-4 w-1/3 rounded-full" />
                <div className="skeleton h-4 w-4/5 rounded-full" />
                <div className="skeleton h-4 w-2/3 rounded-full" />
              </div>
            </Card>
          ) : null}

          {result ? (
            <section className="mt-8 animate-fade-up" aria-live="polite">
              <Card className="p-6 shadow-soft sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-700">Evidence result</p>
                    <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-950">
                      {result.status === 'evidence_found' ? 'Approved material found' : 'Could not verify this claim'}
                    </h2>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <VerificationStatus status={resultStatus} />
                    <EvidenceStrength strength={result.evidence_strength} compact />
                  </div>
                </div>
                <p className="mt-4 animate-fade-in text-sm leading-7 text-slate-700" style={{ animationDelay: '80ms' }}>{result.answer}</p>
                {result.evidence?.length ? (
                  <div className="mt-6 animate-fade-up space-y-3" style={{ animationDelay: '140ms' }}>
                    {result.evidence.map((source) => (
                      <SourceCard key={source.id} source={source} />
                    ))}
                  </div>
                ) : (
                  <Alert tone="warning" className="mt-6">
                    No matching approved record is available. This is not a declaration that the claim is false; it means the current registry cannot substantiate it.
                  </Alert>
                )}
                <p className="mt-5 flex animate-fade-in items-start gap-2 text-xs leading-5 text-slate-500" style={{ animationDelay: '220ms' }}>
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {result.limitations}
                </p>
              </Card>
            </section>
          ) : null}

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Card className="p-6" interactive>
              <ShieldCheck className="h-6 w-6 text-guardian-700" aria-hidden="true" />
              <h2 className="mt-4 font-display text-lg font-extrabold">Evidence, not intuition</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Results link to the underlying institution record and show its publication and validity dates.
              </p>
            </Card>
            <Card className="p-6" interactive>
              <Info className="h-6 w-6 text-blue-700" aria-hidden="true" />
              <h2 className="mt-4 font-display text-lg font-extrabold">Uncertainty is explicit</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                If approved evidence is missing or conflicting, Truth Guardian will not manufacture a verdict or citation.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
