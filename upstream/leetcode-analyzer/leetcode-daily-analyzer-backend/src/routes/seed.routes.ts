import { Router } from 'express';
import prisma from '../lib/prisma';
import { toZonedTime, format } from 'date-fns-tz';
import { subDays } from 'date-fns';
import { config } from '../config';

const router = Router();

const SAMPLE_STUDENTS = [
  { regNo: '21ECE001', name: 'Kavinn V', username: 'Kavinn07', baseSolved: 480, dept: 'ECE', sec: 'A' },
  { regNo: '21ECE002', name: 'Aarav Sharma', username: 'aarav_sharma', baseSolved: 412, dept: 'ECE', sec: 'A' },
  { regNo: '21ECE003', name: 'Diya Patel', username: 'diya_dev', baseSolved: 388, dept: 'ECE', sec: 'B' },
  { regNo: '21ECE004', name: 'Rohan Gupta', username: 'rohan_g', baseSolved: 345, dept: 'ECE', sec: 'B' },
  { regNo: '21ECE005', name: 'Sneha Reddy', username: 'sneha_r', baseSolved: 290, dept: 'ECE', sec: 'C' },
  { regNo: '21CSE101', name: 'Aditya Verma', username: 'aditya_v', baseSolved: 540, dept: 'CSE', sec: 'A' },
  { regNo: '21CSE102', name: 'Ananya Rao', username: 'ananya_codes', baseSolved: 505, dept: 'CSE', sec: 'A' },
  { regNo: '21CSE103', name: 'Vikram Singh', username: 'vikram_s', baseSolved: 460, dept: 'CSE', sec: 'B' },
  { regNo: '21CSE104', name: 'Pooja Nair', username: 'pooja_n', baseSolved: 375, dept: 'CSE', sec: 'B' },
  { regNo: '21MEC001', name: 'Siddharth Roy', username: 'sid_roy', baseSolved: 260, dept: 'MECH', sec: 'A' },
  { regNo: '21MEC002', name: 'Meera Menon', username: 'meera_m', baseSolved: 230, dept: 'MECH', sec: 'A' },
];

router.post('/', async (req, res) => {
  try {
    const zonedNow = toZonedTime(new Date(), config.timezone);
    const day2Date = format(zonedNow, 'yyyy-MM-dd', { timeZone: config.timezone });
    const day1Date = format(subDays(zonedNow, 1), 'yyyy-MM-dd', { timeZone: config.timezone });
    const day0Date = format(subDays(zonedNow, 2), 'yyyy-MM-dd', { timeZone: config.timezone });

    const dates = [day0Date, day1Date, day2Date];

    // Seed Departments and Sections
    const deptMap = new Map<string, string>();
    const secMap = new Map<string, string>();

    const depts = [
      { code: 'ECE', name: 'Electronics and Communication Engineering', sections: ['A', 'B', 'C'] },
      { code: 'CSE', name: 'Computer Science and Engineering', sections: ['A', 'B'] },
      { code: 'MECH', name: 'Mechanical Engineering', sections: ['A'] },
    ];

    for (const d of depts) {
      const dept = await prisma.department.upsert({
        where: { code: d.code },
        update: { name: d.name },
        create: { code: d.code, name: d.name },
      });
      deptMap.set(d.code, dept.id);

      for (const sName of d.sections) {
        const sec = await prisma.section.upsert({
          where: {
            departmentId_name: {
              departmentId: dept.id,
              name: sName,
            },
          },
          update: {},
          create: {
            name: sName,
            departmentId: dept.id,
          },
        });
        secMap.set(`${d.code}_${sName}`, sec.id);
      }
    }

    // Seed Students
    const studentRecords = [];
    for (let i = 0; i < SAMPLE_STUDENTS.length; i++) {
      const s = SAMPLE_STUDENTS[i];
      const deptId = deptMap.get(s.dept) || null;
      const secId = secMap.get(`${s.dept}_${s.sec}`) || null;

      const student = await prisma.student.upsert({
        where: { regNo: s.regNo },
        update: {
          name: s.name,
          leetcodeUrl: `https://leetcode.com/u/${s.username}/`,
          leetcodeUsername: s.username,
          departmentId: deptId,
          sectionId: secId,
          sNo: i + 1,
        },
        create: {
          sNo: i + 1,
          regNo: s.regNo,
          name: s.name,
          leetcodeUrl: `https://leetcode.com/u/${s.username}/`,
          leetcodeUsername: s.username,
          departmentId: deptId,
          sectionId: secId,
        },
      });
      studentRecords.push({ ...student, baseSolved: s.baseSolved });
    }

    // Seed 3 Daily Snapshots
    for (let dayIdx = 0; dayIdx < dates.length; dayIdx++) {
      const dateStr = dates[dayIdx];
      const snapshot = await prisma.dailySnapshot.upsert({
        where: { snapshotDate: dateStr },
        update: {},
        create: {
          snapshotDate: dateStr,
          totalStudents: studentRecords.length,
          totalSolved: 0,
          avgSolved: 0,
        },
      });

      let snapshotTotal = 0;

      for (let sIdx = 0; sIdx < studentRecords.length; sIdx++) {
        const st = studentRecords[sIdx];
        const addedDaily = (dayIdx * 3) + ((sIdx % 3) * 2);
        const total = st.baseSolved + addedDaily;
        const easy = Math.floor(total * 0.45);
        const medium = Math.floor(total * 0.42);
        const hard = total - easy - medium;
        snapshotTotal += total;

        await prisma.dailyStat.upsert({
          where: {
            snapshotId_studentId: {
              snapshotId: snapshot.id,
              studentId: st.id,
            },
          },
          update: {
            easy,
            medium,
            hard,
            total,
            contestRating: 1600 + (sIdx * 35) + (dayIdx * 10),
            globalRank: 45000 - (sIdx * 2500) - (dayIdx * 100),
            submissions: total * 3 + 20,
            acceptanceRate: 0.65 + (sIdx % 5) * 0.04,
            activeDays: 45 + dayIdx * 2,
            currentStreak: 5 + dayIdx,
            maxStreak: 18,
            status: 'SUCCESS',
          },
          create: {
            snapshotId: snapshot.id,
            studentId: st.id,
            easy,
            medium,
            hard,
            total,
            contestRating: 1600 + (sIdx * 35) + (dayIdx * 10),
            globalRank: 45000 - (sIdx * 2500) - (dayIdx * 100),
            submissions: total * 3 + 20,
            acceptanceRate: 0.65 + (sIdx % 5) * 0.04,
            activeDays: 45 + dayIdx * 2,
            currentStreak: 5 + dayIdx,
            maxStreak: 18,
            status: 'SUCCESS',
          },
        });
      }

      await prisma.dailySnapshot.update({
        where: { id: snapshot.id },
        data: {
          totalStudents: studentRecords.length,
          totalSolved: snapshotTotal,
          avgSolved: Math.round((snapshotTotal / studentRecords.length) * 10) / 10,
        },
      });
    }

    return res.json({
      success: true,
      message: 'Sample multi-day dataset generated across departments and sections successfully.',
      snapshots: dates,
    });
  } catch (err: any) {
    console.error('Seed error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
