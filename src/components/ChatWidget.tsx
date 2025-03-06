'use client';

import { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { sendMessageToGroq } from '@/lib/groq';

// Tipo para as mensagens do chat
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Efeito para iniciar o chat com uma mensagem de boas-vindas
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: generateId(),
          content: "Olá! Sou o JARVIS, seu assistente. Como posso ajudar você hoje?",
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
    }
  }, [messages.length]);
  
  // Efeito para rolar a janela de mensagens para o final quando novas mensagens são adicionadas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Função para gerar IDs únicos para mensagens
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Função para alternar o estado do chat
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  // Função para enviar mensagem
  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Adicionar mensagem do usuário ao chat
    const userMessage: ChatMessage = {
      id: generateId(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Enviar mensagem para a API e obter resposta
      const response = await sendMessageToGroq(inputValue);
      
      // Adicionar resposta do assistente ao chat
      const assistantMessage: ChatMessage = {
        id: generateId(),
        content: response,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Adicionar mensagem de erro ao chat
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: error instanceof Error 
          ? `Erro: ${error.message}` 
          : "Desculpe, estou enfrentando dificuldades técnicas no momento. Por favor, tente novamente mais tarde.",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para lidar com a tecla Enter no input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl mb-4 w-80 max-h-96 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Chat Header */}
          <div className="bg-blue-600 dark:bg-blue-800 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-300 animate-pulse"></div>
              <h3 className="text-white font-medium">JARVIS Assistant</h3>
            </div>
            <button 
              onClick={toggleChat}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Fechar chat"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-64">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start ${message.sender === 'assistant' ? '' : 'justify-end'}`}>
                {message.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-white text-xs font-bold">J</span>
                  </div>
                )}
                <div className={`rounded-lg py-2 px-3 max-w-[85%] ${
                  message.sender === 'assistant' 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' 
                    : 'bg-blue-600 text-white ml-2'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {/* Indicador de digitação */}
            {isLoading && (
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-white text-xs font-bold">J</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg py-2 px-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">JARVIS está pensando...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Elemento para rolar para o final das mensagens */}
            <div ref={messagesEndRef}></div>
          </div>
          
          {/* Chat Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-2">
              <input 
                type="text"
                placeholder="Digite sua mensagem..."
                className="w-full bg-transparent focus:outline-none text-sm text-gray-800 dark:text-gray-200"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button 
                className={`ml-2 rounded-full p-1.5 text-white ${
                  isLoading || !inputValue.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 transition-colors'
                }`}
                aria-label="Enviar mensagem"
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Button - JARVIS Original Icon */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
        aria-label="Abrir chat"
      >
        {isOpen ? (
          <XMarkIcon className="h-7 w-7 text-white" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 animate-pulse">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-5 h-0.5 bg-white absolute"></div>
                <div className="w-0.5 h-5 bg-white absolute"></div>
                <div className="w-4 h-4 border-2 border-white rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </button>
    </div>
  );
} 