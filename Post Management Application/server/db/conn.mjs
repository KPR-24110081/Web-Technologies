/**
 * MongoDB connection layer using the *native* MongoDB Node.js driver (no Mongoose).
 *
 * A single MongoClient is created lazily and reused for the lifetime of the
 * process - this is the documented best practice, since clients pool sockets
 * internally and creating one per request is expensive.
 */
import { MongoClient, ServerApiVersion } from 'mongodb';
import { optionalEnv, requireEnv } from '../loadEnvironment.mjs';

let client = null;
let database = null;

function connectionOptions() {
  return {
    // Stable API version so behaviour does not drift between server releases.
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    appName: 'pma-server',
  };
}

/**
 * Opens the shared MongoClient (idempotent).
 * @returns {Promise<import('mongodb').MongoClient>}
 */
export async function connect() {
  if (client) return client;

  const uri = requireEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017');
  const dbName = optionalEnv('MONGODB_DB', 'pma_blog');

  client = new MongoClient(uri, connectionOptions());

  try {
    await client.connect();
  } catch (error) {
    // Drop the reference so a later retry can start from a clean slate.
    client = null;
    throw error;
  }

  database = client.db(dbName);

  // Fail fast here rather than on the first request.
  await database.command({ ping: 1 });

  console.log(`[db] connected to "${dbName}" via ${redactUri(uri)}`);

  return client;
}

/** Returns the current database handle, connecting first if necessary. */
export async function getDb() {
  if (!database) await connect();
  return database;
}

/** Returns the posts collection, creating the collection if it is missing. */
export async function getPostsCollection() {
  const db = await getDb();
  const name = optionalEnv('POSTS_COLLECTION', 'posts');

  if (!(await db.listCollections({ name }, { nameOnly: true }).hasNext())) {
    console.log(`[db] creating collection "${name}"`);
    try {
      await db.createCollection(name);
    } catch (error) {
      // NamespaceExists is fine - another process won the race.
      if (error.codeName !== 'NamespaceExists') throw error;
    }
  }

  return db.collection(name);
}

/** Closes the shared client. Safe to call when never connected. */
export async function close() {
  if (!client) return;
  await client.close();
  client = null;
  database = null;
  console.log('[db] connection closed');
}

/** Hides credentials before a connection string reaches the console. */
function redactUri(uri) {
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
}
