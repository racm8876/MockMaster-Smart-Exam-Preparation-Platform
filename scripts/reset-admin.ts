import bcrypt from 'bcryptjs';
import { findUserByEmail, updateUser } from '../server/db';

const currentEmail = process.env.ADMIN_CURRENT_EMAIL?.trim().toLowerCase();
const newEmail = (process.env.ADMIN_NEW_EMAIL || currentEmail)?.trim().toLowerCase();
const newPassword = process.env.ADMIN_NEW_PASSWORD;

function fail(message: string): never {
  console.error(`Admin recovery failed: ${message}`);
  process.exit(1);
}

if (!currentEmail || !newEmail || !newPassword) {
  fail('set ADMIN_CURRENT_EMAIL, ADMIN_NEW_EMAIL (or reuse the current email), and ADMIN_NEW_PASSWORD before running this command.');
}
if (!/^\S+@\S+\.\S+$/.test(currentEmail) || !/^\S+@\S+\.\S+$/.test(newEmail)) {
  fail('email addresses must be valid.');
}
if (newPassword.length < 10 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
  fail('the new password must have 10+ characters and include uppercase, lowercase, and a number.');
}

const admin = findUserByEmail(currentEmail);
if (!admin || admin.role !== 'ADMIN') {
  fail('no administrator account was found for ADMIN_CURRENT_EMAIL.');
}

if (newEmail !== currentEmail) {
  const userAtNewEmail = findUserByEmail(newEmail);
  if (userAtNewEmail && userAtNewEmail.id !== admin.id) {
    fail('ADMIN_NEW_EMAIL is already in use.');
  }
}

admin.email = newEmail;
admin.passwordHash = bcrypt.hashSync(newPassword, 12);
updateUser(admin);
console.log('Administrator email and password were updated. Sign in with the new credentials.');
