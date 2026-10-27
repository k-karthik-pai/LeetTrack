import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshots = await prisma.dailySnapshot.findMany({
      orderBy: { snapshotDate: 'desc' },
      include: {
        _count: {
          select: { stats: true },
        },
      },
    });

    const enriched = await Promise.all(
      snapshots.map(async (snap) => {
        const successCount = await prisma.dailyStat.count({
          where: { snapshotId: snap.id, status: 'SUCCESS' },
        });
        const failedCount = await prisma.dailyStat.count({
          where: { snapshotId: snap.id, status: { not: 'SUCCESS' } },
        });

        return {
          id: snap.id,
          snapshotDate: snap.snapshotDate,
          totalStudents: snap.totalStudents,
          totalSolved: snap.totalSolved,
          avgSolved: snap.avgSolved,
          successCount,
          failedCount,
          createdAt: snap.createdAt,
        };
      })
    );

    return NextResponse.json({ success: true, snapshots: enriched });
  } catch (err: unknown) {
    const error = err as Error;
    console.warn('Fetch snapshots warning (DB connection):', error.message);
    return NextResponse.json({
      success: true,
      snapshots: [],
      warning: 'Database unreachable. Please check DATABASE_URL in .env.',
    });
  }
}
