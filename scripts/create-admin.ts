import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { createUser, findUserByEmail } from '../server/db';
import { User } from '../server/types';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'Administrator';

function fail(message: string): never {
  console.error(`Administrator creation failed: ${message}`);
  process.exit(1);
}

if (!email || !password) {
  fail('set ADMIN_EMAIL and ADMIN_PASSWORD before running this command.');
}
if (!/^\S+@\S+\.\S+$/.test(email)) {
  fail('ADMIN_EMAIL must be a valid email address.');
}
if (name.length < 2 || name.length > 100) {
  fail('ADMIN_NAME must contain between 2 and 100 characters.');
}
if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
  fail('ADMIN_PASSWORD must have 10+ characters and include uppercase, lowercase, and a number.');
}
if (findUserByEmail(email)) {
  fail('an account with ADMIN_EMAIL already exists. Use npm run admin:reset to change an existing administrator password.');
}

const now = new Date().toISOString();
const admin: User = {
  id: `user-admin-${randomUUID()}`,
  name,
  email,
  passwordHash: bcrypt.hashSync(password, 12),
  role: 'ADMIN',
  isActive: true,
  isVerified: true,
  createdAt: now,
  preferredLanguage: 'en',
  stats: {
    points: 0,
    streakDays: 1,
    testsAttempted: 0,
    testsCompleted: 0,
    avgScore: 0,
    avgAccuracy: 0,
  },
};

createUser(admin);
console.log('Administrator account created. Sign in with the email and password you supplied.');
