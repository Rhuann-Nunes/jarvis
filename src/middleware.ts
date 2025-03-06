import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if the current route is login or an auth callback
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // Verificar se o usuário está autenticado
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // Se não estiver autenticado, redirecionar para login
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // Se estiver autenticado, permitir acesso
  return NextResponse.next();
}

// Configurar em quais caminhos o middleware será executado usando listas explícitas
export const config = {
  matcher: [
    // Rotas da aplicação protegidas
    '/',
    '/dashboard',
    '/dashboard/:path*',
    '/settings',
    '/settings/:path*',
    '/hoje',
    '/hoje/:path*',
    '/concluido',
    '/concluido/:path*',
    '/em-breve',
    '/em-breve/:path*',
    '/entradas',
    '/entradas/:path*',
    '/projeto',
    '/projeto/:path*',
    
    // APENAS rotas API específicas que precisam de proteção
    '/api/user',
    '/api/user/:path*',
    '/api/tasks',
    '/api/tasks/:path*',
    '/api/projects',
    '/api/projects/:path*'
  ]
};

