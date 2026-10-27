import { NextResponse } from 'next/server';
import { queueManager } from '@/lib/leetcode/queue';

export async function POST() {
  queueManager.cancel();
  return NextResponse.json({ success: true, message: 'Analysis queue cancelled' });
}
