import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, FolderTree, Link2, CheckCircle2, XCircle, Activity, Database, RefreshCw } from "lucide-react";

import { healthCheck } from "../services/api";
import { getStats } from "../services/historyApi";
import Spinner from "../components/Spinner";

function StatCard({ icon, label, value, tone }) {
  const tones = {
    primary: { bg: "var(--primary-soft)", color: "#4338ca" },
    secondary: { bg: "var(--secondary-soft)", color: "#0e7490" },
    success: { bg: "var(--success-soft)", color: "#15803d" },
    danger: { bg: "var(--danger-soft)", color: "#b91c1c" },
  };
  const t = tones[tone] || tones.primary;
  return (
    <div className="card info-tile">
      <div className="tile-icon" style={{ background: t.bg, color: t.color }}>
        {icon}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="k" style={{ marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function Dashboard() {
  const [health, setHealth] = useState({ server: "checking", database: "checking" });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const h = await healthCheck();
      setHealth({ server: "online", database: h.database });
    } catch {
      setHealth({ server: "offline", database: "unknown" });
    }
    try {
      const s = await getStats();
      setStats(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">MERN Stack · Overview</div>
        <h1>Dashboard</h1>
        <p>
          Real statistics pulled from MongoDB and the Express API — nothing here is hardcoded.
        </p>
      </div>

      {/* System status */}
      <div className="info-strip" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <div className="card info-tile">
          <div className="tile-icon" style={{ background: health.server === "online" ? "var(--success-soft)" : health.server === "offline" ? "var(--danger-soft)" : "var(--warning-soft)", color: health.server === "online" ? "#15803d" : health.server === "offline" ? "#b91c1c" : "#a16207" }}>
            <Activity size={17} />
          </div>
          <div>
            <div className="k">Express Server</div>
            <div className="v" style={{ textTransform: "capitalize" }}>{health.server}</div>
          </div>
        </div>
        <div className="card info-tile">
          <div className="tile-icon" style={{ background: health.database === "connected" ? "var(--success-soft)" : "var(--danger-soft)", color: health.database === "connected" ? "#15803d" : "#b91c1c" }}>
            <Database size={17} />
          </div>
          <div>
            <div className="k">MongoDB</div>
            <div className="v" style={{ textTransform: "capitalize" }}>{health.database}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <Spinner label="Fetching statistics from MongoDB..." />
      ) : error ? (
        <div className="empty" style={{ color: "#b91c1c" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Could not load statistics</div>
          <div className="text-sm">{error}</div>
        </div>
      ) : !stats || !stats.available ? (
        <div className="empty">
          <Database />
          <div className="empty-title">MongoDB is not connected</div>
          <div className="empty-sub">Start the database to see operation statistics here.</div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="section-head" style={{ marginTop: 8 }}>
            <h2>
              <LayoutDashboard size={17} style={{ verticalAlign: -2, color: "var(--primary)" }} />
              Operation Statistics
            </h2>
            <span className="rule" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={load} title="Refresh statistics">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <div className="info-strip">
            <StatCard icon={<Activity size={17} />} label="Total Operations" value={stats.total} tone="primary" />
            <StatCard icon={<FolderTree size={17} />} label="File Operations" value={stats.file} tone="secondary" />
            <StatCard icon={<Link2 size={17} />} label="URL Operations" value={stats.url} tone="secondary" />
            <StatCard icon={<CheckCircle2 size={17} />} label="Successful" value={stats.success} tone="success" />
            <StatCard icon={<XCircle size={17} />} label="Failed" value={stats.failed} tone="danger" />
          </div>

          {/* Recent operations */}
          <div className="section-head">
            <h2>
              <Activity size={17} style={{ verticalAlign: -2, color: "var(--secondary)" }} />
              Recent Operations
            </h2>
            <span className="rule" />
          </div>

          {stats.recent.length === 0 ? (
            <div className="empty">
              <Activity />
              <div className="empty-title">No operations recorded yet</div>
              <div className="empty-sub">Run an operation in the File System Lab or URL Explorer.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Operation</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <span className="cell-name">{r.operation}</span>
                        <div className="text-sm text-muted" style={{ fontFamily: "var(--mono)" }}>
                          {r.method || "—"}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${r.type === "FILE" ? "badge-primary" : "badge-secondary"}`}>{r.type}</span>
                      </td>
                      <td>
                        <span className={`badge ${r.status === "success" ? "badge-success" : "badge-danger"}`}>{r.status}</span>
                      </td>
                      <td className="text-dim">{formatTime(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* MERN data-flow reminder */}
      <div className="section-head">
        <h2>
          <Database size={17} style={{ verticalAlign: -2, color: "var(--success)" }} />
          The MERN Data Flow
        </h2>
        <span className="rule" />
      </div>
      <div className="info-strip">
        {[
          { title: "React", sub: "renders this UI and calls HTTP APIs", tone: "primary" },
          { title: "Express", sub: "receives REST requests and routes them", tone: "secondary" },
          { title: "Node.js", sub: "runs fs + url operations on the server", tone: "primary" },
          { title: "MongoDB", sub: "persists every operation as a document", tone: "secondary" },
        ].map((m) => (
          <div key={m.title} className="card info-tile">
            <div className="tile-icon" style={{ background: m.tone === "primary" ? "var(--primary-soft)" : "var(--secondary-soft)", color: m.tone === "primary" ? "#4338ca" : "#0e7490" }}>
              <Database size={17} />
            </div>
            <div>
              <div className="k">
                {m.title}
                <span style={{ float: "right", fontWeight: 400 }} />
              </div>
              <div className="v" style={{ fontSize: 12.5, fontWeight: 500, color: "var(--muted)" }}>
                {m.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card card-pad" style={{ marginTop: 4 }}>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Example: clicking <strong style={{ color: "var(--text)" }}>Create File</strong> makes React
          POST to <code>/api/files</code>; Express runs <code>fs.writeFile()</code>, Mongoose stores a{" "}
          <code>FILE / CREATE</code> document in <code>operations</code>, and the result comes back to
          update the UI. Every stat above is computed from those stored documents.
        </p>
      </div>
    </>
  );
}