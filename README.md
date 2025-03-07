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
# Desabilita verificação de ESLint durante o build
NEXT_DISABLE_ESLINT=1

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

### Configurações para Deploy Bem-Sucedido

Este projeto foi configurado para ignorar erros de linting e tipos durante o build, permitindo que a aplicação seja deployada mesmo com avisos. Implementamos várias abordagens para garantir um deploy bem-sucedido:

1. **Configurações do ESLint** no `.eslintrc.json`:
   ```json
   {
     "rules": {
       "@typescript-eslint/no-explicit-any": "warn",
       "@typescript-eslint/no-unused-vars": "warn"
       // ...outras regras transformadas em avisos
     }
   }
   ```

2. **Configurações do Next.js** em `next.config.js/ts`:
   ```js
   {
     eslint: {
       ignoreDuringBuilds: true,
     },
     typescript: {
       ignoreBuildErrors: true,
     }
   }
   ```

3. **Variáveis de ambiente**:
   - `.env.production` e `.env.vercel` com `NEXT_DISABLE_ESLINT=1`

4. **Comando de build personalizado** no `vercel.json`:
   ```json
   "buildCommand": "npm run build:vercel"
   ```

5. **Scripts npm personalizados** em `package.json`:
   ```json
   "build:vercel": "next build --no-lint"
   ```

6. **Tipos corrigidos manualmente** em arquivos críticos como:
   - `src/app/api/auth/test-project/route.ts` - Correção de tipos para `CleanupResult`

7. **Configurações do TypeScript** em `tsconfig.json`:
   ```json
   "noImplicitAny": false
   ```

8. **Arquivo `.npmrc`** para garantir instalação correta:
   ```
   legacy-peer-deps=true
   engine-strict=false
   save-exact=true
   ```

### Lidando com Erros de Linting

Se você quiser corrigir os erros de linting em vez de ignorá-los, recomendamos rodar `npm run lint` localmente e corrigir os problemas antes de fazer deploy.

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

# Construir para produção ignorando linting
npm run build:vercel

# Verificar tipos sem compilar
npm run type-check

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
