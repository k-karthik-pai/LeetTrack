import 'dotenv/config';
import { connectDatabase } from '../server/db.js';
import { User } from '../server/models.js';
const address = process.argv[2]?.trim().toLowerCase();
if (!address || !address.includes('@')) throw new Error('Usage: npm run admin -- existing-student@college.edu');
const db = await connectDatabase();
try {
  const user = await User.findOne({ email: address, college: 'campus' });
  if (!user) throw new Error('Register this account in the app first. No account was changed.');
  user.role = 'admin'; user.verified = true; await user.save();
  console.log(`Administrator access granted to ${user.email}.`);
} finally { await db.close(); }
