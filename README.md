# JARVIS - Seu Assistente Pessoal de Produtividade

## 📌 Sobre

JARVIS é uma aplicação de produtividade que permite gerenciar tarefas, projetos e utilizar inteligência artificial para aumentar sua eficiência.

## 🚀 Deploy com Vercel

Este projeto está configurado para deploy com a Vercel. Todas as referências ao Prisma ORM foram removidas e o projeto agora utiliza apenas o Supabase para gerenciamento de banco de dados.

### Preparação para o Deploy

1. Clone o repositório para sua máquina local
2. Instale as dependências com `npm install --legacy-peer-deps`
3. Certifique-se de que seu projeto Supabase está configurado corretamente
4. Configure as variáveis de ambiente necessárias

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no painel da Vercel:

```
# OpenAI API Key
OPENAI_API_KEY=sua_chave_api_openai

# Next Auth
NEXTAUTH_URL=https://seu-site.vercel.app
NEXTAUTH_SECRET=alguma_string_secreta_longa

# Google OAuth credentials
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# Groq API (se necessário)
GROQ_API_KEY=sua_chave_api_groq

# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=seu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_supabase_service_role_key
SUPABASE_JWT_SECRET=seu_supabase_jwt_secret
```

### Deploy

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente mencionadas acima
3. Deploy!

## 📝 Notas sobre a migração do Prisma para o Supabase

Este projeto foi migrado do Prisma ORM para usar apenas Supabase diretamente. As principais mudanças incluíram:

1. Remoção de todas as dependências do Prisma (`prisma` e `@prisma/client`)
2. Remoção da pasta `prisma/` e arquivos relacionados
3. Substituição das consultas do Prisma por chamadas diretas ao Supabase
4. Criação de um módulo de utilitários `src/lib/user-utils.ts` para centralizar funções de autenticação

Se você precisar fazer mais alterações relacionadas à remoção do Prisma, procure por:

- Referências restantes a `prisma` em arquivos JavaScript compilados
- Arquivos de migração ou configuração do Prisma que podem ter sido esquecidos
- Comentários obsoletos mencionando o Prisma

## 🧰 Tecnologias

- Next.js 15.2.0
- Supabase
- Next Auth
- OpenAI/API de IA
- TypeScript
- Tailwind CSS

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install --legacy-peer-deps

# Executar em modo de desenvolvimento
npm run dev

# Construir para produção
npm run build

# Iniciar servidor de produção
npm start
```

## 📦 Estrutura do Projeto

- `src/app/` - Páginas e API routes
- `src/components/` - Componentes React reutilizáveis
- `src/lib/` - Bibliotecas e utilitários
- `src/hooks/` - Custom React hooks
- `public/` - Arquivos estáticos

## 📄 Licença

Todos os direitos reservados.
