import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Funções para o gerenciamento de preferências no localStorage
export const LOCAL_STORAGE_KEYS = {
  THEME: 'jarvis-theme',
  NOTIFICATION_PERMISSION: 'jarvis-notification-permission',
};

export function getLocalStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

export function setLocalStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

export function removeLocalStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

// Funções específicas para o tema
export function getThemePreference(): 'dark' | 'light' {
  const theme = getLocalStorageItem(LOCAL_STORAGE_KEYS.THEME);
  if (theme === 'dark' || theme === 'light') return theme;
  
  // Se não houver preferência salva, retorna 'dark' como padrão
  return 'dark';
}

export function setThemePreference(theme: 'dark' | 'light'): void {
  setLocalStorageItem(LOCAL_STORAGE_KEYS.THEME, theme);
  
  // Aplicar tema ao documento
  if (typeof window !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
} 