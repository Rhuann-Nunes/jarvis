# Migração do JARVIS para Supabase

Este documento descreve o processo de migração do aplicativo JARVIS de armazenamento local (localStorage) para o Supabase, um serviço de banco de dados PostgreSQL na nuvem.

## Estrutura de Dados

O esquema de banco de dados foi criado no Supabase com as seguintes entidades:

### next_auth.users (Usuário)
- Armazena informações do usuário
- Relacionado com Tasks e Projects
- Utilizado para autenticação via NextAuth

### public.projects (Projeto)
- Organiza tarefas em grupos lógicos (ex: "Casa", "Trabalho")
- Possui cor personalizada
- Pode conter múltiplas seções

### public.sections (Seção)
- Divide um projeto em categorias (ex: "Em progresso", "Concluído")
- Pertence a um único projeto
- Contém tarefas relacionadas

### public.tasks (Tarefa)
- Tarefa principal do sistema
- Pode pertencer a um projeto e/ou seção
- Suporta recorrência, datas de vencimento e conclusão

## Autenticação

A autenticação é gerenciada pelo NextAuth.js, integrado com o Supabase:

1. O usuário faz login via Google
2. O NextAuth cria ou recupera o usuário no schema `next_auth` do Supabase
3. O usuário autenticado pode acessar e gerenciar seus dados

## Processo de Migração

Para migrar seus dados do localStorage para o Supabase, siga estes passos:

1. Crie uma conta ou faça login no sistema
2. Navegue até a página de Configurações (/settings)
3. Clique no botão "Migrar para Supabase"
4. Seus dados serão transferidos para o banco de dados

O processo de migração inclui:
- Projetos e suas seções
- Tarefas e suas relações
- Configurações de recorrência
- Manutenção das relações entre entidades

## Segurança dos Dados

O Supabase implementa Políticas de Segurança no Nível de Linha (RLS) que garantem:

1. Cada usuário só pode acessar seus próprios dados
2. Autenticação via JWT com tokens seguros
3. Controle de acesso granular por operação (SELECT, INSERT, UPDATE, DELETE)
4. Relacionamentos protegidos entre tabelas

## Notas Técnicas

### Principais Tecnologias
- **Supabase**: Serviço PostgreSQL gerenciado com autenticação e APIs
- **NextAuth**: Autenticação e gerenciamento de sessão
- **Next.js**: Framework React para renderização e roteamento
- **Supabase Adapter para NextAuth**: Integração entre autenticação e banco de dados

### SQL Schemas
Scripts SQL para criação do banco de dados estão disponíveis em:
- `src/tables/nextauth.sql`: Schema para autenticação
- `src/tables/users.sql`: Extensões para tabela de usuários
- `src/tables/projects.sql`: Tabela de projetos
- `src/tables/sections.sql`: Tabela de seções
- `src/tables/tasks.sql`: Tabela de tarefas

## Próximos Passos

Após a migração, considere implementar:
1. Backup automático de dados
2. Sincronização entre dispositivos
3. Funcionalidades colaborativas entre usuários
4. Melhorias no sistema de autenticação

## Suporte

Em caso de problemas durante a migração, verifique:
1. Se o usuário está autenticado
2. Se os dados estão presentes no localStorage
3. Se há duplicação de IDs (o sistema tenta evitar isso)
4. Logs de console para possíveis erros detalhados 