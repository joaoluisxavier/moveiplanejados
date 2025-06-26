
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;
let geminiInitializationError: string | null = null;

if (!apiKey) {
  const errorMsg = "Chave da API Gemini não configurada. Verifique as configurações do ambiente de implantação.";
  console.error("Gemini Service Error:", errorMsg);
  geminiInitializationError = errorMsg;
} else {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e: any) {
    const errorMsg = `Erro ao inicializar o serviço Gemini: ${e.message || 'Erro desconhecido'}. Funcionalidades de IA podem não funcionar.`;
    console.error("Gemini Service Error:", errorMsg, e);
    geminiInitializationError = errorMsg;
    ai = null; // Ensure ai is null if initialization fails
  }
}

const model = 'gemini-2.5-flash-preview-04-17';

export const getGeminiChatResponse = async (promptText: string, history?: Array<{role: string, parts: Array<{text: string}>}>): Promise<string> => {
  if (geminiInitializationError) {
    return geminiInitializationError;
  }
  if (!ai) {
    return "Serviço Gemini não inicializado. Verifique a chave da API.";
  }

  try {
    const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: 'Você é um assistente virtual para clientes de uma empresa de móveis planejados. Responda de forma concisa e amigável. Se não souber a resposta, diga que vai verificar com a equipe.',
        },
        // history: history, // If you plan to use history, uncomment and pass it
    });
    
    const result: GenerateContentResponse = await chat.sendMessage({message: promptText});
    return result.text;

  } catch (error) {
    console.error("Error calling Gemini API for chat:", error);
    let errorMessage = "Desculpe, não consegui processar sua solicitação no momento devido a um problema com o serviço de IA. Tente novamente mais tarde.";
    if (error instanceof Error) {
        if (error.message.includes("API key not valid") || error.message.toLowerCase().includes("api key") || error.message.includes("API_KEY_INVALID")) {
            errorMessage = "Erro: A chave da API do Gemini não é válida ou não foi fornecida corretamente. Por favor, contate o suporte ou verifique a configuração do ambiente.";
        } else if (error.message.includes("quota")) {
            errorMessage = "Erro: A cota da API foi excedida. Tente novamente mais tarde.";
        } else if (error.message.includes("candidate.finishReason") && error.message.includes("SAFETY")){
             errorMessage = "Desculpe, a resposta foi bloqueada devido a configurações de segurança. Tente reformular sua pergunta.";
        }
    }
    return errorMessage;
  }
};

export const summarizeTextWithGemini = async (textToSummarize: string): Promise<string> => {
  if (geminiInitializationError) {
    return geminiInitializationError;
  }
  if (!ai) {
    return "Serviço Gemini não inicializado. Verifique a chave da API.";
  }

  try {
    const promptContent = `Resuma o seguinte texto em até 3 frases curtas, focando nos pontos principais para um cliente de móveis planejados:\n\n${textToSummarize}`;
    const result: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: promptContent 
    });
    return result.text;
  } catch (error) {
    console.error("Error calling Gemini API for summarization:", error);
    // Add more specific error handling if needed, similar to getGeminiChatResponse
    return "Não foi possível resumir o texto devido a um erro no serviço de IA.";
  }
};
