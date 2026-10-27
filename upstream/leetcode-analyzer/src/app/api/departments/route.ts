import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    return NextResponse.json({
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
  } catch (err: unknown) {
    const error = err as Error;
    console.warn('Fetch departments warning (DB connection):', error.message);
    return NextResponse.json({
      success: true,
      departments: [
        { id: 'dept-ece', code: 'ECE', name: 'Electronics and Communication Engineering', studentCount: 0, sections: [{ id: 'sec-a', name: 'A' }, { id: 'sec-b', name: 'B' }, { id: 'sec-c', name: 'C' }] },
        { id: 'dept-cse', code: 'CSE', name: 'Computer Science and Engineering', studentCount: 0, sections: [{ id: 'sec-a', name: 'A' }, { id: 'sec-b', name: 'B' }] },
        { id: 'dept-mech', code: 'MECH', name: 'Mechanical Engineering', studentCount: 0, sections: [{ id: 'sec-a', name: 'A' }] },
      ],
      warning: 'Database server unreachable. Showing default departments list.',
    });
  }
}

