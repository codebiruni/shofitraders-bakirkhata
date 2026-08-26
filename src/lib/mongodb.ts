import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB ?? "shofi_traders";

if (!MONGODB_URI) {
  // We don't throw at import time so the app can still build.
  // Database calls will throw a clear error when invoked without a URI.
  console.warn(
    "[mongodb] MONGODB_URI is not set. Set it in .env.local before using the app."
  );
}

type Cached = { client: MongoClient | null; promise: Promise<MongoClient> | null };

declare global {
   
  var __mongoClient: Cached | undefined;
}

const cached: Cached = global.__mongoClient ?? { client: null, promise: null };
if (!global.__mongoClient) global.__mongoClient = cached;

export async function getClient(): Promise<MongoClient> {
  if (cached.client) return cached.client;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured. Add it to your .env.local file.");
  }
  if (!cached.promise) {
    cached.promise = new MongoClient(MONGODB_URI, {
      // Keep the client lean; default pool is fine for single-user app.
    }).connect();
  }
  cached.client = await cached.promise;
  return cached.client;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(MONGODB_DB);
}
