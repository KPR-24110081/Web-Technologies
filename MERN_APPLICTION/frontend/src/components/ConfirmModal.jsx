import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({ open, title, description, fileName, confirmLabel = "Delete", onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "var(--danger-soft)",
              color: "var(--danger)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <AlertTriangle size={17} />
          </span>
          {title}
        </h3>
        <div className="modal-desc">{description}</div>
        {fileName && <div className="modal-file">{fileName}</div>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            <X size={15} />
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} autoFocus>
            <AlertTriangle size={15} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}