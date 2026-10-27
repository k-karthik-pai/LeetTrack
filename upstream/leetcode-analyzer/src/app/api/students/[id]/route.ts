import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Search by student ID or regNo
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id }, { regNo: id }, { leetcodeUsername: id }],
      },
      include: {
        department: true,
        section: true,
        stats: {
          include: {
            snapshot: true,
          },
          orderBy: {
            snapshot: {
              snapshotDate: 'asc',
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: `Student with identifier "${id}" not found` },
        { status: 404 }
      );
    }

    const history = student.stats.map((st) => ({
      statId: st.id,
      snapshotDate: st.snapshot.snapshotDate,
      easy: st.easy,
      medium: st.medium,
      hard: st.hard,
      total: st.total,
      contestRating: st.contestRating,
      globalRank: st.globalRank,
      submissions: st.submissions,
      acceptanceRate: st.acceptanceRate,
      activeDays: st.activeDays,
      currentStreak: st.currentStreak,
      maxStreak: st.maxStreak,
      status: st.status,
      errorMessage: st.errorMessage,
      fetchedAt: st.fetchedAt,
    }));

    // Latest recorded stats
    const latestStat = history.length > 0 ? history[history.length - 1] : null;

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        sNo: student.sNo,
        regNo: student.regNo,
        name: student.name,
        leetcodeUrl: student.leetcodeUrl,
        leetcodeUsername: student.leetcodeUsername,
        department: student.department?.code || null,
        departmentName: student.department?.name || null,
        section: student.section?.name || null,
        latestStat,
        history,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Fetch student history error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch student details' },
      { status: 500 }
    );
  }
}
