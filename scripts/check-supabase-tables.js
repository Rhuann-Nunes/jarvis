// Script para verificar a existência das tabelas do NextAuth no Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSupabaseTables() {
  // Verificar se as variáveis de ambiente estão disponíveis
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas');
    return;
  }

  // Criar cliente Supabase com a chave de serviço
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Verificando conexão com o Supabase...');
  
  // Verificar conexão com o Supabase
  const { data: connectionTest, error: connectionError } = await supabase
    .from('_prisma_migrations')
    .select('*')
    .limit(1);
    
  if (connectionError) {
    console.error('❌ Erro ao conectar ao Supabase:', connectionError.message);
    console.log('💡 Verifique suas credenciais e conexão com a internet.');
    return;
  }
  
  console.log('✅ Conexão com o Supabase estabelecida com sucesso!');
  
  console.log('\n🔍 Tentando acessar as tabelas do schema next_auth...');
  
  // Lista de tabelas que devem existir
  const requiredTables = ['users', 'accounts', 'sessions', 'verification_tokens'];
  let tablesExist = true;
  
  // Verificar cada tabela
  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from('next_auth.' + table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Não foi possível acessar a tabela next_auth.${table}: ${error.message}`);
        tablesExist = false;
      } else {
        console.log(`✅ Tabela next_auth.${table} é acessível.`);
      }
    } catch (err) {
      console.error(`❌ Erro ao verificar tabela ${table}:`, err.message);
      tablesExist = false;
    }
  }
  
  console.log('\n📋 Resultado da verificação:');
  if (!tablesExist) {
    console.log('❌ Uma ou mais tabelas do schema next_auth não existem ou não são acessíveis!');
    console.log('\n💡 Ações recomendadas:');
    console.log('1. Execute o script SQL para criar o schema e tabelas:');
    console.log('   - Abra o Dashboard do Supabase > SQL Editor');
    console.log('   - Cole e execute o conteúdo do arquivo: prisma/supabase-next-auth-schema.sql');
    console.log('\n2. Exponha o schema next_auth na API:');
    console.log('   - Dashboard do Supabase > Settings > API > HTTP API Settings');
    console.log('   - Adicione "next_auth" aos Exposed Schemas');
  } else {
    console.log('✅ Todas as tabelas do schema next_auth estão acessíveis!');
    console.log('🎉 A configuração do Supabase para o NextAuth parece correta.');
  }
}

// Executar verificação
checkSupabaseTables().catch(err => {
  console.error('❌ Erro fatal:', err.message);
}); 