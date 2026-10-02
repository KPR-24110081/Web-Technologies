import { FileText, FileJson, FileCode, FileTerminal, Folder, HardDrive } from "lucide-react";
import Spinner from "./Spinner";
import { toast } from "../services/toast";

const TYPE_ICONS = {
  json: <FileJson size={15} />,
  js: <FileCode size={15} />,
  txt: <FileText size={15} />,
  log: <FileTerminal size={15} />,
};

/**
 * Table of files returned from GET /api/files (list directory).
 * onSelect receives a file entry when the "Use" action is clicked.
 */
export default function FileTable({ files, loading, error, onSelect }) {
  if (loading) return <Spinner label="Reading directory with fs.readdir()..." />;

  if (error) {
    return (
      <div className="empty" style={{ color: "#b91c1c" }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Could not load files</div>
        <div className="text-sm">{error}</div>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="empty">
        <HardDrive />
        <div className="empty-title">No files in storage</div>
        <div className="empty-sub">Create a file using the Create File tab.</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>File name</th>
            <th>Type</th>
            <th>Size</th>
            <th>Last modified</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id || f.name}>
              <td>
                <span className="cell-name">
                  {f.isDirectory ? <Folder size={14} style={{ verticalAlign: -2, color: "var(--warning)" }} /> : TYPE_ICONS[f.extension] || <FileText size={14} style={{ verticalAlign: -2 }} />}{" "}
                  {f.name}
                </span>
              </td>
              <td>
                <span className={`badge ${f.isDirectory ? "badge-warning" : "badge-muted"}`}>{f.type || "file"}</span>
              </td>
              <td className="mono text-dim">{f.sizeLabel}</td>
              <td className="text-dim">{f.modifiedLabel}</td>
              <td>
                <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                  {onSelect && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onSelect(f)}
                      title={`Select ${f.name}`}
                    >
                      Use
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}