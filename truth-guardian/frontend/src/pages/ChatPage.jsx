import { Bot, Info, Send, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hello. Truth Guardian will help you check claims, official announcements, suspicious websites and scam patterns using evidence. AI retrieval is not connected in Phase 1.',
};

export default function ChatPage() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [draft, setDraft] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;

    setMessages((current) => [
      ...current,
      { id: `question-${current.length}`, role: 'user', content: question },
      {
        id: `answer-${current.length}`,
        role: 'assistant',
        content:
          'Your question was not sent to an AI provider. The backend RAG and chatbot services are planned for a later phase, when credentials, trusted sources, citations and safety tests are configured.',
      },
    ]);
    setDraft('');
  };

  return (
    <div className="min-h-[calc(100vh-18rem)] bg-slate-100 py-10">
      <div className="page-shell">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-guardian-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-800">
              <Bot className="h-4 w-4" aria-hidden="true" />
              Truth Guardian
            </div>
            <h1 className="mt-4 font-display text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Ask before you trust or share
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Future answers will retrieve evidence from scoped trusted sources, distinguish claims
              from facts and show citations. The browser will never receive an AI API key.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-200 bg-guardian-950 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-guardian-400/15">
                  <ShieldCheck className="h-5 w-5 text-guardian-300" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-extrabold">Truth Guardian Assistant</p>
                  <p className="text-xs text-guardian-200">Evidence assistant · Foundation mode</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-bold text-amber-200">
                AI not connected
              </span>
            </div>

            <div className="min-h-[420px] space-y-5 bg-slate-50 p-5 sm:p-7" aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-guardian-100 text-guardian-800">
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === 'user'
                        ? 'rounded-br-sm bg-guardian-800 text-white'
                        : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === 'user' ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4 sm:p-5">
              <label htmlFor="guardian-question" className="sr-only">
                Ask Truth Guardian
              </label>
              <div className="flex items-end gap-3">
                <textarea
                  id="guardian-question"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows="2"
                  placeholder="Example: Is this scholarship announcement real?"
                  className="min-h-12 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-guardian-800 text-white hover:bg-guardian-900 disabled:bg-slate-300"
                  aria-label="Send question"
                >
                  <Send className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Foundation mode accepts local UI input only and does not transmit or store it.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
