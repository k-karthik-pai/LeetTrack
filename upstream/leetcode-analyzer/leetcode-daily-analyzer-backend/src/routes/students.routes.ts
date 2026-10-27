import { Router } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma';
import { parseAndValidateStudentExcel } from '../services/excel/parser';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/students/import
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    let departmentCode = req.body.department;
    let sectionName = req.body.section;
    let studentsPayload = req.body.students;

    let validationResult;

    if (req.file) {
      validationResult = parseAndValidateStudentExcel(req.file.buffer);
    } else if (studentsPayload) {
      const parsed = typeof studentsPayload === 'string' ? JSON.parse(studentsPayload) : studentsPayload;
      validationResult = {
        valid: Array.isArray(parsed) && parsed.length > 0,
        totalRows: parsed.length,
        validRows: parsed.length,
        invalidRows: 0,
        students: parsed,
        errors: [],
        warnings: [],
        duplicates: { regNos: [], usernames: [] },
      };
    } else {
      return res.status(400).json({
        success: false,
        error: 'No Excel file or student payload provided.',
      });
    }

    let deptId: string | null = null;
    let secId: string | null = null;

    if (departmentCode && departmentCode !== 'ALL') {
      const dept = await prisma.department.upsert({
        where: { code: departmentCode.toUpperCase() },
        update: {},
        create: {
          code: departmentCode.toUpperCase(),
          name: `${departmentCode.toUpperCase()} Department`,
        },
      });
      deptId = dept.id;

      if (sectionName && sectionName !== 'ALL') {
        const sec = await prisma.section.upsert({
          where: {
            departmentId_name: {
              departmentId: dept.id,
              name: sectionName.toUpperCase(),
            },
          },
          update: {},
          create: {
            name: sectionName.toUpperCase(),
            departmentId: dept.id,
          },
        });
        secId = sec.id;
      }
    }

    const savedStudents = [];
    for (const student of validationResult.students) {
      const upserted = await prisma.student.upsert({
        where: { regNo: student.regNo },
        update: {
          name: student.name,
          leetcodeUrl: student.leetcodeUrl,
          leetcodeUsername: student.leetcodeUsername || student.name,
          ...(deptId ? { departmentId: deptId } : {}),
          ...(secId ? { sectionId: secId } : {}),
          ...(student.sNo ? { sNo: student.sNo } : {}),
        },
        create: {
          regNo: student.regNo,
          name: student.name,
          leetcodeUrl: student.leetcodeUrl,
          leetcodeUsername: student.leetcodeUsername || student.name,
          departmentId: deptId,
          sectionId: secId,
          sNo: student.sNo,
        },
      });
      savedStudents.push(upserted);
    }

    return res.json({
      success: true,
      importedCount: savedStudents.length,
      department: departmentCode || 'ALL',
      section: sectionName || 'ALL',
      validation: validationResult,
      students: validationResult.students,
    });
  } catch (err: any) {
    console.error('Import students error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Import failed' });
  }
});

// GET /api/students
router.get('/', async (req, res) => {
  try {
    const { department, section, search } = req.query as {
      department?: string;
      section?: string;
      search?: string;
    };

    const where: any = {};

    if (department && department !== 'ALL') {
      where.department = { code: department.toUpperCase() };
    }

    if (section && section !== 'ALL') {
      where.section = { name: section.toUpperCase() };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { regNo: { contains: search, mode: 'insensitive' } },
        { leetcodeUsername: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { regNo: 'asc' },
      include: {
        department: true,
        section: true,
      },
    });

    return res.json({
      success: true,
      total: students.length,
      students: students.map((s) => ({
        id: s.id,
        regNo: s.regNo,
        name: s.name,
        leetcodeUrl: s.leetcodeUrl,
        leetcodeUsername: s.leetcodeUsername,
        department: s.department?.code || 'N/A',
        section: s.section?.name || 'N/A',
        createdAt: s.createdAt,
      })),
    });
  } catch (err: any) {
    return res.json({
      success: true,
      total: 0,
      students: [],
      warning: 'Database unreachable',
    });
  }
});

// GET /api/students/:id/history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id }, { regNo: id }, { leetcodeUsername: id }],
      },
      include: {
        department: true,
        section: true,
        stats: {
          include: { snapshot: true },
          orderBy: { snapshot: { snapshotDate: 'asc' } },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    const history = student.stats.map((stat) => ({
      date: stat.snapshot.snapshotDate,
      easy: stat.easy,
      medium: stat.medium,
      hard: stat.hard,
      total: stat.total,
      contestRating: stat.contestRating,
      globalRank: stat.globalRank,
      submissions: stat.submissions,
      status: stat.status,
      fetchedAt: stat.fetchedAt,
    }));

    return res.json({
      success: true,
      student: {
        id: student.id,
        regNo: student.regNo,
        name: student.name,
        leetcodeUrl: student.leetcodeUrl,
        leetcodeUsername: student.leetcodeUsername,
        department: student.department?.code || 'N/A',
        section: student.section?.name || 'N/A',
      },
      history,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id }, { regNo: id }, { leetcodeUsername: id }],
      },
      include: {
        department: true,
        section: true,
        stats: {
          include: { snapshot: true },
          orderBy: { snapshot: { snapshotDate: 'desc' } },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const latestStat = student.stats[0] || null;

    return res.json({
      success: true,
      student: {
        id: student.id,
        regNo: student.regNo,
        name: student.name,
        leetcodeUrl: student.leetcodeUrl,
        leetcodeUsername: student.leetcodeUsername,
        department: student.department?.code || 'N/A',
        section: student.section?.name || 'N/A',
        latestStat,
        history: student.stats.map((s) => ({
          date: s.snapshot.snapshotDate,
          easy: s.easy,
          medium: s.medium,
          hard: s.hard,
          total: s.total,
          contestRating: s.contestRating,
          globalRank: s.globalRank,
          status: s.status,
        })),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
