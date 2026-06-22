// Thin wrapper around the backend API. All calls go through the Vite proxy.

async function json(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => fetch('/api/health').then(json),

  listDocuments: () => fetch('/api/documents').then(json),

  uploadFile: (file, title) => {
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    return fetch('/api/documents/upload', { method: 'POST', body: form }).then(json);
  },

  pasteText: (title, text) =>
    fetch('/api/documents/paste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, text }),
    }).then(json),

  deleteDocument: (id) =>
    fetch(`/api/documents/${id}`, { method: 'DELETE' }).then(json),

  ask: (question) =>
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    }).then(json),
};
