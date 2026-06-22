import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import NeoLogo from './NeoLogo';

// Render an answer, turning [1], [2] citation markers into little chips.
function AnswerText({ text }) {
  const parts = String(text).split(/(\[\d+\])/g);
  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) =>
        /^\[\d+\]$/.test(part) ? (
          <sup
            key={i}
            className="mx-0.5 rounded-md bg-blue-100 px-1 text-[10px] font-bold text-blue-600"
          >
            {part.replace(/[[\]]/g, '')}
          </sup>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

function Sources({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;
  return (
    <div className="mt-3 border-t border-blue-100 pt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
      >
        {open ? '▾' : '▸'} {sources.length} source{sources.length > 1 ? 's' : ''}
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {sources.map((s) => (
            <li key={s.citation} className="rounded-xl bg-blue-50/70 p-2.5 text-xs text-slate-600">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold text-blue-700">
                  [{s.citation}] {s.documentTitle}
                </span>
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                  sim {s.similarity}
                </span>
              </div>
              <p className="text-slate-500">{s.snippet}…</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  'Summarize my notes',
  'What are the key points?',
  'Explain the main concept simply',
];

export default function Chat({ mode, hasDocuments, onMenu = () => {} }) {
  const [messages, setMessages] = useState([]); // {role, text, sources, grounded}
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function send(text) {
    const question = (text ?? input).trim();
    if (!question || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setBusy(true);
    try {
      const res = await api.ask(question);
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: res.answer, sources: res.sources, grounded: res.grounded },
      ]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: `⚠ ${err.message}`, error: true }]);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <main className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-blue-100/70 bg-white/60 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenu}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-blue-600 transition hover:bg-blue-50 md:hidden"
            title="Documents"
            aria-label="Open documents panel"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="font-bold text-slate-800">Chat</h2>
          <span className="hidden text-sm text-slate-400 sm:inline">— powered by Neo</span>
        </div>
        {mode && (
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              mode === 'mock'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}
            title={
              mode === 'mock'
                ? 'No OpenAI key set — running offline mock embeddings & answers'
                : 'Live OpenAI generation'
            }
          >
            <span className={`h-1.5 w-1.5 rounded-full ${mode === 'mock' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {mode === 'mock' ? 'Mock mode' : 'OpenAI live'}
          </span>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
        {messages.length === 0 && (
          <div className="mx-auto mt-10 max-w-md text-center">
            <div
              className="mx-auto mb-4 w-28"
              style={{ animation: 'neoFloat 4s ease-in-out infinite' }}
            >
              <NeoLogo size={112} className="drop-shadow-[0_18px_28px_rgba(37,99,235,0.30)]" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              {hasDocuments ? 'Hi, I’m Neo 👋' : 'Hi, I’m Neo 👋'}
            </h3>
            <p className="mt-1.5 text-sm text-slate-500">
              {hasDocuments
                ? 'Ask me anything about your notes. I answer strictly from your documents, with citations.'
                : 'Add a document on the left, then ask me anything about it.'}
            </p>
            {hasDocuments && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-blue-200 bg-white px-3.5 py-1.5 text-xs font-medium text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-blue-100">
                <NeoLogo size={26} antenna={false} />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-xl ${
                m.role === 'user'
                  ? 'rounded-br-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20'
                  : m.error
                  ? 'rounded-bl-md bg-rose-50 text-rose-600'
                  : 'rounded-bl-md border border-blue-100 bg-white text-slate-700'
              }`}
            >
              {m.role === 'assistant' && !m.error ? (
                <AnswerText text={m.text} />
              ) : (
                <p className="whitespace-pre-wrap">{m.text}</p>
              )}
              {m.role === 'assistant' && <Sources sources={m.sources} />}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-end gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-blue-100">
              <NeoLogo size={26} antenna={false} />
            </div>
            <div className="rounded-2xl rounded-bl-md border border-blue-100 bg-white px-4 py-3 text-sm text-slate-400 shadow-sm">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-300" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:0.3s]" />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-blue-100/70 bg-white/60 p-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-blue-100 bg-white p-2 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask Neo about your notes…"
            className="max-h-40 flex-1 resize-none self-center bg-transparent px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none"
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 transition hover:shadow-lg disabled:opacity-40 disabled:shadow-none"
            title="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}
