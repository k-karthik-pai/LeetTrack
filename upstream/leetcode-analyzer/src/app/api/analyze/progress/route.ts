import { NextResponse } from 'next/server';
import { queueManager } from '@/lib/leetcode/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = queueManager.getStatus();
  return NextResponse.json({ success: true, status });
}
