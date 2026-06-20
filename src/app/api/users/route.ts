import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, updateUser } from '@/lib/luma-docs';
import { userSchema, userUpdateSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    // getUsers() already strips password hashes.
    const all = await getUsers();
    // Optional pagination: ?page=&pageSize= (non-breaking — full list by default).
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '0');
    const total = all.length;
    const users = page > 0 && pageSize > 0 ? all.slice((page - 1) * pageSize, page * pageSize) : all;
    return NextResponse.json({
      data: users,
      ...(page > 0 && pageSize > 0 ? { pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } : {}),
      success: true,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = userSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '), success: false },
        { status: 400 }
      );
    }

    const id = `user_${Date.now()}`;
    const user = await createUser({ id, ...parsed.data });
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ data: userWithoutPassword, success: true });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '), success: false },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    await updateUser(id, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', success: false },
      { status: 500 }
    );
  }
}
