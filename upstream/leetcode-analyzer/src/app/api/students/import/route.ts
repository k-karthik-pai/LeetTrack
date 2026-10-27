import { NextRequest, NextResponse } from 'next/server';
import { parseStudentExcel } from '@/lib/excel';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const departmentCode = (formData.get('department') as string | null)?.trim().toUpperCase() || '';
    const sectionName = (formData.get('section') as string | null)?.trim().toUpperCase() || '';

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file uploaded. Please upload a .xlsx or .xls file.',
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          duplicateRows: 0,
          errors: ['No file provided'],
          warnings: [],
        },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only .xlsx and .xls files are supported.',
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          duplicateRows: 0,
          errors: ['Unsupported file extension'],
          warnings: [],
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parseResult = parseStudentExcel(buffer, departmentCode || undefined, sectionName || undefined);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.errors?.[0] || 'Failed to parse Excel file',
          totalRows: parseResult.totalCount,
          validRows: parseResult.validCount,
          invalidRows: parseResult.invalidCount,
          duplicateRows: parseResult.duplicateCount || 0,
          errors: parseResult.errors || [],
          warnings: parseResult.warnings || [],
          missingColumns: parseResult.missingColumns,
        },
        { status: 400 }
      );
    }

    // Resolve Department & Section in DB if specified
    let defaultDeptId: string | null = null;
    let defaultSecId: string | null = null;

    if (departmentCode) {
      const dept = await prisma.department.upsert({
        where: { code: departmentCode },
        update: {},
        create: {
          code: departmentCode,
          name: `${departmentCode} Department`,
        },
      });
      defaultDeptId = dept.id;

      if (sectionName) {
        const sec = await prisma.section.upsert({
          where: {
            departmentId_name: {
              departmentId: dept.id,
              name: sectionName,
            },
          },
          update: {},
          create: {
            departmentId: dept.id,
            name: sectionName,
          },
        });
        defaultSecId = sec.id;
      }
    }

    // Upsert students into PostgreSQL by regNo (preserving identity & historical stats)
    let upsertedCount = 0;
    for (const s of parseResult.students) {
      if (!s.regNo) continue;

      let studentDeptId = defaultDeptId;
      let studentSecId = defaultSecId;

      if (s.department && s.department !== departmentCode) {
        const dept = await prisma.department.upsert({
          where: { code: s.department.toUpperCase() },
          update: {},
          create: {
            code: s.department.toUpperCase(),
            name: `${s.department.toUpperCase()} Department`,
          },
        });
        studentDeptId = dept.id;

        if (s.section) {
          const sec = await prisma.section.upsert({
            where: {
              departmentId_name: {
                departmentId: dept.id,
                name: s.section.toUpperCase(),
              },
            },
            update: {},
            create: {
              departmentId: dept.id,
              name: s.section.toUpperCase(),
            },
          });
          studentSecId = sec.id;
        }
      }

      await prisma.student.upsert({
        where: { regNo: s.regNo },
        update: {
          name: s.name,
          sNo: s.sNo,
          leetcodeUrl: s.leetcodeUrl,
          leetcodeUsername: s.leetcodeUsername,
          ...(studentDeptId ? { departmentId: studentDeptId } : {}),
          ...(studentSecId ? { sectionId: studentSecId } : {}),
        },
        create: {
          sNo: s.sNo,
          regNo: s.regNo,
          name: s.name,
          leetcodeUrl: s.leetcodeUrl,
          leetcodeUsername: s.leetcodeUsername,
          departmentId: studentDeptId,
          sectionId: studentSecId,
        },
      });
      upsertedCount++;
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      totalRows: parseResult.totalCount,
      validRows: parseResult.validCount,
      invalidRows: parseResult.invalidCount,
      duplicateRows: parseResult.duplicateCount || 0,
      upsertedCount,
      department: departmentCode || null,
      section: sectionName || null,
      errors: parseResult.errors || [],
      warnings: parseResult.warnings || [],
      students: parseResult.students,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Import students error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Server error importing students',
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        duplicateRows: 0,
        errors: [error?.message || 'Server error'],
        warnings: [],
      },
      { status: 500 }
    );
  }
}
