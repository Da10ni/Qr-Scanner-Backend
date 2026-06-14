import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './db.js';
import User from './models/User.js';

async function run() {
  await connectDB(process.env.MONGODB_URI);
  const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await User.findOne({ username });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`✓ Admin user "${username}" password reset.`);
  } else {
    await User.create({ username, passwordHash, role: 'admin' });
    console.log(`✓ Admin user "${username}" created.`);
  }
  console.log(`   Password: ${password}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
