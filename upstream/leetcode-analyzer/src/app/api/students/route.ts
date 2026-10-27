import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentCode = searchParams.get('department')?.trim().toUpperCase() || '';
    const sectionName = searchParams.get('section')?.trim().toUpperCase() || '';
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const whereClause: any = {};

    if (departmentCode && departmentCode !== 'ALL') {
      whereClause.department = { code: departmentCode };
    }

    if (sectionName && sectionName !== 'ALL') {
      whereClause.section = { name: sectionName };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { regNo: { contains: search, mode: 'insensitive' } },
        { leetcodeUsername: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        department: true,
        section: true,
        stats: {
          orderBy: {
            snapshot: {
              snapshotDate: 'desc',
            },
          },
          take: 1,
        },
      },
      orderBy: { sNo: 'asc' },
    });

    const formatted = students.map((s) => {
      const latestStat = s.stats[0] || null;
      return {
        id: s.id,
        sNo: s.sNo,
        regNo: s.regNo,
        name: s.name,
        leetcodeUrl: s.leetcodeUrl,
        leetcodeUsername: s.leetcodeUsername,
        department: s.department?.code || null,
        departmentName: s.department?.name || null,
        section: s.section?.name || null,
        easy: latestStat?.easy ?? 0,
        medium: latestStat?.medium ?? 0,
        hard: latestStat?.hard ?? 0,
        total: latestStat?.total ?? 0,
        contestRating: latestStat?.contestRating ?? null,
        globalRank: latestStat?.globalRank ?? null,
        status: latestStat?.status ?? 'PENDING',
      };
    });

    return NextResponse.json({
      success: true,
      total: formatted.length,
      students: formatted,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Fetch students error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
