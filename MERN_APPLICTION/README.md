# NodeScope

### NodeScope: A MERN-Based File System and URL Operations Explorer

An interactive, college-level web application that demonstrates the **Node.js core modules `fs` and `url`** inside a complete **MERN stack** (MongoDB · Express.js · React · Node.js). Every operation you run in the UI is **actually executed on the backend** by real Node.js methods, and **saved to MongoDB** as an operation document.

> Assignment: **Web Technologies** — SNU Sem 5, 2026

---

## 1. Project Overview

NodeScope started as a two-section lab (File System + URL). It has been converted into a full **MERN** application:

- **React** renders the dashboard, labs, history and documentation pages.
- **Express** exposes a REST API under `/api`.
- **Node.js** performs the real file-system (`fs/promises`) and URL (`WHATWG URL`) logic.
- **MongoDB + Mongoose** persist **every operation** in the `operations` collection, powering the dashboard statistics and the history page.

Before the conversion, history was stored in a local JSON file. It now lives in MongoDB, so it survives restarts and is queryable through filters.

---

## 2. Aim

To design and implement a MERN-stack application that demonstrates:

1. Node.js **File System** (`fs`) module
2. Node.js **Path** (`path`) module
3. Node.js **URL** module (WHATWG `URL` + `URLSearchParams`)
4. **Express** REST APIs
5. **React** frontend
6. **MongoDB** database
7. **Mongoose** ODM
8. **CRUD** operations on real files and documents
9. Client–server communication over HTTP
10. Persistent, filterable **operation history**

---

## 3. Features

- **8 file-system operations** via `fs/promises` (`writeFile`, `readFile`, `appendFile`, `rename`, `unlink`, `readdir`, `stat`) — create, read, write, append, rename, delete, list, stats.
- **6 URL operations** using `new URL()` and `URLSearchParams` — parse, validate, inspect params, modify, build, resolve.
- **MongoDB persistence**: every operation creates a document (`type`, `operation`, `method`, `input`, `result`, `status`, `error`, `createdAt`).
- **Dashboard** with live statistics from the database (total / file / URL / success / failed / recent operations) + server & DB health.
- **Operation History** page with filters (type, status, operation) and a proper backend delete API.
- **Documentation page** explaining MERN, `fs`, `path`, `url`, MongoDB and Mongoose.
- **Sandboxed file access** that refuses path traversal, nested paths and invalid characters — everything stays inside `backend/storage`.
- Live **server + database health indicators** in the navbar (polls `/api/health`).
- CORS enabled, JSON error handling, request logging, centralized error handler and Mongoose error translation.

---

## 4. MERN Architecture

```
React (client/)
   │  fetch()  ->  /api/...
   ▼
Express (backend/)                    Node.js core modules
   │  routes → controllers → services
   ▼                                    fs / path / url
Node.js logic executes             ───►  real operations
   │
   ▼  Mongoose ODM
MongoDB (operations collection)
```

**End-to-end example — Create File:**

```
React sends POST /api/files {name, content}
   → Express routes to fileController.createFile
   → Node.js runs fs.writeFile(path, content, {flag:"wx"})
   → Mongoose stores a {type:"FILE", operation:"CREATE", status:"success"} document
   → Express returns {success:true, data:{file}}
   → React updates the UI + refreshes the file table
```

**End-to-end example — Parse URL:**

```
React sends POST /api/url/parse {url}
   → Express routes to urlController.parseUrl
   → Node.js runs new URL(url) and extracts components
   → Mongoose stores a {type:"URL", operation:"PARSE"} document
   → Express returns the breakdown
   → React renders the URL structure table
```

---

## 5. Technologies Used

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React 18, Vite, plain CSS (light theme), lucide-react icons       |
| Backend    | Node.js, Express 4, `fs/promises`, WHATWG `URL` / `URLSearchParams` |
| Database   | MongoDB 7 (via Docker or local install)                           |
| ODM        | Mongoose 8 (`Operation` model with schema + timestamps)           |
| Build/run  | `concurrently` for one-command startup, `dotenv` for config       |

---

## 6. Project Structure

The pre-existing `frontend/` and `backend/` folders were kept (rather than renamed to `client/`/`server/`) to avoid breaking the working code. Internals match a clean MERN layout.

```
assesment/
├── package.json               # root: concurrently scripts (npm run dev)
├── .env.example               # template for backend + frontend env files
├── README.md
├── backend/                   # ── the E + N (+ M) layers
│   ├── server.js              # entry: dotenv, MongoDB connect, listen
│   ├── app.js                 # Express wiring (routes, cors, error handler)
│   ├── config/db.js           # mongoose connection + db state helper
│   ├── models/Operation.js    # Mongoose schema → 'operations' collection
│   ├── routes/                # file, url, history, stats routes
│   ├── controllers/           # file, url, history, stats, system
│   ├── services/              # fileService, urlService (real fs/url logic)
│   ├── middleware/errorHandler.js
│   ├── utils/                 # safePath (sandbox), errors, history (Mongo)
│   ├── storage/               # flat-filename sandbox + sample files
│   ├── .env / .env.example    # MONGODB_URI, PORT, CLIENT_URL
│   └── package.json
└── frontend/                  # ── the R layer
    ├── index.html
    ├── vite.config.js
    ├── .env / .env.example    # VITE_API_URL
    └── src/
        ├── main.jsx, App.jsx
        ├── pages/             # Dashboard, FileSystemLab, UrlExplorer, History, Docs
        ├── components/        # Sidebar, Navbar, ResultPanel, OperationCard, FileTable, ...
        ├── services/          # api.js (fetch wrapper), fileApi, urlApi, historyApi, toast
        └── styles/global.css
```

---

## 7. MongoDB Setup

You need a running **MongoDB 7+** on `localhost:27017`. Two easy options:

**Option A — Docker (recommended):**

```bash
docker run -d --name nodescope-mongo -p 27017:27017 -e MONGO_INITDB_DATABASE=nodescope mongo:7
```

**Option B — Local install:** install MongoDB Community Server, then:

```bash
mongod --dbpath /path/to/data
```

Optionally verify:

```bash
# Docker only
docker exec -it nodescope-mongo mongosh --quiet --eval "db.operations.countDocuments({})"
```

The database `nodescope` and its `operations` collection are created **automatically** on first write — no manual setup needed.

### Start order does not matter

The backend treats MongoDB as **optional at startup**. If it cannot reach the database it still boots, keeps the File System and URL labs working, and retries the connection every 5 seconds until MongoDB appears — so you can start the app in either order and never need to restart it.

While MongoDB is down:

| Endpoint            | Behaviour                                                            |
| ------------------- | -------------------------------------------------------------------- |
| `/api/health`       | `200` with `"database":"disconnected"` — the navbar shows a warning   |
| `/api/stats`        | `200` with `data.available: false` and zeroed counters                |
| `/api/history`      | `503` with a friendly message (the operation itself still succeeds)   |
| `/api/files`, `/api/url/*` | Fully functional — these do not need the database               |

Once MongoDB is reachable the navbar indicator flips to green and history/stats come back automatically, with no server restart.

---

## 8. Environment Variables

Create `backend/.env` from `backend/.env.example` and `frontend/.env` from `frontend/.env.example`.

```env
# backend/.env
MONGODB_URI=mongodb://localhost:27017/nodescope
PORT=5000
CLIENT_URL=http://localhost:5173
```

```env
# frontend/.env
VITE_API_URL=http://localhost:5000/api
```

`.env` files are git-ignored. The repo ships `.env.example` placeholders only.

---

## 9. Installation

Requires **Node.js ≥ 18** (24 recommended) and MongoDB.

```bash
# from the project root
npm install                  # root: concurrently
npm run install:all          # installs backend + frontend dependencies
```

Or install manually:

```bash
npm install
cd backend  && npm install
cd ../frontend && npm install
```

---

## 10. Running the Application

```bash
npm run dev                  # starts backend (:5000) + frontend (:5173) together
```

Open **http://localhost:5173**.

Individual servers:

```bash
npm run server               # backend only  -> http://localhost:5000
npm run client               # frontend only -> http://localhost:5173
npm run dev:backend          # same as server
npm run dev:frontend         # same as client
```

Quick health check:

```bash
# backend live?            {"success":true,"server":"running","database":"connected"}
curl http://localhost:5000/api/health
```

---

## 11. API Documentation

Base URL: `http://localhost:5000/api`. Every response uses `{ success, message, data? }` (errors: `{ success:false, message, error, status }`).

| Method | Path                     | Node.js method used        | Purpose                          |
| ------ | ------------------------ | -------------------------- | -------------------------------- |
| GET    | `/health`                | —                          | Server + database status         |
| GET    | `/files`                 | `fs/promises.readdir`      | List storage directory           |
| POST   | `/files`                 | `writeFile(…, {flag:"wx"})`| Create file (409 if exists)      |
| GET    | `/files/:name`           | `readFile`                 | Read a file                      |
| PUT    | `/files/:name`           | `writeFile`                | Overwrite a file                 |
| POST   | `/files/:name/append`    | `appendFile`               | Append to a file                 |
| PATCH  | `/files/:name/rename`    | `rename`                   | Rename a file                    |
| DELETE | `/files/:name`           | `unlink`                   | Delete a file                    |
| GET    | `/files/:name/stats`     | `stat`                     | File metadata                    |
| POST   | `/url/parse`             | `new URL(str)`             | Parse + breakdown a URL          |
| POST   | `/url/validate`          | `new URL` + try/catch      | Validate syntax                  |
| POST   | `/url/params`            | `URLSearchParams`          | get/has/keys/values/entries      |
| POST   | `/url/modify`            | `searchParams.set/append/delete` | Modify a parameter         |
| POST   | `/url/build`             | `new URL` + `URLSearchParams` | Build a URL from parts        |
| POST   | `/url/resolve`           | `new URL(rel, base)`       | Resolve a relative URL           |
| GET    | `/history`               | MongoDB `find`             | History (`?type=&status=&operation=&limit=`) |
| DELETE | `/history`               | MongoDB `deleteMany`       | Clear history                    |
| GET    | `/stats`                 | MongoDB aggregations       | Dashboard statistics             |

**Example responses:**

```json
// GET /api/health
{ "success": true, "server": "running", "database": "connected",
  "message": "Server is running. MongoDB is connected.", "data": { "node": "v24.3.0" } }

// POST /api/files  { "name": "notes.txt", "content": "hi" }
{ "success": true, "operation": "fs.writeFile (flag: wx)",
  "message": "File created successfully", "data": { "file": { "name": "notes.txt", "size": 2 } } }

// GET /api/files/../../etc/passwd  ->  400
{ "success": false, "message": "Invalid filename: path separators ('/' or '\\') and '..' are not allowed.", "error": "...", "status": 400 }
```

---

## 12. File System Operations

| Method         | What it shows                                       |
| -------------- | --------------------------------------------------- |
| `writeFile({flag:"wx"})` | Strict create (fails if the file exists)    |
| `readFile(path,"utf8")`   | Read text content                           |
| `writeFile(path,data,"w")`| Overwrite / create                          |
| `appendFile(path,data)`   | Add to end of file                          |
| `rename(old,new)`         | Rename within the sandbox                   |
| `unlink(path)`            | Delete a file                               |
| `readdir(dir)`            | List directory entries                      |
| `stat(path)`              | `size`, `birthtime`, `mtime`, `isFile()`    |

History records for these use semantic operations `CREATE / READ / WRITE / APPEND / RENAME / DELETE / LIST / STATS` with type `FILE`.

---

## 13. URL Operations

| Method                        | What it shows                                    |
| ----------------------------- | ------------------------------------------------ |
| `new URL(str)`                | Protocol, hostname, port, pathname, search, hash, origin, href |
| `try { new URL } catch`       | Syntax validation (not existence)                |
| `url.searchParams.get/has/keys/values/entries/toString` | Query string inspection |
| `url.searchParams.set/append/delete` | Modify parameters                       |
| `new URL` + `URLSearchParams` | Build a URL from parts                          |
| `new URL(relative, base)`     | Resolve a relative reference                    |

History records: `PARSE / PARAMS / VALIDATE / MODIFY / BUILD / RESOLVE` with type `URL`.

---

## 14. Database Schema

Collection: `operations` (created automatically by Mongoose).

```js
{
  type:      String,   // "FILE" | "URL"
  operation: String,   // CREATE, READ, WRITE, APPEND, RENAME, DELETE, LIST, STATS | PARSE, PARAMS, VALIDATE, MODIFY, BUILD, RESOLVE
  method:    String,   // the Node.js API executed (fs.writeFile, new URL(), ...)
  input:     String,   // the user-supplied input
  result:    Object,   // condensed JSON result
  status:    String,   // "success" | "error"
  error:     String,   // failure message ("" on success)
  createdAt: Date      // added via timestamps: true
}
```

Model: `backend/models/Operation.js`. It is the single source of truth for the history page and dashboard stats.

---

## 15. Security

- **Sandboxing**: filenames validate against `^[\w][\w ._\-()@^$!#%&+,;=]{0,254}$` (letters, numbers, spaces, dots, dashes, underscores and a small safe set). `/`, `\`, `..` and null bytes are rejected.
- **Defense in depth**: `utils/safePath.js` resolves every name through `path.resolve` and double-checks the final path is **inside** `backend/storage` before any I/O.
- **Input validation**: controllers/services validate bodies before touching disk or the database (400 on empty/invalid input, 404 not found, 409 conflict).
- **Error handling**: centralized middleware; Mongoose validation/Cast/duplicate errors are translated to friendly messages — no stack traces leaked.
- **Resilient to a dead database**: DB-dependent routes return `503` instead of crashing, queries fail fast (3 s buffer timeout) rather than hanging, and `unhandledRejection` / `uncaughtException` are logged rather than killing the process.
- **No hardcoded credentials**: the MongoDB URI comes from `MONGODB_URI`.
- This is a local teaching project: CORS is permissive and there is **no authentication** — do not expose it to the internet as-is.

---

## 16. Screenshots

| Placeholder |
| ----------- |
| (Add screenshots of Dashboard, File System Lab, URL Explorer, History and Docs here) |

---

## 17. Learning Outcomes

After this lab you can explain:

1. Why MongoDB was added — **persistent, queryable operation history** (vs the old JSON file).
2. Why MongoDB is the **"M" in MERN** — it is the database layer of the stack.
3. What **Express** does — HTTP routing, middleware, REST endpoints.
4. What **React** does — declarative UI rendered from API state.
5. What **Node.js** does — runs `fs` / `url` / HTTP server logic outside the browser.
6. How **React → Express** — `fetch()` + JSON over HTTP.
7. How **Express → MongoDB** — Mongoose models (`find`, `create`, `deleteMany`, `countDocuments`).
8. What **Mongoose** is — an ODM: schema + query model over MongoDB.
9. What **CRUD** means — Create/Read/Update/Delete maps to `POST/GET/(PUT|PATCH)/DELETE`.
10–16. How **`fs.writeFile/readFile/appendFile/rename/unlink/readdir/stat`** work (see Section 12).
17. How the **Node.js URL API** parses and manipulates URLs.
18. What **`URLSearchParams`** adds — a purpose-built interface for query strings.
19. How **REST APIs** work — resources + HTTP verbs + JSON.
20. How the app **prevents path traversal** — filename validation + `path.resolve` containment (Section 15).

---

*Generated as part of the Web Technologies course assignment. All operations run against a real Express server and are saved to MongoDB — try them at http://localhost:5173.*