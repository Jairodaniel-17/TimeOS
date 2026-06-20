import { NextResponse } from 'next/server';
import { getUsers, getUserByEmail, updateUser } from '@/lib/luma-docs';

// Default passwords for seeded users (used only as fallback for users without one)
const DEFAULT_PASSWORDS: Record<string, string> = {
  'user_1': 'admin123',
  'user_2': 'carlos123',
  'user_3': 'maria123',
  'user_4': 'pedro123',
  'user_5': 'laura123',
};

export async function GET() {
  try {
    const users = await getUsers();
    const updated: string[] = [];

    for (const user of users) {
      // getUsers() no longer returns the password hash, so read the full doc.
      const fullUser = await getUserByEmail(user.email);
      const currentPassword = fullUser?.password;

      if (!currentPassword) {
        const password = DEFAULT_PASSWORDS[user.id] || 'password123';
        // updateUser now auto-hashes the password
        await updateUser(user.id, { password, isActive: true });
        updated.push(user.email);
        continue;
      }

      // Upgrade plaintext passwords to bcrypt
      const isBcrypt = currentPassword.startsWith('$2b$') || currentPassword.startsWith('$2a$');
      if (!isBcrypt) {
        await updateUser(user.id, { password: currentPassword });
        updated.push(user.email);
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: updated.length > 0 ? `Upgraded ${updated.length} users` : 'All passwords already hashed',
      upgraded: updated,
      userCount: users.length,
    });
  } catch (error) {
    console.error('Error checking users:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to check users', error: String(error) },
      { status: 500 }
    );
  }
}
