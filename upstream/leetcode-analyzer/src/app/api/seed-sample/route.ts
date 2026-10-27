import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTodayDateString } from '@/lib/date';
import { subDays, format, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const todayStr = getTodayDateString();
    const todayDate = parseISO(todayStr);
    const yesterdayStr = format(subDays(todayDate, 1), 'yyyy-MM-dd');
    const dayBeforeStr = format(subDays(todayDate, 2), 'yyyy-MM-dd');

    // 1. Seed Departments & Sections
    const eceDept = await prisma.department.upsert({
      where: { code: 'ECE' },
      update: { name: 'Electronics and Communication Engineering' },
      create: { code: 'ECE', name: 'Electronics and Communication Engineering' },
    });

    const cseDept = await prisma.department.upsert({
      where: { code: 'CSE' },
      update: { name: 'Computer Science and Engineering' },
      create: { code: 'CSE', name: 'Computer Science and Engineering' },
    });

    const mechDept = await prisma.department.upsert({
      where: { code: 'MECH' },
      update: { name: 'Mechanical Engineering' },
      create: { code: 'MECH', name: 'Mechanical Engineering' },
    });

    // Sections
    const eceSecA = await prisma.section.upsert({
      where: { departmentId_name: { departmentId: eceDept.id, name: 'A' } },
      update: {},
      create: { departmentId: eceDept.id, name: 'A' },
    });

    const eceSecB = await prisma.section.upsert({
      where: { departmentId_name: { departmentId: eceDept.id, name: 'B' } },
      update: {},
      create: { departmentId: eceDept.id, name: 'B' },
    });

    const eceSecC = await prisma.section.upsert({
      where: { departmentId_name: { departmentId: eceDept.id, name: 'C' } },
      update: {},
      create: { departmentId: eceDept.id, name: 'C' },
    });

    const cseSecA = await prisma.section.upsert({
      where: { departmentId_name: { departmentId: cseDept.id, name: 'A' } },
      update: {},
      create: { departmentId: cseDept.id, name: 'A' },
    });

    const cseSecB = await prisma.section.upsert({
      where: { departmentId_name: { departmentId: cseDept.id, name: 'B' } },
      update: {},
      create: { departmentId: cseDept.id, name: 'B' },
    });

    const sampleStudents = [
      { sNo: 1, regNo: '23ECR001', name: 'Kavin P', leetcodeUsername: 'Kavinn07', leetcodeUrl: 'https://leetcode.com/u/Kavinn07/', departmentId: eceDept.id, sectionId: eceSecC.id },
      { sNo: 2, regNo: '23ECR002', name: 'Abijeeth M', leetcodeUsername: 'user123', leetcodeUrl: 'https://leetcode.com/u/user123/', departmentId: eceDept.id, sectionId: eceSecC.id },
      { sNo: 3, regNo: '23ECR003', name: 'Dharani S', leetcodeUsername: 'dharani07', leetcodeUrl: 'https://leetcode.com/u/dharani07/', departmentId: eceDept.id, sectionId: eceSecC.id },
      { sNo: 4, regNo: '23CSR001', name: 'Neal Wu', leetcodeUsername: 'neal_wu', leetcodeUrl: 'https://leetcode.com/u/neal_wu/', departmentId: cseDept.id, sectionId: cseSecA.id },
      { sNo: 5, regNo: '23CSR002', name: 'Lee Chen', leetcodeUsername: 'lee215', leetcodeUrl: 'https://leetcode.com/u/lee215/', departmentId: cseDept.id, sectionId: cseSecA.id },
      { sNo: 6, regNo: '23CSR003', name: 'Stefan P', leetcodeUsername: 'StefanPochmann', leetcodeUrl: 'https://leetcode.com/u/StefanPochmann/', departmentId: cseDept.id, sectionId: cseSecB.id },
      { sNo: 7, regNo: '23ECR004', name: 'Gennady K', leetcodeUsername: 'tourist', leetcodeUrl: 'https://leetcode.com/u/tourist/', departmentId: eceDept.id, sectionId: eceSecA.id },
      { sNo: 8, regNo: '23ECR005', name: 'Priya Sharma', leetcodeUsername: 'priya_code', leetcodeUrl: 'https://leetcode.com/u/priya_code/', departmentId: eceDept.id, sectionId: eceSecB.id },
      { sNo: 9, regNo: '23MER001', name: 'Rahul Verma', leetcodeUsername: 'rahul_dev', leetcodeUrl: 'https://leetcode.com/u/rahul_dev/', departmentId: mechDept.id, sectionId: null },
      { sNo: 10, regNo: '23ECR006', name: 'Ananya Roy', leetcodeUsername: 'ananya_leetcode', leetcodeUrl: 'https://leetcode.com/u/ananya_leetcode/', departmentId: eceDept.id, sectionId: eceSecB.id },
    ];

    const studentRecords = [];
    for (const s of sampleStudents) {
      const rec = await prisma.student.upsert({
        where: { regNo: s.regNo },
        update: s,
        create: s,
      });
      studentRecords.push(rec);
    }

    // Historical base stats
    const baseStats = [
      { easy: 110, medium: 95, hard: 40, total: 245, rating: 1940.5, rank: 14200, sub: 620, acc: 68.4, days: 120, streak: 14 },
      { easy: 90, medium: 90, hard: 40, total: 220, rating: 1820.0, rank: 22100, sub: 540, acc: 62.1, days: 95, streak: 8 },
      { easy: 100, medium: 75, hard: 23, total: 198, rating: 1750.2, rank: 34000, sub: 480, acc: 59.8, days: 82, streak: 5 },
      { easy: 320, medium: 520, hard: 210, total: 1050, rating: 2850.4, rank: 120, sub: 2400, acc: 78.5, days: 450, streak: 92 },
      { easy: 280, medium: 480, hard: 180, total: 940, rating: 2710.8, rank: 250, sub: 2100, acc: 75.2, days: 380, streak: 64 },
      { easy: 240, medium: 410, hard: 150, total: 800, rating: 2590.0, rank: 410, sub: 1800, acc: 72.9, days: 310, streak: 45 },
      { easy: 290, medium: 490, hard: 195, total: 975, rating: 2890.2, rank: 95, sub: 2300, acc: 81.0, days: 420, streak: 110 },
      { easy: 80, medium: 60, hard: 15, total: 155, rating: 1610.5, rank: 54000, sub: 350, acc: 56.4, days: 60, streak: 3 },
      { easy: 65, medium: 45, hard: 10, total: 120, rating: 1520.0, rank: 72000, sub: 290, acc: 52.1, days: 45, streak: 2 },
      { easy: 50, medium: 30, hard: 5, total: 85, rating: 1440.0, rank: 95000, sub: 190, acc: 48.5, days: 30, streak: 1 },
    ];

    const daysToSeed = [
      { date: dayBeforeStr, diffMultiplier: -4 },
      { date: yesterdayStr, diffMultiplier: -2 },
      { date: todayStr, diffMultiplier: 0 },
    ];

    for (const day of daysToSeed) {
      let snapshot = await prisma.dailySnapshot.findUnique({ where: { snapshotDate: day.date } });
      if (!snapshot) {
        snapshot = await prisma.dailySnapshot.create({
          data: {
            snapshotDate: day.date,
            totalStudents: studentRecords.length,
            totalSolved: 0,
            avgSolved: 0,
          },
        });
      }

      let dayTotalSolved = 0;

      for (let i = 0; i < studentRecords.length; i++) {
        const student = studentRecords[i];
        const base = baseStats[i];
        const growth = Math.max(0, day.diffMultiplier + (i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1));
        const easy = Math.max(0, base.easy + Math.floor(growth / 2));
        const medium = Math.max(0, base.medium + Math.floor(growth / 2));
        const hard = base.hard;
        const total = easy + medium + hard;
        dayTotalSolved += total;

        await prisma.dailyStat.upsert({
          where: {
            snapshotId_studentId: {
              snapshotId: snapshot.id,
              studentId: student.id,
            },
          },
          update: {
            easy,
            medium,
            hard,
            total,
            contestRating: base.rating,
            globalRank: base.rank,
            submissions: base.sub + growth * 2,
            acceptanceRate: base.acc,
            activeDays: base.days + (day.diffMultiplier + 4),
            currentStreak: Math.max(1, base.streak + day.diffMultiplier),
            maxStreak: base.streak + 5,
            status: 'SUCCESS',
            fetchedAt: new Date(),
          },
          create: {
            snapshotId: snapshot.id,
            studentId: student.id,
            easy,
            medium,
            hard,
            total,
            contestRating: base.rating,
            globalRank: base.rank,
            submissions: base.sub + growth * 2,
            acceptanceRate: base.acc,
            activeDays: base.days + (day.diffMultiplier + 4),
            currentStreak: Math.max(1, base.streak + day.diffMultiplier),
            maxStreak: base.streak + 5,
            status: 'SUCCESS',
            fetchedAt: new Date(),
          },
        });
      }

      await prisma.dailySnapshot.update({
        where: { id: snapshot.id },
        data: {
          totalStudents: studentRecords.length,
          totalSolved: dayTotalSolved,
          avgSolved: Number((dayTotalSolved / studentRecords.length).toFixed(1)),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Sample multi-day dataset generated successfully with Department and Section hierarchies',
      dates: daysToSeed.map((d) => d.date),
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Seed sample error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to seed sample data' },
      { status: 500 }
    );
  }
}

