'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { UserPreferencesForm } from './UserPreferencesForm';

export function SettingsPanel() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return (
    <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 space-y-6">
      <div className="space-y-6">
        {/* Preferências do Usuário */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preferências do Usuário</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Configure suas preferências pessoais para melhorar sua experiência.
          </p>
          <UserPreferencesForm />
        </div>
        
        {/* Conta */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Conta</h3>
          <div className="mt-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {session?.user?.image && (
                  <img 
                    src={session.user.image} 
                    alt={session?.user?.name || 'User'} 
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium dark:text-white">{session?.user?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Faça login para acessar recursos avançados.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 