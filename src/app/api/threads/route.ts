import { NextResponse } from 'next/server';
import { ThreadService } from '@/services/thread.service';
import { createThreadSchema } from '@/utils/validation';
import { handleError } from '@/utils/errors';

import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Check Rate Limiting
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const rateLimit = await checkRateLimit(ip);
    
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await request.json();
    
    // Validate request body
    const { prompt, tone, recipientName } = createThreadSchema.parse(body);

    const result = await ThreadService.createThreadWithEmail(prompt, tone, recipientName);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET() {
  try {
    const threads = await ThreadService.getThreads();
    return NextResponse.json({ threads });
  } catch (error) {
    return handleError(error);
  }
}
