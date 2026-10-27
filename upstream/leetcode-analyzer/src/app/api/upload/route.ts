import { NextRequest, NextResponse } from 'next/server';
import { parseStudentExcel } from '@/lib/excel';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const departmentCode = (formData.get('department') as string | null)?.trim().toUpperCase() || '';
    const sectionName = (formData.get('section') as string | null)?.trim().toUpperCase() || '';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded. Please upload a .xlsx or .xls file.' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only .xlsx and .xls files are supported.' },
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
          missingColumns: parseResult.missingColumns,
          totalDetected: parseResult.totalCount,
          errors: parseResult.errors || [],
          warnings: parseResult.warnings || [],
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      totalDetected: parseResult.totalCount,
      validCount: parseResult.validCount,
      invalidCount: parseResult.invalidCount,
      duplicateCount: parseResult.duplicateCount || 0,
      department: departmentCode || null,
      section: sectionName || null,
      warnings: parseResult.warnings || [],
      duplicates: parseResult.duplicates || [],
      students: parseResult.students,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error processing file' },
      { status: 500 }
    );
  }
}

