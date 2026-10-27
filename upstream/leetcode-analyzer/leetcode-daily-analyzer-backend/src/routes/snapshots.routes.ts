import { Router } from 'express';
import prisma from '../lib/prisma';
import { toZonedTime, format } from 'date-fns-tz';
import { config } from '../config';

const router = Router();

function getTodayDateString(): string {
  const zoned = toZonedTime(new Date(), config.timezone);
  return format(zoned, 'yyyy-MM-dd', { timeZone: config.timezone });
}

// GET /api/snapshots
router.get('/', async (req, res) => {
  try {
    const snapshots = await prisma.dailySnapshot.findMany({
      orderBy: { snapshotDate: 'desc' },
      include: {
        _count: { select: { stats: true } },
      },
    });

    const enriched = await Promise.all(
      snapshots.map(async (snap) => {
        const successCount = await prisma.dailyStat.count({
          where: { snapshotId: snap.id, status: 'SUCCESS' },
        });
        const failedCount = await prisma.dailyStat.count({
          where: { snapshotId: snap.id, status: { not: 'SUCCESS' } },
        });

        return {
          id: snap.id,
          snapshotDate: snap.snapshotDate,
          totalStudents: snap.totalStudents,
          totalSolved: snap.totalSolved,
          avgSolved: snap.avgSolved,
          successCount,
          failedCount,
          createdAt: snap.createdAt,
        };
      })
    );

    return res.json({ success: true, snapshots: enriched });
  } catch (err: any) {
    return res.json({
      success: true,
      snapshots: [],
      warning: 'Database unreachable',
    });
  }
});

// GET /api/snapshots/:date
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { department, section } = req.query as { department?: string; section?: string };

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: date },
      include: {
        stats: {
          include: {
            student: {
              include: { department: true, section: true },
            },
          },
        },
      },
    });

    if (!snapshot) {
      return res.status(404).json({ success: false, error: `Snapshot not found for date: ${date}` });
    }

    const previousSnapshot = await prisma.dailySnapshot.findFirst({
      where: { snapshotDate: { lt: date } },
      orderBy: { snapshotDate: 'desc' },
      include: { stats: true },
    });

    const prevStatsMap = new Map<string, number>();
    if (previousSnapshot) {
      for (const s of previousSnapshot.stats) {
        prevStatsMap.set(s.studentId, s.total);
      }
    }

    let filteredStats = snapshot.stats;
    if (department && department !== 'ALL') {
      filteredStats = filteredStats.filter((s) => s.student.department?.code === department.toUpperCase());
    }
    if (section && section !== 'ALL') {
      filteredStats = filteredStats.filter((s) => s.student.section?.name === section.toUpperCase());
    }

    // Sort: Total DESC -> Hard DESC -> Medium DESC -> Easy DESC
    filteredStats.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.hard !== a.hard) return b.hard - a.hard;
      if (b.medium !== a.medium) return b.medium - a.medium;
      return b.easy - a.easy;
    });

    let currentRank = 1;
    const enrichedStats = filteredStats.map((stat, idx) => {
      const prevTotal = prevStatsMap.get(stat.studentId);
      const diff = prevTotal !== undefined ? stat.total - prevTotal : null;

      if (idx > 0) {
        const prev = filteredStats[idx - 1];
        if (
          stat.total !== prev.total ||
          stat.hard !== prev.hard ||
          stat.medium !== prev.medium ||
          stat.easy !== prev.easy
        ) {
          currentRank = idx + 1;
        }
      }

      return {
        id: stat.student.id,
        sNo: stat.student.sNo || idx + 1,
        regNo: stat.student.regNo,
        name: stat.student.name,
        department: stat.student.department?.code || 'N/A',
        section: stat.student.section?.name || 'N/A',
        leetcodeUrl: stat.student.leetcodeUrl,
        leetcodeUsername: stat.student.leetcodeUsername,
        easy: stat.easy,
        medium: stat.medium,
        hard: stat.hard,
        total: stat.total,
        diff,
        contestRating: stat.contestRating || null,
        globalRank: stat.globalRank || null,
        submissions: stat.submissions || 0,
        activeDays: stat.activeDays || null,
        currentStreak: stat.currentStreak || null,
        status: stat.status,
        errorMessage: stat.errorMessage,
        rank: stat.status === 'SUCCESS' ? currentRank : 999,
        fetchedAt: stat.fetchedAt,
      };
    });

    const successCount = enrichedStats.filter((s) => s.status === 'SUCCESS').length;
    const failedCount = enrichedStats.filter((s) => s.status !== 'SUCCESS').length;
    const totalSolved = enrichedStats.reduce((sum, s) => sum + s.total, 0);
    const avgSolved = successCount > 0 ? Math.round((totalSolved / successCount) * 10) / 10 : 0;
    const totalEasy = enrichedStats.reduce((sum, s) => sum + s.easy, 0);
    const totalMedium = enrichedStats.reduce((sum, s) => sum + s.medium, 0);
    const totalHard = enrichedStats.reduce((sum, s) => sum + s.hard, 0);
    const totalSubmissions = enrichedStats.reduce((sum, s) => sum + s.submissions, 0);

    const topImprovers = [...enrichedStats]
      .filter((s) => s.diff !== null && s.diff > 0)
      .sort((a, b) => (b.diff || 0) - (a.diff || 0))
      .slice(0, 10);

    const todayDate = getTodayDateString();

    return res.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        snapshotDate: snapshot.snapshotDate,
        createdAt: snapshot.createdAt,
        isToday: snapshot.snapshotDate === todayDate,
        previousDate: previousSnapshot?.snapshotDate || null,
        department: department || 'ALL',
        section: section || 'ALL',
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
  } catch (err: any) {
    return res.json({
      success: false,
      error: 'Snapshot not found or database unreachable',
    });
  }
});

export default router;
