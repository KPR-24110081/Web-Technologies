import { useEffect, useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ToastContainer from "./components/ToastContainer";

import Dashboard from "./pages/Dashboard";
import FileSystemLab from "./pages/FileSystemLab";
import UrlExplorer from "./pages/UrlExplorer";
import History from "./pages/History";
import Docs from "./pages/Docs";

import { healthCheck } from "./services/api";

const PAGES = {
  dashboard: Dashboard,
  files: FileSystemLab,
  url: UrlExplorer,
  history: History,
  docs: Docs,
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [backend, setBackend] = useState({ status: "checking", nodeVersion: null, database: null });

  // Poll the backend health endpoint so the connection indicator stays honest.
  const checkHealth = useCallback(async () => {
    try {
      const h = await healthCheck();
      setBackend({ status: "online", nodeVersion: h.data?.node || null, database: h.database });
    } catch {
      setBackend({ status: "offline", nodeVersion: null, database: null });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const timer = setInterval(checkHealth, 8000);
    return () => clearInterval(timer);
  }, [checkHealth]);

  const navigate = (id) => {
    setPage(id);
    window.scrollTo({ top: 0 });
  };

  const CurrentPage = PAGES[page] || Dashboard;

  return (
    <div className="app-shell">
      <Sidebar active={page} onNavigate={navigate} />
      <div className="app-main">
        <Navbar
          page={page}
          status={backend.status}
          nodeVersion={backend.nodeVersion}
          database={backend.database}
        />
        <main className="app-content">
          <CurrentPage />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}