import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize OpenAI client on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  let requestText = '';
  try {
    const { text } = await request.json();
    requestText = text;
    
    if (!text) {
      return NextResponse.json(
        { error: 'O texto da tarefa é obrigatório' }, 
        { status: 400 }
      );
    }

    // Obter a data e hora atuais para passar para a IA
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1; // Meses em JS são 0-indexados
    const currentYear = now.getFullYear();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const currentWeekday = weekdays[now.getDay()];
    
    const formattedDate = `${currentDay}/${currentMonth}/${currentYear}`;
    const formattedTime = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;
    const currentDateTime = `${formattedDate} ${formattedTime} (${currentWeekday})`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um assistente de IA que ajuda a extrair dados estruturados de descrições de tarefas em português brasileiro.
          A data e hora atuais são: ${currentDateTime}.

          Extraia as seguintes informações:
          
          - Título da tarefa (obrigatório): Extraia o título principal da tarefa
          
          - Data de vencimento (se houver): Identifique datas como:
            * Datas explícitas (10/05/2023, 10 de maio, etc.)
            * Dias da semana (segunda-feira, terça, etc.)
            * Expressões relativas (hoje, amanhã, próxima semana, daqui a 3 dias, etc.)
            * Períodos específicos (início do mês, fim de semana, etc.)
            * Datas por extenso (primeiro de janeiro, etc.)
          
          - Horário (se mencionado):
            * Horários numéricos (14:30, 14h, 14 horas)
            * Horários por extenso (duas da tarde, sete e meia da noite, etc.)
            * Períodos do dia (manhã = 8:00, tarde = 14:00, noite = 20:00)
            * MUITO IMPORTANTE: Se um horário for mencionado, você DEVE incluí-lo na data ISO
          
          - Padrão de recorrência (se houver):
            * Identifique padrões como "todo dia", "toda segunda", "todos os dias", "semanalmente", etc.
            * Para recorrências, você pode retornar:
              - "todo dia" para tarefas diárias
              - "toda semana" para tarefas semanais
              - "todo mês" para tarefas mensais
              - "todo ano" para tarefas anuais
              - "toda segunda/terça/etc" para tarefas em dias específicos da semana
          
          - Nome do projeto (se mencionado com prefixo #, como #NomeDoProjeto)
          - Nome da seção (se mencionado com prefixo /, como /NomeDaSeção)
          
          REGRAS IMPORTANTES:
          1. A data e hora DEVEM ser combinadas em um único campo ISO (dueDate)
          2. Se uma hora for especificada, deve ser incluída na data ISO
          3. Se apenas uma data for especificada (sem hora), defina a hora para 12:00 (meio-dia)
          4. Não invente datas ou horários que não foram mencionados no texto
          
          REGRA PARA TAREFAS RECORRENTES SEM DATA ESPECÍFICA:
          * Se o texto menciona "todo dia" sem uma data específica (ex: "todo dia ao meio-dia"):
            - Se o horário mencionado ainda não passou hoje, use a data de HOJE (${formattedDate})
            - Se o horário mencionado já passou hoje, use a data de AMANHÃ
            - Exemplo: São ${formattedTime} agora e a tarefa é "ir a academia todo dia ao meio-dia" → use data de ${currentHour < 12 ? 'hoje' : 'amanhã'}
          
          * Se o texto menciona um dia específico da semana sem data ("toda segunda-feira às 10h"):
            - Se hoje é esse dia da semana e o horário ainda não passou, use a data de HOJE
            - Se hoje é esse dia da semana e o horário já passou, use a data da PRÓXIMA SEMANA
            - Se hoje não é esse dia da semana, use a data da PRÓXIMA ocorrência desse dia
          
          Formate sua resposta como JSON com a seguinte estrutura:
          {
            "title": "string (título principal da tarefa)",
            "dueDate": "string de data ISO com hora incluída ou null",
            "recurrence": "string descritiva do padrão de recorrência ou null",
            "projectName": "string ou null",
            "sectionName": "string ou null"
          }
          
          Se você não conseguir determinar alguma das informações, retorne null para aquele campo.`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao analisar o texto da tarefa:', error);
    return NextResponse.json(
      { error: 'Falha ao analisar a tarefa', title: requestText }, 
      { status: 500 }
    );
  }
} 