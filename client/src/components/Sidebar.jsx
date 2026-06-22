import { useRef, useState } from 'react';
import { api } from '../api';
import NeoLogo from './NeoLogo';

function SourceBadge({ type }) {
  const map = {
    pdf: 'bg-rose-100 text-rose-600',
    markdown: 'bg-violet-100 text-violet-600',
    text: 'bg-sky-100 text-sky-600',
    paste: 'bg-amber-100 text-amber-600',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[type] || 'bg-slate-100 text-slate-500'}`}>
      {type}
    </span>
  );
}

export default function Sidebar({ documents, onChanged }) {
  const [tab, setTab] = useState('upload'); // 'upload' | 'paste'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await api.uploadFile(file);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handlePaste() {
    if (!pasteText.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.pasteText(pasteTitle, pasteText);
      setPasteTitle('');
      setPasteText('');
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setBusy(true);
    try {
      await api.deleteDocument(id);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-blue-100/70 bg-white/70 backdrop-blur-xl">
      {/* Brand header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-5 pb-6 pt-5 text-white shadow-lg shadow-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-md shadow-blue-900/10">
            <NeoLogo size={34} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Neo</h1>
            <p className="text-xs text-blue-100">Ask Neo about your documents</p>
          </div>
        </div>
      </div>

      {/* Add-source card */}
      <div className="px-4 pt-4">
        <div className="mb-3 flex gap-1 rounded-2xl bg-blue-50 p-1 text-sm">
          {['upload', 'paste'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-xl px-3 py-2 font-medium transition ${
                tab === t
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              {t === 'upload' ? 'Upload' : 'Paste text'}
            </button>
          ))}
        </div>

        {tab === 'upload' ? (
          <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-b from-blue-50/60 to-white p-6 text-center transition hover:border-blue-400 hover:from-blue-50">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,.markdown,text/plain,application/pdf"
              className="hidden"
              onChange={handleFile}
              disabled={busy}
            />
            <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-blue-100 text-blue-600">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4M5 11l7-7 7 7" />
                <path d="M5 20h14" />
              </svg>
            </div>
            <div className="font-semibold text-slate-700">Choose a file</div>
            <div className="text-xs text-slate-400">PDF, .txt, or .md · max 15 MB</div>
          </label>
        ) : (
          <div className="space-y-2">
            <input
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your notes here…"
              rows={5}
              className="w-full resize-none rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={handlePaste}
              disabled={busy || !pasteText.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-40 disabled:shadow-none"
            >
              Add note
            </button>
          </div>
        )}

        {busy && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            Processing &amp; embedding…
          </p>
        )}
        {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
      </div>

      {/* Document list */}
      <div className="mt-4 flex-1 overflow-y-auto px-4 pb-4">
        <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
          Knowledge base · {documents.length}
        </div>
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-blue-100 bg-blue-50/40 p-4 text-center text-sm text-slate-400">
            No documents yet. Add one above to start chatting with Neo.
          </div>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="group rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-700" title={doc.title}>
                      {doc.title}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                      <SourceBadge type={doc.sourceType} />
                      <span>{doc.chunkCount} chunks</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="shrink-0 rounded-lg p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
