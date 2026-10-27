import { Router } from 'express';
import prisma from '../lib/prisma';
import { queueManager } from '../services/leetcode/queue';
import { StudentInput } from '../types';
import { toZonedTime, format } from 'date-fns-tz';
import { config } from '../config';

const router = Router();

function getTodayDateString(): string {
  const zoned = toZonedTime(new Date(), config.timezone);
  return format(zoned, 'yyyy-MM-dd', { timeZone: config.timezone });
}

// POST /api/analyze & POST /api/analyze/start
const handleStartAnalysis = async (req: any, res: any) => {
  try {
    const {
      students,
      date,
      mode = 'new',
      department,
      section,
    } = req.body as {
      students?: StudentInput[];
      date?: string;
      mode?: 'new' | 'update' | 'retry';
      department?: string;
      section?: string;
    };

    const targetDate = date || getTodayDateString();

    let studentsToProcess: StudentInput[] = [];

    if (students && Array.isArray(students) && students.length > 0) {
      studentsToProcess = students;
    } else {
      const where: any = {};
      if (department && department !== 'ALL') {
        where.department = { code: department.toUpperCase() };
      }
      if (section && section !== 'ALL') {
        where.section = { name: section.toUpperCase() };
      }

      const dbStudents = await prisma.student.findMany({
        where,
        include: { department: true, section: true },
        orderBy: { regNo: 'asc' },
      });

      if (dbStudents.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No student profiles found for the selected department/section. Please import an Excel file first.',
        });
      }

      studentsToProcess = dbStudents.map((s) => ({
        sNo: s.sNo || undefined,
        regNo: s.regNo,
        name: s.name,
        leetcodeUrl: s.leetcodeUrl,
        leetcodeUsername: s.leetcodeUsername,
        department: s.department?.code,
        section: s.section?.name,
      }));
    }

    const batchStatus = await queueManager.startBatch(
      studentsToProcess,
      targetDate,
      mode,
      department !== 'ALL' ? department : undefined,
      section !== 'ALL' ? section : undefined
    );

    return res.json({
      success: true,
      message: `Batch analysis initiated for ${studentsToProcess.length} students on ${targetDate}.`,
      status: batchStatus,
    });
  } catch (err: any) {
    console.error('Start analysis error:', err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

router.post('/', handleStartAnalysis);
router.post('/start', handleStartAnalysis);

// GET /api/analyze/progress & GET /api/analyze/:id/progress
const handleGetProgress = (req: any, res: any) => {
  const status = queueManager.getStatus();
  if (!status) {
    return res.json({
      success: true,
      status: {
        batchId: '',
        snapshotDate: '',
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        notFound: 0,
        rateLimited: 0,
        pending: 0,
        isActive: false,
        isComplete: false,
        startedAt: null,
        completedAt: null,
        items: [],
      },
    });
  }
  return res.json({ success: true, status });
};

router.get('/progress', handleGetProgress);
router.get('/:id/progress', handleGetProgress);

// POST /api/analyze/retry & POST /api/analyze/:id/retry
const handleRetryFailed = async (req: any, res: any) => {
  try {
    const { date, department, section } = req.body;
    const targetDate = date || req.params.id || getTodayDateString();

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: targetDate },
      include: {
        stats: {
          where: { status: { not: 'SUCCESS' } },
          include: { student: { include: { department: true, section: true } } },
        },
      },
    });

    if (!snapshot || snapshot.stats.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No failed profiles found for snapshot ${targetDate}.`,
      });
    }

    let filteredStats = snapshot.stats;
    if (department && department !== 'ALL') {
      filteredStats = filteredStats.filter((s) => s.student.department?.code === department.toUpperCase());
    }
    if (section && section !== 'ALL') {
      filteredStats = filteredStats.filter((s) => s.student.section?.name === section.toUpperCase());
    }

    const studentsToRetry: StudentInput[] = filteredStats.map((st) => ({
      regNo: st.student.regNo,
      name: st.student.name,
      leetcodeUrl: st.student.leetcodeUrl,
      leetcodeUsername: st.student.leetcodeUsername,
      department: st.student.department?.code,
      section: st.student.section?.name,
    }));

    const batchStatus = await queueManager.startBatch(
      studentsToRetry,
      targetDate,
      'retry',
      department !== 'ALL' ? department : undefined,
      section !== 'ALL' ? section : undefined
    );

    return res.json({
      success: true,
      message: `Retrying ${studentsToRetry.length} failed profiles for snapshot ${targetDate}.`,
      status: batchStatus,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

router.post('/retry', handleRetryFailed);
router.post('/:id/retry', handleRetryFailed);

// POST /api/analyze/cancel
router.post('/cancel', (req, res) => {
  queueManager.cancel();
  return res.json({ success: true, message: 'Analysis queue cancelled.' });
});

export default router;
