# NodeScope Backend

Express REST API + MongoDB (Mongoose) that executes real Node.js `fs` and `url` operations.

## Run

```bash
cp .env.example .env      # set MONGODB_URI etc. (already done on this machine)
npm install
npm run dev               # starts on http://localhost:5000
```

## Structure

```
backend/
├── server.js            # entry point: load dotenv, connect MongoDB, listen
├── app.js               # Express wiring (routes, cors, error handler)
├── config/db.js         # mongoose connection + database state helper
├── models/Operation.js  # Operation schema (operations collection)
├── routes/              # fileRoutes, urlRoutes, historyRoutes, statsRoutes
├── controllers/         # fileController, urlController, historyController, statsController, systemController
├── services/            # fileService, urlService — real fs/url logic
├── middleware/          # errorHandler (incl. Mongoose error translation)
├── utils/               # safePath (sandbox), errors, history (Mongo persistence)
└── storage/             # flat-filename sandbox with sample files
```

## Endpoints

| Method | Path                      | Purpose                       |
| ------ | ------------------------- | ----------------------------- |
| GET    | /api/health               | Server + MongoDB status       |
| GET    | /api/files                | List storage directory        |
| POST   | /api/files                | Create a file                 |
| GET    | /api/files/:name          | Read a file                   |
| PUT    | /api/files/:name          | Overwrite a file              |
| POST   | /api/files/:name/append   | Append to a file              |
| PATCH  | /api/files/:name/rename   | Rename a file                 |
| DELETE | /api/files/:name          | Delete a file                 |
| GET    | /api/files/:name/stats    | File metadata                 |
| POST   | /api/url/parse            | Parse a URL                   |
| POST   | /api/url/validate         | Validate a URL                |
| POST   | /api/url/params           | URLSearchParams inspection    |
| POST   | /api/url/modify           | set/append/delete a param     |
| POST   | /api/url/build            | Build a URL                   |
| POST   | /api/url/resolve          | Resolve a relative URL        |
| GET    | /api/history              | Operation history (MongoDB)   |
| DELETE | /api/history              | Clear history                 |
| GET    | /api/stats                | Dashboard aggregates          |

All file operations are sandboxed inside `backend/storage` (see `utils/safePath.js`).