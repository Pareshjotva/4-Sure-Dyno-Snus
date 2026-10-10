import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "dyno-snus";

if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function clientPromise() {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri!, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    global._mongoClientPromise = client.connect().catch((error) => {
      global._mongoClientPromise = undefined;
      throw error;
    });
  }
  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}
