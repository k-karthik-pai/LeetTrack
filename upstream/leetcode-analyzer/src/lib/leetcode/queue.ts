import prisma from '@/lib/prisma';
import { fetchLeetCodeStats, extractLeetCodeUsername } from './fetcher';
import { BatchAnalysisStatus, QueueItem, StudentInput } from './types';

class AnalysisQueueManager {
  private static instance: AnalysisQueueManager;
  private currentStatus: BatchAnalysisStatus = {
    isActive: false,
    snapshotDate: '',
    department: null,
    section: null,
    total: 0,
    processed: 0,
    successful: 0,
    notFound: 0,
    rateLimited: 0,
    failed: 0,
    currentUsername: null,
    percentage: 0,
    items: [],
    startedAt: null,
    completedAt: null,
    isComplete: false,
    error: null,
  };

  private isCancelled = false;
  private concurrency = 4; // 4 controlled workers for optimal throughput and rate-limit safety

  private constructor() {}

  public static getInstance(): AnalysisQueueManager {
    if (!AnalysisQueueManager.instance) {
      AnalysisQueueManager.instance = new AnalysisQueueManager();
    }
    return AnalysisQueueManager.instance;
  }

  public getStatus(): BatchAnalysisStatus {
    return { ...this.currentStatus };
  }

  public cancel(): void {
    if (this.currentStatus.isActive) {
      this.isCancelled = true;
      this.currentStatus.isActive = false;
      this.currentStatus.error = 'Analysis was cancelled by user';
    }
  }

  /**
   * Starts batch analysis for a list of students for a given snapshot date
   */
  public async startBatch(
    students: StudentInput[],
    snapshotDate: string,
    mode: 'new' | 'update' | 'retry_failed' = 'new',
    departmentCode?: string,
    sectionName?: string
  ): Promise<{ success: boolean; message: string }> {
    if (this.currentStatus.isActive) {
      return { success: false, message: 'An analysis is already in progress' };
    }

    this.isCancelled = false;
    const initialItems: QueueItem[] = students.map((s, idx) => ({
      id: s.regNo || `student-${idx}`,
      sNo: s.sNo,
      regNo: s.regNo,
      name: s.name,
      leetcodeUrl: s.leetcodeUrl,
      leetcodeUsername: s.leetcodeUsername || extractLeetCodeUsername(s.leetcodeUrl),
      department: s.department || departmentCode,
      section: s.section || sectionName,
      status: 'PENDING',
      errorMessage: null,
      stats: null,
    }));

    this.currentStatus = {
      isActive: true,
      snapshotDate,
      department: departmentCode || null,
      section: sectionName || null,
      total: initialItems.length,
      processed: 0,
      successful: 0,
      notFound: 0,
      rateLimited: 0,
      failed: 0,
      currentUsername: null,
      percentage: 0,
      items: initialItems,
      startedAt: new Date().toISOString(),
      completedAt: null,
      isComplete: false,
      error: null,
    };

    // Run in background without blocking API response
    this.processQueue(snapshotDate, departmentCode, sectionName).catch((err) => {
      console.error('Error during batch analysis execution:', err);
      this.currentStatus.isActive = false;
      this.currentStatus.error = err?.message || 'Unknown batch error';
    });

    return { success: true, message: `Started analysis for ${initialItems.length} students` };
  }

  private async processQueue(snapshotDate: string, departmentCode?: string, sectionName?: string) {
    try {
      // 1. Ensure snapshot record exists in database
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

      // 2. Department and Section resolution
      let defaultDeptId: string | null = null;
      let defaultSecId: string | null = null;

      if (departmentCode) {
        const dept = await prisma.department.upsert({
          where: { code: departmentCode.toUpperCase().trim() },
          update: {},
          create: {
            code: departmentCode.toUpperCase().trim(),
            name: `${departmentCode.toUpperCase().trim()} Department`,
          },
        });
        defaultDeptId = dept.id;

        if (sectionName) {
          const sec = await prisma.section.upsert({
            where: {
              departmentId_name: {
                departmentId: dept.id,
                name: sectionName.toUpperCase().trim(),
              },
            },
            update: {},
            create: {
              departmentId: dept.id,
              name: sectionName.toUpperCase().trim(),
            },
          });
          defaultSecId = sec.id;
        }
      }

      // 3. Upsert all Student records (regNo is unique stable identity)
      const studentMap = new Map<string, string>(); // regNo -> studentId

      for (const item of this.currentStatus.items) {
        const username = item.leetcodeUsername || extractLeetCodeUsername(item.leetcodeUrl);

        let studentDeptId = defaultDeptId;
        let studentSecId = defaultSecId;

        // If item has specific department/section specified
        if (item.department && item.department !== departmentCode) {
          const itemDept = await prisma.department.upsert({
            where: { code: item.department.toUpperCase().trim() },
            update: {},
            create: {
              code: item.department.toUpperCase().trim(),
              name: `${item.department.toUpperCase().trim()} Department`,
            },
          });
          studentDeptId = itemDept.id;

          if (item.section) {
            const itemSec = await prisma.section.upsert({
              where: {
                departmentId_name: {
                  departmentId: itemDept.id,
                  name: item.section.toUpperCase().trim(),
                },
              },
              update: {},
              create: {
                departmentId: itemDept.id,
                name: item.section.toUpperCase().trim(),
              },
            });
            studentSecId = itemSec.id;
          }
        }

        const student = await prisma.student.upsert({
          where: { regNo: item.regNo },
          update: {
            name: item.name,
            sNo: item.sNo,
            leetcodeUrl: item.leetcodeUrl,
            leetcodeUsername: username,
            ...(studentDeptId ? { departmentId: studentDeptId } : {}),
            ...(studentSecId ? { sectionId: studentSecId } : {}),
          },
          create: {
            sNo: item.sNo,
            regNo: item.regNo,
            name: item.name,
            leetcodeUrl: item.leetcodeUrl,
            leetcodeUsername: username,
            departmentId: studentDeptId,
            sectionId: studentSecId,
          },
        });
        studentMap.set(item.regNo, student.id);
      }

      // 4. Worker pool with controlled concurrency
      const itemsToProcess = [...this.currentStatus.items];
      let itemIndex = 0;

      const worker = async () => {
        while (itemIndex < itemsToProcess.length) {
          if (this.isCancelled) break;

          const currentIndex = itemIndex++;
          const item = itemsToProcess[currentIndex];
          if (!item) continue;

          item.status = 'PROCESSING';
          this.currentStatus.currentUsername = item.leetcodeUsername;

          // Fetch real LeetCode statistics via modular provider
          const stats = await fetchLeetCodeStats(item.leetcodeUsername);
          item.stats = stats;
          item.status = stats.status;
          item.errorMessage = stats.errorMessage || null;

          // Upsert DailyStat record
          const studentId = studentMap.get(item.regNo);
          if (studentId && snapshot) {
            await prisma.dailyStat.upsert({
              where: {
                snapshotId_studentId: {
                  snapshotId: snapshot.id,
                  studentId,
                },
              },
              update: {
                easy: stats.easy,
                medium: stats.medium,
                hard: stats.hard,
                total: stats.total,
                contestRating: stats.contestRating,
                globalRank: stats.globalRank,
                submissions: stats.submissions,
                acceptanceRate: stats.acceptanceRate,
                activeDays: stats.activeDays,
                currentStreak: stats.currentStreak,
                maxStreak: stats.maxStreak,
                status: stats.status,
                errorMessage: stats.errorMessage,
                fetchedAt: new Date(),
              },
              create: {
                snapshotId: snapshot.id,
                studentId,
                easy: stats.easy,
                medium: stats.medium,
                hard: stats.hard,
                total: stats.total,
                contestRating: stats.contestRating,
                globalRank: stats.globalRank,
                submissions: stats.submissions,
                acceptanceRate: stats.acceptanceRate,
                activeDays: stats.activeDays,
                currentStreak: stats.currentStreak,
                maxStreak: stats.maxStreak,
                status: stats.status,
                errorMessage: stats.errorMessage,
                fetchedAt: new Date(),
              },
            });
          }

          // Update counts
          this.currentStatus.processed++;
          if (stats.status === 'SUCCESS') this.currentStatus.successful++;
          else if (stats.status === 'NOT_FOUND') this.currentStatus.notFound++;
          else if (stats.status === 'RATE_LIMITED') this.currentStatus.rateLimited++;
          else this.currentStatus.failed++;

          this.currentStatus.percentage = Math.round(
            (this.currentStatus.processed / this.currentStatus.total) * 100
          );

          // Polite throttle between requests
          await new Promise((r) => setTimeout(r, 200));
        }
      };

      // Launch concurrent workers
      const workers = Array.from({ length: this.concurrency }, () => worker());
      await Promise.all(workers);

      // 5. Update Snapshot aggregates
      if (snapshot) {
        const statsSummary = await prisma.dailyStat.aggregate({
          where: { snapshotId: snapshot.id, status: 'SUCCESS' },
          _sum: { total: true },
          _count: { id: true },
        });

        const totalStudentsCount = await prisma.dailyStat.count({
          where: { snapshotId: snapshot.id },
        });

        const totalSolved = statsSummary._sum.total || 0;
        const successCount = statsSummary._count.id || 0;
        const avgSolved = successCount > 0 ? Number((totalSolved / successCount).toFixed(1)) : 0;

        await prisma.dailySnapshot.update({
          where: { id: snapshot.id },
          data: {
            totalStudents: totalStudentsCount,
            totalSolved,
            avgSolved,
          },
        });
      }

      this.currentStatus.isActive = false;
      this.currentStatus.isComplete = true;
      this.currentStatus.completedAt = new Date().toISOString();
      this.currentStatus.currentUsername = null;
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Queue processing error:', error);
      this.currentStatus.isActive = false;
      this.currentStatus.error = error?.message || 'Error occurred during queue processing';
    }
  }
}

export const queueManager = AnalysisQueueManager.getInstance();

