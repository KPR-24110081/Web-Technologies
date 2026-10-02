import { Loader2 } from "lucide-react";

export default function Spinner({ label = "Loading...", small = false }) {
  return (
    <div className="empty" style={{ padding: small ? "18px" : "46px 20px" }}>
      <Loader2 className="spin" style={{ width: small ? 22 : 34, height: small ? 22 : 34, marginBottom: 8 }} />
      {!small && <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{label}</div>}
    </div>
  );
}