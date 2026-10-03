/**
 * Seeds the posts collection with sample data.
 *
 *   npm run seed          # clears existing posts, inserts the samples
 *   npm run seed -- --keep   # inserts without clearing
 */
import process from 'node:process';
import { loadEnvironment } from '../loadEnvironment.mjs';
import { getPostsCollection, close } from '../db/conn.mjs';

loadEnvironment();

const keepExisting = process.argv.includes('--keep');

const SAMPLES = [
  {
    title: 'Welcome to the Post Management App',
    author: 'Aarav Sharma',
    tags: ['announcement', 'meta'],
    published: true,
    content:
      'This application is a full-stack blog built with React, Express and MongoDB.\n\n' +
      'The React front end talks to the Express REST API using the browser fetch() API, ' +
      'and the API stores everything in MongoDB through the native MongoDB Node driver.',
  },
  {
    title: 'How the REST API is structured',
    author: 'Aarav Sharma',
    tags: ['express', 'rest', 'backend'],
    published: true,
    content:
      'Every endpoint lives in server/routes/posts.mjs and follows resource-based URLs.\n\n' +
      '- GET    /api/posts    lists posts\n' +
      '- GET    /api/posts/:id fetches one post\n' +
      '- POST   /api/posts    creates a post\n' +
      '- PUT    /api/posts/:id updates a post\n' +
      '- DELETE /api/posts/:id deletes a post\n\n' +
      'Errors are returned as JSON with a 4xx or 5xx status code.',
  },
  {
    title: 'Draft: notes on MongoDB indexing',
    author: 'Priya Nair',
    tags: ['mongodb', 'backend'],
    published: false,
    content:
      'Unfinished draft.\n\nIndexes worth adding later: a compound index on ' +
      '{ published: 1, createdAt: -1 } so that filtered, date-sorted list queries ' +
      'stay fast as the collection grows.',
  },
  {
    title: 'Draft: styling ideas for the reading view',
    author: 'Priya Nair',
    tags: ['design', 'css'],
    published: false,
    content:
      'Unfinished draft.\n\nIdeas: constrain the article column to roughly 70 characters, ' +
      'increase line height for body copy, and keep tags as small pill badges.',
  },
];

async function main() {
  const posts = await getPostsCollection();

  if (!keepExisting) {
    const { deletedCount } = await posts.deleteMany({});
    console.log(`[seed] removed ${deletedCount} existing post(s)`);
  }

  const now = Date.now();
  const docs = SAMPLES.map((post, index) => {
    // Stagger createdAt so the "newest first" ordering is deterministic.
    const createdAt = new Date(now - (SAMPLES.length - index) * 3_600_000);
    return { ...post, createdAt, updatedAt: createdAt };
  });

  const { insertedCount } = await posts.insertMany(docs);
  console.log(`[seed] inserted ${insertedCount} post(s)`);
  console.log(`[seed] ${SAMPLES.filter((p) => p.published).length} published, ${SAMPLES.filter((p) => !p.published).length} draft(s)`);

  await close();
}

main().catch(async (error) => {
  console.error('[seed] failed:', error.message);
  await close().catch(() => {});
  process.exit(1);
});
