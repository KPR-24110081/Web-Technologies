import { FolderTree, Link2, ChevronRight, Boxes, LayoutDashboard, History, BookOpen } from "lucide-react";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "files", label: "File System Lab", icon: FolderTree },
  { id: "url", label: "URL Explorer", icon: Link2 },
  { id: "history", label: "Operation History", icon: History },
  { id: "docs", label: "Documentation", icon: BookOpen },
];

export function LogoIcon({ size = 40 }) {
  return (
    <div className="brand-logo" style={{ width: size, height: size }}>
      <Boxes size={size * 0.5} />
    </div>
  );
}

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <LogoIcon />
        <div>
          <div className="brand-title">NodeScope</div>
          <div className="brand-sub">MERN · fs + url explorer</div>
        </div>
      </div>

      <nav className="nav" aria-label="Main navigation">
        <div className="nav-label">Pages</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
              <ChevronRight className="chevron" size={15} />
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        React → Express → Node.js → MongoDB
        <br />
        fs + url modules · MERN stack
      </div>
    </aside>
  );
}