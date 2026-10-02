import { useState } from "react";
import { Copy, Check, TerminalSquare } from "lucide-react";
import { copyToClipboard } from "../services/toast";

export default function CodePreview({ code, language = "js", title = "node.js" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="code-block">
      <div className="code-head">
        <TerminalSquare size={14} style={{ color: "var(--secondary)" }} />
        <span>{title}</span>
        <button
          type="button"
          className="btn btn-ghost btn-sm copy-btn"
          onClick={handleCopy}
          title="Copy code to clipboard"
        >
          {copied ? <Check size={13} style={{ color: "var(--success)" }} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}