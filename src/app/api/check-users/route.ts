import { NextResponse } from 'next/server';
import { getUsers, updateUser } from '@/lib/luma-docs';

export async function GET() {
  try {
    const users = await getUsers();
    
    // Check for users without password
    const usersWithoutPassword = users.filter(u => !u.password);
    
    if (usersWithoutPassword.length > 0) {
      console.log('Found users without password:', usersWithoutPassword.map(u => ({ id: u.id, email: u.email })));
      
      // Update users with default passwords
      const defaultPasswords: Record<string, string> = {
        'user_1': 'admin123',
        'user_2': 'carlos123',
        'user_3': 'maria123',
        'user_4': 'pedro123',
        'user_5': 'laura123',
      };
      
      for (const user of usersWithoutPassword) {
        const password = defaultPasswords[user.id] || 'password123';
        await updateUser(user.id, { 
          password, 
          isActive: true 
        });
        console.log(`Updated user ${user.email} with password`);
      }
      
      return NextResponse.json({ 
        status: 'ok', 
        message: `Updated ${usersWithoutPassword.length} users with passwords`,
        users: usersWithoutPassword.map(u => ({ id: u.id, email: u.email }))
      });
    }
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'All users have passwords',
      userCount: users.length,
      users: users.map(u => ({ id: u.id, email: u.email, hasPassword: !!u.password, isActive: u.isActive }))
    });
  } catch (error) {
    console.error('Error checking users:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to check users', error: String(error) },
      { status: 500 }
    );
  }
}