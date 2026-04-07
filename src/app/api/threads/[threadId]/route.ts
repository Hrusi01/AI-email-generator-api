import { NextResponse } from 'next/server';
import { ThreadService } from '@/services/thread.service';
import { handleError } from '@/utils/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const threadId = (await params).threadId;
    
    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    const { thread, messages } = await ThreadService.getThreadDetails(threadId);

    return NextResponse.json({ thread, messages }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
