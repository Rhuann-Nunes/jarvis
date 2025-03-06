'use client';

// Função para enviar mensagem para a API route e receber resposta
export const sendMessageToGroq = async (userMessage: string): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao comunicar com o assistente');
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('Erro ao comunicar com a API de chat:', error);
    return "Desculpe, estou enfrentando dificuldades técnicas no momento. Por favor, tente novamente mais tarde.";
  }
}; 