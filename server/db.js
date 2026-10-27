import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export async function connectDatabase({ temporary = false } = {}) {
  let mongo;
  let uri = process.env.MONGODB_URI;
  if (temporary || !uri) {
    if (!temporary && process.env.NODE_ENV === 'production') throw new Error('MONGODB_URI is required in production.');
    const storage = path.resolve('.data/mongo');
    await mkdir(storage, { recursive: true });
    process.env.MONGOMS_DOWNLOAD_DIR ||= path.resolve('.data/mongodb-binaries');
    mongo = await MongoMemoryServer.create({
      binary: { version: '7.0.24' },
      instance: { ...(temporary ? {} : { dbPath: storage }), storageEngine: 'wiredTiger', ip: '127.0.0.1' }
    });
    uri = mongo.getUri(temporary ? 'leettrack_test' : 'leettrack');
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return { uri, close: async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); } };
}
