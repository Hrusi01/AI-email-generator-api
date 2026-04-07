import { NextResponse } from 'next/server';
import { ThreadService } from '@/services/thread.service';
import { replyThreadSchema } from '@/utils/validation';
import { handleError } from '@/utils/errors';

import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    // Check Rate Limiting
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const rateLimit = await checkRateLimit(ip);
    
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const threadId = (await params).threadId;

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate request body
    const { replyInstruction, tone } = replyThreadSchema.parse(body);

    const email = await ThreadService.replyToThread(threadId, replyInstruction, tone);

    return NextResponse.json({ email }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
