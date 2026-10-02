import { Terminal } from "lucide-react";

/**
 * Compact header describing a single lab operation:
 * title, description, the exact Node.js method and a module badge.
 */
export default function OperationCard({ icon, title, desc, method = "", moduleName, tone = "fs" }) {
  const toneMap = {
    fs: { bg: "var(--primary-soft)", color: "#4338ca", border: "rgba(79,70,229,0.3)" },
    url: { bg: "var(--secondary-soft)", color: "#0e7490", border: "rgba(8,145,178,0.3)" },
  };
  const t = toneMap[tone] || toneMap.fs;

  return (
    <div className="card card-pad mb-20">
      <div className="flex" style={{ alignItems: "flex-start", gap: 14 }}>
        <div
          className="module-icon"
          style={{ marginBottom: 0, width: 42, height: 42, background: t.bg, color: t.color }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex" style={{ gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
            <h3 style={{ fontSize: 16 }}>{title}</h3>
            <span className="badge" style={{ background: t.bg, color: t.color, borderColor: t.border }}>
              module: {moduleName || "?"}
            </span>
          </div>
          <p className="text-sm mb-16" style={{ color: "var(--muted)" }}>
            {desc}
          </p>
          {method && (
            <span className="chip">
              <Terminal size={13} />
              {method}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}