import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateSnapshotExcel, generateSnapshotCSV } from '@/lib/excel';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();
    const departmentCode = searchParams.get('department')?.trim().toUpperCase() || '';
    const sectionName = searchParams.get('section')?.trim().toUpperCase() || '';

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Snapshot date is required in query params (e.g. ?date=2026-08-16)' },
        { status: 400 }
      );
    }

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: date },
      include: {
        stats: {
          include: {
            student: {
              include: {
                department: true,
                section: true,
              },
            },
          },
          orderBy: [
            { total: 'desc' },
            { hard: 'desc' },
            { medium: 'desc' },
            { easy: 'desc' },
          ],
        },
      },
    });

    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: `Snapshot not found for date ${date}` },
        { status: 404 }
      );
    }

    let stats = snapshot.stats;

    if (departmentCode && departmentCode !== 'ALL') {
      stats = stats.filter(
        (st) => st.student.department?.code.toUpperCase() === departmentCode
      );
    }

    if (sectionName && sectionName !== 'ALL') {
      stats = stats.filter(
        (st) => st.student.section?.name.toUpperCase() === sectionName
      );
    }

    const exportRows = stats.map((st, idx) => ({
      sNo: st.student.sNo ?? idx + 1,
      regNo: st.student.regNo,
      name: st.student.name,
      department: st.student.department?.code || 'N/A',
      section: st.student.section?.name || 'N/A',
      leetcodeUrl: st.student.leetcodeUrl,
      leetcodeUsername: st.student.leetcodeUsername,
      easy: st.easy,
      medium: st.medium,
      hard: st.hard,
      total: st.total,
      contestRating: st.contestRating,
      globalRank: st.globalRank,
      submissions: st.submissions,
      acceptanceRate: st.acceptanceRate,
      activeDays: st.activeDays,
      currentStreak: st.currentStreak,
      maxStreak: st.maxStreak,
      status: st.status,
      snapshotDate: snapshot.snapshotDate,
    }));

    const deptSuffix = departmentCode && departmentCode !== 'ALL' ? `_${departmentCode}` : '';
    const secSuffix = sectionName && sectionName !== 'ALL' ? `_${sectionName}` : '';
    const filenameBase = `leetcode_${date}${deptSuffix}${secSuffix}`;

    if (format === 'csv') {
      const csvContent = generateSnapshotCSV(exportRows);
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filenameBase}.csv"`,
        },
      });
    } else {
      const excelBuffer = generateSnapshotExcel(exportRows);
      return new Response(new Uint8Array(excelBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filenameBase}.xlsx"`,
        },
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to export snapshot' },
      { status: 500 }
    );
  }
}

