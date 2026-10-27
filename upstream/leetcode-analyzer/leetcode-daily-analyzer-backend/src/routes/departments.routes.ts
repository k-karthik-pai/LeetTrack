import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/departments
router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { code: 'asc' },
      include: {
        sections: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    return res.json({
      success: true,
      departments: departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        studentCount: d._count.students,
        sections: d.sections.map((s) => ({
          id: s.id,
          name: s.name,
        })),
      })),
    });
  } catch (err: any) {
    console.warn('Fetch departments DB warning:', err.message);
    return res.json({
      success: true,
      departments: [
        { id: 'dept-ece', code: 'ECE', name: 'Electronics and Communication Engineering', studentCount: 0, sections: [{ id: 'sec-a', name: 'A' }, { id: 'sec-b', name: 'B' }, { id: 'sec-c', name: 'C' }] },
        { id: 'dept-cse', code: 'CSE', name: 'Computer Science and Engineering', studentCount: 0, sections: [{ id: 'sec-a', name: 'A' }, { id: 'sec-b', name: 'B' }] },
        { id: 'dept-mech', code: 'MECH', name: 'Mechanical Engineering', studentCount: 0, sections: [{ id: 'sec-a', name: 'A' }] },
      ],
      warning: 'Database server unreachable. Showing default departments.',
    });
  }
});

// GET /api/departments/:id/sections
router.get('/:id/sections', async (req, res) => {
  try {
    const { id } = req.params;
    const sections = await prisma.section.findMany({
      where: { departmentId: id },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, sections });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
