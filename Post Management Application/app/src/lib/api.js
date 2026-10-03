/**
 * Thin wrapper around the browser's native fetch() API.
 *
 * Every component talks to the backend through this module, so request
 * formatting and error handling live in exactly one place.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

/** An error carrying the HTTP status and any per-field validation details. */
export class ApiError extends Error {
  constructor(message, { status = 0, details = null, isNetworkError = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Performs a request and returns the parsed JSON body.
 * @param {string} path      path relative to the API base, e.g. '/posts'
 * @param {object} [options] standard fetch options plus `query`
 */
async function request(path, { query, body, headers, ...options } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch() only rejects on a network-level failure, never on 4xx/5xx.
    throw new ApiError(
      'Could not reach the server. Is the Express API running on port 5000?',
      { isNetworkError: true },
    );
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const error = payload?.error ?? {};
    throw new ApiError(error.message ?? `Request failed with status ${response.status}`, {
      status: response.status,
      details: error.details ?? null,
    });
  }

  return payload;
}

/** Parses a response body as JSON, tolerating empty or non-JSON bodies. */
async function readJson(response) {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * Lists posts.
 * @param {{ published?: boolean, q?: string, page?: number, limit?: number }} params
 */
export function listPosts({ published, q, page, limit } = {}) {
  return request('/posts', {
    query: { published, q, page, limit },
  });
}

/** Fetches a single post by id. */
export function getPost(id) {
  return request(`/posts/${encodeURIComponent(id)}`);
}

/** Creates a post. */
export function createPost(post) {
  return request('/posts', { method: 'POST', body: post });
}

/** Updates an existing post. */
export function updatePost(id, post) {
  return request(`/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: post });
}

/** Deletes a post. */
export function deletePost(id) {
  return request(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Convenience helpers for the two list views. */
export const listPublishedPosts = (params) => listPosts({ ...params, published: true });
export const listDraftPosts = (params) => listPosts({ ...params, published: false });
