# Integração com a API RAG JARVIS

## Visão Geral

Este projeto foi atualizado para usar a API RAG JARVIS em vez da implementação direta com Groq. A API RAG JARVIS fornece acesso a um assistente pessoal inteligente que combina o poder do Groq para inferência de modelo de linguagem grande e OpenAI para embeddings, tudo através de uma API REST hospedada em:

**URL da API**: `https://rag-jarvis-production.up.railway.app/`

## Arquivos Principais da Integração

1. **`src/lib/jarvis-api.ts`**: Contém a classe `JarvisClient` e funções auxiliares para interagir com a API RAG JARVIS.

2. **`src/hooks/useJarvisUser.ts`**: Hook React para obter e gerenciar informações do usuário necessárias para a API JARVIS.

3. **`src/components/ChatWidget.tsx`**: Componente de chat atualizado para usar a API RAG JARVIS.

## Como Funciona

### 1. Inicialização

O `useJarvisUser` hook é responsável por:
- Obter o ID do usuário do sistema
- Obter o nome do usuário da sessão atual
- Criar uma instância do cliente JARVIS
- Carregar os dados do usuário para o sistema RAG

```tsx
const { userId, userName, isLoading, error, jarvis } = useJarvisUser();
```

### 2. Identificação do Usuário

A API RAG JARVIS requer **tanto o ID do usuário quanto o nome do usuário** para funcionar corretamente:

1. **UUID do usuário**: Identifica unicamente o usuário no sistema.
2. **Nome do usuário**: Utilizado para personalizar as respostas e proporcionar uma experiência mais pessoal.

O hook `useJarvisUser` recupera automaticamente estas informações da sessão do usuário, priorizando:
- Para o nome: `session.user.name` → `session.user.email` → "Usuário" (fallback)
- Para o ID: `session.user.id` → UUID gerado aleatoriamente (modo demo)

### 3. Envio de Mensagens

O componente ChatWidget usa o cliente JARVIS para enviar mensagens e receber respostas:

```tsx
const response = await jarvis.sendMessage(inputValue);
```

O cliente JARVIS gerencia automaticamente:
- O histórico de conversas
- A autenticação com o ID do usuário
- A personalização com o nome do usuário
- O contexto do usuário

### 4. Quantidade de Documentos Recuperados

Por padrão, configuramos a API para recuperar 100 documentos relevantes (`k=100`) para cada consulta. Este valor foi definido para maximizar a quantidade de contexto disponível para o assistente, melhorando assim a qualidade e a relevância das respostas. Todos os métodos da classe `JarvisClient` utilizam este valor como padrão.

Caso necessário, o valor pode ser alterado em chamadas específicas:

```tsx
// Recuperar um número diferente de documentos
const resposta = await jarvis.sendMessage("Minha pergunta", 50); // k=50
```

### 5. Fluxo de Dados

1. O usuário envia uma mensagem através do ChatWidget
2. O JarvisClient envia a mensagem, histórico de conversa, ID e nome do usuário para a API RAG JARVIS
3. A API processa a mensagem, consulta até 100 documentos relevantes do banco vetorial
4. A resposta personalizada com o nome do usuário é retornada e exibida no ChatWidget

## Métodos Disponíveis na API

A classe `JarvisClient` oferece os seguintes métodos para interação com a API:

1. **`loadUserData()`**: Carrega os dados do usuário para o sistema RAG. Deve ser chamado antes de fazer consultas.

2. **`sendMessage(message, k=100)`**: Envia uma mensagem para a API e retorna uma resposta contextualizada.

3. **`searchData(query, k=100)`**: Busca diretamente nos dados do usuário sem gerar uma resposta contextualizada.

4. **`getAugmentedPrompt(query, k=100)`**: Retorna um prompt aumentado com contexto do usuário, sem executar o modelo LLM.

5. **`clearHistory()`**: Limpa o histórico de conversa.

6. **`getConversationHistory()`**: Obtém uma cópia do histórico de conversa atual.

## Vantagens da Nova Implementação

1. **Separação de Responsabilidades**: A lógica de processamento de linguagem natural é mantida na API, simplificando a aplicação cliente.

2. **Eficiência de Recursos**: Não é mais necessário enviar grandes conjuntos de dados para o modelo de linguagem a cada consulta.

3. **RAG Otimizado**: A API usa Recuperação Aumentada de Geração (RAG) para fornecer respostas mais precisas e contextuais.

4. **Manutenção Simplificada**: Atualizações no modelo de linguagem ou na lógica de RAG podem ser feitas no backend sem alterar a aplicação cliente.

5. **Menor Consumo de Tokens**: Otimiza o uso da API do Groq, reduzindo custos.

6. **Personalização**: As respostas são personalizadas com o nome do usuário, proporcionando uma experiência mais humana.

## Configuração

Não é necessária nenhuma configuração adicional para usar a API RAG JARVIS, pois todos os detalhes de autenticação são gerenciados pelo ID e nome do usuário.

## Limitações

- A aplicação requer conexão com a internet para funcionar, já que depende da API externa.
- Caso a API esteja indisponível, o assistente não funcionará.
- A recuperação de 100 documentos pode aumentar o tempo de resposta da API, mas proporciona respostas mais abrangentes.

## Próximos Passos

- Implementar um modo offline com respostas básicas pré-definidas para quando a API estiver indisponível.
- Adicionar autenticação mais robusta usando tokens JWT.
- Implementar cache local para respostas comuns ou recentes.
- Avaliar o equilíbrio entre quantidade de documentos recuperados e tempo de resposta. 