import { useCallback, useEffect, useState } from "react";
import { History as HistoryIcon, Trash2, RefreshCw, Database } from "lucide-react";

import ConfirmModal from "../components/ConfirmModal";
import Spinner from "../components/Spinner";

import { getHistory, clearHistory } from "../services/historyApi";
import { toast } from "../services/toast";

const TYPE_FILTERS = [
  { id: "", label: "All types" },
  { id: "FILE", label: "FILE" },
  { id: "URL", label: "URL" },
];

const STATUS_FILTERS = [
  { id: "", label: "All statuses" },
  { id: "success", label: "success" },
  { id: "error", label: "error" },
];

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function History() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [operation, setOperation] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getHistory({ type, status, operation, limit: 100 });
      setItems(data.items);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, status, operation]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClear = async () => {
    setConfirmClear(false);
    try {
      const res = await clearHistory();
      toast.success(res.message || "History cleared");
      setItems([]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">MongoDB · Operation Log</div>
        <h1>Operation History</h1>
        <p>
          Every file-system and URL operation is stored as a document in the MongoDB{" "}
          <code>operations</code> collection. Filter what you want to inspect.
        </p>
      </div>

      {/* Filters */}
      <div className="card card-pad">
        <div className="form-row-3">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Operation type</label>
            <div className="chip-list">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.id || "all"}
                  type="button"
                  className={`filter-pill ${type === t.id ? "active" : ""}`}
                  onClick={() => setType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <div className="chip-list">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.id || "all"}
                  type="button"
                  className={`filter-pill ${status === s.id ? "active" : ""}`}
                  onClick={() => setStatus(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="op-filter">Operation <span className="hint">(optional: e.g. CREATE, READ, PARSE)</span></label>
            <input
              id="op-filter"
              className="input mono"
              placeholder="CREATE"
              value={operation}
              onChange={(e) => setOperation(e.target.value.trim().toUpperCase())}
            />
          </div>
        </div>
        <div className="flex mt-16" style={{ flexWrap: "wrap", gap: 10 }}>
          <button type="button" className="btn" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Apply filters
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setConfirmClear(true)}
            disabled={items.length === 0}
          >
            <Trash2 size={15} /> Clear history
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="section-head" style={{ marginTop: 26 }}>
        <h2>
          <HistoryIcon size={17} style={{ verticalAlign: -2, color: "var(--secondary)" }} />
          Records <span className="badge badge-muted">{loading ? "…" : items.length}</span>
        </h2>
        <span className="rule" />
      </div>

      {loading ? (
        <Spinner label="Querying MongoDB..." />
      ) : error ? (
        <div className="empty" style={{ color: "#b91c1c" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Could not load history</div>
          <div className="text-sm">{error}</div>
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <Database />
          <div className="empty-title">No operation records found</div>
          <div className="empty-sub">Run an operation in the labs, or change the active filters.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Type</th>
                <th>Input</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
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
                  <td className="text-dim" style={{ maxWidth: 280 }}>
                    <span style={{ wordBreak: "break-all" }}>{r.input || "—"}</span>
                  </td>
                  <td>
                    <span className={`badge ${r.status === "success" ? "badge-success" : "badge-danger"}`}>
                      {r.status}
                    </span>
                    {r.status === "error" && r.error && (
                      <div className="text-sm text-muted" style={{ marginTop: 3, maxWidth: 220 }}>
                        {r.error}
                      </div>
                    )}
                  </td>
                  <td className="text-dim">{formatTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={confirmClear}
        title="Clear operation history?"
        description="This permanently removes every operation document from the MongoDB 'operations' collection. This cannot be undone."
        confirmLabel="Clear history"
        onConfirm={handleClear}
        onClose={() => setConfirmClear(false)}
      />
    </>
  );
}