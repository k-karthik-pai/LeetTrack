import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { computeRankingsAndDiffs } from '@/lib/ranking';
import { getTodayDateString } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const { date } = params;
    const { searchParams } = new URL(req.url);
    const departmentCode = searchParams.get('department')?.trim().toUpperCase() || '';
    const sectionName = searchParams.get('section')?.trim().toUpperCase() || '';

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: date },
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
      return NextResponse.json(
        { success: false, error: `No snapshot found for date ${date}` },
        { status: 404 }
      );
    }

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

    // Find the immediately preceding snapshot date
    const previousSnapshot = await prisma.dailySnapshot.findFirst({
      where: {
        snapshotDate: {
          lt: date,
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

    // Build map of previous stats: regNo -> stats
    const previousStatsMap = new Map<
      string,
      { total: number; easy: number; medium: number; hard: number }
    >();

    if (previousSnapshot) {
      previousSnapshot.stats.forEach((stat) => {
        if (stat.status === 'SUCCESS') {
          previousStatsMap.set(stat.student.regNo, {
            total: stat.total,
            easy: stat.easy,
            medium: stat.medium,
            hard: stat.hard,
          });
        }
      });
    }

    // Enrich current snapshot stats with ranks and diffs
    const enrichedStats = computeRankingsAndDiffs(stats, previousStatsMap);

    // Compute summary cards
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

    const todayDate = getTodayDateString();

    return NextResponse.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        snapshotDate: snapshot.snapshotDate,
        createdAt: snapshot.createdAt,
        isToday: snapshot.snapshotDate === todayDate,
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
    console.warn('Fetch snapshot by date warning (DB connection):', error.message);
    return NextResponse.json(
      { success: false, error: 'Snapshot not found or database unreachable. Please verify DATABASE_URL.' },
      { status: 200 }
    );
  }
}


