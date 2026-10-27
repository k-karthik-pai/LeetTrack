import { Router } from 'express';
import * as XLSX from 'xlsx';

const router = Router();

// GET /api/template
router.get('/', (req, res) => {
  try {
    const templateData = [
      {
        'S.NO': 1,
        'REG NO': '21EC001',
        'NAME': 'Kavinn V',
        'LEETCODE URL': 'https://leetcode.com/u/Kavinn07/',
      },
      {
        'S.NO': 2,
        'REG NO': '21EC002',
        'NAME': 'Aarav Sharma',
        'LEETCODE URL': 'https://leetcode.com/u/aarav_codes/',
      },
      {
        'S.NO': 3,
        'REG NO': '21EC003',
        'NAME': 'Diya Patel',
        'LEETCODE URL': 'https://leetcode.com/u/diya_dev/',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="leetcode_students_template.xlsx"'
    );
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
