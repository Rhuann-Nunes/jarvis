// Este é um script de teste para verificar a API de chat
// Para executar: node src/app/api/chat/test-client.js

async function testChatAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Olá, como você pode me ajudar?' })
    });

    const data = await response.json();
    console.log('Resposta da API:', data);
  } catch (error) {
    console.error('Erro ao testar a API:', error);
  }
}

// Executar o teste
testChatAPI(); 