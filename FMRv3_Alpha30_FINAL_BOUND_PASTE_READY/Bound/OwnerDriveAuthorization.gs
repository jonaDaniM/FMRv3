/**
 * FMR Operations v3 — Alpha 30
 * Owner Maintenance Drive authorization and folder-access helpers.
 *
 * IMPORTANT:
 * The Bound web app is intentionally deployed as USER_ACCESSING.
 * Therefore DriveApp acts as the Google account currently accessing the app,
 * not as the user who originally deployed the web app and not merely as the
 * FMR "System Owner" role stored in the Users sheet.
 */

const FMR_V3_OWNER_MAINTENANCE_SCOPES_ =
  Object.freeze([
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.email'
  ]);

function ownerMigrationFolderIdV3_(value) {
  const source =
    String(
      value ||
      ''
    ).trim();

  if (!source) {
    throw new Error(
      'Google Drive folder URL or ID is required.'
    );
  }

  const match =
    source.match(
      /\/folders\/([A-Za-z0-9_-]+)/
    );

  return match
    ? match[1]
    : source;
}

function getOwnerMaintenanceAuthorizationV3() {
  assertCurrentBoundOwnerV3_();

  const info =
    ScriptApp.getAuthorizationInfo(
      ScriptApp.AuthMode.FULL,
      FMR_V3_OWNER_MAINTENANCE_SCOPES_
    );

  const status =
    info.getAuthorizationStatus();

  return {
    callerEmail:
      callerEmailFmrV3_(),

    authorizationStatus:
      String(
        status
      ),

    authorizationRequired:
      (
        status ===
        ScriptApp.AuthorizationStatus.REQUIRED
      ),

    authorizationUrl:
      info.getAuthorizationUrl() ||
      '',

    authorizedScopes:
      info.getAuthorizedScopes() ||
      [],

    requiredScopes:
      FMR_V3_OWNER_MAINTENANCE_SCOPES_
        .slice(),

    executionIdentity:
      'USER_ACCESSING'
  };
}

/**
 * Run this function directly once from the Bound Apps Script editor while
 * signed into the Google account that will perform historical migrations.
 *
 * When authorization is missing, Apps Script stops this execution and opens
 * the Google consent flow. After consent, run it one more time; it should
 * return passed=true.
 */
function authorizeOwnerMaintenanceV3() {
  assertCurrentBoundOwnerV3_();

  ScriptApp.requireScopes(
    ScriptApp.AuthMode.FULL,
    FMR_V3_OWNER_MAINTENANCE_SCOPES_
  );

  const root =
    DriveApp.getRootFolder();

  return {
    passed:
      true,

    callerEmail:
      callerEmailFmrV3_(),

    driveRootId:
      root.getId(),

    driveRootName:
      root.getName(),

    executionIdentity:
      'USER_ACCESSING'
  };
}

/**
 * Verifies both OAuth permission and actual folder access.
 *
 * This does not modify the folder.
 */
function probeOwnerMigrationFolderV3(
  folderValue
) {
  assertCurrentBoundOwnerV3_();

  ScriptApp.requireScopes(
    ScriptApp.AuthMode.FULL,
    FMR_V3_OWNER_MAINTENANCE_SCOPES_
  );

  const folderId =
    ownerMigrationFolderIdV3_(
      folderValue
    );

  const folder =
    DriveApp.getFolderById(
      folderId
    );

  return {
    passed:
      true,

    callerEmail:
      callerEmailFmrV3_(),

    folderId:
      folder.getId(),

    folderName:
      folder.getName(),

    executionIdentity:
      'USER_ACCESSING',

    message:
      (
        'Drive access verified for ' +
        callerEmailFmrV3_() +
        '.'
      )
  };
}
