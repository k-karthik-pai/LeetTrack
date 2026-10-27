import { NextResponse } from 'next/server';
import { generateSampleExcelTemplate } from '@/lib/excel';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const excelBuffer = generateSampleExcelTemplate();

    return new Response(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="leetcode_students_template.xlsx"',
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Template download error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate template' },
      { status: 500 }
    );
  }
}
