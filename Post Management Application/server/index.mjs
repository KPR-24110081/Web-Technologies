/**
 * Express application entry point.
 *
 *   React SPA  --fetch()-->  /api/*  -->  Express routes  -->  MongoDB
 *
 * In development the Vite dev server proxies /api here, so no CORS issues.
 * In production this same process also serves the built React app from app/dist.
 */
import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnvironment, optionalEnv, boolEnv } from './loadEnvironment.mjs';
import { connect, close, getPostsCollection } from './db/conn.mjs';
import { postsRouter, HttpError } from './routes/posts.mjs';

loadEnvironment();

const serverRoot = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(optionalEnv('PORT', '5000'));
const clientDist = resolve(serverRoot, '..', 'app', 'dist');

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

app.use(express.json({ limit: '1mb' }));

// cors is unnecessary when Vite proxies /api, but harmless and helpful if the
// SPA is opened from a different origin (e.g. a static host or phone on LAN).
app.use(
  cors({
    origin: optionalEnv('CORS_ORIGIN', '*') === '*' ? true : optionalEnv('CORS_ORIGIN').split(','),
    credentials: false,
  }),
);

// Compact request log - skips static asset noise.
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const started = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
    });
  }
  next();
});

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use('/api/posts', postsRouter);

// Unknown /api/* path -> JSON 404 (never fall through to the SPA).
app.use('/api', (req, res) => {
  res.status(404).json({ error: { message: `No API route matches ${req.method} ${req.originalUrl}` } });
});

// ---------------------------------------------------------------------------
// Static React build (production only)
// ---------------------------------------------------------------------------

const shouldServeClient =
  boolEnv('SERVE_CLIENT', true) && existsSync(resolve(clientDist, 'index.html'));

if (shouldServeClient) {
  app.use(express.static(clientDist));
  // Client-side routing: hand every non-API GET to index.html.
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(resolve(clientDist, 'index.html'));
  });
  console.log(`[web] serving built React app from ${clientDist}`);
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'Post Management API is running. Start the Vite dev server for the React UI.',
      api: '/api/posts',
    });
  });
}

// ---------------------------------------------------------------------------
// Error handling (must be registered last, needs all 4 params)
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars -- Express detects handlers by arity.
app.use((error, req, res, next) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      error: { message: error.message, ...(error.details ? { details: error.details } : {}) },
    });
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: { message: 'Malformed JSON in request body.' } });
  }

  console.error('[error]', error);

  res.status(500).json({
    error: {
      message: optionalEnv('NODE_ENV') === 'production' ? 'Internal server error.' : error.message,
    },
  });
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

const server = app.listen(PORT, async () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] base URL: http://localhost:${PORT}/api/posts`);

  try {
    await connect();
    const posts = await getPostsCollection();

    // Only indexes that match real query patterns. (Search uses an escaped
    // regex rather than $text, so a text index would never be used.)
    await posts.createIndex({ createdAt: -1 });
    await posts.createIndex({ tags: 1 });

    console.log('[db] ready');
  } catch (error) {
    console.error(`[db] startup connection failed: ${error.message}`);
    console.error('[db] check MONGODB_URI in server/.env and that MongoDB is running.');
  }
});

async function shutdown(signal) {
  console.log(`\n[api] ${signal} received, shutting down.`);
  server.close(async () => {
    await close();
    process.exit(0);
  });
  // Do not hang forever on stuck sockets.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
