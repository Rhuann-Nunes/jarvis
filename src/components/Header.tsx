'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { SunIcon, MoonIcon, BellIcon } from '@heroicons/react/24/outline';
import { requestNotificationPermission, areNotificationsEnabled } from '@/lib/notifications';
import { getThemePreference, setThemePreference } from '@/lib/utils';

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const pathname = usePathname();
  
  useEffect(() => {
    // Obter preferência de tema
    const theme = getThemePreference();
    setDarkMode(theme === 'dark');
    
    // Verificar permissão de notificação
    if (typeof window !== 'undefined') {
      setNotificationsEnabled(areNotificationsEnabled());
    }
  }, []);
  
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    setThemePreference(newDarkMode ? 'dark' : 'light');
  };
  
  const handleRequestNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationsEnabled(permission === 'granted');
  };
  
  const handleAuth = async () => {
    if (isAuthenticated) {
      await signOut({ callbackUrl: '/' });
    } else {
      await signIn('google', { callbackUrl: pathname });
    }
  };
  
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm mr-2">
              <div className="w-3 h-3 rounded-full bg-white opacity-90" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">JARVIS</h1>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Nome do usuário */}
          {isAuthenticated && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mr-2">
              {session?.user?.name?.split(' ')[0]}
            </span>
          )}
          
          {/* Botões de ação */}
          {isAuthenticated ? (
            <button
              onClick={handleAuth}
              className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Logout"
              title="Sair"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleAuth}
              className="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Entrar
            </button>
          )}
          
          <button
            onClick={handleRequestNotifications}
            className={`p-1.5 rounded-md ${
              notificationsEnabled 
                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            } transition-colors`}
            aria-label={notificationsEnabled ? "Notifications enabled" : "Enable notifications"}
            title={notificationsEnabled ? "Notifications enabled" : "Enable notifications"}
          >
            <BellIcon className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <SunIcon className="h-4 w-4 text-amber-500" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
} 