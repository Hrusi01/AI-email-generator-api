import { z } from 'zod';

export const createThreadSchema = z.object({
  prompt: z.string().min(5, 'Prompt must be at least 5 characters').max(2000, 'Prompt too long'),
  recipientName: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent', 'neutral']).default('professional'),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;

export const replyThreadSchema = z.object({
  replyInstruction: z.string().min(5, 'Instructions must be at least 5 characters').max(2000, 'Instructions too long'),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent', 'neutral']).optional(),
});

export type ReplyThreadInput = z.infer<typeof replyThreadSchema>;
