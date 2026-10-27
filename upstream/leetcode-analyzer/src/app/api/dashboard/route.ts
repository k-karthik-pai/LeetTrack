import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { computeRankingsAndDiffs } from '@/lib/ranking';
import { getTodayDateString } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const departmentCode = searchParams.get('department')?.trim().toUpperCase() || '';
    const sectionName = searchParams.get('section')?.trim().toUpperCase() || '';

    const todayDateStr = getTodayDateString();

    // 1. Fetch available snapshots
    const allSnapshots = await prisma.dailySnapshot.findMany({
      orderBy: { snapshotDate: 'desc' },
      select: { snapshotDate: true },
    });

    const availableDates = allSnapshots.map((s) => s.snapshotDate);

    // Determine target date
    let targetDate = dateParam || (availableDates.length > 0 ? (availableDates.includes(todayDateStr) ? todayDateStr : availableDates[0]) : todayDateStr);

    // 2. Fetch specific snapshot
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
        availableDates,
        snapshot: null,
        message: `No snapshot available for date ${targetDate}`,
      });
    }

    // Filter stats by Department and Section if provided
    let stats = snapshot.stats;

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

    // 3. Find immediately preceding snapshot for comparison
    const previousSnapshot = await prisma.dailySnapshot.findFirst({
      where: {
        snapshotDate: {
          lt: targetDate,
        },
      },
      orderBy: { snapshotDate: 'desc' },
      include: {
        stats: {
          include: {
            student: true,
          },
        },
      },
    });

    const previousStatsMap = new Map<
      string,
      { total: number; easy: number; medium: number; hard: number }
    >();

    if (previousSnapshot) {
      previousSnapshot.stats.forEach((st) => {
        if (st.status === 'SUCCESS') {
          previousStatsMap.set(st.student.regNo, {
            total: st.total,
            easy: st.easy,
            medium: st.medium,
            hard: st.hard,
          });
        }
      });
    }

    // 4. Enrich stats with rankings & diffs
    const enrichedStats = computeRankingsAndDiffs(stats, previousStatsMap);

    // 5. Aggregate summary cards
    let totalEasy = 0;
    let totalMedium = 0;
    let totalHard = 0;
    let totalSubmissions = 0;
    let successCount = 0;
    let failedCount = 0;

    enrichedStats.forEach((s) => {
      if (s.status === 'SUCCESS') {
        successCount++;
        totalEasy += s.easy;
        totalMedium += s.medium;
        totalHard += s.hard;
        if (s.submissions) totalSubmissions += s.submissions;
      } else {
        failedCount++;
      }
    });

    const totalSolved = totalEasy + totalMedium + totalHard;
    const avgSolved = successCount > 0 ? Number((totalSolved / successCount).toFixed(1)) : 0;

    // Top improvers
    const topImprovers = enrichedStats
      .filter((s) => s.diff !== null && s.diff !== undefined && s.diff > 0)
      .sort((a, b) => (b.diff || 0) - (a.diff || 0))
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      availableDates,
      snapshot: {
        id: snapshot.id,
        snapshotDate: snapshot.snapshotDate,
        createdAt: snapshot.createdAt,
        isToday: snapshot.snapshotDate === todayDateStr,
        previousDate: previousSnapshot?.snapshotDate || null,
        department: departmentCode || 'ALL',
        section: sectionName || 'ALL',
        summary: {
          totalStudents: enrichedStats.length,
          profilesAnalysed: successCount,
          profilesFailed: failedCount,
          totalProblemsSolved: totalSolved,
          avgProblemsSolved: avgSolved,
          totalEasy,
          totalMedium,
          totalHard,
          totalSubmissions,
        },
        topImprovers,
        students: enrichedStats,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.warn('Dashboard API warning (DB connection):', error.message);
    return NextResponse.json({
      success: true,
      availableDates: [],
      snapshot: null,
      warning: 'Database unreachable. Please check DATABASE_URL in .env.',
    });
  }
}

