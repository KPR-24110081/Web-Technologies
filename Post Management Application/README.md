# Post Management Application

A full-stack blog application built with **React**, **Express.js / Node.js** and **MongoDB**.
The React front end talks to the Express REST API using the browser's native `fetch()`,
and the API persists data through the **native MongoDB Node.js driver** (no Mongoose).

```
React SPA  ──fetch()──▶  Express REST API  ──MongoClient──▶  MongoDB
 :5173                     :5000/api/posts                    pma_blog.posts
```

---

## 1. Features

| Feature | Where |
|---|---|
| Create a post (title, content, author, tags, published flag) | `app/src/pages/Create.jsx` → `POST /api/posts` |
| View all published posts, with live search | `app/src/pages/Home.jsx` → `GET /api/posts` |
| View a single post | `app/src/pages/Post.jsx` → `GET /api/posts/:id` |
| Edit a post | `Post.jsx` → `PUT /api/posts/:id` |
| Publish / unpublish a post (draft ⇄ published) | `Post.jsx` → `PUT /api/posts/:id` |
| Delete a post (with confirmation) | `Post.jsx` → `DELETE /api/posts/:id` |
| Archive of drafts | `app/src/pages/Archive.jsx` → `GET /api/posts?published=false` |
| Server-side validation with per-field messages | `server/routes/posts.mjs` |
| 64 automated end-to-end assertions | `npm test` |

A **draft** is an ordinary post with `published: false`. Home shows published posts,
Archive shows drafts, and publishing is a one-click update.

---

## 2. Project structure

```
PMA/
├── package.json                  # root scripts (setup, dev, seed, test, build)
├── app/
│   ├── index.html
│   ├── vite.config.js            # dev server + /api proxy to Express
│   ├── .env                      # VITE_API_BASE_URL
│   └── src/
│       ├── main.jsx              # React root + BrowserRouter
│       ├── App.jsx               # app shell and routes
│       ├── index.css
│       ├── lib/
│       │   ├── api.js            # fetch() client for every endpoint
│       │   └── format.js         # date / truncation helpers
│       ├── components/
│       │   ├── NavBar.jsx
│       │   ├── PostSummary.jsx   # post card used in the list views
│       │   ├── PostForm.jsx      # shared create/edit form
│       │   └── ErrorBanner.jsx
│       └── pages/
│           ├── Home.jsx
│           ├── Create.jsx
│           ├── Post.jsx
│           ├── Archive.jsx
│           └── NotFound.jsx
└── server/
    ├── .env                      # PORT, MONGODB_URI, MONGODB_DB, CORS_ORIGIN
    ├── .env.example
    ├── index.mjs                 # Express app, middleware, error handling, boot
    ├── loadEnvironment.mjs       # dependency-free .env loader
    ├── db/
    │   └── conn.mjs              # shared MongoClient, collection + index setup
    ├── routes/
    │   └── posts.mjs             # all CRUD endpoints
    └── scripts/
        ├── seed.mjs              # sample data
        └── smoke.mjs             # end-to-end API test suite
```

---

## 3. Prerequisites

- **Node.js 20.12+** (this was built and tested on Node v24)
- **MongoDB** running locally, or a MongoDB Atlas connection string

<details>
<summary>If you do not have MongoDB installed</summary>

Using Docker (this machine already has a `mongo:7` container publishing port 27017):

```bash
docker run -d --name pma-mongo -p 27017:27017 mongo:7
```
</details>

---

## 4. Setup

From the project root:

```bash
npm run setup     # installs root, server/ and app/ dependencies
```

Then point the API at your database. `server/.env` already defaults to a local
MongoDB on port 27017:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=pma_blog
```

**To use MongoDB Atlas instead**, replace `MONGODB_URI` with your Atlas string:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=pma
```

> When using Atlas, remember to add your own IP to the cluster's IP Access List.

Finally, load the sample posts:

```bash
npm run seed
```

---

## 5. Running the app

### Development (two servers, hot reload)

```bash
npm run dev
```

- React dev server → <http://localhost:5173>
- Express API → <http://localhost:5000/api/posts>

The Vite dev server **proxies** `/api` to Express (`app/vite.config.js`), so the browser
only ever talks to one origin — no CORS preflight and no hard-coded API host in the bundle.

### Production (single server)

```bash
npm run build     # builds the React app into app/dist
npm start         # Express serves both the API and the built SPA
```

Open <http://localhost:5000>. Unknown non-`/api` paths fall through to `index.html`
so client-side routes like `/post/<id>` survive a page refresh.

---

## 6. API reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness probe |
| `GET` | `/posts` | List posts |
| `GET` | `/posts/:id` | Fetch one post |
| `POST` | `/posts` | Create a post |
| `PUT` | `/posts/:id` | Update a post |
| `DELETE` | `/posts/:id` | Delete a post |

**Query parameters for `GET /api/posts`**

| Param | Example | Effect |
|---|---|---|
| `published` | `?published=true` / `false` | Only published / only drafts |
| `q` | `?q=mongo` | Case-insensitive search of title, content, author, tags |
| `tag` | `?tag=react` | Posts carrying a tag |
| `page` | `?page=2` | Page number (default 1) |
| `limit` | `?limit=20` | Page size (default 10, max 100) |

**Post document**

```json
{
  "id": "6ac0b4875d02c0a9bd17a40a",
  "title": "How the REST API is structured",
  "content": "Every endpoint lives in server/routes/posts.mjs…",
  "excerpt": "Every endpoint lives in server/routes/posts.mjs…",
  "author": "Aarav Sharma",
  "tags": ["express", "rest"],
  "published": true,
  "createdAt": "2026-10-03T09:00:00.000Z",
  "updatedAt": "2026-10-03T09:00:00.000Z"
}
```

**Creating a post**

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","content":"First post!","author":"Aarav","tags":["intro"],"published":true}'
```

**Error shape** — every failure returns the same JSON structure:

```json
{
  "error": {
    "message": "Validation failed.",
    "details": { "title": "Title is required." }
  }
}
```

| Status | Meaning |
|---|---|
| `400` | Malformed JSON body or invalid post id |
| `404` | No post with that id (or unknown `/api` route) |
| `422` | Validation failed — see `error.details` per field |
| `500` | Unexpected server error |

---

## 7. Environment variables

**`server/.env`** (see `.env.example`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Port for the Express server |
| `NODE_ENV` | `development` | `production` hides internal error messages |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017` | Connection string (local or Atlas) |
| `MONGODB_DB` | `pma_blog` | Database name |
| `POSTS_COLLECTION` | `posts` | Collection name |
| `CORS_ORIGIN` | `*` | Allowed browser origin(s), comma-separated |
| `SERVE_CLIENT` | `true` | Serve `app/dist` when it exists |

**`app/.env`**

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base URL the client prepends to every request |

`loadEnvironment.mjs` never overrides a real environment variable, so any value can be
overridden per-run without editing the file:

```bash
PORT=8080 npm start
```

---

## 8. Tests

```bash
npm test
```

`server/scripts/smoke.mjs` boots the real server on a throwaway port, then runs
**40 assertions** across every endpoint: create (201 + `Location`), validation (422),
malformed JSON (400), read, 400/404 handling, list + filter + search, regex-injection
safety, pagination limits, update, delete, and JSON 404s.

Verified during development (64 checks total, all passing):

```
server/scripts/smoke.mjs   40 passed, 0 failed   # API surface
full-stack check           17 passed, 0 failed   # SPA build + API on one server
Vite proxy check            7 passed, 0 failed   # dev server /api proxy
```

---

## 9. Notes on the implementation

- **Native driver, no Mongoose.** `db/conn.mjs` keeps one `MongoClient` for the whole
  process, pings on startup, and creates the collection plus indexes on boot.
- **No `dotenv` dependency.** `loadEnvironment.mjs` is a ~60-line parser supporting
  comments, quoted values and inline comments. Real env vars win over `.env` values.
- **Validation lives on the server.** The client validates for instant feedback, but the
  API re-validates everything — the client cannot be trusted.
- **Search input is escaped** before being turned into a `RegExp`, so a query such as
  `.*` cannot become a catastrophic-backtracking pattern.
- **ObjectIds are validated** with `ObjectId.isValid` before touching the database.
- **Search requests are debounced** (300 ms) and **responses are guarded** with an abort
  flag, so fast typing and StrictMode's double-invoke cannot race and clobber state.
- **Unknown `/api` paths return JSON**, never the SPA's `index.html`, so a typo in a
  fetch URL surfaces as a readable error instead of a confusing HTML parse failure.
