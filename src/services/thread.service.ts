import { EmailThread } from '@/models/EmailThread';
import { Email } from '@/models/Email';
import connectToDatabase from '@/lib/db';
import { AIService } from './ai.service';
import { APIError } from '@/utils/errors';

export class ThreadService {
  /**
   * Generates a new email and creates a Thread to store it.
   */
  static async createThreadWithEmail(prompt: string, tone: string, recipientName?: string) {
    await connectToDatabase();

    // 1. Generate the email via AI
    const generated = await AIService.generateNewEmail(prompt, tone, recipientName);

    // 2. Create the Thread
    // Generate a title based on the first 40 chars of the prompt
    const title = prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt;
    
    const thread = await EmailThread.create({
      title,
      tone,
      recipientName
    });

    // 3. Create the underlying user prompt as an email record (role: user)
    await Email.create({
      threadId: thread._id,
      role: 'user',
      content: prompt,
    });

    // 4. Create the assistant's generated email response (role: assistant)
    const assistantEmail = await Email.create({
      threadId: thread._id,
      role: 'assistant',
      subject: generated.subject,
      content: generated.content,
    });

    return {
      threadId: thread._id,
      email: assistantEmail
    };
  }

  /**
   * Fetches all threads.
   */
  static async getThreads() {
    await connectToDatabase();
    return EmailThread.find().sort({ updatedAt: -1 }).lean();
  }

  /**
   * Fetches a single thread and all its underlying emails.
   */
  static async getThreadDetails(threadId: string) {
    await connectToDatabase();
    const thread = await EmailThread.findById(threadId).lean();
    if (!thread) {
      throw new APIError(404, 'Thread not found');
    }

    const messages = await Email.find({ threadId }).sort({ createdAt: 1 }).lean();
    
    return {
      thread,
      messages
    };
  }

  /**
   * Generates a reply in an existing thread context.
   */
  static async replyToThread(threadId: string, instruction: string, overrideTone?: string) {
    await connectToDatabase();
    
    const thread = await EmailThread.findById(threadId);
    if (!thread) {
      throw new APIError(404, 'Thread not found');
    }

    // Determine the tone to use
    const toneToUse = overrideTone || thread.tone;

    // Fetch the history
    const history = await Email.find({ threadId }).sort({ createdAt: 1 }).lean();
    
    // Format history for the AI
    const historyFormatted = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Generate the reply
    const generated = await AIService.generateReply(
        historyFormatted, 
        instruction, 
        toneToUse, 
        thread.recipientName
    );

    // Save the user's instruction
    await Email.create({
      threadId: thread._id,
      role: 'user',
      content: instruction,
    });

    // Save the assistant's newly generated email
    const assistantEmail = await Email.create({
      threadId: thread._id,
      role: 'assistant',
      subject: generated.subject,
      content: generated.content,
    });

    // Update the thread's updatedAt timestamp
    thread.updatedAt = new Date();
    // Update tone if it was overridden
    if (overrideTone) {
      thread.tone = overrideTone;
    }
    await thread.save();

    return assistantEmail;
  }
}
