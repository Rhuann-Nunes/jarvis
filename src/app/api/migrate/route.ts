import { NextResponse } from 'next/server';
import { migrateToSupabase } from '@/scripts/migrate-to-supabase';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  try {
    // Get current user from session
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get request data
    const data = await request.json();
    
    // Run migration
    await migrateToSupabase(
      session.user.email,
      session.user.name || 'User',
      session.user.image || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error during migration:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
} 