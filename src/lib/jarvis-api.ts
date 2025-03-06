'use client';

interface JarvisMessage {
  role: 'user' | 'assistant';
  content: string;
}

// URL base da API
const API_URL = "https://rag-jarvis-production.up.railway.app";

// Classe cliente para integração com a API RAG JARVIS
export class JarvisClient {
  private apiUrl: string;
  private userId: string;
  private userName: string;
  private conversationHistory: JarvisMessage[] = [];
  
  constructor(userId: string, userName: string, apiUrl: string = API_URL) {
    this.apiUrl = apiUrl;
    this.userId = userId;
    this.userName = userName;
  }
  
  async loadUserData(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/load-user-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.userId,
          user_name: this.userName
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar dados do usuário: ${response.status}`);
      }
      
      const result = await response.json();
      return true;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      return false;
    }
  }
  
  async sendMessage(message: string, k: number = 100): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/api/user-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.userId,
          user_name: this.userName,
          query: message,
          conversation_history: this.conversationHistory,
          k: k
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Atualizar o histórico de conversa
      this.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: result.answer }
      );
      
      return result.answer;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw new Error('Não foi possível obter resposta do assistente. Por favor, tente novamente mais tarde.');
    }
  }
  
  // Método para buscar diretamente nos dados do usuário sem gerar uma resposta contextualizada
  async searchData(query: string, k: number = 100): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/api/user-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.userId,
          user_name: this.userName,
          query: query,
          k: k
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      throw new Error('Não foi possível buscar os dados solicitados. Por favor, tente novamente mais tarde.');
    }
  }
  
  // Método para gerar um prompt aumentado sem executar o modelo LLM
  async getAugmentedPrompt(query: string, k: number = 100): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/api/user-augmented-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.userId,
          user_name: this.userName,
          query: query,
          k: k
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao gerar prompt aumentado: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao gerar prompt aumentado:', error);
      throw new Error('Não foi possível gerar o prompt aumentado. Por favor, tente novamente mais tarde.');
    }
  }
  
  clearHistory(): void {
    this.conversationHistory = [];
  }
  
  getConversationHistory(): JarvisMessage[] {
    return [...this.conversationHistory];
  }
}

// Função para criar uma instância do cliente Jarvis
let jarvisClientInstance: JarvisClient | null = null;

export const getJarvisClient = (userId: string, userName: string): JarvisClient => {
  if (!jarvisClientInstance) {
    jarvisClientInstance = new JarvisClient(userId, userName);
    // Inicialização assíncrona
    jarvisClientInstance.loadUserData().catch(error => {
      console.error('Erro ao inicializar o cliente Jarvis:', error);
    });
  }
  return jarvisClientInstance;
};

// Função para enviar mensagem para a API do Jarvis
export const sendMessageToJarvis = async (message: string, userId: string, userName: string): Promise<string> => {
  try {
    const jarvis = getJarvisClient(userId, userName);
    return await jarvis.sendMessage(message);
  } catch (error) {
    console.error('Erro ao comunicar com o assistente:', error);
    return "Desculpe, estou enfrentando dificuldades técnicas no momento. Por favor, tente novamente mais tarde.";
  }
}; 