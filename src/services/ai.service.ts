import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  // We log this but only throw if we actually try to instantiate/call the service without the key
  console.warn('GEMINI_API_KEY environment variable is missing.');
}

// Allow model to be configured via env var, with a sensible default
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

export interface GeneratedEmail {
  subject: string;
  content: string;
}

/**
 * Helper to parse Gemini response into a GeneratedEmail object.
 */
function parseGeminiResponse(text: string): GeneratedEmail {
  // Clean up markdown markers if Gemini still returns them despite instructions
  let cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
  return JSON.parse(cleaned) as GeneratedEmail;
}

/**
 * Wraps error with a more descriptive message for known error types.
 */
function handleGeminiError(error: unknown, context: string): never {
  const errMsg = error instanceof Error ? error.message : String(error);

  if (errMsg.includes('429') || errMsg.includes('Too Many Requests') || errMsg.includes('quota')) {
    console.error(`${context}:`, error);
    throw new Error(
      'Gemini API rate limit exceeded. Your free-tier quota may be exhausted. ' +
      'Please wait for it to reset or upgrade your plan at https://ai.google.dev/gemini-api/docs/rate-limits'
    );
  }

  if (errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED')) {
    console.error(`${context}:`, error);
    throw new Error('Gemini API key is invalid or does not have permission. Please check your GEMINI_API_KEY.');
  }

  if (errMsg.includes('404') || errMsg.includes('not found')) {
    console.error(`${context}:`, error);
    throw new Error(
      `Gemini model "${GEMINI_MODEL}" is not available. ` +
      'Try setting GEMINI_MODEL env var to a valid model like "gemini-2.0-flash" or "gemini-2.0-flash-lite".'
    );
  }

  console.error(`${context}:`, error);
  throw new Error(`AI ${context} failed. See server logs for details.`);
}

export class AIService {
  /**
   * Generates a new email based on a prompt and tone.
   */
  static async generateNewEmail(prompt: string, tone: string, recipientName?: string): Promise<GeneratedEmail> {
    if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API functionality requires GEMINI_API_KEY');

    const defaultPersona = process.env.DEFAULT_AI_PERSONA || 'helpful AI assistant';
    const recipientText = recipientName ? `The recipient is ${recipientName}.` : '';
    
    // We request the model to output JSON strictly for robust parsing
    const systemInstruction = `You are a ${defaultPersona} tasked with writing emails. 
      Your tone should be ${tone}. ${recipientText}
      Output the result exactly as a valid JSON object with {"subject": "<email subject>", "content": "<email body>"}. 
      Do no use markdown formatting (\`\`\`json) outside the brackets, just return the raw JSON object.`;

    const fullPrompt = `${systemInstruction}\n\nEmail Prompt: ${prompt}`;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return parseGeminiResponse(text);
    } catch (error) {
      handleGeminiError(error, 'email generation');
    }
  }

  /**
   * Generates a reply email based on previous thread context and a new instruction.
   * history is an array of objects: { role: 'user' | 'assistant', content: string }
   */
  static async generateReply(
    history: { role: string; content: string }[], 
    instruction: string, 
    tone: string, 
    recipientName?: string
  ): Promise<GeneratedEmail> {
    if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API functionality requires GEMINI_API_KEY');

    const defaultPersona = process.env.DEFAULT_AI_PERSONA || 'helpful AI assistant';
    const recipientText = recipientName ? `The recipient is ${recipientName}.` : '';

    const historyText = history.map(item => `${item.role.toUpperCase()}: ${item.content}`).join('\n\n');

    const systemInstruction = `You are a ${defaultPersona} replying to an email thread. 
      Your tone should be ${tone}. ${recipientText}
      The following is the conversation history so far. Review it carefully before writing the reply.
      
      -- HISTORY START --
      ${historyText}
      -- HISTORY END --
      
      Your new instruction for the reply is: ${instruction}
      
      Output the result exactly as a valid JSON object with {"subject": "<email subject>", "content": "<email body>"}. 
      Do no use markdown formatting (\`\`\`json) outside the brackets, just return the raw JSON object.`;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(systemInstruction);
      const response = await result.response;
      const text = response.text();

      return parseGeminiResponse(text);
    } catch (error) {
      handleGeminiError(error, 'email reply generation');
    }
  }
}
