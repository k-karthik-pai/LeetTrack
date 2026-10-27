import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { queueManager } from '@/lib/leetcode/queue';
import { StudentInput } from '@/lib/leetcode/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const { date } = params;
    const body = await req.json().catch(() => ({}));
    const { retryAll = false } = body as { retryAll?: boolean };

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: date },
      include: {
        stats: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: `No snapshot found for date ${date}` },
        { status: 404 }
      );
    }

    const targetStats = retryAll
      ? snapshot.stats
      : snapshot.stats.filter((s) => s.status !== 'SUCCESS');

    if (targetStats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matching profiles found to re-analyse.' },
        { status: 400 }
      );
    }

    const studentsToRetry: StudentInput[] = targetStats.map((s) => ({
      sNo: s.student.sNo,
      regNo: s.student.regNo,
      name: s.student.name,
      leetcodeUrl: s.student.leetcodeUrl,
      leetcodeUsername: s.student.leetcodeUsername,
    }));

    const result = await queueManager.startBatch(
      studentsToRetry,
      date,
      retryAll ? 'update' : 'retry_failed'
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: `Started re-analysis for ${studentsToRetry.length} students`,
      totalStudents: studentsToRetry.length,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Retry analysis error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retry analysis' },
      { status: 500 }
    );
  }
}
