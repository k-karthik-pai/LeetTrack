import { NextRequest, NextResponse } from 'next/server';
import { queueManager } from '@/lib/leetcode/queue';
import { getTodayDateString } from '@/lib/date';
import { StudentInput } from '@/lib/leetcode/types';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      students,
      date,
      mode,
      department,
      section,
      departmentId,
      sectionId,
    } = body as {
      students?: StudentInput[];
      date?: string;
      mode?: 'new' | 'update' | 'retry_failed';
      department?: string;
      section?: string;
      departmentId?: string;
      sectionId?: string;
    };

    const targetDate = date || getTodayDateString();

    let studentList: StudentInput[] = students || [];

    // If no students provided directly in payload, fetch from database matching filters
    if (studentList.length === 0) {
      const whereClause: any = {};

      if (departmentId) {
        whereClause.departmentId = departmentId;
      } else if (department && department !== 'ALL') {
        const dept = await prisma.department.findUnique({
          where: { code: department.toUpperCase() },
        });
        if (dept) whereClause.departmentId = dept.id;
      }

      if (sectionId) {
        whereClause.sectionId = sectionId;
      } else if (section && section !== 'ALL' && whereClause.departmentId) {
        const sec = await prisma.section.findFirst({
          where: {
            departmentId: whereClause.departmentId,
            name: section.toUpperCase(),
          },
        });
        if (sec) whereClause.sectionId = sec.id;
      }

      const dbStudents = await prisma.student.findMany({
        where: whereClause,
        include: {
          department: true,
          section: true,
        },
        orderBy: { sNo: 'asc' },
      });

      if (dbStudents.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No students found matching selected filters. Please upload an Excel file first.',
          },
          { status: 400 }
        );
      }

      studentList = dbStudents.map((s) => ({
        sNo: s.sNo,
        regNo: s.regNo,
        name: s.name,
        leetcodeUrl: s.leetcodeUrl,
        leetcodeUsername: s.leetcodeUsername,
        department: s.department?.code,
        section: s.section?.name,
        departmentId: s.departmentId || undefined,
        sectionId: s.sectionId || undefined,
      }));
    }

    const result = await queueManager.startBatch(
      studentList,
      targetDate,
      mode || 'new',
      department || undefined,
      section || undefined
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      snapshotDate: targetDate,
      totalStudents: studentList.length,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Start analyze error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error starting analysis' },
      { status: 500 }
    );
  }
}

