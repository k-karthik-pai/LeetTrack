import { Router } from 'express';
import prisma from '../lib/prisma';
import { generateSnapshotExcel, generateSnapshotCSV, ExportRow } from '../services/excel/exporter';

const router = Router();

const handleExport = async (req: any, res: any) => {
  try {
    const { date: queryDate, format = 'xlsx', department, section } = req.query as {
      date?: string;
      format?: 'xlsx' | 'csv';
      department?: string;
      section?: string;
    };

    const targetDate = req.params.date || queryDate;

    if (!targetDate) {
      return res.status(400).json({ success: false, error: 'Snapshot date is required for export' });
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

    if (!snapshot || snapshot.stats.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No snapshot data found for date: ${targetDate}`,
      });
    }

    let stats = snapshot.stats;
    if (department && department !== 'ALL') {
      stats = stats.filter((s) => s.student.department?.code === department.toUpperCase());
    }
    if (section && section !== 'ALL') {
      stats = stats.filter((s) => s.student.section?.name === section.toUpperCase());
    }

    stats.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.hard !== a.hard) return b.hard - a.hard;
      if (b.medium !== a.medium) return b.medium - a.medium;
      return b.easy - a.easy;
    });

    const exportRows: ExportRow[] = stats.map((stat, idx) => ({
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
      contestRating: stat.contestRating ? Math.round(stat.contestRating) : 'N/A',
      globalRank: stat.globalRank || 'N/A',
      totalSubmissions: stat.submissions || 0,
      acceptanceRate: stat.acceptanceRate ? `${(stat.acceptanceRate * 100).toFixed(1)}%` : 'N/A',
      activeDays: stat.activeDays !== null && stat.activeDays !== undefined ? stat.activeDays : 'N/A',
      currentStreak: stat.currentStreak !== null && stat.currentStreak !== undefined ? stat.currentStreak : 'N/A',
      maxStreak: stat.maxStreak !== null && stat.maxStreak !== undefined ? stat.maxStreak : 'N/A',
      status: stat.status,
      date: targetDate,
    }));

    if (format === 'csv') {
      const csvContent = generateSnapshotCSV(exportRows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="leetcode_snapshot_${targetDate}.csv"`
      );
      return res.send(csvContent);
    }

    const excelBuffer = generateSnapshotExcel(exportRows, targetDate);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="leetcode_snapshot_${targetDate}.xlsx"`
    );
    return res.send(excelBuffer);
  } catch (err: any) {
    console.error('Export error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to generate export' });
  }
};

router.get('/', handleExport);
router.get('/:date', handleExport);

export default router;
