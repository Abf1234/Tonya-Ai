import { BadgeCheck, Bell, FileSearch, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import FeaturePage from '../components/FeaturePage';
import { fetchVerifiedInformation, getApiErrorMessage } from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ContentHint from '../components/ui/ContentHint';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import PasteButton from '../components/ui/PasteButton';
import SourceCard from '../components/ui/SourceCard';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';

function formatDate(value) {
  if (!value) return 'Not supplied';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function VerifiedInformationPage() {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDocuments = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchVerifiedInformation({ query: search });
      setDocuments(response.results || []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Verified information is temporarily unavailable.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  return (
    <FeaturePage
      eyebrow="Verified information"
      title="Authoritative public information, made searchable"
      description="Only reviewed, currently valid official records appear here. Citizen reports and unapproved submissions stay in their separate workflow."
      showStatusNotice={false}
    >
      <Card className="p-6 sm:p-8">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadDocuments(query.trim());
          }}
          className="max-w-3xl"
        >
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="verified-search" className="text-sm font-extrabold text-slate-900">Search approved information</label>
            <PasteButton
              onPaste={(value) => {
                setQuery(value);
                showToast({ message: 'Clipboard text inserted into search.', type: 'success', duration: 2200 });
              }}
              onUnavailable={() => showToast({ message: "Clipboard access isn't available. You can paste manually using Ctrl+V.", type: 'warning' })}
            />
          </div>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 focus-within:border-guardian-500 focus-within:ring-2 focus-within:ring-guardian-200">
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              id="verified-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search approved announcements and notices"
              className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <Button type="submit" size="sm" disabled={loading}>Search</Button>
          </div>
          <ContentHint value={query} />
        </form>

        {loading ? (
          <div className="mt-8 space-y-4" role="status" aria-label="Loading approved records">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="p-5" interactive={false}>
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {error ? (
          <ErrorState
            className="mt-8"
            title="Verified information is unavailable"
            message={error}
            onRetry={() => void loadDocuments(query.trim())}
          />
        ) : null}

        {!loading && !error && documents.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon={FileSearch}
            title="No approved record found"
            description="No reviewed official source currently matches this search. Try a shorter phrase or check the original institution."
          />
        ) : null}

        {documents.length ? (
          <div className="mt-8 animate-fade-up space-y-4">
            <p className="text-sm font-bold text-slate-500">{documents.length} approved record{documents.length === 1 ? '' : 's'} found</p>
            {documents.map((document) => (
              <SourceCard
                key={document.id}
                source={{
                  ...document,
                  institution: document.institution_name,
                  excerpt: document.description || document.body_text,
                  source_type: document.document_type,
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 border-t border-slate-200 pt-7 md:grid-cols-3">
          {[
            [BadgeCheck, 'Verified status', 'Only approved records from active, verified institutions are public.'],
            [FileSearch, 'Current versions', 'Expired and superseded records are excluded from search.'],
            [Bell, 'Separate pipelines', 'Citizen fraud reports never become official knowledge automatically.'],
          ].map(([Icon, title, description]) => (
            <div key={title} className="rounded-xl border border-slate-200 p-4">
              <Icon className="h-5 w-5 text-guardian-700" aria-hidden="true" />
              <h2 className="mt-3 font-extrabold">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </Card>
    </FeaturePage>
  );
}
