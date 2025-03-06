# Políticas e Funções Supabase

Este diretório contém as políticas de segurança (Row Level Security) e funções para o Supabase.

## Estrutura

Os arquivos foram organizados por entidade para facilitar a manutenção:

- **setup.sql**: Script principal que importa todos os outros arquivos
- **projects.sql**: Políticas e funções relacionadas a projetos
- **sections.sql**: Políticas e funções relacionadas a seções de projetos
- **tasks.sql**: Políticas e funções relacionadas a tarefas
- **utils.sql**: Funções utilitárias e diagnóstico

## Como usar

### Método 1: Usando o Editor SQL do Supabase

1. Faça login no dashboard do Supabase
2. Navegue até a seção "SQL Editor"
3. Cole o conteúdo de cada arquivo individualmente ou apenas o conteúdo do arquivo `setup.sql` ajustando os caminhos
4. Execute o script

### Método 2: Usando a CLI do Supabase

Se você estiver usando a CLI do Supabase, pode executar:

```bash
psql -U <seu_usuario> -d <sua_database> -f policies/setup.sql
```

### Método 3: Usando o psql diretamente

1. Conecte-se ao banco de dados Supabase:
```bash
psql -h <host> -U <usuario> -d <database>
```

2. Execute o script principal:
```sql
\i 'policies/setup.sql'
```

## Descrição das Políticas

### Projetos
- Usuários podem ler, criar, atualizar e excluir apenas seus próprios projetos
- Função RPC `get_user_projects` para buscar projetos de um usuário
- Função RPC `create_user_project` para criar projetos com segurança

### Seções
- Usuários podem ler, criar, atualizar e excluir seções apenas de seus próprios projetos
- Função RPC `get_project_sections` para buscar seções de vários projetos

### Tarefas
- Usuários podem ler, criar, atualizar e excluir apenas suas próprias tarefas
- Função RPC `create_user_task` para criar tarefas com segurança e validações

### Utilitários
- Função `check_rls_policies` para diagnosticar a configuração de RLS
- Função `verify_jwt_user` para verificar a autenticação do usuário
- Função `sync_nextauth_user_with_auth` para sincronizar usuários entre NextAuth e Supabase Auth

## Troubleshooting

Se encontrar problemas de permissão:

1. Verifique se o script foi executado corretamente usando a função:
```sql
SELECT * FROM check_rls_policies();
```

2. Teste a autenticação do usuário com:
```sql
SELECT * FROM verify_jwt_user();
```

3. Sincronize manualmente o usuário se necessário:
```sql
SELECT * FROM sync_nextauth_user_with_auth('id-do-usuario', 'email@exemplo.com', 'Nome do Usuário');
``` 