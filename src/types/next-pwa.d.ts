declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  
  export interface PWAConfig {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    scope?: string;
    sw?: string;
    runtimeCaching?: any[];
    publicExcludes?: string[];
    buildExcludes?: string[] | ((path: string) => boolean)[];
  }
  
  export default function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig;
} 