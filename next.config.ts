import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Não falhar o build em caso de aviso ou erro do ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Não falhar o build em caso de erro de tipos TypeScript
    ignoreBuildErrors: true,
  }
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

export default pwaConfig(nextConfig);
