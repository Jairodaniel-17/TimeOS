import { NextResponse } from 'next/server';
import { initializeDocumentStore, clearAllData } from '@/lib/luma-docs';
import { seedDocumentStore } from '@/lib/seed-docs';

export async function GET() {
  try {
    const isHealthy = await initializeDocumentStore();
    
    return NextResponse.json({ 
      status: 'ok',
      database: isHealthy ? 'connected' : 'error',
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
    // Initialize Document Store
    await initializeDocumentStore();
    
    // Seed with initial data
    await seedDocumentStore();
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Document Store initialized and seeded successfully' 
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database initialization failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Clear all data (useful for reset)
    await clearAllData();
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'All data cleared' 
    });
  } catch (error) {
    console.error('Failed to clear data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to clear data' },
      { status: 500 }
    );
  }
}