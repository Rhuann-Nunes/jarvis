'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface UserPreferences {
  id?: string;
  form_of_address: string;
  phone_number: string;
  allow_notifications: boolean;
}

export function UserPreferencesForm() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    form_of_address: '',
    phone_number: '',
    allow_notifications: false,
  });
  
  // Fetch current preferences when component mounts
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchUserPreferences();
    }
  }, [status, session]);
  
  const fetchUserPreferences = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no record found
      
      // No need to treat absence of data as an error
      if (data) {
        setPreferences({
          id: data.id,
          form_of_address: data.form_of_address || '',
          phone_number: data.phone_number || '',
          allow_notifications: data.allow_notifications || false,
        });
      }
      // If no data, we just keep the default state
    } catch (error) {
      // Only log critical errors, not "no record found" type errors
      console.error('Erro ao carregar preferências:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error('Você precisa estar autenticado para salvar preferências');
      return;
    }
    
    setIsLoading(true);
    try {
      if (preferences.id) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_preferences')
          .update({
            form_of_address: preferences.form_of_address,
            phone_number: preferences.phone_number,
            allow_notifications: preferences.allow_notifications,
          })
          .eq('user_id', session.user.id);
          
        if (error) throw error;
      } else {
        // Create new preferences
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: session.user.id,
            form_of_address: preferences.form_of_address,
            phone_number: preferences.phone_number,
            allow_notifications: preferences.allow_notifications,
          });
          
        if (error) throw error;
      }
      
      toast.success('Preferências salvas com sucesso');
    } catch (error: any) {
      console.error('Erro ao salvar preferências:', error);
      toast.error(`Erro ao salvar preferências: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setPreferences(prev => ({ ...prev, [name]: checked }));
    } else {
      setPreferences(prev => ({ ...prev, [name]: value }));
    }
  };
  
  if (status === 'loading') {
    return <div className="py-4">Carregando...</div>;
  }
  
  if (status !== 'authenticated') {
    return (
      <div className="py-4 text-amber-500">
        Você precisa estar autenticado para gerenciar suas preferências.
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="form_of_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pronome de Tratamento
          </label>
          <select
            id="form_of_address"
            name="form_of_address"
            value={preferences.form_of_address}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Selecione...</option>
            
            {/* Tradicionais */}
            <optgroup label="Tradicionais">
              <option value="Sr.">Sr.</option>
              <option value="Sra.">Sra.</option>
              <option value="Dr.">Dr.</option>
              <option value="Dra.">Dra.</option>
              <option value="Prof.">Prof.</option>
              <option value="Profa.">Profa.</option>
            </optgroup>
            
            {/* Realeza e Nobreza */}
            <optgroup label="Realeza e Nobreza">
              <option value="Rei">Rei</option>
              <option value="Rainha">Rainha</option>
              <option value="Príncipe">Príncipe</option>
              <option value="Princesa">Princesa</option>
              <option value="Lorde">Lorde</option>
              <option value="Lady">Lady</option>
              <option value="Duque">Duque</option>
              <option value="Duquesa">Duquesa</option>
              <option value="Conde">Conde</option>
              <option value="Condessa">Condessa</option>
              <option value="Vossa Majestade">Vossa Majestade</option>
              <option value="Vossa Excelência">Vossa Excelência</option>
              <option value="Vossa Magnificência">Vossa Magnificência</option>
              <option value="Magnânimo">Magnânimo</option>
              <option value="Meritíssimo">Meritíssimo</option>
            </optgroup>
            
            {/* Anime/Mangá */}
            <optgroup label="Anime/Mangá">
              <option value="Hokage">Hokage</option>
              <option value="Rei dos Piratas">Rei dos Piratas</option>
              <option value="Hashira">Hashira</option>
              <option value="Sensei">Sensei</option>
              <option value="Senpai">Senpai</option>
              <option value="Sama">Sama</option>
              <option value="Sannin">Sannin</option>
              <option value="Shinigami">Shinigami</option>
              <option value="Hunter">Hunter</option>
              <option value="Alquimista de Aço">Alquimista de Aço</option>
              <option value="Capitão Shinigami">Capitão Shinigami</option>
              <option value="Herói Classe S">Herói Classe S</option>
              <option value="Mestre dos Elementos">Mestre dos Elementos</option>
              <option value="Cavaleiro de Ouro">Cavaleiro de Ouro</option>
            </optgroup>
            
            {/* Fantasia e Ficção */}
            <optgroup label="Fantasia e Ficção">
              <option value="Mago Supremo">Mago Supremo</option>
              <option value="Mestre Jedi">Mestre Jedi</option>
              <option value="Lorde Sith">Lorde Sith</option>
              <option value="Guardião da Galáxia">Guardião da Galáxia</option>
              <option value="Campeão do Multiverso">Campeão do Multiverso</option>
              <option value="Comandante Estelar">Comandante Estelar</option>
              <option value="Arquimago">Arquimago</option>
              <option value="Caçador de Monstros">Caçador de Monstros</option>
              <option value="Sumo Sacerdote">Sumo Sacerdote</option>
              <option value="Paladino Divino">Paladino Divino</option>
              <option value="Deus do Trovão">Deus do Trovão</option>
              <option value="Portador da Chama">Portador da Chama</option>
            </optgroup>
            
            {/* Épicos e Míticos */}
            <optgroup label="Épicos e Míticos">
              <option value="Deus">Deus</option>
              <option value="Titã">Titã</option>
              <option value="Imperador Imortal">Imperador Imortal</option>
              <option value="Primordial">Primordial</option>
              <option value="Avatar">Avatar</option>
              <option value="Lendário">Lendário</option>
              <option value="Guardião Ancestral">Guardião Ancestral</option>
              <option value="Escolhido">Escolhido</option>
              <option value="Oráculo">Oráculo</option>
              <option value="Amo do Destino">Amo do Destino</option>
              <option value="Portador da Luz">Portador da Luz</option>
              <option value="Criador de Mundos">Criador de Mundos</option>
            </optgroup>
            
            {/* Profissões/Funções Especiais */}
            <optgroup label="Profissões/Funções">
              <option value="Mestre">Mestre</option>
              <option value="Comandante">Comandante</option>
              <option value="Capitão">Capitão</option>
              <option value="General">General</option>
              <option value="Arquiteto">Arquiteto</option>
              <option value="Engenheiro">Engenheiro</option>
              <option value="CEO">CEO</option>
              <option value="Mente Suprema">Mente Suprema</option>
              <option value="Líder Visionário">Líder Visionário</option>
              <option value="Gênio">Gênio</option>
            </optgroup>
          </select>
        </div>
        
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número de Celular
          </label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={preferences.phone_number}
            onChange={handleInputChange}
            placeholder="(99) 99999-9999"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Este número será usado apenas para envio de notificações se autorizado.
          </p>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allow_notifications"
            name="allow_notifications"
            checked={preferences.allow_notifications}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="allow_notifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Autorizo o recebimento de notificações no celular
          </label>
        </div>
      </div>
      
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Salvando...' : 'Salvar Preferências'}
        </button>
      </div>
    </form>
  );
} 