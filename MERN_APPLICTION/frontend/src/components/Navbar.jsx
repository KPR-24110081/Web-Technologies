export const PAGE_META = {
  dashboard: {
    name: "Dashboard",
    desc: "Live statistics from MongoDB and the Express API",
  },
  files: {
    name: "File System Lab",
    desc: "Create, read, write, append, rename, delete and inspect files",
  },
  url: {
    name: "URL Explorer",
    desc: "Parse, validate, modify and build URLs",
  },
  history: {
    name: "Operation History",
    desc: "Persistent operation records stored in MongoDB",
  },
  docs: {
    name: "Documentation",
    desc: "MERN stack concepts, modules and data flow",
  },
};

export default function Navbar({ page, status, nodeVersion, database }) {
  const meta = PAGE_META[page] || PAGE_META.dashboard;

  return (
    <header className="topnav">
      <div className="topnav-crumb">
        <span>NodeScope</span>
        <span style={{ opacity: 0.5 }}> / </span>
        <strong>{meta.name}</strong>
      </div>
      <div className="topnav-desc">{meta.desc}</div>

      <div className="topnav-right">
        {nodeVersion && <span className="node-version">node {nodeVersion}</span>}
        {database && (
          <span className={`status-pill ${database === "connected" ? "online" : "offline"}`} title="MongoDB connection status">
            <span className="status-dot" />
            DB {database}
          </span>
        )}
        <span className={`status-pill ${status ?? "checking"}`} title="Backend connection status">
          <span className="status-dot" />
          {status === "online" ? "API connected" : status === "offline" ? "API offline" : "Checking..."}
        </span>
      </div>
    </header>
  );
}