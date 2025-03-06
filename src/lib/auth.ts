import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";

// Replace Prisma adapter with Supabase adapter
import { SupabaseAdapter } from "@auth/supabase-adapter";

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  }),
  debug: process.env.NODE_ENV !== "production", // Habilitar debug apenas em ambiente de desenvolvimento
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  events: {
    createUser: async ({ user }) => {
      console.log("User created:", user);
    },
    linkAccount: async ({ user, account, profile }) => {
      console.log("Account linked:", { userId: user.id, provider: account.provider });
    },
    signIn: async ({ user, account, profile, isNewUser }) => {
      console.log("User signed in:", { 
        userId: user.id, 
        provider: account?.provider,
        isNewUser 
      });
      
      // For Google users, email is already verified
      // No need to manually update emailVerified as was done with Prisma
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("SignIn callback iniciado:", {
          user,
          accountProvider: account?.provider,
          accountType: account?.type,
          hasProfile: !!profile
        });
        
        // Se estivermos usando o Google como provedor
        if (account?.provider === "google") {
          // Verificar se o e-mail foi verificado no Google
          // @ts-ignore - O tipo profile do Google pode não estar definido corretamente
          const emailVerified = profile?.email_verified;
          
          if (!emailVerified) {
            console.error("Google email not verified:", profile?.email);
            return false;
          }
          
          if (!user.email) {
            console.error("User has no email in profile");
            return false;
          }
          
          // Se chegamos aqui, permitir a autenticação
          console.log("Google sign-in successful for:", user.email);
          return true;
        }
        
        // Para outros provedores
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    
    async session({ session, token, user }) {
      // Quando usando jwt como estratégia, token estará disponível, mas user pode ser undefined
      if (token) {
        session.user.id = token.sub || token.id as string;
        
        // Gerar o token de acesso do Supabase
        const signingSecret = process.env.SUPABASE_JWT_SECRET;
        if (signingSecret) {
          const payload = {
            aud: "authenticated",
            exp: Math.floor(new Date(session.expires).getTime() / 1000),
            sub: token.sub || token.id as string,
            email: token.email || session.user.email,
            role: "authenticated",
          };
          // @ts-ignore - Adicionando propriedade ao objeto session
          session.supabaseAccessToken = jwt.sign(payload, signingSecret);
        }
      } 
      // Quando usando "database" como estratégia, user estará disponível
      else if (user) {
        session.user.id = user.id;
      }
      
      return session;
    },
    
    async jwt({ token, user, account }) {
      // Inicial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      
      // Incluir informações da conta, se disponível
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
    }
  },
}; 