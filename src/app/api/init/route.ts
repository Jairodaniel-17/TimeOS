import { NextResponse } from 'next/server';
import { initializeDatabase, checkDatabaseHealth } from '@/lib/db';

export async function GET() {
  try {
    const isHealthy = await checkDatabaseHealth();
    
    if (!isHealthy) {
      await initializeDatabase();
    }
    
    return NextResponse.json({ 
      status: 'ok',
      database: isHealthy ? 'connected' : 'initialized',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database connection failed' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database initialization failed' },
      { status: 500 }
    );
  }
}
