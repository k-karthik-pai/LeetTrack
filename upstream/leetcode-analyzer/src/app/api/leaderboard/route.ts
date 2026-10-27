import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTodayDateString } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const departmentCode = searchParams.get('department')?.trim().toUpperCase() || '';
    const sectionName = searchParams.get('section')?.trim().toUpperCase() || '';
    const category = (searchParams.get('category') || 'all').toLowerCase();

    const todayDateStr = getTodayDateString();

    let targetDate = dateParam;
    if (!targetDate) {
      const latestSnap = await prisma.dailySnapshot.findFirst({
        orderBy: { snapshotDate: 'desc' },
        select: { snapshotDate: true },
      });
      targetDate = latestSnap?.snapshotDate || todayDateStr;
    }

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: targetDate },
      include: {
        stats: {
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

    if (!snapshot) {
      return NextResponse.json({
        success: true,
        snapshotDate: targetDate,
        students: [],
        podium: { first: null, second: null, third: null },
        summary: { totalStudents: 0, totalSolved: 0, averageSolved: 0 },
      });
    }

    let stats = snapshot.stats.filter((s) => s.status === 'SUCCESS');

    if (departmentCode && departmentCode !== 'ALL') {
      stats = stats.filter(
        (st) => st.student.department?.code.toUpperCase() === departmentCode
      );
    }

    if (sectionName && sectionName !== 'ALL') {
      stats = stats.filter(
        (st) => st.student.section?.name.toUpperCase() === sectionName
      );
    }

    // Sort according to category with strict tie-breaking
    stats.sort((a, b) => {
      if (category === 'easy') {
        if (b.easy !== a.easy) return b.easy - a.easy;
        return b.total - a.total;
      }
      if (category === 'medium') {
        if (b.medium !== a.medium) return b.medium - a.medium;
        return b.total - a.total;
      }
      if (category === 'hard') {
        if (b.hard !== a.hard) return b.hard - a.hard;
        return b.total - a.total;
      }
      if (category === 'rating') {
        const aRating = a.contestRating || 0;
        const bRating = b.contestRating || 0;
        if (bRating !== aRating) return bRating - aRating;
        return b.total - a.total;
      }

      // Default: total DESC -> hard DESC -> medium DESC -> easy DESC
      if (b.total !== a.total) return b.total - a.total;
      if (b.hard !== a.hard) return b.hard - a.hard;
      if (b.medium !== a.medium) return b.medium - a.medium;
      if (b.easy !== a.easy) return b.easy - a.easy;
      return (a.student.name || '').localeCompare(b.student.name || '');
    });

    const rankedStudents = stats.map((st, idx) => ({
      id: st.id,
      studentId: st.student.id,
      rank: idx + 1,
      sNo: st.student.sNo ?? idx + 1,
      regNo: st.student.regNo,
      name: st.student.name,
      department: st.student.department?.code || null,
      section: st.student.section?.name || null,
      leetcodeUrl: st.student.leetcodeUrl,
      leetcodeUsername: st.student.leetcodeUsername,
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
    }));

    const totalSolved = rankedStudents.reduce((acc, s) => acc + s.total, 0);
    const avgSolved = rankedStudents.length > 0 ? Number((totalSolved / rankedStudents.length).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      snapshotDate: targetDate,
      category,
      department: departmentCode || 'ALL',
      section: sectionName || 'ALL',
      summary: {
        totalStudents: rankedStudents.length,
        totalSolved,
        averageSolved: avgSolved,
      },
      podium: {
        first: rankedStudents[0] || null,
        second: rankedStudents[1] || null,
        third: rankedStudents[2] || null,
      },
      students: rankedStudents,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error loading leaderboard' },
      { status: 500 }
    );
  }
}
