const ExcelJS = require('exceljs');
const path = require('path');
const os = require('os');

const COLUMNS = [
  { header: 'Test Case ID', key: 'id',       width: 14 },
  { header: 'Title',        key: 'title',    width: 40 },
  { header: 'Type',         key: 'type',     width: 12 },
  { header: 'Priority',     key: 'priority', width: 12 },
  { header: 'Given',        key: 'given',    width: 50 },
  { header: 'When',         key: 'when',     width: 50 },
  { header: 'Then',         key: 'then',     width: 50 },
];

// Row background colours by test type
const ROW_FILLS = {
  positive: { argb: 'FFC6EFCE' }, // green
  negative: { argb: 'FFFFC7CE' }, // red
  edge:     { argb: 'FFFFEB9C' }, // orange
};

async function generateExcelFile(testCases) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Test Cases');

  sheet.columns = COLUMNS;

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });
  headerRow.height = 20;

  // Add data rows
  for (const tc of testCases) {
    const row = sheet.addRow({
      id:       tc.id       ?? '',
      title:    tc.title    ?? '',
      type:     tc.type     ?? '',
      priority: tc.priority ?? '',
      given:    tc.given    ?? '',
      when:     tc.when     ?? '',
      then:     tc.then     ?? '',
    });

    const rowFill = ROW_FILLS[tc.type?.toLowerCase()];

    row.eachCell((cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
      if (rowFill) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: rowFill };
      }
    });

    row.height = 60;
  }

  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const filePath = path.join(os.tmpdir(), `test-cases-${Date.now()}.xlsx`);
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

module.exports = { generateExcelFile };
