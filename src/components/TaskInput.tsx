'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { PaperAirplaneIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import { analyzeTaskText } from '@/lib/openai';
import { TaskService, ProjectService, SectionService } from '@/lib/db';
import { AIAnalysisResult } from '@/types';
import toast from 'react-hot-toast';

// Definir tipos para reconhecimento de voz
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    recognition: any;
  }
}

interface TaskInputProps {
  projectId?: string;
  sectionId?: string;
  onTaskAdded: () => void;
}

// Expressões regulares aprimoradas para detectar padrões de data e hora em português
const DATE_TIME_PATTERNS = [
  // Dias da semana: segunda, terça-feira, etc.
  /\b(segunda|terça|quarta|quinta|sexta|sábado|domingo)(-|\s+)?feira?\b/gi,
  
  // Datas: 10/05, 10 de maio, etc.
  /\b(\d{1,2})(\/|-|\s+de\s+)(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|\d{1,2})(\/|-|\s+de\s+)?(\d{2,4})?\b/gi,
  
  // Horários com números: 10h, 10:30, 10h30, 10 horas, etc.
  /\b(\d{1,2})(:|h|:|\s+h\s+|\s+horas?\s+)(\d{1,2})?(min|m|minutos?)?\b/gi,
  
  // Horários por extenso: sete horas, meio-dia, etc.
  /\b(uma|duas|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|meia|meio)(-|\s+)?(hora|dia|noite)\b/gi,
  
  // Períodos do dia: da manhã, da tarde, da noite, etc.
  /\b(da|de|pela|a|à)\s+(manhã|tarde|noite|madrugada)\b/gi,
  
  // Recorrências: todo dia, todas as segundas, etc.
  /\b(todo|toda|todos|todas)(\s+os|\s+as)?\s+(dias?|segundas?|terças?|quartas?|quintas?|sextas?|sábados?|domingos?|semanas?|mês|meses|ano|anos)\b/gi,
  
  // Expressões de tempo relativo: daqui a 2 dias, na próxima semana, etc.
  /\b(daqui|depois|após)(\s+a|\s+de)?\s+(\d+)?\s*(dias?|semanas?|meses|anos?)\b/gi,
  /\b(n[ao]|d[ao])?\s+(próxim[ao]|semana\s+que\s+vem|mês\s+que\s+vem)\b/gi,
  
  // Periodos específicos: início do mês, fim de semana, etc.
  /\b(início|começo|meio|final|fim)(\s+d[eo])?\s+(semana|mês|ano|trimestre|bimestre|semestre)\b/gi,
  
  // Horas com AM/PM: 10 AM, 7 PM, etc.
  /\b(\d{1,2})\s*(am|pm)\b/gi,
  
  // Termos específicos: hoje, amanhã, etc.
  /\b(hoje|amanhã|depois\s+de\s+amanhã|anteontem|ontem)\b/gi,
  
  // Períodos: manhã, tarde, noite, etc. (quando usados sozinhos)
  /\b(madrugada|manhã|tarde|noite)\b/gi,
  
  // Horas cheias por extenso: às sete, às oito
  /\b(às|as|a|à)\s+(uma|duas|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|catorze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|vinte\s+e\s+uma|vinte\s+e\s+duas|vinte\s+e\s+três)\b/gi,
  
  // Números ordinais para dias: primeiro, segundo, etc.
  /\b(primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|sext[oa]|sétim[oa]|oitav[oa]|non[oa]|décim[oa])\s+(dia)?\b/gi,
];

export default function TaskInput({ projectId, sectionId, onTaskAdded }: TaskInputProps) {
  const [taskText, setTaskText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Função de destaque otimizada para minimizar re-renderizações
  const highlightDateTimes = useMemo(() => {
    return (text: string): string => {
      if (!text) return '';
      
      let lastIndex = 0;
      const segments: string[] = [];
      
      // Array para rastrear regiões que já foram destacadas para evitar sobreposições
      const markedRegions: Array<{start: number, end: number}> = [];
      
      // Verificar se uma nova região se sobrepõe a regiões existentes
      const hasOverlap = (start: number, end: number): boolean => {
        return markedRegions.some(region => 
          (start >= region.start && start < region.end) || 
          (end > region.start && end <= region.end) ||
          (start <= region.start && end >= region.end)
        );
      };
      
      // Função para detectar e extrair todos os matches
      const findMatches = () => {
        const allMatches: Array<{pattern: RegExp, match: RegExpExecArray}> = [];
        
        // Encontrar todos os matches para cada padrão
        DATE_TIME_PATTERNS.forEach(pattern => {
          // Reset do lastIndex para cada padrão
          pattern.lastIndex = 0;
          
          let match;
          while ((match = pattern.exec(text)) !== null) {
            allMatches.push({ pattern, match });
          }
        });
        
        // Ordenar por posição para processar em ordem e por comprimento (prefere matches mais longos)
        return allMatches.sort((a, b) => {
          // Se a posição for a mesma, prefere o match mais longo
          if (a.match.index === b.match.index) {
            return b.match[0].length - a.match[0].length;
          }
          return a.match.index - b.match.index;
        });
      };
      
      const sortedMatches = findMatches();
      
      // Processar o texto de forma ordenada
      sortedMatches.forEach(({ match }) => {
        const matchText = match[0];
        const startPos = match.index;
        const endPos = startPos + matchText.length;
        
        // Verificar se este match se sobrepõe a algum já processado
        if (hasOverlap(startPos, endPos)) {
          return; // Pular este match
        }
        
        // Adicionar texto normal antes do match
        if (startPos > lastIndex) {
          segments.push(text.substring(lastIndex, startPos));
        }
        
        // Adicionar o match destacado com a classe para o overlay
        segments.push(`<span class="highlight-overlay-span">${matchText}</span>`);
        
        // Registrar a região marcada
        markedRegions.push({ start: startPos, end: endPos });
        
        lastIndex = endPos;
      });
      
      // Adicionar o texto restante após o último match
      if (lastIndex < text.length) {
        segments.push(text.substring(lastIndex));
      }
      
      return segments.join('');
    };
  }, []);
  
  // Detectar datas e horários para destacar no texto com debounce
  useEffect(() => {
    if (!taskText) {
      setHighlightedText('');
      return;
    }
    
    const timer = setTimeout(() => {
      setHighlightedText(highlightDateTimes(taskText));
    }, 100); // pequeno delay para evitar processamento desnecessário durante digitação rápida
    
    return () => clearTimeout(timer);
  }, [taskText, highlightDateTimes]);
  
  // Ajustar altura do textarea automaticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [taskText]);
  
  // Handle speech recognition
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Reconhecimento de voz não suportado neste navegador');
      return;
    }
    
    const recognition = new window.webkitSpeechRecognition();
    
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setIsListening(true);
      toast.success('Escutando... Clique no microfone para parar');
    };
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      
      setTaskText(transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Erro de reconhecimento de voz:', event.error);
      setIsListening(false);
      toast.error('Erro no reconhecimento de voz');
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
    window.recognition = recognition;
  };
  
  const stopListening = () => {
    if (window.recognition) {
      window.recognition.stop();
      setIsListening(false);
      toast.success('Reconhecimento de voz parado');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!taskText.trim()) {
      toast.error('O título da tarefa é obrigatório');
      return;
    }

    setIsProcessing(true);

    try {
      // Analisar o texto da tarefa com IA
      const analysisResult = await analyzeTaskText(taskText);
      console.log('Análise da IA:', analysisResult);

      // Processar a recorrência se existir
      let recurrence: any = undefined;

      if (analysisResult.recurrence) {
        // Verificar se é um objeto ou string
        if (typeof analysisResult.recurrence === 'object' && analysisResult.recurrence !== null) {
          recurrence = analysisResult.recurrence;
        } else if (typeof analysisResult.recurrence === 'string') {
          // Processar strings de recorrência
          if (analysisResult.recurrence.includes('todo dia') || analysisResult.recurrence.includes('diariamente')) {
            recurrence = {
              type: 'daily',
              interval: 1
            };
          } else if (analysisResult.recurrence.includes('toda semana') || analysisResult.recurrence.includes('semanalmente')) {
            recurrence = {
              type: 'weekly',
              interval: 1
            };
          } else if (analysisResult.recurrence.includes('todo mês') || analysisResult.recurrence.includes('mensalmente')) {
            recurrence = {
              type: 'monthly',
              interval: 1
            };
          } else if (analysisResult.recurrence.includes('todo ano') || analysisResult.recurrence.includes('anualmente')) {
            recurrence = {
              type: 'yearly',
              interval: 1
            };
          } else {
            // Usar a string de recorrência como está
            recurrence = analysisResult.recurrence;
          }
        }
      }

      // Usar os resultados da análise (título, data de vencimento, recorrência)
      const taskData = {
        title: analysisResult.title || taskText,
        completed: false,
        projectId: projectId || undefined,
        dueDate: analysisResult.dueDate,
        recurrence
      };

      console.log('Tentando criar tarefa com:', taskData);

      // É importante garantir que projectId seja undefined (e não null) quando não houver um projeto associado
      // Isso é crucial para a página de Entries
      const task = await TaskService.createTask(taskData);

      console.log('Tarefa criada com sucesso:', task);
      setTaskText('');
      
      // Atualiza a lista de tarefas após a criação
      if (onTaskAdded) {
        onTaskAdded();
      }

      toast.success('Tarefa criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      
      // Determinar a mensagem de erro adequada
      if (error instanceof Error) {
        // Se for um erro relacionado à autenticação
        if (error.message.includes('permissão') || 
            error.message.includes('autenticação') || 
            error.message.includes('userId')) {
          toast.error('Erro de autenticação. Por favor, faça login novamente.');
        }
        // Se for um erro de validação de campos
        else if (error.message.includes('obrigatório') || 
                error.message.includes('Campo')) {
          toast.error(error.message);
        }
        // Para outros erros com mensagem
        else {
          toast.error(error.message);
        }
      } else if (typeof error === 'string') {
        toast.error(error);
      } else {
        // Caso seja um objeto de erro vazio ou indefinido
        toast.error('Erro desconhecido ao criar a tarefa. Verifique o console para mais detalhes.');
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
      <div className="flex items-start space-x-2">
        <div className="relative flex-1">
          <div className="task-input-container">
            <textarea
              ref={textareaRef}
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="Adicionar uma tarefa... Ex: Reunião toda terça às duas da tarde ou Lembrar de pagar contas no início do mês #Financeiro /Pagamentos"
              className="w-full px-4 py-3 min-h-[60px] max-h-[150px] rounded-lg border shadow-sm resize-none overflow-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isProcessing || isListening}
              rows={2}
            />
            
            {/* Overlay para destacar datas/horários */}
            {highlightedText && (
              <div 
                className="task-input-overlay px-4 py-3"
                dangerouslySetInnerHTML={{ __html: highlightedText }}
              />
            )}
          </div>
          
          {isProcessing && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 items-center">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-full ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
            } text-white`}
            aria-label={isListening ? 'Parar reconhecimento de voz' : 'Iniciar reconhecimento de voz'}
          >
            <MicrophoneIcon className={`h-5 w-5 ${isListening ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
          </button>
          
          <button
            type="submit"
            className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isProcessing || !taskText.trim()}
            aria-label="Adicionar tarefa"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .highlight-overlay-span {
          background-color: #FEF9C3;
          border-radius: 2px;
        }
        
        @media (prefers-color-scheme: dark) {
          .highlight-overlay-span {
            background-color: rgba(253, 224, 71, 0.3);
          }
        }
      `}</style>
    </form>
  );
} 