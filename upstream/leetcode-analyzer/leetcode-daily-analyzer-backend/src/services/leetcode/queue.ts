import { StudentInput, BatchAnalysisStatus, QueueItem, LeetCodeProfileStats } from '../../types';
import { leetCodeProvider } from './provider';
import prisma from '../../lib/prisma';
import { config } from '../../config';

export class AnalysisQueueManager {
  private currentStatus: BatchAnalysisStatus | null = null;
  private isProcessing = false;
  private shouldCancel = false;

  getStatus(): BatchAnalysisStatus | null {
    return this.currentStatus;
  }

  cancel() {
    this.shouldCancel = true;
    if (this.currentStatus) {
      this.currentStatus.isActive = false;
    }
  }

  async startBatch(
    students: StudentInput[],
    snapshotDate: string,
    mode: 'new' | 'update' | 'retry' = 'new',
    departmentCode?: string,
    sectionName?: string
  ): Promise<BatchAnalysisStatus> {
    if (this.isProcessing) {
      throw new Error('A batch analysis is already in progress. Please wait.');
    }

    this.shouldCancel = false;
    const batchId = `batch_${Date.now()}`;

    const items: QueueItem[] = students.map((s, idx) => ({
      id: `item_${idx}_${s.regNo}`,
      student: s,
      status: 'PENDING',
      retries: 0,
    }));

    this.currentStatus = {
      batchId,
      snapshotDate,
      department: departmentCode,
      section: sectionName,
      total: items.length,
      processed: 0,
      success: 0,
      failed: 0,
      notFound: 0,
      rateLimited: 0,
      pending: items.length,
      isActive: true,
      isComplete: false,
      startedAt: new Date().toISOString(),
      completedAt: null,
      items,
    };

    // Run processing asynchronously in background
    this.processQueue(snapshotDate, departmentCode, sectionName).catch((err) => {
      console.error('Batch processing error:', err);
      if (this.currentStatus) {
        this.currentStatus.isActive = false;
        this.currentStatus.isComplete = true;
        this.currentStatus.completedAt = new Date().toISOString();
      }
      this.isProcessing = false;
    });

    return this.currentStatus;
  }

  private async processQueue(snapshotDate: string, departmentCode?: string, sectionName?: string) {
    this.isProcessing = true;
    if (!this.currentStatus) return;

    try {
      // 1. Ensure DailySnapshot record exists in DB
      let snapshot = await prisma.dailySnapshot.findUnique({
        where: { snapshotDate },
      });

      if (!snapshot) {
        snapshot = await prisma.dailySnapshot.create({
          data: {
            snapshotDate,
            totalStudents: this.currentStatus.total,
            totalSolved: 0,
            avgSolved: 0,
          },
        });
      }

      // 2. Resolve Department and Section if provided
      let deptId: string | null = null;
      let secId: string | null = null;

      if (departmentCode) {
        const dept = await prisma.department.upsert({
          where: { code: departmentCode.toUpperCase() },
          update: {},
          create: {
            code: departmentCode.toUpperCase(),
            name: `${departmentCode.toUpperCase()} Department`,
          },
        });
        deptId = dept.id;

        if (sectionName) {
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

      // 3. Worker Concurrency Pool
      const concurrency = config.concurrency;
      const queue = [...this.currentStatus.items];
      let queueIdx = 0;

      const worker = async () => {
        while (queueIdx < queue.length) {
          if (this.shouldCancel) break;

          const itemIndex = queueIdx++;
          const item = queue[itemIndex];
          if (!item) break;

          item.status = 'PROCESSING';
          this.updateCounts();

          const rawUsername =
            item.student.leetcodeUsername ||
            this.extractUsernameFromUrl(item.student.leetcodeUrl) ||
            item.student.name;

          const stats: LeetCodeProfileStats = await leetCodeProvider.getProfile(rawUsername, 3);
          item.result = stats;

          if (stats.status === 'SUCCESS') item.status = 'SUCCESS';
          else if (stats.status === 'NOT_FOUND') item.status = 'NOT_FOUND';
          else if (stats.status === 'RATE_LIMITED') item.status = 'RATE_LIMITED';
          else item.status = 'FAILED';

          if (stats.errorMessage) item.errorMessage = stats.errorMessage;

          // 4. Upsert student and daily stat in database
          try {
            const student = await prisma.student.upsert({
              where: { regNo: item.student.regNo },
              update: {
                name: item.student.name,
                leetcodeUrl: item.student.leetcodeUrl,
                leetcodeUsername: rawUsername,
                ...(deptId ? { departmentId: deptId } : {}),
                ...(secId ? { sectionId: secId } : {}),
                ...(item.student.sNo ? { sNo: item.student.sNo } : {}),
              },
              create: {
                regNo: item.student.regNo,
                name: item.student.name,
                leetcodeUrl: item.student.leetcodeUrl,
                leetcodeUsername: rawUsername,
                departmentId: deptId,
                sectionId: secId,
                sNo: item.student.sNo,
              },
            });

            await prisma.dailyStat.upsert({
              where: {
                snapshotId_studentId: {
                  snapshotId: snapshot.id,
                  studentId: student.id,
                },
              },
              update: {
                easy: stats.easy,
                medium: stats.medium,
                hard: stats.hard,
                total: stats.total,
                contestRating: stats.contestRating,
                globalRank: stats.globalRanking || stats.ranking,
                submissions: stats.totalSubmissions || 0,
                activeDays: stats.activeDays,
                currentStreak: stats.currentStreak,
                status: stats.status,
                errorMessage: stats.errorMessage,
                fetchedAt: new Date(stats.fetchedAt),
              },
              create: {
                snapshotId: snapshot.id,
                studentId: student.id,
                easy: stats.easy,
                medium: stats.medium,
                hard: stats.hard,
                total: stats.total,
                contestRating: stats.contestRating,
                globalRank: stats.globalRanking || stats.ranking,
                submissions: stats.totalSubmissions || 0,
                activeDays: stats.activeDays,
                currentStreak: stats.currentStreak,
                status: stats.status,
                errorMessage: stats.errorMessage,
                fetchedAt: new Date(stats.fetchedAt),
              },
            });
          } catch (dbErr) {
            console.error(`DB save error for ${item.student.regNo}:`, dbErr);
          }

          this.updateCounts();

          // Polite throttling delay to protect LeetCode rate limits
          await new Promise((r) => setTimeout(r, 200));
        }
      };

      const workers = Array.from({ length: concurrency }, () => worker());
      await Promise.all(workers);

      // 5. Update Snapshot Totals
      const allStats = await prisma.dailyStat.findMany({
        where: { snapshotId: snapshot.id },
      });

      const totalStudents = allStats.length;
      const totalSolved = allStats.reduce((sum, s) => sum + s.total, 0);
      const avgSolved = totalStudents > 0 ? Math.round((totalSolved / totalStudents) * 10) / 10 : 0;

      await prisma.dailySnapshot.update({
        where: { id: snapshot.id },
        data: {
          totalStudents,
          totalSolved,
          avgSolved,
        },
      });

      if (this.currentStatus) {
        this.currentStatus.isActive = false;
        this.currentStatus.isComplete = true;
        this.currentStatus.completedAt = new Date().toISOString();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private updateCounts() {
    if (!this.currentStatus) return;
    let processed = 0;
    let success = 0;
    let failed = 0;
    let notFound = 0;
    let rateLimited = 0;
    let pending = 0;

    for (const item of this.currentStatus.items) {
      if (item.status === 'PENDING' || item.status === 'PROCESSING') {
        pending++;
      } else {
        processed++;
        if (item.status === 'SUCCESS') success++;
        else if (item.status === 'NOT_FOUND') notFound++;
        else if (item.status === 'RATE_LIMITED') rateLimited++;
        else failed++;
      }
    }

    this.currentStatus.processed = processed;
    this.currentStatus.success = success;
    this.currentStatus.failed = failed;
    this.currentStatus.notFound = notFound;
    this.currentStatus.rateLimited = rateLimited;
    this.currentStatus.pending = pending;
  }

  private extractUsernameFromUrl(url: string): string {
    if (!url) return '';
    let cleaned = url.trim().replace(/\/+$/, '');
    const match = cleaned.match(/leetcode\.com\/(?:u\/)?([a-zA-Z0-9_\-]+)/i);
    return match ? match[1] : cleaned;
  }
}

export const queueManager = new AnalysisQueueManager();
