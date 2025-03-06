'use client';

import { useEffect } from 'react';
import { getLocalStorageItem, LOCAL_STORAGE_KEYS, setThemePreference } from '@/lib/utils';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if there's already a theme preference in local storage
    const storedTheme = getLocalStorageItem(LOCAL_STORAGE_KEYS.THEME);
    
    if (storedTheme === 'light') {
      // If light mode is explicitly set, keep it
      document.documentElement.classList.remove('dark');
    } else {
      // If no preference or dark mode, set to dark mode
      document.documentElement.classList.add('dark');
      
      // If no preference exists yet, save dark mode as the default
      if (!storedTheme) {
        setThemePreference('dark');
      }
    }
  }, []);

  return <>{children}</>;
} 