import { Router } from 'express';
import prisma from '../lib/prisma';
import { toZonedTime, format } from 'date-fns-tz';
import { config } from '../config';

const router = Router();

function getTodayDateString(): string {
  const zoned = toZonedTime(new Date(), config.timezone);
  return format(zoned, 'yyyy-MM-dd', { timeZone: config.timezone });
}

// GET /api/leaderboard
router.get('/', async (req, res) => {
  try {
    const { date, department, section } = req.query as {
      date?: string;
      department?: string;
      section?: string;
    };

    const targetDate = date || getTodayDateString();

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: targetDate },
      include: {
        stats: {
          where: { status: 'SUCCESS' },
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
        date: targetDate,
        total: 0,
        leaderboard: [],
      });
    }

    let stats = snapshot.stats;
    if (department && department !== 'ALL') {
      stats = stats.filter((s) => s.student.department?.code === department.toUpperCase());
    }
    if (section && section !== 'ALL') {
      stats = stats.filter((s) => s.student.section?.name === section.toUpperCase());
    }

    // Sort with strict tie-breaking: Total DESC -> Hard DESC -> Medium DESC -> Easy DESC
    stats.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.hard !== a.hard) return b.hard - a.hard;
      if (b.medium !== a.medium) return b.medium - a.medium;
      return b.easy - a.easy;
    });

    let currentRank = 1;
    const leaderboard = stats.map((stat, idx) => {
      if (idx > 0) {
        const prev = stats[idx - 1];
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
        rank: currentRank,
        studentId: stat.student.id,
        regNo: stat.student.regNo,
        name: stat.student.name,
        leetcodeUsername: stat.student.leetcodeUsername,
        department: stat.student.department?.code || 'N/A',
        section: stat.student.section?.name || 'N/A',
        easy: stat.easy,
        medium: stat.medium,
        hard: stat.hard,
        total: stat.total,
        contestRating: stat.contestRating,
        globalRank: stat.globalRank,
      };
    });

    return res.json({
      success: true,
      date: targetDate,
      total: leaderboard.length,
      leaderboard,
    });
  } catch (err: any) {
    return res.json({
      success: true,
      date: req.query.date || getTodayDateString(),
      total: 0,
      leaderboard: [],
      warning: 'Database unreachable',
    });
  }
});

export default router;
