// One-time migration for installations that previously contained sample data.
import 'dotenv/config';
import mongoose from 'mongoose';
if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI to the running database for this migration.');
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const samples = await db.collection('users').find({ college: 'demo', demo: true }).project({ _id: 1 }).toArray();
const ids = samples.map(u => u._id);
const result = {};
result.snapshots = (await db.collection('snapshots').deleteMany({ user: { $in: ids } })).deletedCount;
for (const collection of ['groups', 'challenges', 'activities', 'departments', 'rosters']) result[collection] = (await db.collection(collection).deleteMany({ college: 'demo' })).deletedCount;
result.users = (await db.collection('users').deleteMany({ college: 'demo', demo: true })).deletedCount;
for (const id of ids) await db.collection('sessions').deleteMany({ session: { $regex: String(id) } });
console.log('Removed sample records:', result);
console.log('Remaining registered accounts:', await db.collection('users').countDocuments());
await mongoose.disconnect();
