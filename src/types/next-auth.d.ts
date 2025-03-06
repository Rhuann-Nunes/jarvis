import "next-auth";
import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import NextAuth from "next-auth";

// Estendendo o tipo User em Session
declare module "next-auth" {
  /**
   * Estendendo a interface Session para incluir propriedades personalizadas
   */
  interface Session {
    // Token de acesso do Supabase para uso com RLS
    supabaseAccessToken?: string;
    user: {
      // Garantir que user.id está sempre disponível
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}

// Estendendo o tipo JWT
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
} 