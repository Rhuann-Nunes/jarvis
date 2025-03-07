import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Essas rotas não precisam de verificação de assinatura, apenas autenticação
const AUTH_ONLY_ROUTES = [
  '/subscription',
  '/subscription/plans',
  '/subscription/checkout',
  '/api/subscription',
  '/api/subscription/:path*',
];

// Rotas públicas (não precisam de autenticação)
const PUBLIC_ROUTES = [
  '/login',
  '/api/auth',
  '/auth/callback',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se a rota é pública (não precisa de autenticação)
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
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
  
  // Se a rota não precisa de verificação de assinatura, permitir acesso
  if (AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Verificar se o usuário tem uma assinatura ativa
  try {
    const userId = token.sub; // O ID do usuário geralmente está no sub do token JWT
    
    // Para o middleware, vamos fazer a verificação simplificada de assinatura por API
    const response = await fetch(`${request.nextUrl.origin}/api/subscription`, {
      method: 'GET',
      headers: {
        Cookie: request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
      },
    });
    
    // Se a API retornar erro, redirecionamos para a página de planos
    if (!response.ok) {
      console.error('Erro ao verificar assinatura via API:', await response.json());
      return NextResponse.redirect(new URL('/subscription/plans', request.url));
    }
    
    const data = await response.json();
    
    // Se não tem assinatura ativa, redirecionar para a página de planos
    if (!data.hasSubscription) {
      return NextResponse.redirect(new URL('/subscription/plans', request.url));
    }
    
    // Se tiver assinatura ativa, permitir acesso
    return NextResponse.next();
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    // Em caso de erro, redirecionar para a página de planos
    return NextResponse.redirect(new URL('/subscription/plans', request.url));
  }
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
    '/subscription',
    '/subscription/:path*',
    
    // APENAS rotas API específicas que precisam de proteção
    '/api/user',
    '/api/user/:path*',
    '/api/tasks',
    '/api/tasks/:path*',
    '/api/projects',
    '/api/projects/:path*',
    '/api/subscription',
    '/api/subscription/:path*'
  ]
};

