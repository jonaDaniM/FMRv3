/**
 * Optional pre-cutover warning-only protections.
 *
 * These are NOT security controls.
 * They are safe while production still executes as USER_ACCESSING because
 * they warn rather than block.
 */

const FMR_WARNING_ONLY_SHEETS_ = Object.freeze([
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
  'Field_Notifications'
]);

function installFmrWarningOnlyProtections_() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const description =
    'FMR_APPLICATION_MANAGED_WARNING_ONLY';

  FMR_WARNING_ONLY_SHEETS_
    .forEach(function(name) {
      const sheet =
        ss.getSheetByName(name);

      if (!sheet) return;

      sheet
        .getProtections(
          SpreadsheetApp
            .ProtectionType
            .SHEET
        )
        .filter(function(p) {
          return (
            p.getDescription() ===
            description
          );
        })
        .forEach(function(p) {
          p.remove();
        });

      sheet
        .protect()
        .setDescription(
          description
        )
        .setWarningOnly(true);
    });

  return {
    installed: true,
    mode: 'WARNING_ONLY'
  };
}
