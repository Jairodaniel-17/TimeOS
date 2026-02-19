import { NextResponse } from 'next/server';
import { clearAllData, initializeDocumentStore } from '@/lib/luma-docs';
import { seedDocumentStore } from '@/lib/seed-docs';

export async function POST() {
  try {
    console.log('Resetting database...');
    
    // Clear all existing data
    await clearAllData();
    console.log('Data cleared');
    
    // Initialize Document Store
    await initializeDocumentStore();
    console.log('Document Store initialized');
    
    // Seed with fresh data
    await seedDocumentStore();
    console.log('Data seeded successfully');
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Database reset and seeded successfully' 
    });
  } catch (error) {
    console.error('Database reset failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database reset failed', error: String(error) },
      { status: 500 }
    );
  }
}