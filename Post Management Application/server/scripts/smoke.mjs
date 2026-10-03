/**
 * End-to-end smoke test for the Post Management API.
 *
 * Spawns the real server on a throwaway port, then exercises every REST
 * endpoint with the native fetch() API and asserts the responses.
 *
 *   npm run smoke
 */
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.SMOKE_PORT || 5099);
const BASE = `http://127.0.0.1:${PORT}`;
const postsUrl = `${BASE}/api/posts`;

let passed = 0;
let failed = 0;

function check(label, condition, extra = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${extra ? ` -> ${extra}` : ''}`);
  }
}

function section(name) {
  console.log(`\n${name}`);
}

/** Waits until the server answers /api/health, or throws after `timeoutMs`. */
async function waitForServer(timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  throw new Error(`Server did not become ready on ${BASE}`);
}

async function main() {
  const child = spawn(process.execPath, ['index.mjs'], {
    cwd: serverRoot,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test', SERVE_CLIENT: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  child.stdout.on('data', (d) => (serverLog += d));
  child.stderr.on('data', (d) => (serverLog += d));

  try {
    await waitForServer();
    check('server starts and responds to /api/health', true);

    // -- create -------------------------------------------------------------
    section('POST /api/posts  (create)');
    const createRes = await fetch(postsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Smoke Test Post',
        content: 'Verifying that the REST API and MongoDB are wired together correctly.',
        author: 'Test Harness',
        tags: ['testing', 'smoke'],
        published: true,
      }),
    });
    const created = await createRes.json();

    check('returns 201', createRes.status === 201, `got ${createRes.status}`);
    check('sets Location header', Boolean(createRes.headers.get('location')));
    check('returns an id', typeof created.post?.id === 'string');
    check('echoes title', created.post?.title === 'Smoke Test Post');
    check('sets published true', created.post?.published === true);
    check('normalises tags', Array.isArray(created.post?.tags) && created.post.tags.length === 2);
    check('adds createdAt', Boolean(created.post?.createdAt));
    check('adds excerpt', typeof created.post?.excerpt === 'string' && created.post.excerpt.length > 0);

    const id = created.post?.id;

    // -- validation ---------------------------------------------------------
    section('POST /api/posts  (validation)');
    const badRes = await fetch(postsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'no title here' }),
    });
    const bad = await badRes.json();

    check('rejects missing title with 422', badRes.status === 422, `got ${badRes.status}`);
    check('reports title detail', Boolean(bad.error?.details?.title));
    check('does not flag valid content', bad.error?.details?.content === undefined);

    const emptyRes = await fetch(postsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ', content: '' }),
    });
    const empty = await emptyRes.json();

    check('rejects blank title with 422', emptyRes.status === 422, `got ${emptyRes.status}`);
    check('reports both fields when both blank', Boolean(empty.error?.details?.title && empty.error?.details?.content));

    const malformed = await fetch(postsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ this is not json',
    });
    check('rejects malformed JSON with 400', malformed.status === 400, `got ${malformed.status}`);

    // -- read ---------------------------------------------------------------
    section('GET /api/posts/:id  (read one)');
    const readRes = await fetch(`${postsUrl}/${id}`);
    const read = await readRes.json();

    check('returns 200', readRes.status === 200, `got ${readRes.status}`);
    check('returns the same id', read.post?.id === id);

    const badId = await fetch(`${postsUrl}/not-an-objectid`);
    check('rejects malformed id with 400', badId.status === 400, `got ${badId.status}`);

    const missing = await fetch(`${postsUrl}/000000000000000000000000`);
    check('returns 404 for unknown id', missing.status === 404, `got ${missing.status}`);

    // -- list + filter ------------------------------------------------------
    section('GET /api/posts  (list, filter, search)');
    const listRes = await fetch(postsUrl);
    const list = await listRes.json();

    check('returns 200', listRes.status === 200, `got ${listRes.status}`);
    check('returns an array', Array.isArray(list.posts));
    check('includes the new post', list.posts.some((p) => p.id === id));
    check('includes pagination metadata', typeof list.pagination?.total === 'number');
    check('respects ?published=true', (await (await fetch(`${postsUrl}?published=true`)).json()).posts.every((p) => p.published === true));

    const search = await (await fetch(`${postsUrl}?q=Smoke%20Test`)).json();
    check('search ?q matches by title', search.posts.some((p) => p.id === id));

    const searchMiss = await (await fetch(`${postsUrl}?q=zzzznotarealterm`)).json();
    check('search with no match returns empty list', searchMiss.posts.length === 0);

    const regexSafe = await fetch(`${postsUrl}?q=${encodeURIComponent('.*')}`);
    check('search input cannot inject regex', regexSafe.status === 200, `got ${regexSafe.status}`);

    const limit = await (await fetch(`${postsUrl}?limit=1`)).json();
    check('respects ?limit', limit.posts.length <= 1);

    // -- update -------------------------------------------------------------
    section('PUT /api/posts/:id  (update)');
    const putRes = await fetch(`${postsUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Smoke Test Post (edited)' }),
    });
    const put = await putRes.json();

    check('returns 200', putRes.status === 200, `got ${putRes.status}`);
    check('updates the title', put.post?.title === 'Smoke Test Post (edited)');
    check('keeps untouched fields', put.post?.content === created.post.content);
    check('keeps the id', put.post?.id === id);
    check('advances updatedAt', new Date(put.post.updatedAt) >= new Date(created.post.createdAt));

    const putMissing = await fetch(`${postsUrl}/000000000000000000000000`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'nope' }),
    });
    check('update on unknown id returns 404', putMissing.status === 404, `got ${putMissing.status}`);

    // -- delete -------------------------------------------------------------
    section('DELETE /api/posts/:id  (delete)');
    const delRes = await fetch(`${postsUrl}/${id}`, { method: 'DELETE' });
    const del = await delRes.json();

    check('returns 200', delRes.status === 200, `got ${delRes.status}`);
    check('confirms deletion', del.deleted === true && del.id === id);
    check('post is gone', (await fetch(`${postsUrl}/${id}`)).status === 404);
    check('deleting twice returns 404', (await fetch(`${postsUrl}/${id}`, { method: 'DELETE' })).status === 404);

    // -- unknown api route --------------------------------------------------
    section('Error handling');
    const noRoute = await fetch(`${BASE}/api/does-not-exist`);
    check('unknown /api route returns JSON 404', noRoute.status === 404, `got ${noRoute.status}`);
    check('unknown /api route is JSON not HTML', (noRoute.headers.get('content-type') || '').includes('application/json'));
  } finally {
    child.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 400));
    child.kill('SIGKILL');
  }

  console.log(`\n${'-'.repeat(46)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log(`${'-'.repeat(46)}\n`);

  if (failed > 0) {
    console.log('--- server log ---');
    console.log(serverLog);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\nSmoke test crashed:', error);
  process.exit(1);
});
