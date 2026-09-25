import { Bot, Info, Languages, Send, ShieldCheck, Sparkles, Square, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { askPublicAssistant, getApiErrorMessage } from '../services/api';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ContentHint from '../components/ui/ContentHint';
import CopyButton from '../components/ui/CopyButton';
import EvidenceStrength from '../components/ui/EvidenceStrength';
import PasteButton from '../components/ui/PasteButton';
import SourceCard from '../components/ui/SourceCard';
import { useToast } from '../components/ui/ToastProvider';

const languageOptions = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'krio', label: 'Krio' },
  { value: 'mende', label: 'Mende' },
  { value: 'temne', label: 'Temne' },
  { value: 'limba', label: 'Limba' },
];

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hello. Ask about a government announcement, scholarship, recruitment notice, or suspicious message. Truth Guardian searches approved official records without requiring an account. If the optional language model is enabled, it can explain the evidence in your selected language; it never decides whether a claim is true.',
  evidence: [],
  status: 'welcome',
};

const assistantStatusLabels = {
  grounded: 'AI-assisted wording grounded in approved excerpts',
  disabled: 'Optional language model disabled; deterministic lookup used',
  not_configured: 'Optional language model not configured; deterministic lookup used',
  unavailable: 'Optional language model unavailable; deterministic lookup used',
  not_needed: 'Deterministic approved-source lookup used',
};

function validateAssistantResponse(response) {
  if (
    !response
    || typeof response.answer !== 'string'
    || !Array.isArray(response.evidence)
  ) {
    throw new Error('The assistant returned an invalid response.');
  }
  return response;
}

export default function ChatPage() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState([welcomeMessage]);
  const [draft, setDraft] = useState('');
  const [language, setLanguage] = useState('auto');
  const [submitting, setSubmitting] = useState(false);
  const nextId = useRef(1);
  const requestController = useRef(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestController.current?.abort();
    };
  }, []);

  const sendQuestion = async (question) => {
    const trimmed = question.trim();
    if (!trimmed || submittingRef.current) return;

    const questionId = nextId.current++;
    setMessages((current) => [
      ...current,
      { id: `question-${questionId}`, role: 'user', content: trimmed },
    ]);
    setDraft('');
    submittingRef.current = true;
    setSubmitting(true);
    const controller = new AbortController();
    requestController.current = controller;

    try {
      const response = validateAssistantResponse(await askPublicAssistant(trimmed, {
        signal: controller.signal,
        language,
      }));
      if (!mountedRef.current) return;
      setMessages((current) => [
        ...current,
        {
          id: `answer-${questionId}`,
          role: 'assistant',
          content: response.answer,
          evidence: response.evidence || [],
          evidenceStrength: response.evidence_strength,
          limitations: response.limitations,
          aiGenerated: response.ai_generated === true,
          aiStatus: response.ai_status,
          language: response.language || language,
        },
      ]);
    } catch (requestError) {
      if (!mountedRef.current) return;
      if (controller.signal.aborted) {
        setMessages((current) => [
          ...current,
          {
            id: `stopped-${questionId}`,
            role: 'assistant',
            content: 'The search was stopped. No answer was added.',
            evidence: [],
            isMuted: true,
          },
        ]);
      } else {
        setMessages((current) => [
          ...current,
          {
            id: `error-${questionId}`,
            role: 'assistant',
            content: getApiErrorMessage(requestError, 'The evidence assistant is temporarily unavailable.'),
            evidence: [],
            isError: true,
          },
        ]);
      }
    } finally {
      if (requestController.current === controller) requestController.current = null;
      submittingRef.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    void sendQuestion(draft);
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent?.isComposing) {
      event.preventDefault();
      void sendQuestion(draft);
    }
  };

  const stopSearch = () => {
    requestController.current?.abort();
  };

  return (
    <div className="min-h-[calc(100vh-18rem)] bg-slate-100 py-8 sm:py-12">
      <div className="page-shell">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-guardian-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-800">
              <Bot className="h-4 w-4" aria-hidden="true" />
              Truth Guardian
            </div>
            <h1 className="mt-4 font-display text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Ask before you trust or share
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              The assistant searches approved, currently valid official records. It will say when evidence is unavailable rather than inventing an answer.
            </p>
          </div>

          <Card className="overflow-hidden p-0 shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-guardian-950 px-5 py-4 text-white">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-guardian-400/15">
                  <ShieldCheck className="h-5 w-5 text-guardian-300" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">Truth Guardian Assistant</p>
                  <p className="truncate text-xs text-guardian-200">Public evidence lookup · No login required</p>
                </div>
              </div>
              <span className="hidden rounded-full bg-guardian-400/15 px-3 py-1 text-xs font-bold text-guardian-200 sm:inline-flex">
                Approved sources only
              </span>
            </div>

            <div className="min-h-[420px] space-y-5 bg-slate-50 p-4 sm:p-7" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-guardian-100 text-guardian-800">
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-sm bg-guardian-800 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'} ${message.isError ? 'border-rose-200 bg-rose-50 text-rose-900' : ''} ${message.isMuted ? 'border-slate-200 bg-slate-100 text-slate-600' : ''}`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.aiStatus && message.id !== 'welcome' ? (
                      <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-guardian-700">
                        {message.aiGenerated ? (
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span>
                          {message.aiGenerated
                            ? 'AI-assisted wording · check the source cards'
                            : assistantStatusLabels[message.aiStatus] || 'Approved-source lookup used'}
                        </span>
                      </p>
                    ) : null}
                    {message.evidenceStrength ? (
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <EvidenceStrength strength={message.evidenceStrength} compact />
                      </div>
                    ) : null}
                    {message.evidence?.length ? (
                      <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                        {message.evidence.map((source) => (
                          <SourceCard key={source.id} source={source} compact />
                        ))}
                      </div>
                    ) : null}
                    {message.limitations ? <p className="mt-3 text-xs leading-5 text-slate-500">{message.limitations}</p> : null}
                    {message.role === 'assistant' && !message.isError && message.id !== 'welcome' ? (
                      <div className="mt-3 flex justify-end border-t border-slate-200 pt-2">
                        <CopyButton
                          value={message.content}
                          label="Copy response"
                          copiedLabel="Response copied"
                          onSuccess={() => showToast({ message: 'Response copied to your clipboard.', type: 'success', duration: 2200 })}
                          onError={() => showToast({ message: "Clipboard access isn't available. You can paste manually using Ctrl+V.", type: 'warning' })}
                        />
                      </div>
                    ) : null}
                  </div>
                  {message.role === 'user' ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                </div>
              ))}
              {submitting ? (
                <div className="flex items-center gap-3 rounded-2xl border border-guardian-100 bg-white p-4 text-sm text-slate-600 shadow-sm" role="status">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-guardian-50 text-guardian-700">
                    <span className="flex gap-1" aria-hidden="true">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-guardian-500 [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-guardian-500 [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-guardian-500" />
                    </span>
                  </span>
                  <span>Truth Guardian is checking available evidence…</span>
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <label htmlFor="guardian-question" className="text-sm font-extrabold text-slate-900">Ask a question</label>
                <div className="flex items-center gap-2">
                  <label htmlFor="guardian-language" className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                    Reply
                  </label>
                  <select
                    id="guardian-language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200"
                    aria-label="Response language"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <PasteButton
                    onPaste={(value) => {
                      setDraft(value);
                      showToast({ message: 'Clipboard text inserted.', type: 'success', duration: 2200 });
                    }}
                    onUnavailable={() => showToast({ message: "Clipboard access isn't available. You can paste manually using Ctrl+V.", type: 'warning' })}
                  />
                </div>
              </div>
              <div className="flex items-end gap-2 sm:gap-3">
                <textarea
                  id="guardian-question"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  rows="2"
                  placeholder="Example: Is this scholarship announcement real?"
                  className="min-h-12 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200"
                />
                {submitting ? (
                  <Button variant="dangerSoft" size="icon" onClick={stopSearch} aria-label="Stop searching">
                    <Square className="h-4 w-4 fill-current" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send question">
                    <Send className="h-5 w-5" aria-hidden="true" />
                  </Button>
                )}
              </div>
              <ContentHint value={draft} />
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Press Enter to send or Shift+Enter for a new line. Approved records are not a guarantee that every statement is correct.</span>
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Language support depends on the optional model configuration. This assistant sends text questions only; use verification or reporting for file evidence.
              </p>
            </form>
          </Card>

          <Alert tone="info" className="mt-5">
            Truth Guardian does not search citizen reports as facts, and it will not present an unverified source as an official confirmation.
          </Alert>
        </div>
      </div>
    </div>
  );
}
