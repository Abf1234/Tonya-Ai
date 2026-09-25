import { FileText, Image as ImageIcon, RefreshCw, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const defaultAccept = '.png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function matchesAccept(file, accept) {
  const accepted = (accept || defaultAccept)
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return accepted.some((candidate) => {
    if (candidate.startsWith('.')) return name.endsWith(candidate);
    return candidate === type || `${candidate}/*` === type.split('/')[0] + '/*';
  });
}

export function getImageFileFromClipboard(clipboardData) {
  const items = Array.from(clipboardData?.items || []);
  for (const item of items) {
    if (item.kind === 'file' && (item.type || '').startsWith('image/')) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return null;
}

export default function FileDropzone({
  id = 'evidence-file',
  value,
  onChange,
  onError,
  accept = defaultAccept,
  maxBytes = 10 * 1024 * 1024,
  label = 'Drop evidence here',
  description = 'or choose a file from your device',
  hint = 'PNG, JPEG, WebP or PDF · 10 MB maximum',
  disabled = false,
  progress,
  className = '',
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const previewable =
      value &&
      (value.type?.startsWith('image/') || value.type === 'application/pdf' || value.name?.toLowerCase().endsWith('.pdf'));
    if (!previewable || typeof URL === 'undefined' || !URL.createObjectURL || !URL.revokeObjectURL) {
      setPreviewUrl('');
      return undefined;
    }
    const nextUrl = URL.createObjectURL(value);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [value]);

  const selectFile = (file) => {
    if (!file) {
      setLocalError('');
      onChange?.(null);
      return;
    }
    if (file.size === 0) {
      const message = 'The selected file is empty. Choose a non-empty evidence file.';
      setLocalError(message);
      onError?.(message);
      return;
    }
    if (!matchesAccept(file, accept)) {
      const message = 'Use a PNG, JPEG, WebP image or a PDF document.';
      setLocalError(message);
      onError?.(message);
      return;
    }
    if (file.size > maxBytes) {
      const message = `The selected file is larger than the ${formatBytes(maxBytes)} limit.`;
      setLocalError(message);
      onError?.(message);
      return;
    }
    setLocalError('');
    onError?.('');
    onChange?.(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) selectFile(event.dataTransfer.files?.[0] || null);
  };

  const handlePaste = (event) => {
    const image = getImageFileFromClipboard(event.clipboardData);
    if (image && !disabled) {
      event.preventDefault();
      selectFile(image);
    }
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const isImage = value?.type?.startsWith('image/');
  const isPdf = value?.type === 'application/pdf' || value?.name?.toLowerCase().endsWith('.pdf');

  return (
    <div className={className}>
      <div
        className={`group relative overflow-hidden rounded-2xl border-2 border-dashed transition-[background-color,border-color,box-shadow] duration-200 ${
          dragging
            ? 'border-guardian-500 bg-guardian-50 shadow-[0_0_0_4px_rgba(37,170,148,0.12)]'
            : value
              ? 'border-slate-300 bg-slate-50'
              : 'border-slate-300 bg-white hover:border-guardian-400 hover:bg-guardian-50/50'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setDragging(false);
        }}
        onDrop={handleDrop}
        onPaste={handlePaste}
        aria-describedby={!value ? `${id}-hint` : undefined}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="sr-only"
          accept={accept}
          disabled={disabled}
          aria-label="Choose evidence file"
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            selectFile(event.target.files?.[0] || null);
            event.target.value = '';
          }}
        />

        {value ? (
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-guardian-700">
                {isImage && previewUrl ? (
                  <img src={previewUrl} alt="Selected evidence preview" className="h-full w-full object-cover" />
                ) : isPdf ? (
                  <FileText className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <ImageIcon className="h-6 w-6" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-900">{value.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{formatBytes(value.size)}</p>
                <p className="mt-1 text-xs text-slate-500">Selected locally · server processing is shown by the service</p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  selectFile(null);
                }}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guardian-500"
                aria-label="Remove selected file"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {isPdf && previewUrl ? (
              <iframe
                title="PDF evidence preview"
                src={previewUrl}
                className="mt-4 h-48 w-full rounded-xl border border-slate-200 bg-white"
              />
            ) : null}
            {isImage && previewUrl ? (
              <img src={previewUrl} alt="Evidence preview" className="mt-4 max-h-64 w-full rounded-xl border border-slate-200 object-contain" />
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openPicker();
                }}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-extrabold text-slate-700 hover:border-guardian-300 hover:text-guardian-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guardian-500"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Replace file
              </button>
            </div>
            {typeof progress === 'number' ? (
              <div
                className="mt-4"
                role="progressbar"
                aria-label="Upload progress"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={Math.max(0, Math.min(100, Math.round(progress)))}
              >
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Uploading</span>
                  <span>{Math.max(0, Math.min(100, Math.round(progress)))}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-guardian-600 transition-[width] duration-200"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled}
            className="w-full px-5 py-8 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-guardian-500 disabled:cursor-not-allowed sm:px-8 sm:py-10"
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-guardian-50 text-guardian-700 transition-transform group-hover:scale-105 motion-reduce:group-hover:scale-100">
              <Upload className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="mt-4 block text-sm font-extrabold text-slate-900">{label}</span>
            <span className="mt-1 block text-sm text-slate-500">{description}</span>
            <span id={`${id}-hint`} className="mt-3 block text-xs font-semibold text-slate-400">{hint}</span>
          </button>
        )}
      </div>
      {localError ? <p className="mt-2 text-xs font-bold text-rose-700" role="alert">{localError}</p> : null}
    </div>
  );
}
