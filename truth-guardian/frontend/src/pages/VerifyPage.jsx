import { FileText, Info, Link2, SearchCheck, ShieldCheck, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
const maximumFileSize = 5 * 1024 * 1024;

export default function VerifyPage() {
  const location = useLocation();
  const fileInput = useRef(null);
  const initialFile = location.state?.initialFile || null;
  const [text, setText] = useState(location.state?.initialText || '');
  const [file, setFile] = useState(initialFile);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fileSummary = useMemo(() => {
    if (!file) return null;
    return `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }, [file]);

  const selectFile = (selectedFile) => {
    setNotice('');
    setError('');

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!acceptedTypes.includes(selectedFile.type)) {
      setError('Use a PNG, JPEG, WebP image or a PDF document.');
      setFile(null);
      return;
    }

    if (selectedFile.size > maximumFileSize) {
      setError('The selected file is larger than the 5 MB foundation limit.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!text.trim() && !file) {
      setError('Enter a claim, message, URL, or choose a supported file.');
      return;
    }

    setNotice(
      'The Phase 1 workspace received your selection, but no content was uploaded and no AI provider was called. Verification processing will be connected in a later phase.',
    );
  };

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="page-shell">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-guardian-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-800">
              <SearchCheck className="h-4 w-4" aria-hidden="true" />
              Verification workspace
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              What would you like to verify?
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Submit a message, claim, URL, screenshot or supported document. Serious claims will
              require evidence review and may require human approval.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-9 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-8">
            <div className="grid gap-7 lg:grid-cols-[1fr_0.42fr]">
              <div>
                <label htmlFor="verification-text" className="text-sm font-extrabold text-slate-900">
                  Message, claim or URL
                </label>
                <p className="mt-1 text-sm text-slate-500">Include enough context to understand the claim.</p>
                <textarea
                  id="verification-text"
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    setNotice('');
                  }}
                  rows="10"
                  placeholder="Paste the exact wording or URL you received..."
                  className="mt-4 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200"
                />
              </div>
              <div>
                <span className="text-sm font-extrabold text-slate-900">Supporting file</span>
                <p className="mt-1 text-sm text-slate-500">PNG, JPEG, WebP or PDF, up to 5 MB.</p>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="mt-4 flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-guardian-400 hover:bg-guardian-50"
                >
                  <Upload className="h-7 w-7 text-guardian-700" aria-hidden="true" />
                  <span className="mt-3 text-sm font-extrabold text-slate-800">Choose a file</span>
                  <span className="mt-1 text-xs text-slate-500">or take a clear screenshot</span>
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  className="sr-only"
                  accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(event) => selectFile(event.target.files?.[0] || null)}
                />
                {fileSummary ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-guardian-50 p-3 text-left">
                    <div className="min-w-0">
                      <FileText className="mb-1 h-4 w-4 text-guardian-700" aria-hidden="true" />
                      <p className="truncate text-xs font-bold text-guardian-900">{file.name}</p>
                      <p className="mt-0.5 text-xs text-guardian-700">{fileSummary.split(' · ')[1]}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInput.current) fileInput.current.value = '';
                      }}
                      className="rounded-md p-1 text-guardian-800 hover:bg-guardian-100"
                      aria-label="Remove selected file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {error ? (
              <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800" role="alert">
                {error}
              </p>
            ) : null}
            {notice ? (
              <div className="mt-5 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900" role="status">
                <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                {notice}
              </div>
            ) : null}

            <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
                <ShieldCheck className="h-4 w-4 shrink-0 text-guardian-700" aria-hidden="true" />
                Personal information should not be included unless necessary.
              </p>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-guardian-800 px-6 py-3 text-sm font-extrabold text-white hover:bg-guardian-900"
              >
                <SearchCheck className="h-5 w-5" aria-hidden="true" />
                Check submission
              </button>
            </div>
          </form>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <Link2 className="h-6 w-6 text-blue-700" aria-hidden="true" />
              <h2 className="mt-4 font-display text-lg font-extrabold">Planned result statuses</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The final interface will distinguish official confirmation, support, uncertainty,
                disputes, misleading content, scams and review—not only true or false.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <ShieldCheck className="h-6 w-6 text-guardian-700" aria-hidden="true" />
              <h2 className="mt-4 font-display text-lg font-extrabold">Evidence, not intuition</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Every future assessment must show evidence strength, an explanation, source links
                and relevant uncertainty.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <strong>Foundation limitation:</strong> this page intentionally does not call an AI
            provider, scrape a website, perform OCR, or save a verification record. Those services
            must be implemented and tested before they are presented as operational.
          </div>
        </div>
      </div>
    </div>
  );
}
