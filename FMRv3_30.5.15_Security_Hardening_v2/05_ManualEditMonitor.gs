/**
 * FMRv3 manual-edit security monitor.
 *
 * Install from a project owned by the primary System Owner.
 *
 * Script Properties:
 *   FMR_SECURITY_LOG_SPREADSHEET_ID = private log spreadsheet ID
 *   FMR_SECURITY_ALERT_EMAIL = optional alert recipient
 *
 * Create the private security-log spreadsheet separately and share it only
 * with intentional System Owners.
 *
 * This is monitoring only. It does not undo edits.
 */

const FMR_SECURITY_MONITORED_SHEETS_ = Object.freeze([
  'Configuration',
  'Users',
  'FMR_Header',
  'FMR_Line_Items',
  'Search_Index',
  'Operational_Index',
  'Material_Transactions',
  'Bag_Tag_Header',
  'Bag_Tag_Items',
  'Backorder_Requests',
  'Audit_Log',
  'Field_Notifications',
  'Operational_Health_Log',
  'Recovery_Actions',
  'Backup_History'
]);

function installFmrSecurityTriggers_() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  ScriptApp.getProjectTriggers()
    .forEach(function(trigger) {
      const name =
        trigger.getHandlerFunction();

      if (
        name === 'fmrSecurityOnEdit_' ||
        name === 'fmrSecurityOnChange_'
      ) {
        ScriptApp.deleteTrigger(trigger);
      }
    });

  ScriptApp
    .newTrigger('fmrSecurityOnEdit_')
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  ScriptApp
    .newTrigger('fmrSecurityOnChange_')
    .forSpreadsheet(ss)
    .onChange()
    .create();

  return {
    installed: true,
    spreadsheetId: ss.getId(),
    triggers: 2
  };
}

function fmrSecurityOnEdit_(e) {
  try {
    if (!e || !e.range) return;

    const sheet =
      e.range.getSheet();

    if (
      !FMR_SECURITY_MONITORED_SHEETS_
        .includes(sheet.getName())
    ) {
      return;
    }

    const editor =
      fmrSecurityEditorEmail_(e);

    fmrSecurityAppend_({
      eventType: 'MANUAL_EDIT',
      spreadsheetId:
        sheet.getParent().getId(),
      spreadsheetName:
        sheet.getParent().getName(),
      sheetName:
        sheet.getName(),
      rangeA1:
        e.range.getA1Notation(),
      editorEmail:
        editor,
      oldValue:
        typeof e.oldValue === 'undefined'
          ? ''
          : String(e.oldValue),
      newValue:
        typeof e.value === 'undefined'
          ? ''
          : String(e.value),
      detail:
        JSON.stringify({
          row: e.range.getRow(),
          column: e.range.getColumn(),
          numRows: e.range.getNumRows(),
          numColumns: e.range.getNumColumns()
        })
    });

    fmrSecurityAlert_(
      'FMR manual database edit detected',
      [
        'Spreadsheet: ' +
          sheet.getParent().getName(),
        'Sheet: ' +
          sheet.getName(),
        'Range: ' +
          e.range.getA1Notation(),
        'Editor: ' +
          (editor || 'Unavailable'),
        'Old value: ' +
          (typeof e.oldValue === 'undefined'
            ? ''
            : e.oldValue),
        'New value: ' +
          (typeof e.value === 'undefined'
            ? ''
            : e.value)
      ].join('\n')
    );
  } catch (error) {
    console.error(
      'FMR security onEdit failed: ' +
      error.message
    );
  }
}

function fmrSecurityOnChange_(e) {
  try {
    if (!e || !e.source) return;

    const changeType =
      String(e.changeType || '')
        .trim()
        .toUpperCase();

    if (
      !changeType ||
      changeType === 'EDIT'
    ) {
      return;
    }

    const editor =
      fmrSecurityEditorEmail_(e);

    fmrSecurityAppend_({
      eventType: 'STRUCTURAL_CHANGE',
      spreadsheetId:
        e.source.getId(),
      spreadsheetName:
        e.source.getName(),
      sheetName: '',
      rangeA1: '',
      editorEmail:
        editor,
      oldValue: '',
      newValue: '',
      detail:
        JSON.stringify({
          changeType: changeType
        })
    });

    fmrSecurityAlert_(
      'FMR database structural change detected',
      [
        'Spreadsheet: ' +
          e.source.getName(),
        'Change type: ' +
          changeType,
        'Editor: ' +
          (editor || 'Unavailable')
      ].join('\n')
    );
  } catch (error) {
    console.error(
      'FMR security onChange failed: ' +
      error.message
    );
  }
}

function fmrSecurityEditorEmail_(e) {
  try {
    if (
      e &&
      e.user &&
      typeof e.user.getEmail === 'function'
    ) {
      return String(
        e.user.getEmail() || ''
      )
        .trim()
        .toLowerCase();
    }
  } catch (ignored) {}

  return '';
}

function fmrSecurityAppend_(entry) {
  const logId =
    String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          'FMR_SECURITY_LOG_SPREADSHEET_ID'
        ) || ''
    ).trim();

  if (!logId) {
    throw new Error(
      'FMR_SECURITY_LOG_SPREADSHEET_ID is not configured.'
    );
  }

  const book =
    SpreadsheetApp.openById(logId);

  let sheet =
    book.getSheetByName(
      'Security_Events'
    );

  if (!sheet) {
    sheet =
      book.insertSheet(
        'Security_Events'
      );

    sheet
      .getRange(1, 1, 1, 11)
      .setValues([[
        'Event_ID',
        'Timestamp',
        'Event_Type',
        'Spreadsheet_ID',
        'Spreadsheet_Name',
        'Sheet_Name',
        'Range_A1',
        'Editor_Email',
        'Old_Value',
        'New_Value',
        'Detail_JSON'
      ]]);

    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    'SEC-' +
      Utilities
        .getUuid()
        .toUpperCase(),
    new Date(),
    entry.eventType || '',
    entry.spreadsheetId || '',
    entry.spreadsheetName || '',
    entry.sheetName || '',
    entry.rangeA1 || '',
    entry.editorEmail || '',
    entry.oldValue || '',
    entry.newValue || '',
    entry.detail || ''
  ]);
}

function fmrSecurityAlert_(subject, body) {
  const email =
    String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          'FMR_SECURITY_ALERT_EMAIL'
        ) || ''
    ).trim();

  if (!email) return;

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body
    });
  } catch (error) {
    console.warn(
      'FMR security alert failed: ' +
      error.message
    );
  }
}
