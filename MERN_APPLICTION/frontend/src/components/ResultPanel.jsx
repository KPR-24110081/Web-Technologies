import { CheckCircle2, XCircle, Lightbulb, FlaskConical } from "lucide-react";
import CodePreview from "./CodePreview";

/**
 * Renders the outcome of an executed backend operation.
 *
 * result = {
 *   status: "success" | "error",
 *   operation: "fs.writeFile",
 *   methodLabel: "fs.writeFile()",       // badge shown in header
 *   message: "...",
 *   details: [{ key, value, wrap? }],
 *   input: "what the user provided or '—'",
 *   useCase: "real world scenario",
 *   code: "const fs = require(...) ...",
 * }
 */
export default function ResultPanel({ result }) {
  if (!result) {
    return (
      <div className="result-panel">
        <div className="empty">
          <FlaskConical />
          <div className="empty-title">No operation executed yet</div>
          <div className="empty-sub">Fill in the inputs above and press execute — results appear here.</div>
        </div>
      </div>
    );
  }

  const isError = result.status === "error";

  return (
    <div className="result-panel">
      <div className={isError ? "result-error-head" : "result-success-head"}>
        {isError ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
        <span>{isError ? "Operation failed" : "Operation succeeded"}</span>
        <div className="result-meta">
          {result.methodLabel && (
            <span className={`badge ${isError ? "badge-danger" : "badge-secondary"}`}>{result.methodLabel}</span>
          )}
          <span className={`badge ${isError ? "badge-danger" : "badge-success"}`}>
            {result.status}
          </span>
        </div>
      </div>

      <div className="result-body">
        <div className="result-message">
          <strong style={{ color: "var(--text)" }}>{result.operation || "Operation"}</strong>
          {" — "}
          {result.message}
        </div>

        {result.input && (
          <div style={{ marginBottom: 14, fontSize: 12.5 }}>
            <span style={{ color: "var(--muted-2)", fontWeight: 700, textTransform: "uppercase", fontSize: 11, letterSpacing: 1 }}>
              Input&nbsp;&nbsp;
            </span>
            <span className="mono" style={{ color: "var(--text-dim)", wordBreak: "break-all" }}>{result.input}</span>
          </div>
        )}

        {result.details && result.details.length > 0 && (
          <div className="detail-grid">
            {result.details.map((d, i) => (
              <div className="detail-item" key={i}>
                <div className="k">{d.key}</div>
                <div className={`v ${d.wrap ? "wrap" : ""}`}>{d.value}</div>
              </div>
            ))}
          </div>
        )}

        {result.code && <CodePreview code={result.code} title={isError ? "node.js (reference)" : "executed with node.js"} />}

        {result.useCase && (
          <div className="use-case">
            <Lightbulb size={16} />
            <div>
              <strong>Real-world use case</strong>
              {result.useCase}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}