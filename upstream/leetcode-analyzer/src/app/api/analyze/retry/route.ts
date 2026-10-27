import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { queueManager } from '@/lib/leetcode/queue';
import { getTodayDateString } from '@/lib/date';
import { StudentInput } from '@/lib/leetcode/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { date, department, section } = body as {
      date?: string;
      department?: string;
      section?: string;
    };

    const targetDate = date || getTodayDateString();

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: targetDate },
      include: {
        stats: {
          where: {
            status: { not: 'SUCCESS' },
          },
          include: {
            student: {
              include: {
                department: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!snapshot || snapshot.stats.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No failed or pending profiles found to retry for date ${targetDate}`,
        },
        { status: 400 }
      );
    }

    let statsToRetry = snapshot.stats;

    if (department && department !== 'ALL') {
      statsToRetry = statsToRetry.filter(
        (s) => s.student.department?.code.toUpperCase() === department.toUpperCase()
      );
    }

    if (section && section !== 'ALL') {
      statsToRetry = statsToRetry.filter(
        (s) => s.student.section?.name.toUpperCase() === section.toUpperCase()
      );
    }

    const studentsToRetry: StudentInput[] = statsToRetry.map((st) => ({
      sNo: st.student.sNo,
      regNo: st.student.regNo,
      name: st.student.name,
      leetcodeUrl: st.student.leetcodeUrl,
      leetcodeUsername: st.student.leetcodeUsername,
      department: st.student.department?.code,
      section: st.student.section?.name,
    }));

    const result = await queueManager.startBatch(
      studentsToRetry,
      targetDate,
      'retry_failed',
      department || undefined,
      section || undefined
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: `Retrying ${studentsToRetry.length} failed profiles for ${targetDate}`,
      snapshotDate: targetDate,
      totalRetried: studentsToRetry.length,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Retry error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error retrying analysis' },
      { status: 500 }
    );
  }
}
