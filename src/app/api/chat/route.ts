import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';
import { TaskService, ProjectService } from '@/lib/db';
import { getUserId } from '@/lib/db';
import { formatDistanceToNow, format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, 
         isTomorrow, addDays, isWithinInterval, startOfWeek, endOfWeek, isYesterday, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task, Project } from '@/types';
import { supabase } from '@/lib/supabase';

// Interface para tarefas com propriedades adicionais que podem ser usadas no sistema
interface ExtendedTask extends Task {
  priority?: number;
}

// Inicializar o cliente Groq com a chave API (segura no servidor)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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',
});

/**
 * Função para obter dados brutos das tarefas e projetos do usuário direto do banco de dados
 * Envia os resultados das tabelas tasks e projects para o modelo de IA interpretar
 */
const getUserTasksData = async () => {
  try {
    console.log('Tentando obter ID do usuário...');
    
    // Tentar obter o ID do usuário usando a função getUserId
    let userId = await getUserId();
    console.log('ID do usuário via getUserId:', userId || 'Não encontrado');
      
    // Se não for possível obter o ID do usuário, tente outras abordagens
    if (!userId) {
      console.log("Não foi possível obter ID do usuário autenticado, buscando ID para demonstração");
      
      // PARA DEMONSTRAÇÃO: buscar qualquer tarefa ou projeto para usar como exemplo
      try {
        // Tente obter primeiro uma tarefa
        const { data: anyTask } = await supabase.from('tasks').select('user_id').limit(1);
        
        if (anyTask && anyTask.length > 0) {
          userId = anyTask[0].user_id;
          console.log('Usando ID de usuário de uma tarefa existente para demonstração:', userId);
        } else {
          // Se não houver tarefas, tente obter um projeto
          const { data: anyProject } = await supabase.from('projects').select('user_id').limit(1);
          
          if (anyProject && anyProject.length > 0) {
            userId = anyProject[0].user_id;
            console.log('Usando ID de usuário de um projeto existente para demonstração:', userId);
          }
        }
      } catch (sampleError) {
        console.error('Erro ao buscar dados de exemplo:', sampleError);
      }
    }
    
    if (!userId) {
      console.error('Não foi possível obter nenhum ID de usuário');
      return { rawData: { tasks: [], projects: [] } };
    }
    
    console.log('Buscando dados brutos para o usuário:', userId);
    
    // Consulta direta à tabela tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);
      
    if (tasksError) {
      console.error('Erro ao buscar tarefas:', tasksError);
      return { rawData: { tasks: [], projects: [] } };
    }
    
    console.log('Dados de tasks obtidos:', tasksData?.length || 0, 'registros');
    if (tasksData && tasksData.length > 0) {
      console.log('Amostra da primeira tarefa:', JSON.stringify(tasksData[0]));
    } else {
      console.log('Nenhuma tarefa encontrada para o usuário');
    }
    
    // Consulta direta à tabela projects
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);
      
    if (projectsError) {
      console.error('Erro ao buscar projetos:', projectsError);
      return { rawData: { tasks: [], projects: [] } };
    }
    
    console.log('Dados de projects obtidos:', projectsData?.length || 0, 'registros');
    if (projectsData && projectsData.length > 0) {
      console.log('Amostra do primeiro projeto:', JSON.stringify(projectsData[0]));
    } else {
      console.log('Nenhum projeto encontrado para o usuário');
    }
    
    console.log(`Dados brutos carregados: ${tasksData?.length || 0} tarefas, ${projectsData?.length || 0} projetos`);
    
    // Retornar os dados brutos para o modelo processar
    const result = {
      rawData: {
        tasks: tasksData || [],
        projects: projectsData || []
      }
    };
    
    console.log('Tamanho do objeto JSON a ser enviado:', JSON.stringify(result).length, 'caracteres');
    
    return result;
  } catch (error) {
    console.error('Erro ao obter dados brutos:', error);
    return { rawData: { tasks: [], projects: [] } };
  }
};

// Função para criar um prompt personalizado com os dados do usuário
const createUserPrompt = async () => {
  const userData = await getUserTasksData();
  
  // Verificar o tamanho dos dados
  const tasksJson = JSON.stringify(userData.rawData.tasks || [], null, 2);
  const projectsJson = JSON.stringify(userData.rawData.projects || [], null, 2);
  
  console.log('Tamanho JSON tarefas:', tasksJson.length, 'caracteres');
  console.log('Tamanho JSON projetos:', projectsJson.length, 'caracteres');
  console.log('Quantidade de tarefas:', userData.rawData.tasks?.length || 0);
  console.log('Quantidade de projetos:', userData.rawData.projects?.length || 0);
  
  // Criar o prompt com os dados
  const prompt = `Você é o JARVIS, um assistente pessoal inteligente para gerenciamento de tarefas.

Você foi desenvolvido para ajudar o usuário a gerenciar suas tarefas e projetos. Você tem acesso aos dados brutos do banco de dados do usuário.

IMPORTANTE: Os dados abaixo são dados reais obtidos diretamente do banco de dados. Se as listas estiverem vazias, significa que o usuário realmente não tem tarefas ou projetos cadastrados no sistema.

DADOS BRUTOS DO BANCO DE DADOS (JSON):

1. TABELA TASKS (TAREFAS):
\`\`\`json
${tasksJson}
\`\`\`

2. TABELA PROJECTS (PROJETOS):
\`\`\`json
${projectsJson}
\`\`\`

ESQUEMA DAS TABELAS:

- Tasks (Tarefas):
  - id: identificador único da tarefa
  - title: título da tarefa
  - description: descrição da tarefa (pode ser nulo)
  - completed: booleano indicando se a tarefa foi concluída
  - completed_at: data/hora em que a tarefa foi concluída (pode ser nulo)
  - due_date: data/hora de vencimento da tarefa (pode ser nulo)
  - recurrence_type: tipo de recorrência ('daily', 'weekly', 'monthly', etc.) (pode ser nulo)
  - recurrence_interval: intervalo de recorrência (pode ser nulo)
  - recurrence_days_of_week: dias da semana para recorrência semanal (array) (pode ser nulo)
  - is_recurrence_occurrence: indica se é uma ocorrência de uma tarefa recorrente
  - original_task_id: ID da tarefa original (para ocorrências recorrentes) (pode ser nulo)
  - project_id: ID do projeto relacionado (pode ser nulo)
  - user_id: ID do usuário dono da tarefa
  - created_at: data/hora de criação da tarefa
  - updated_at: data/hora da última atualização da tarefa

- Projects (Projetos):
  - id: identificador único do projeto
  - name: nome do projeto
  - color: cor do projeto em formato de código de cor
  - user_id: ID do usuário dono do projeto
  - created_at: data/hora de criação do projeto
  - updated_at: data/hora da última atualização do projeto

Ao analisar os dados, considere:
- Tarefas com completed=true são tarefas concluídas
- Tarefas com due_date anterior à data atual e completed=false são tarefas atrasadas
- Tarefas com due_date na data atual e completed=false são tarefas para hoje
- Tarefas recorrentes possuem valores em recurrence_type, recurrence_interval e possivelmente recurrence_days_of_week

Sua função é analisar estes dados brutos e responder às perguntas do usuário de forma inteligente e útil. Use os dados para criar resumos, estatísticas e insights relevantes.

Você pode responder perguntas como:
- "Quantas tarefas tenho pendentes?"
- "Quais são minhas tarefas para hoje?"
- "Quais projetos tenho atualmente?"
- "Quais tarefas estão atrasadas?"
- "Quais são minhas tarefas mais importantes?"
- "Quantas tarefas concluí nesta semana/mês?"
- "Qual a taxa de conclusão dos meus projetos?"

Responda sempre baseando-se nos dados brutos fornecidos acima. Se o usuário perguntar sobre algo que não está nos dados, informe educadamente que você não tem essa informação específica.`;

  console.log('Tamanho total do prompt:', prompt.length, 'caracteres');
  
  // Se tiver dados, confirmar que estão no prompt
  if (userData.rawData.tasks?.length > 0 || userData.rawData.projects?.length > 0) {
    console.log('Prompt contém dados? tasks:', prompt.includes('"title"'), 'projects:', prompt.includes('"name"'));
  }
  
  return prompt;
};

export async function POST(request: Request) {
  try {
    console.log('API de chat recebeu uma requisição');
    
    // Obter mensagem do corpo da requisição
    const { message } = await request.json();
    
    if (!message) {
      console.log('Erro: Mensagem não fornecida');
      return NextResponse.json({ error: 'Mensagem não fornecida' }, { status: 400 });
    }

    console.log(`Mensagem recebida: "${message}"`);
    
    const systemPrompt = await createUserPrompt();
    console.log('Prompt do sistema criado com dados brutos do banco de dados');
    
    console.log('Enviando requisição para a API Groq...');
    console.log('Tamanho do system prompt:', systemPrompt.length, 'caracteres');
    
    // Verificar se o systemPrompt contém dados antes de enviar
    const promptContainsTasks = systemPrompt.includes('"title"');
    const promptContainsProjects = systemPrompt.includes('"name"');
    console.log('Prompt contém dados reais?', { tasks: promptContainsTasks, projects: promptContainsProjects });
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.6,
      max_tokens: 1000,
      top_p: 0.95,
      reasoning_format: "hidden"
    });

    console.log('Resposta recebida da API Groq');
    const assistantReply = chatCompletion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.';
    
    return NextResponse.json({ reply: assistantReply });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
} 