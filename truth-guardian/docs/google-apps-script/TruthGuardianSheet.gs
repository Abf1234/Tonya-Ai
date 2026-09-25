/**
 * Truth Guardian — report sheet bootstrap
 *
 * Paste this file into a Google Apps Script project, run
 * `setupTruthGuardianSheet` once, and authorize the script to create/edit a
 * spreadsheet. Re-running it is safe: existing report rows are not deleted.
 *
 * This script creates an operational sheet and an optional, manually/trigger
 * callable `appendReport` helper. It intentionally does NOT publish a public
 * doPost webhook. A future Django/Celery sync worker must authenticate and
 * rate-limit any server-to-Google integration separately.
 *
 * Do not put API keys, service-account JSON, Hugging Face tokens, or reporter
 * credentials in this file or in the sheet's public share settings.
 */

const TRUTH_GUARDIAN_CONFIG = Object.freeze({
  propertyKey: 'TRUTH_GUARDIAN_SPREADSHEET_ID',
  spreadsheetName: 'Truth Guardian Reports',
  reportsTab: 'Reports',
  notesTab: 'Setup Notes',
  headers: [
    'Report ID',
    'Created At',
    'Category',
    'Claim',
    'Description',
    'Anonymous',
    'Status',
    'Evidence Processing Status',
    'Google Sheets Sync Status',
    'Appwrite Sync Status',
    'Submitted Channel',
    'Contact Email (private)',
    'Contact Phone (private)',
    'Assigned Officer',
    'Admin Notes',
  ],
});

/** Add a small menu when this project is bound to a spreadsheet. */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Truth Guardian')
    .addItem('Create or update report sheet', 'setupTruthGuardianSheet')
    .addToUi();
}

/**
 * Create or update the sheet without clearing existing rows.
 * Returns the spreadsheet ID and URL for the caller.
 */
function setupTruthGuardianSheet() {
  const spreadsheet = getOrCreateSpreadsheet_();
  const reports = getOrCreateSheet_(spreadsheet, TRUTH_GUARDIAN_CONFIG.reportsTab);
  ensureHeaders_(reports, TRUTH_GUARDIAN_CONFIG.headers);
  formatReportsSheet_(reports);
  writeSetupNotes_(spreadsheet);

  const result = {
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    reportsTab: TRUTH_GUARDIAN_CONFIG.reportsTab,
  };

  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Truth Guardian sheet ready',
    'The Reports tab and Setup Notes tab are ready. Existing rows were preserved.\n\n' +
      result.spreadsheetUrl,
    ui.ButtonSet.OK,
  );
  return result;
}

/**
 * Append one already-authorized report row.
 *
 * This is intentionally not an HTTP endpoint. A trusted Apps Script trigger or
 * a separately authenticated backend worker may call it. Set includePrivate to
 * true only when the spreadsheet access policy explicitly permits private
 * contact fields; the default leaves private columns blank.
 */
function appendReport(report, options) {
  if (!report || typeof report !== 'object' || !report.report_id) {
    throw new Error('appendReport requires an object with a report_id.');
  }

  // Private columns are opt-in and are never written for an anonymous report.
  const includePrivate = Boolean(options && options.includePrivate === true)
    && report.is_anonymous !== true;
  const spreadsheet = getOrCreateSpreadsheet_();
  const sheet = getOrCreateSheet_(spreadsheet, TRUTH_GUARDIAN_CONFIG.reportsTab);
  // Only a freshly created header row is reformatted, so repeated appends do not
  // rewrite every formatted cell in the tab.
  if (ensureHeaders_(sheet, TRUTH_GUARDIAN_CONFIG.headers)) {
    formatReportsSheet_(sheet);
  }

  const reportId = String(report.report_id);
  const existingRow = findRowByReportId_(sheet, reportId);
  if (existingRow !== 0) {
    return { status: 'duplicate', reportId: reportId, row: existingRow };
  }

  const row = [
    safeText_(report.report_id),
    safeText_(report.created_at || ''),
    safeText_(report.category || 'OTHER'),
    safeText_(report.claim || ''),
    safeText_(report.description || ''),
    report.is_anonymous === true ? 'Yes' : 'No',
    safeText_(report.status || 'RECEIVED'),
    safeText_(report.evidence_processing_status || 'NOT_PROVIDED'),
    safeText_(report.google_sheets_sync_status || 'NOT_CONFIGURED'),
    safeText_(report.appwrite_sync_status || 'NOT_CONFIGURED'),
    safeText_(report.submitted_channel || 'public_web'),
    includePrivate ? safeText_(report.contact_email || '') : '',
    includePrivate ? safeText_(report.contact_phone || '') : '',
    '',
    '',
  ];

  sheet.appendRow(row);
  return { status: 'appended', reportId: reportId, row: sheet.getLastRow() };
}

/** Return the spreadsheet stored in script properties, creating one if needed. */
function getOrCreateSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const savedId = properties.getProperty(TRUTH_GUARDIAN_CONFIG.propertyKey);
  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (error) {
      properties.deleteProperty(TRUTH_GUARDIAN_CONFIG.propertyKey);
    }
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  const spreadsheet = active || SpreadsheetApp.create(TRUTH_GUARDIAN_CONFIG.spreadsheetName);
  properties.setProperty(TRUTH_GUARDIAN_CONFIG.propertyKey, spreadsheet.getId());
  return spreadsheet;
}

function getOrCreateSheet_(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

/**
 * Ensure the expected header row exists without touching report rows.
 * Returns true when the header row was written (a new or empty tab).
 */
function ensureHeaders_(sheet, headers) {
  const requiredColumns = headers.length;
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < requiredColumns) {
    if (lastColumn === 0) {
      // Empty Apps Script sheets can report zero columns; insertColumnsAfter
      // expects a one-based existing column.
      sheet.insertColumns(1, requiredColumns);
    } else {
      sheet.insertColumnsAfter(lastColumn, requiredColumns - lastColumn);
    }
  }

  const firstRow = sheet.getRange(1, 1, 1, requiredColumns).getDisplayValues()[0];
  const hasHeader = firstRow.some((value) => String(value).trim() !== '');
  const matches = firstRow.every((value, index) => String(value).trim() === headers[index]);

  if (hasHeader && !matches) {
    throw new Error('The Reports tab has a different header row; refusing to overwrite it.');
  }
  if (!hasHeader) {
    if (sheet.getLastRow() > 1 && sheet.getRange(2, 1).getDisplayValue() !== '') {
      throw new Error('The Reports tab has data without the expected headers; refusing to overwrite it.');
    }
    sheet.getRange(1, 1, 1, requiredColumns).setValues([headers]);
    return true;
  }
  return false;
}

function formatReportsSheet_(sheet) {
  const columnCount = TRUTH_GUARDIAN_CONFIG.headers.length;
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, columnCount)
    .setBackground('#123b35')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.getRange(1, 1, 1, columnCount).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 170);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 280);
  sheet.setColumnWidth(5, 360);
  sheet.setColumnWidth(6, 90);
  sheet.setColumnWidth(7, 120);
  sheet.setColumnWidth(8, 190);
  sheet.setColumnWidth(9, 190);
  sheet.setColumnWidth(10, 170);
  sheet.setColumnWidth(11, 140);
  sheet.setColumnWidth(12, 210);
  sheet.setColumnWidth(13, 180);
  sheet.setColumnWidth(14, 180);
  sheet.setColumnWidth(15, 260);

  if (sheet.getMaxRows() > 1) {
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, columnCount)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
      .setVerticalAlignment('top');
  }

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['RECEIVED', 'UNDER_REVIEW', 'ACTION_TAKEN', 'CLOSED'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 7, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(statusRule);

  const evidenceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['NOT_PROVIDED', 'PENDING', 'STORED', 'REJECTED', 'FAILED'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 8, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(evidenceRule);

  const syncRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['NOT_CONFIGURED', 'PENDING', 'SYNCED', 'FAILED'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 9, Math.max(sheet.getMaxRows() - 1, 1), 2).setDataValidation(syncRule);
}

function writeSetupNotes_(spreadsheet) {
  const notes = getOrCreateSheet_(spreadsheet, TRUTH_GUARDIAN_CONFIG.notesTab);
  const values = [
    ['Truth Guardian report sheet', ''],
    ['Purpose', 'Operational export for authorized staff; PostgreSQL remains the source of truth.'],
    ['Privacy', 'Do not share this spreadsheet publicly. Contact columns are blank unless a trusted caller explicitly opts in.'],
    ['Live sync', 'This bootstrap does not create a public webhook or synchronize reports automatically.'],
    ['Safe setup', 'Run setupTruthGuardianSheet from the Truth Guardian menu or the Apps Script editor. Re-running it preserves rows.'],
    ['AI', 'Any AI integration belongs in the backend. Never put a Hugging Face token or provider key in this spreadsheet.'],
  ];
  notes.getRange(1, 1, values.length, 2).setValues(values);
  notes.getRange(1, 1, 1, 2).merge();
  notes.getRange(1, 1).setBackground('#123b35').setFontColor('#ffffff').setFontWeight('bold');
  notes.getRange(1, 1, values.length, 1).setFontWeight('bold');
  notes.setColumnWidth(1, 180);
  notes.setColumnWidth(2, 700);
  notes.getRange(1, 1, values.length, 2).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  notes.setFrozenRows(1);
}

function findRowByReportId_(sheet, reportId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  for (let index = 0; index < ids.length; index += 1) {
    if (String(ids[index][0]).trim() === reportId) return index + 2;
  }
  return 0;
}

/** Prevent user text from becoming a spreadsheet formula. */
function safeText_(value) {
  const text = value === undefined || value === null ? '' : String(value);
  const probe = text.replace(/^\s+/, '');
  return /^[=+\-@]/.test(probe) ? "'" + text : text;
}
