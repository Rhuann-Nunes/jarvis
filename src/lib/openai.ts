import { AIAnalysisResult } from '@/types';

/**
 * Analyzes task text using OpenAI to extract structured data
 * @param text The task text to analyze
 * @returns Structured task data
 */
export async function analyzeTaskText(text: string): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/analyze-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Convert ISO date string to Date object if present
    if (result.dueDate) {
      try {
        result.dueDate = new Date(result.dueDate);
        
        // Verificar se a data é válida
        if (isNaN(result.dueDate.getTime())) {
          console.error('Data inválida recebida da API:', result.dueDate);
          result.dueDate = undefined;
        } else {
          // Verificação adicional para tarefas recorrentes
          // Se o texto menciona recorrência e a data/hora já passou hoje
          const isRecurring = result.recurrence && typeof result.recurrence === 'string' && 
                             (result.recurrence.includes('todo dia') || 
                              result.recurrence.includes('toda') || 
                              result.recurrence.includes('todos'));
          
          const now = new Date();
          
          if (isRecurring && result.dueDate < now) {
            console.log('Ajustando data de tarefa recorrente que já passou hoje');
            
            // Verificar se a data é hoje e apenas ajustar para amanhã se for
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const taskDate = new Date(result.dueDate);
            const taskDay = new Date(taskDate);
            taskDay.setHours(0, 0, 0, 0);
            
            // Se a data da tarefa é hoje e já passou, ajustar para amanhã
            if (taskDay.getTime() === today.getTime()) {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(
                result.dueDate.getHours(),
                result.dueDate.getMinutes(),
                result.dueDate.getSeconds()
              );
              result.dueDate = tomorrow;
              console.log('Data ajustada para amanhã:', result.dueDate);
            }
          }
        }
        
        console.log('Data convertida final:', result.dueDate);
      } catch (error) {
        console.error('Erro ao converter data:', error);
        result.dueDate = undefined;
      }
    }
    
    return result as AIAnalysisResult;
  } catch (error) {
    console.error('Error analyzing task text:', error);
    // Return basic result with just the title
    return { title: text };
  }
} 