# NodeScope Frontend

React + Vite dashboard for NodeScope (MERN File System & URL Explorer).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

The API base URL is configured in `.env` via `VITE_API_URL` (default `http://localhost:5000/api`).

## Build

```bash
npm run build      # outputs to dist/
npm run preview
```

## Structure

- `src/pages/` — Dashboard, FileSystemLab, UrlExplorer, History, Docs
- `src/components/` — Sidebar, Navbar, ResultPanel, CodePreview, FileTable, UrlBreakdown, ConfirmModal, ...
- `src/services/` — api.js (fetch wrapper + health), fileApi.js, urlApi.js, historyApi.js, toast.js
- `src/styles/global.css` — light dashboard theme