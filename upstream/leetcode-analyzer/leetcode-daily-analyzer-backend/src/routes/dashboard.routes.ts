import { Router } from 'express';
import prisma from '../lib/prisma';
import { toZonedTime, format } from 'date-fns-tz';
import { config } from '../config';

const router = Router();

function getTodayDateString(): string {
  const zoned = toZonedTime(new Date(), config.timezone);
  return format(zoned, 'yyyy-MM-dd', { timeZone: config.timezone });
}

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const { date, department, section } = req.query as {
      date?: string;
      department?: string;
      section?: string;
    };

    const todayDateStr = getTodayDateString();

    const allSnapshots = await prisma.dailySnapshot.findMany({
      orderBy: { snapshotDate: 'desc' },
      select: { snapshotDate: true },
    });
    const availableDates = allSnapshots.map((s) => s.snapshotDate);

    let targetDate = date || (availableDates.includes(todayDateStr) ? todayDateStr : availableDates[0]);
    if (!targetDate) {
      return res.json({
        success: true,
        availableDates: [],
        snapshot: null,
      });
    }

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: targetDate },
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
      return res.json({
        success: true,
        availableDates,
        snapshot: null,
      });
    }

    // Previous snapshot for diffs
    const previousSnapshot = await prisma.dailySnapshot.findFirst({
      where: { snapshotDate: { lt: targetDate } },
      orderBy: { snapshotDate: 'desc' },
      include: { stats: true },
    });

    const prevStatsMap = new Map<string, number>();
    if (previousSnapshot) {
      for (const stat of previousSnapshot.stats) {
        prevStatsMap.set(stat.studentId, stat.total);
      }
    }

    let filteredStats = snapshot.stats;
    if (department && department !== 'ALL') {
      filteredStats = filteredStats.filter(
        (s) => s.student.department?.code === department.toUpperCase()
      );
    }
    if (section && section !== 'ALL') {
      filteredStats = filteredStats.filter(
        (s) => s.student.section?.name === section.toUpperCase()
      );
    }

    // Sort with strict tie-breaking
    filteredStats.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.hard !== a.hard) return b.hard - a.hard;
      if (b.medium !== a.medium) return b.medium - a.medium;
      return b.easy - a.easy;
    });

    let currentRank = 1;
    const enrichedStudents = filteredStats.map((stat, idx) => {
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

    const successCount = enrichedStudents.filter((s) => s.status === 'SUCCESS').length;
    const failedCount = enrichedStudents.filter((s) => s.status !== 'SUCCESS').length;
    const totalSolved = enrichedStudents.reduce((sum, s) => sum + s.total, 0);
    const avgSolved = successCount > 0 ? Math.round((totalSolved / successCount) * 10) / 10 : 0;
    const totalEasy = enrichedStudents.reduce((sum, s) => sum + s.easy, 0);
    const totalMedium = enrichedStudents.reduce((sum, s) => sum + s.medium, 0);
    const totalHard = enrichedStudents.reduce((sum, s) => sum + s.hard, 0);
    const totalSubmissions = enrichedStudents.reduce((sum, s) => sum + s.submissions, 0);

    const topImprovers = [...enrichedStudents]
      .filter((s) => s.diff !== null && s.diff > 0)
      .sort((a, b) => (b.diff || 0) - (a.diff || 0))
      .slice(0, 10);

    return res.json({
      success: true,
      availableDates,
      snapshot: {
        id: snapshot.id,
        snapshotDate: snapshot.snapshotDate,
        createdAt: snapshot.createdAt,
        isToday: snapshot.snapshotDate === todayDateStr,
        previousDate: previousSnapshot?.snapshotDate || null,
        department: department || 'ALL',
        section: section || 'ALL',
        summary: {
          totalStudents: enrichedStudents.length,
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
        students: enrichedStudents,
      },
    });
  } catch (err: any) {
    console.warn('Dashboard DB warning:', err.message);
    return res.json({
      success: true,
      availableDates: [],
      snapshot: null,
      warning: 'Database unreachable',
    });
  }
});

export default router;
