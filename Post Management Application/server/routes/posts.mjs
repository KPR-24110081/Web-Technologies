/**
 * REST routes for blog posts.
 *
 *   GET    /api/posts          list posts (filter by ?published, search with ?q)
 *   GET    /api/posts/:id      fetch a single post
 *   POST   /api/posts          create a post
 *   PUT    /api/posts/:id      update a post
 *   DELETE /api/posts/:id      delete a post
 *
 * Every response uses JSON. Errors always look like:
 *   { "error": { "message": string, "details"?: object } }
 */
import express from 'express';
import { ObjectId } from 'mongodb';
import { getPostsCollection } from '../db/conn.mjs';

const postsRouter = express.Router();

const LIMITS = { title: 200, content: 20000, author: 120, tag: 40, maxTags: 10 };
const MAX_PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Thrown for any client mistake; carries an HTTP status and optional details. */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

/** Converts a string to an ObjectId or throws a 400. */
function toObjectId(id) {
  if (!ObjectId.isValid(id)) {
    throw new HttpError(400, `Invalid post id "${id}".`);
  }
  return new ObjectId(id);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Coerces loose input (query strings, form data) into a trimmed string. */
function toText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/** Coerces truthy/falsy input into a real boolean. */
function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

/** Normalises a tags value into a clean, de-duplicated array of strings. */
function toTags(value) {
  if (value === undefined || value === null || value === '') return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return [...new Set(list.map((tag) => toText(tag)).filter(Boolean))].slice(0, LIMITS.maxTags);
}

/**
 * Validates and normalises the fields of an incoming post.
 * @param {object} body
 * @param {{ partial?: boolean }} [options] when partial, absent fields are ignored
 */
function validatePost(body, { partial = false } = {}) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object.');
  }

  const errors = {};
  const doc = {};

  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  // On a full create every required field is checked. On a partial update only
  // the keys actually present are validated.
  if (!partial || has('title')) {
    const title = toText(body.title);
    if (!title) errors.title = 'Title is required.';
    else if (title.length > LIMITS.title) errors.title = `Title must be at most ${LIMITS.title} characters.`;
    else doc.title = title;
  }

  if (!partial || has('content')) {
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content) errors.content = 'Content is required.';
    else if (content.length > LIMITS.content) {
      errors.content = `Content must be at most ${LIMITS.content} characters.`;
    } else doc.content = content;
  }

  if (has('author')) {
    const author = toText(body.author);
    if (author.length > LIMITS.author) errors.author = `Author must be at most ${LIMITS.author} characters.`;
    else doc.author = author;
  } else if (!partial) {
    doc.author = 'Anonymous';
  }

  if (has('tags')) {
    const tags = toTags(body.tags);
    const tooLong = tags.find((tag) => tag.length > LIMITS.tag);
    if (tooLong) errors.tags = `Each tag must be at most ${LIMITS.tag} characters.`;
    else doc.tags = tags;
  } else if (!partial) {
    doc.tags = [];
  }

  if (has('published')) doc.published = toBoolean(body.published, false);
  else if (!partial) doc.published = false;

  if (Object.keys(errors).length > 0) {
    throw new HttpError(422, 'Validation failed.', errors);
  }

  return doc;
}

/** Builds the MongoDB filter for GET /api/posts. */
function buildListFilter(query) {
  const filter = {};

  const published = toText(query.published).toLowerCase();
  if (published === 'true' || published === '1') filter.published = true;
  else if (published === 'false' || published === '0') filter.published = false;

  const q = toText(query.q);
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: pattern }, { content: pattern }, { author: pattern }, { tags: pattern }];
  }

  const tag = toText(query.tag);
  if (tag) filter.tags = tag;

  return filter;
}

function buildPagination(query) {
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), MAX_PAGE_SIZE);
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  return { limit, skip: (page - 1) * limit, page };
}

/** Strips Mongo internals and adds a short excerpt for list views. */
function toPublicPost(doc) {
  if (!doc) return null;

  const content = typeof doc.content === 'string' ? doc.content : '';
  const plain = content.replace(/\s+/g, ' ').trim();

  return {
    id: String(doc._id),
    title: doc.title,
    content: content,
    excerpt: plain.length > 180 ? `${plain.slice(0, 180).trimEnd()}…` : plain,
    author: doc.author ?? 'Anonymous',
    tags: doc.tags ?? [],
    published: Boolean(doc.published),
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** GET /api/posts - list posts, newest first. */
postsRouter.get('/', async (req, res) => {
  const posts = await getPostsCollection();
  const filter = buildListFilter(req.query);
  const { limit, skip, page } = buildPagination(req.query);

  const [docs, total] = await Promise.all([
    posts.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).toArray(),
    posts.countDocuments(filter),
  ]);

  res.json({
    posts: docs.map(toPublicPost),
    pagination: { total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) },
  });
});

/** GET /api/posts/:id - fetch one post. */
postsRouter.get('/:id', async (req, res) => {
  const posts = await getPostsCollection();
  const doc = await posts.findOne({ _id: toObjectId(req.params.id) });

  if (!doc) throw new HttpError(404, 'Post not found.');

  res.json({ post: toPublicPost(doc) });
});

/** POST /api/posts - create a post. */
postsRouter.post('/', async (req, res) => {
  const posts = await getPostsCollection();
  const payload = validatePost(req.body);
  const now = new Date();

  const result = await posts.insertOne({
    ...payload,
    createdAt: now,
    updatedAt: now,
  });

  const doc = await posts.findOne({ _id: result.insertedId });

  res.status(201).location(`/api/posts/${result.insertedId}`).json({ post: toPublicPost(doc) });
});

/** PUT /api/posts/:id - replace the editable fields of a post. */
postsRouter.put('/:id', async (req, res) => {
  const posts = await getPostsCollection();
  const _id = toObjectId(req.params.id);
  const payload = validatePost(req.body, { partial: true });

  const existing = await posts.findOne({ _id });
  if (!existing) throw new HttpError(404, 'Post not found.');

  const result = await posts.updateOne(
    { _id },
    { $set: { ...payload, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) throw new HttpError(404, 'Post not found.');

  res.json({ post: toPublicPost(await posts.findOne({ _id })) });
});

/** DELETE /api/posts/:id - remove a post. */
postsRouter.delete('/:id', async (req, res) => {
  const posts = await getPostsCollection();
  const _id = toObjectId(req.params.id);

  const result = await posts.deleteOne({ _id });
  if (result.deletedCount === 0) throw new HttpError(404, 'Post not found.');

  res.json({ deleted: true, id: String(_id) });
});

export { HttpError, toPublicPost };
export { postsRouter };
export default postsRouter;
