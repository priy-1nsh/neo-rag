import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import { api } from './api';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [mode, setMode] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer

  const refresh = useCallback(async () => {
    const { documents } = await api.listDocuments();
    setDocuments(documents);
  }, []);

  useEffect(() => {
    api.health().then((h) => setMode(h.mode)).catch(() => {});
    refresh().catch(() => {});
  }, [refresh]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-[100dvh] w-screen items-center justify-center p-0 sm:p-4 lg:p-6">
      <div className="relative flex h-full w-full max-w-7xl overflow-hidden bg-white/50 shadow-2xl shadow-blue-900/10 ring-1 ring-blue-100/80 backdrop-blur-sm sm:rounded-3xl">
        {/* Dimmed backdrop behind the mobile drawer */}
        {sidebarOpen && (
          <div
            onClick={closeSidebar}
            className="absolute inset-0 z-30 bg-slate-900/40 md:hidden"
            aria-hidden="true"
          />
        )}

        <Sidebar
          documents={documents}
          onChanged={refresh}
          open={sidebarOpen}
          onClose={closeSidebar}
        />
        <Chat
          mode={mode}
          hasDocuments={documents.length > 0}
          onMenu={() => setSidebarOpen(true)}
        />
      </div>
    </div>
  );
}
