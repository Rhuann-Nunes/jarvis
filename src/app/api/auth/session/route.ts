import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Retornar a sessão, incluindo o token de acesso do Supabase
    return NextResponse.json(session || { user: null });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 