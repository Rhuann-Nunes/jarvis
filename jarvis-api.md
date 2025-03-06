<think>
Vou criar um guia completo em markdown sobre como utilizar o RAG JARVIS através da sua API. Baseado nos arquivos fornecidos, este é um assistente pessoal inteligente que utiliza Groq para inferência de modelo de linguagem grande e OpenAI para embeddings.

Primeiro, vou estruturar o guia com:
1. Introdução ao RAG JARVIS
2. Pré-requisitos
3. Autenticação e configuração
4. Endpoints da API
5. Exemplos de uso com curl, Python e outras linguagens
6. Tratamento de tarefas recorrentes
7. Dicas e boas práticas
8. Troubleshooting

O guia será escrito em português, já que o contexto do projeto está em português (vejo isso pelo README.md e outros arquivos).

A URL da API é: https://rag-jarvis-production.up.railway.app/
</think>

# Guia de Utilização da API RAG JARVIS

## Introdução

O JARVIS é um assistente pessoal inteligente que utiliza o Groq para inferência de modelo de linguagem grande e OpenAI para embeddings. Este guia detalha como interagir com o JARVIS através de sua API REST.

URL da API: **https://rag-jarvis-production.up.railway.app/**

## Pré-requisitos

- UUID de usuário válido no Supabase
- Nome do usuário para personalização das respostas
- Cliente HTTP para fazer requisições (curl, Postman, código em Python, etc.)

## Endpoints da API

### 1. Status da API

```
GET /api
```

Verifica se a API está funcionando corretamente.

**Exemplo com curl:**

```bash
curl -X GET https://rag-jarvis-production.up.railway.app/api
```

### 2. Carregar Dados do Usuário

```
POST /api/load-user-data
```

Este endpoint deve ser chamado antes de fazer consultas para carregar os dados do usuário do Supabase para o armazenamento vetorial.

**Corpo da requisição:**

```json
{
  "user_id": "uuid-do-usuario-no-supabase",
  "user_name": "Nome do Usuário"
}
```

**Exemplo com curl:**

```bash
curl -X POST https://rag-jarvis-production.up.railway.app/api/load-user-data \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "seu-uuid-aqui",
    "user_name": "Seu Nome"
  }'
```

### 3. Consulta do Usuário (JARVIS)

```
POST /api/user-query
```

Envia uma pergunta para o JARVIS e recebe uma resposta personalizada com base nos dados do usuário.

**Corpo da requisição:**

```json
{
  "user_id": "uuid-do-usuario-no-supabase",
  "user_name": "Nome do Usuário",
  "query": "Sua pergunta aqui",
  "conversation_history": [
    {"role": "user", "content": "Mensagem anterior do usuário"},
    {"role": "assistant", "content": "Resposta anterior do assistente"}
  ],
  "k": 3
}
```

**Observação:** O parâmetro `k` define quantos documentos relevantes serão recuperados do banco vetorial.

**Exemplo com curl:**

```bash
curl -X POST https://rag-jarvis-production.up.railway.app/api/user-query \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "seu-uuid-aqui",
    "user_name": "Seu Nome",
    "query": "Quais são meus projetos em andamento?",
    "conversation_history": [],
    "k": 3
  }'
```

### 4. Busca nos Dados do Usuário

```
POST /api/user-search
```

Busca diretamente nos dados do usuário sem gerar uma resposta contextualizada.

**Corpo da requisição:**

```json
{
  "user_id": "uuid-do-usuario-no-supabase",
  "user_name": "Nome do Usuário",
  "query": "Sua consulta de busca aqui",
  "k": 3
}
```

**Exemplo com curl:**

```bash
curl -X POST https://rag-jarvis-production.up.railway.app/api/user-search \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "seu-uuid-aqui",
    "user_name": "Seu Nome",
    "query": "projetos com prazo esta semana",
    "k": 3
  }'
```

### 5. Prompt Aumentado do Usuário

```
POST /api/user-augmented-prompt
```

Gera um prompt personalizado com contexto do usuário sem executar o modelo LLM.

**Corpo da requisição:**

```json
{
  "user_id": "uuid-do-usuario-no-supabase",
  "user_name": "Nome do Usuário",
  "query": "Sua consulta aqui",
  "k": 3
}
```

**Exemplo com curl:**

```bash
curl -X POST https://rag-jarvis-production.up.railway.app/api/user-augmented-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "seu-uuid-aqui",
    "user_name": "Seu Nome",
    "query": "Liste minhas tarefas pendentes",
    "k": 3
  }'
```

## Exemplos Práticos em Python

### Exemplo 1: Fluxo Completo de Interação

```python
import requests
import json

# URL base da API
API_URL = "https://rag-jarvis-production.up.railway.app"

# Dados do usuário
user_id = "seu-uuid-aqui"
user_name = "Seu Nome"

# 1. Carregar dados do usuário
def load_user_data():
    response = requests.post(
        f"{API_URL}/api/load-user-data",
        json={
            "user_id": user_id,
            "user_name": user_name
        }
    )
    
    print("Status de carregamento:", response.status_code)
    return response.json()

# 2. Consultar o JARVIS
def query_jarvis(question, conversation_history=None):
    if conversation_history is None:
        conversation_history = []
        
    response = requests.post(
        f"{API_URL}/api/user-query",
        json={
            "user_id": user_id,
            "user_name": user_name,
            "query": question,
            "conversation_history": conversation_history,
            "k": 3
        }
    )
    
    return response.json()

# Executar o fluxo
print("Carregando dados do usuário...")
load_result = load_user_data()
print(json.dumps(load_result, indent=2))

print("\nEnviando consulta ao JARVIS...")
question = "Quais são minhas tarefas pendentes para esta semana?"
result = query_jarvis(question)

print("\nResposta do JARVIS:")
print(result["answer"])

# Continuar a conversa
conversation_history = [
    {"role": "user", "content": question},
    {"role": "assistant", "content": result["answer"]}
]

follow_up = "E para o próximo mês?"
print("\nEnviando pergunta de acompanhamento...")
result2 = query_jarvis(follow_up, conversation_history)

print("\nResposta do JARVIS:")
print(result2["answer"])
```

### Exemplo 2: Classe de Cliente para o JARVIS

```python
class JarvisClient:
    def __init__(self, api_url, user_id, user_name):
        self.api_url = api_url
        self.user_id = user_id
        self.user_name = user_name
        self.conversation_history = []
        
    def load_user_data(self):
        """Carrega os dados do usuário para o assistente"""
        response = requests.post(
            f"{self.api_url}/api/load-user-data",
            json={
                "user_id": self.user_id,
                "user_name": self.user_name
            }
        )
        return response.json()
    
    def ask(self, question, k=3):
        """Envia uma pergunta para o JARVIS e atualiza o histórico"""
        response = requests.post(
            f"{self.api_url}/api/user-query",
            json={
                "user_id": self.user_id,
                "user_name": self.user_name,
                "query": question,
                "conversation_history": self.conversation_history,
                "k": k
            }
        )
        result = response.json()
        
        # Atualizar o histórico de conversa
        self.conversation_history.append({"role": "user", "content": question})
        self.conversation_history.append({"role": "assistant", "content": result["answer"]})
        
        return result
    
    def clear_history(self):
        """Limpa o histórico de conversa"""
        self.conversation_history = []
        
    def search_data(self, query, k=3):
        """Busca diretamente nos dados do usuário"""
        response = requests.post(
            f"{self.api_url}/api/user-search",
            json={
                "user_id": self.user_id,
                "user_name": self.user_name,
                "query": query,
                "k": k
            }
        )
        return response.json()

# Uso da classe
jarvis = JarvisClient(
    api_url="https://rag-jarvis-production.up.railway.app",
    user_id="seu-uuid-aqui",
    user_name="Seu Nome"
)

# Carregar dados
jarvis.load_user_data()

# Fazer perguntas
result1 = jarvis.ask("Quais são meus projetos?")
print(result1["answer"])

result2 = jarvis.ask("Quais tarefas tenho que concluir para eles?")
print(result2["answer"])

# Buscar dados específicos
search_result = jarvis.search_data("tarefas recorrentes")
print(json.dumps(search_result, indent=2))
```

## Consultas Especiais para Tarefas Recorrentes

O JARVIS possui funcionalidade especializada para lidar com tarefas recorrentes. Você pode usar as seguintes consultas para explorar esta funcionalidade:

```python
# Exemplos de consultas sobre tarefas recorrentes
consultas = [
    "Quais são minhas tarefas para amanhã?",
    "O que tenho planejado para esta semana?",
    "Mostre minhas tarefas para o mês de julho",
    "Tenho alguma tarefa recorrente pendente?",
    "Quais tarefas se repetem mensalmente?"
]

# Executar as consultas
for consulta in consultas:
    print(f"\nConsulta: {consulta}")
    result = jarvis.ask(consulta)
    print(f"Resposta: {result['answer']}")
```

## Dicas e Boas Práticas

1. **Carregue os dados primeiro**: Sempre carregue os dados do usuário com `/api/load-user-data` antes de fazer consultas.

2. **Mantenha o histórico de conversa**: Para manter o contexto da conversa, armazene e envie o histórico de mensagens anteriores.

3. **Ajuste o valor de k**: Aumente o valor de `k` para obter mais contexto ou diminua para respostas mais focadas.

4. **Formatos específicos**: Para perguntas sobre datas específicas, use formatos claros como "amanhã", "próxima semana" ou datas como "15 de julho".

5. **Atualize regularmente**: Se dados forem alterados no Supabase, recarregue os dados do usuário para garantir que as respostas estejam atualizadas.

## Códigos de Erro Comuns

| Código | Significado | Solução |
|--------|-------------|---------|
| 400 | UUID inválido | Verifique se o UUID do usuário está correto |
| 500 | Erro interno | Erro no servidor ou serviço indisponível |

## Conclusão

Este guia apresentou os principais endpoints e métodos para interagir com a API do JARVIS. Utilizando as técnicas descritas, você pode integrar o assistente pessoal em qualquer aplicação que possa fazer requisições HTTP.

Para suporte adicional ou dúvidas, consulte a documentação completa ou entre em contato com a equipe de desenvolvimento.
