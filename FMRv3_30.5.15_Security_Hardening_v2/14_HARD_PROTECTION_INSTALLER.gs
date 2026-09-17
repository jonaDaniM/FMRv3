/**
 * FINAL owner-only database protections.
 *
 * DO NOT RUN until:
 * - gateway is stable in production;
 * - ordinary Field/Admin users work as Viewers;
 * - Jonathan and Ernie remain intentional database editors.
 *
 * Script Property:
 *   FMR_PROTECTION_EDITOR_EMAILS
 *
 * REQUIRED VALUE FOR THE CURRENT OWNERSHIP DECISION:
 *   jonathanmura05@gmail.com,emoralessantillan@turner-industries.com
 */

const FMR_HARD_PROTECTED_SHEETS_ =
  Object.freeze([
    'Configuration',
    'Users',
    'Import_Staging_Header',
    'Import_Staging_Lines',
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
    'Backup_History',
    'Recovery_Actions',
    'Bulk_Import_Batches',
    'Bulk_Import_Items',
    'Bulk_Import_Lines',
    'Bulk_Import_Issues'
  ]);

function installFmrHardOwnerOnlyProtections_() {
  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  const allowed =
    String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          'FMR_PROTECTION_EDITOR_EMAILS'
        ) || ''
    )
      .split(',')
      .map(function(value) {
        return value
          .trim()
          .toLowerCase();
      })
      .filter(Boolean);

  const requiredOwners =
    [
      'jonathanmura05@gmail.com',
      'emoralessantillan@turner-industries.com'
    ];

  const missingRequired =
    requiredOwners.filter(
      function(email) {
        return !allowed.includes(email);
      }
    );

  if (missingRequired.length) {
    throw new Error(
      'Protection editor list is missing required System Owner(s): ' +
      missingRequired.join(', ')
    );
  }

  const description =
    'FMR_PRODUCTION_OWNER_ONLY';

  const summary = [];

  FMR_HARD_PROTECTED_SHEETS_
    .forEach(function(name) {
      const sheet =
        ss.getSheetByName(name);

      if (!sheet) {
        summary.push({
          sheet: name,
          status: 'MISSING_SKIPPED'
        });
        return;
      }

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

      const protection =
        sheet
          .protect()
          .setDescription(
            description
          );

      allowed.forEach(
        function(email) {
          protection.addEditor(
            email
          );
        }
      );

      protection
        .getEditors()
        .forEach(function(user) {
          const email =
            String(
              user.getEmail() || ''
            )
              .trim()
              .toLowerCase();

          if (
            email &&
            !allowed.includes(email)
          ) {
            try {
              protection.removeEditor(
                user
              );
            } catch (error) {
              console.warn(
                'Could not remove protection editor ' +
                email +
                ' from ' +
                name +
                ': ' +
                error.message
              );
            }
          }
        });

      if (
        protection.canDomainEdit()
      ) {
        protection
          .setDomainEdit(false);
      }

      summary.push({
        sheet: name,
        status: 'PROTECTED'
      });
    });

  return {
    installed: true,
    description: description,
    approvedEditors: allowed,
    summary: summary
  };
}
