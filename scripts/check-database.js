// Script para verificar a conexão com o banco de dados e tabelas do NextAuth
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando conexão com o banco de dados...');
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão bem-sucedida com o banco de dados!');
    
    // Verificar tabelas do NextAuth
    console.log('\n🔍 Verificando tabelas do NextAuth...');
    
    try {
      const accountCount = await prisma.account.count();
      console.log(`✅ Tabela 'accounts' existe. Total de registros: ${accountCount}`);
    } catch (e) {
      console.error('❌ Tabela accounts não encontrada ou erro:', e.message);
    }
    
    try {
      const sessionCount = await prisma.session.count();
      console.log(`✅ Tabela 'sessions' existe. Total de registros: ${sessionCount}`);
    } catch (e) {
      console.error('❌ Tabela sessions não encontrada ou erro:', e.message);
    }
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Tabela 'users' existe. Total de registros: ${userCount}`);
    } catch (e) {
      console.error('❌ Tabela users não encontrada ou erro:', e.message);
    }
    
    try {
      const verificationTokenCount = await prisma.verificationToken.count();
      console.log(`✅ Tabela 'verification_tokens' existe. Total de registros: ${verificationTokenCount}`);
    } catch (e) {
      console.error('❌ Tabela verification_tokens não encontrada ou erro:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔚 Verificação concluída!');
  }
}

checkDatabase().catch(console.error); 