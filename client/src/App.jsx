import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import { api } from './api';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [mode, setMode] = useState(null);

  const refresh = useCallback(async () => {
    const { documents } = await api.listDocuments();
    setDocuments(documents);
  }, []);

  useEffect(() => {
    api.health().then((h) => setMode(h.mode)).catch(() => {});
    refresh().catch(() => {});
  }, [refresh]);

  return (
    <div className="flex h-screen w-screen items-center justify-center p-0 sm:p-4 lg:p-6">
      <div className="flex h-full w-full max-w-7xl overflow-hidden rounded-none bg-white/50 shadow-2xl shadow-blue-900/10 ring-1 ring-blue-100/80 backdrop-blur-sm sm:rounded-3xl">
        <Sidebar documents={documents} onChanged={refresh} />
        <Chat mode={mode} hasDocuments={documents.length > 0} />
      </div>
    </div>
  );
}
