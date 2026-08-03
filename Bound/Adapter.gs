const FMR_V3_DEFAULT_DATABASE_ID =
  '1nDEsty3PTVppEPAkKpN9RVXCl_P0pgQALyGPficjz68';

const FMR_V3_BOUND_ENVIRONMENTS =
  Object.freeze([
    'TEST',
    'PRODUCTION'
  ]);

function normalizeBoundEnvironmentV3_(
  environment
) {
  const normalized =
    String(
      environment || ''
    )
      .trim()
      .toUpperCase() ||
    'TEST';

  if (
    !FMR_V3_BOUND_ENVIRONMENTS
      .includes(
        normalized
      )
  ) {
    throw new Error(
      'Bound environment must be TEST or PRODUCTION.'
    );
  }

  return normalized;
}

function activeBoundEnvironmentV3_() {
  return normalizeBoundEnvironmentV3_(
    PropertiesService
      .getScriptProperties()
      .getProperty(
        'FMR_V3_ACTIVE_ENVIRONMENT'
      ) ||
    'TEST'
  );
}

function boundDatabasePropertyKeyV3_(
  environment
) {
  return (
    'FMR_V3_DATABASE_ID_' +
    normalizeBoundEnvironmentV3_(
      environment
    )
  );
}

function boundDatabaseIdForEnvironmentV3_(
  environment
) {
  const normalized =
    normalizeBoundEnvironmentV3_(
      environment
    );

  const configured =
    String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          boundDatabasePropertyKeyV3_(
            normalized
          )
        ) ||
      ''
    ).trim();

  if (configured) {
    return configured;
  }

  if (
    normalized ===
    'TEST'
  ) {
    return FMR_V3_DEFAULT_DATABASE_ID;
  }

  throw new Error(
    'No database is configured for the PRODUCTION environment.'
  );
}

function boundDatabaseIdFmrV3_() {
  return boundDatabaseIdForEnvironmentV3_(
    activeBoundEnvironmentV3_()
  );
}

function assertCurrentBoundOwnerV3_() {
  return FMRCoreV3.getFmrV3SystemControl(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    activeBoundEnvironmentV3_()
  );
}

function configureBoundEnvironmentV3(
  environment,
  databaseId
) {
  assertCurrentBoundOwnerV3_();

  const normalizedEnvironment =
    normalizeBoundEnvironmentV3_(
      environment
    );

  const normalizedDatabaseId =
    String(
      databaseId || ''
    ).trim();

  if (!normalizedDatabaseId) {
    throw new Error(
      'databaseId is required.'
    );
  }

  FMRCoreV3.getFmrV3SystemControl(
    normalizedDatabaseId,
    callerEmailFmrV3_(),
    normalizedEnvironment
  );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      boundDatabasePropertyKeyV3_(
        normalizedEnvironment
      ),
      normalizedDatabaseId
    );

  return inspectBoundEnvironmentV3();
}

function activateBoundEnvironmentV3(
  environment
) {
  assertCurrentBoundOwnerV3_();

  const normalizedEnvironment =
    normalizeBoundEnvironmentV3_(
      environment
    );

  const databaseId =
    boundDatabaseIdForEnvironmentV3_(
      normalizedEnvironment
    );

  FMRCoreV3.getFmrV3SystemControl(
    databaseId,
    callerEmailFmrV3_(),
    normalizedEnvironment
  );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'FMR_V3_ACTIVE_ENVIRONMENT',
      normalizedEnvironment
    );

  return inspectBoundEnvironmentV3();
}

function inspectBoundEnvironmentV3() {
  const environment =
    activeBoundEnvironmentV3_();

  const databaseId =
    boundDatabaseIdForEnvironmentV3_(
      environment
    );

  const control =
    FMRCoreV3.getFmrV3SystemControl(
      databaseId,
      callerEmailFmrV3_(),
      environment
    );

  return {
    environment:
      environment,

    databaseFingerprint:
      control.environment
        .databaseFingerprint,

    coreEnvironment:
      control.environment
        .environmentName,

    transactionMode:
      control.environment
        .transactionMode,

    version:
      control.version
  };
}

function callerEmailFmrV3_() {
  const activeEmail =
    Session
      .getActiveUser()
      .getEmail();

  const effectiveEmail =
    Session
      .getEffectiveUser()
      .getEmail();

  const email =
    activeEmail ||
    effectiveEmail;

  if (!email) {
    throw new Error(
      'Authenticated Google account email is unavailable.'
    );
  }

  return email;
}

function scheduledCallerEmailFmrV3_() {
  const email =
    Session
      .getEffectiveUser()
      .getEmail();

  if (!email) {
    throw new Error(
      'Scheduled-operation owner email is unavailable.'
    );
  }

  return email;
}

function getPortalBootstrapV3(
  interfaceName
) {
  return FMRCoreV3.getFmrV3Bootstrap(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    interfaceName ||
      'PORTAL',
    activeBoundEnvironmentV3_()
  );
}

function searchPortalV3(
  query,
  mode
) {
  return FMRCoreV3.searchFmrV3(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    query,
    mode || 'AUTO'
  );
}

function performFieldActionV3(
  request
) {
  return FMRCoreV3.performFmrV3FieldAction(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    request || {}
  );
}

function getAdminDashboardV3() {
  return FMRCoreV3.getFmrV3AdminDashboard(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_()
  );
}

function getAdminFmrRegisterV3(
  request
) {
  return FMRCoreV3.getFmrV3AdminRegister(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    request || {}
  );
}

function getAdminActiveBagsV3(
  request
) {
  return FMRCoreV3.getFmrV3AdminActiveBags(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    request || {}
  );
}

function reviewBackorderV3(
  request
) {
  return FMRCoreV3.reviewFmrV3Backorder(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    request || {}
  );
}

function saveStagingV3(
  payload
) {
  return FMRCoreV3.saveFmrV3Staging(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    payload || {}
  );
}

function getStagingListV3(
  maximumRows
) {
  return FMRCoreV3.getFmrV3StagingList(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    maximumRows || 100
  );
}

function getStagedFmrV3(
  stagingFmrId
) {
  return FMRCoreV3.getFmrV3StagedFmr(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    stagingFmrId
  );
}

function publishStagedFmrV3(
  stagingFmrId
) {
  return FMRCoreV3.publishFmrV3StagedFmr(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    stagingFmrId
  );
}

function renumberPublishedFmrV3(
  fmrId,
  newFmrNumber,
  reason
) {
  return FMRCoreV3.renumberFmrV3(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    fmrId,
    newFmrNumber,
    reason
  );
}

function renumberPublishedFmrByNumberV3(
  currentFmrNumber,
  newFmrNumber,
  reason
) {
  return FMRCoreV3.renumberFmrV3ByNumber(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    currentFmrNumber,
    newFmrNumber,
    reason
  );
}

function getSystemControlV3() {
  return FMRCoreV3.getFmrV3SystemControl(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    activeBoundEnvironmentV3_()
  );
}

function saveSystemUserV3(
  payload
) {
  return FMRCoreV3.saveFmrV3SystemUser(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    payload || {}
  );
}

function setSystemUserActiveV3(
  targetEmail,
  active,
  reason
) {
  return FMRCoreV3.setFmrV3SystemUserActive(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    targetEmail,
    Boolean(
      active
    ),
    reason || ''
  );
}

function saveSystemConfigurationV3(
  payload
) {
  const source =
    Object.assign(
      {},
      payload || {},
      {
        boundEnvironment:
          activeBoundEnvironmentV3_()
      }
    );

  return FMRCoreV3.saveFmrV3SystemConfiguration(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    source
  );
}

function serializeBoundResponseV3_(
  value
) {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return null;
  }

  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}

function getOperationsCenterV3() {
  const center =
    FMRCoreV3.getFmrV3OperationsCenter(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      activeBoundEnvironmentV3_()
    );

  center.schedule =
    getBoundOperationsScheduleV3();

  return serializeBoundResponseV3_(
    center
  );
}

function runOperationalHealthV3() {
  const health =
    FMRCoreV3.runFmrV3OperationalHealth(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      'MANUAL'
    );

  return serializeBoundResponseV3_(
    health
  );
}

function createDatabaseBackupV3(
  notes
) {
  return FMRCoreV3.createFmrV3DatabaseBackup(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    'MANUAL',
    notes || ''
  );
}

function saveOperationalSettingsV3(
  payload
) {
  return FMRCoreV3.saveFmrV3OperationalSettings(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    payload || {}
  );
}

function previewRecoveryV3(
  request
) {
  return FMRCoreV3.previewFmrV3Recovery(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    request || {}
  );
}

function applyRecoveryV3(
  request
) {
  return FMRCoreV3.applyFmrV3Recovery(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    request || {}
  );
}

function runBoundScheduledOperationsV3() {
  const result =
    FMRCoreV3.runFmrV3ScheduledOperations(
      boundDatabaseIdFmrV3_(),
      scheduledCallerEmailFmrV3_(),
      activeBoundEnvironmentV3_()
    );

  return serializeBoundResponseV3_(
    result
  );
}

function boundOperationsTriggerHandlerV3_() {
  return 'runBoundScheduledOperationsV3';
}

function getBoundOperationsScheduleV3() {
  const handler =
    boundOperationsTriggerHandlerV3_();

  const triggers =
    ScriptApp
      .getProjectTriggers()
      .filter(
        function (
          trigger
        ) {
          return (
            trigger
              .getHandlerFunction() ===
            handler
          );
        }
      );

  const properties =
    PropertiesService
      .getScriptProperties();

  const hour =
    Number(
      properties.getProperty(
        'FMR_V3_DAILY_OPERATIONS_HOUR'
      ) ||
      2
    );

  return {
    enabled:
      triggers.length > 0,

    triggerCount:
      triggers.length,

    hour:
      Number.isInteger(
        hour
      )
        ? hour
        : 2,

    timezone:
      Session
        .getScriptTimeZone(),

    installedBy:
      properties.getProperty(
        'FMR_V3_DAILY_OPERATIONS_INSTALLED_BY'
      ) ||
      '',

    installedAt:
      properties.getProperty(
        'FMR_V3_DAILY_OPERATIONS_INSTALLED_AT'
      ) ||
      ''
  };
}

function installBoundDailyOperationsV3(
  hour
) {
  assertCurrentBoundOwnerV3_();

  const parsedHour =
    Number(
      hour
    );

  if (
    !Number.isInteger(
      parsedHour
    ) ||
    parsedHour < 0 ||
    parsedHour > 23
  ) {
    throw new Error(
      'Schedule hour must be an integer from 0 through 23.'
    );
  }

  const handler =
    boundOperationsTriggerHandlerV3_();

  ScriptApp
    .getProjectTriggers()
    .filter(
      function (
        trigger
      ) {
        return (
          trigger
            .getHandlerFunction() ===
          handler
        );
      }
    )
    .forEach(
      function (
        trigger
      ) {
        ScriptApp.deleteTrigger(
          trigger
        );
      }
    );

  ScriptApp
    .newTrigger(
      handler
    )
    .timeBased()
    .everyDays(
      1
    )
    .atHour(
      parsedHour
    )
    .create();

  const properties =
    PropertiesService
      .getScriptProperties();

  properties.setProperties({
    FMR_V3_DAILY_OPERATIONS_HOUR:
      String(
        parsedHour
      ),

    FMR_V3_DAILY_OPERATIONS_INSTALLED_BY:
      callerEmailFmrV3_(),

    FMR_V3_DAILY_OPERATIONS_INSTALLED_AT:
      new Date()
        .toISOString()
  });

  return getBoundOperationsScheduleV3();
}

function removeBoundDailyOperationsV3() {
  assertCurrentBoundOwnerV3_();

  const handler =
    boundOperationsTriggerHandlerV3_();

  let removed = 0;

  ScriptApp
    .getProjectTriggers()
    .filter(
      function (
        trigger
      ) {
        return (
          trigger
            .getHandlerFunction() ===
          handler
        );
      }
    )
    .forEach(
      function (
        trigger
      ) {
        ScriptApp.deleteTrigger(
          trigger
        );

        removed +=
          1;
      }
    );

  PropertiesService
    .getScriptProperties()
    .deleteProperty(
      'FMR_V3_DAILY_OPERATIONS_HOUR'
    );

  return {
    success:
      true,

    removed:
      removed,

    schedule:
      getBoundOperationsScheduleV3()
  };
}

function startBulkImportUploadV3(
  payload
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.startFmrV3BulkImportUpload(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      payload || {}
    )
  );
}

function startBulkImportGoogleSheetV3(
  sourceValue
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.startFmrV3BulkImportGoogleSheet(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      sourceValue
    )
  );
}

function getBulkImportBatchV3(
  batchId
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.getFmrV3BulkImportBatch(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      batchId
    )
  );
}

function getBulkImportItemV3(
  importItemId
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.getFmrV3BulkImportItem(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      importItemId
    )
  );
}

function updateBulkImportItemV3(
  importItemId,
  payload
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.updateFmrV3BulkImportItem(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      importItemId,
      payload || {}
    )
  );
}

function applyBulkImportIsoSheetOverrideV3(
  batchId,
  importItemIds,
  isoSheet,
  confirmation
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.applyFmrV3BulkImportIsoSheetOverride(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      batchId,
      importItemIds || [],
      isoSheet,
      confirmation
    )
  );
}

function stageBulkImportItemsV3(
  batchId,
  importItemIds
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.stageFmrV3BulkImportItems(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      batchId,
      importItemIds || []
    )
  );
}

function getRecentBulkImportBatchesV3(
  maximumRows
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.getFmrV3RecentBulkImportBatches(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      maximumRows || 10
    )
  );
}

function verifyBoundFmrV3Connection() {
  const result =
    getPortalBootstrapV3();

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

/**
 * Returns true when a Core version belongs to
 * the 3.0.0 alpha series and meets or exceeds
 * the required alpha release.
 */
function isCompatibleFmrV3Alpha_(
  version,
  minimumAlpha
) {
  const match =
    /^3\.0\.0-alpha\.(\d+)$/
      .exec(
        String(
          version || ''
        ).trim()
      );

  return (
    Boolean(match) &&
    Number(match[1]) >=
      Number(
        minimumAlpha || 0
      )
  );
}


function validBoundActiveBagRecordV3_(
  record
) {
  const source =
    record || {};

  const readiness =
    String(
      source.readiness || ''
    ).trim();

  const status =
    String(
      source.status || ''
    ).trim()
      .toUpperCase();

  const bagged =
    Number(
      source.qtyBagged || 0
    );

  const issued =
    Number(
      source.qtyIssued || 0
    );

  const remaining =
    Number(
      source.qtyRemaining || 0
    );

  return (
    Boolean(
      source.bagTagId
    ) &&
    Boolean(
      source.bagTagItemId
    ) &&
    Boolean(
      source.tagNumber
    ) &&
    Boolean(
      source.fmrNumber
    ) &&
    Boolean(
      source.fmrLineId
    ) &&
    Boolean(
      source.commodityCode
    ) &&
    Boolean(
      source.materialDescription
    ) &&
    Number.isFinite(
      bagged
    ) &&
    Number.isFinite(
      issued
    ) &&
    Number.isFinite(
      remaining
    ) &&
    bagged > 0 &&
    issued >= 0 &&
    remaining > 0 &&
    Math.abs(
      bagged -
      issued -
      remaining
    ) < 0.000001 &&
    [
      'READY_FOR_FIELD',
      'PARTIALLY_ISSUED'
    ].includes(
      readiness
    ) &&
    [
      'ACTIVE',
      'PARTIALLY ISSUED'
    ].includes(
      status
    )
  );
}

function uniqueBoundActiveBagRecordsV3_(
  records
) {
  const seen = {};

  return (
    (records || [])
      .every(
        function (
          record
        ) {
          const key =
            String(
              record.bagTagId || ''
            ) +
            '|' +
            String(
              record.bagTagItemId || ''
            );

          if (
            !key ||
            key === '|' ||
            seen[key]
          ) {
            return false;
          }

          seen[key] =
            true;

          return true;
        }
      )
  );
}

function verifyBoundAdminActiveBagsV3() {
  const started =
    Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const result =
    getAdminActiveBagsV3({
      query: '',
      readiness: 'ALL',
      sortOrder: 'OLDEST_FIRST',
      page: 1,
      pageSize: 50
    });

  const summary =
    result &&
    result.summary
      ? result.summary
      : {};

  const pagination =
    result &&
    result.pagination
      ? result.pagination
      : {};

  const records =
    result &&
    Array.isArray(
      result.records
    )
      ? result.records
      : [];

  const expectedReturned =
    Math.min(
      Number(
        pagination.pageSize || 0
      ),
      Number(
        pagination.totalRecords || 0
      )
    );

  const recordsValid =
    records.every(
      validBoundActiveBagRecordV3_
    );

  const recordsUnique =
    uniqueBoundActiveBagRecordsV3_(
      records
    );

  const firstRecord =
    records.length
      ? records[0]
      : null;

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        3
      ) &&
      Boolean(result) &&
      Boolean(result.summary) &&
      Boolean(result.pagination) &&
      Array.isArray(
        result.records
      ) &&
      Number(
        summary.activeTags || 0
      ) >= 1 &&
      Number(
        summary.activeItems || 0
      ) >=
        Number(
          summary.activeTags || 0
        ) &&
      Number(
        summary.matchingItems || 0
      ) ===
        Number(
          pagination.totalRecords || 0
        ) &&
      records.length ===
        expectedReturned &&
      records.length > 0 &&
      recordsValid &&
      recordsUnique,

    readOnly: true,

    elapsedMs:
      Date.now() - started,

    coreVersion:
      coreVersion,

    activeTags:
      Number(
        summary.activeTags || 0
      ),

    activeItems:
      Number(
        summary.activeItems || 0
      ),

    matchingItems:
      Number(
        summary.matchingItems || 0
      ),

    returnedRecords:
      records.length,

    recordsValid:
      recordsValid,

    recordsUnique:
      recordsUnique,

    firstTag:
      firstRecord
        ? firstRecord.tagNumber
        : '',

    firstReadiness:
      firstRecord
        ? firstRecord.readiness
        : '',

    firstRemaining:
      firstRecord
        ? Number(
            firstRecord.qtyRemaining ||
            0
          )
        : 0,

    authenticatedUser:
      result.user
        ? result.user.email
        : ''
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!output.passed) {
    throw new Error(
      'Bound Admin Active Bag integration diagnostic failed.'
    );
  }

  return output;
}


function verifyBoundAdminOperationalRailV3() {
  const started =
    Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const result =
    getAdminDashboardV3();

  const rail =
    result &&
    result.operationalRail
      ? result.operationalRail
      : {};

  const activeBags =
    rail.activeBags || {};

  const backorders =
    rail.backorders || {};

  const records =
    Array.isArray(
      activeBags.records
    )
      ? activeBags.records
      : [];

  const recordsValid =
    records.every(
      validBoundActiveBagRecordV3_
    );

  const recordsUnique =
    uniqueBoundActiveBagRecordsV3_(
      records
    );

  const firstActiveBag =
    records.length
      ? records[0]
      : null;

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        4
      ) &&
      Boolean(result) &&
      Boolean(result.kpis) &&
      Boolean(
        result.operationalRail
      ) &&
      Array.isArray(
        backorders.requests
      ) &&
      Number(
        backorders.count || 0
      ) ===
        backorders.requests.length &&
      Boolean(
        activeBags.summary
      ) &&
      Array.isArray(
        activeBags.records
      ) &&
      Number(
        activeBags.summary
          .activeTags || 0
      ) >= 1 &&
      Number(
        activeBags.summary
          .activeItems || 0
      ) >= records.length &&
      records.length > 0 &&
      recordsValid &&
      recordsUnique,

    readOnly: true,

    elapsedMs:
      Date.now() - started,

    coreVersion:
      coreVersion,

    backorderCount:
      Number(
        backorders.count || 0
      ),

    activeTags:
      Number(
        activeBags.summary
          ? activeBags.summary
              .activeTags || 0
          : 0
      ),

    activeItems:
      Number(
        activeBags.summary
          ? activeBags.summary
              .activeItems || 0
          : 0
      ),

    returnedActiveBags:
      records.length,

    recordsValid:
      recordsValid,

    recordsUnique:
      recordsUnique,

    firstTag:
      firstActiveBag
        ? firstActiveBag.tagNumber
        : '',

    firstReadiness:
      firstActiveBag
        ? firstActiveBag.readiness
        : '',

    firstRemaining:
      firstActiveBag
        ? Number(
            firstActiveBag
              .qtyRemaining ||
            0
          )
        : 0,

    authenticatedUser:
      result &&
      result.user
        ? result.user.email
        : ''
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!output.passed) {
    throw new Error(
      'Bound Admin operational-rail integration failed.'
    );
  }

  return output;
}


function verifyBoundFieldWorkflowContractV3() {
  const started =
    Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const result =
    searchPortalV3(
      'V3-ACCEPT-0001',
      'FMR'
    );

  const materials =
    (result.cards || [])
      .reduce(
        function (
          all,
          card
        ) {
          return all.concat(
            card.materials || []
          );
        },
        []
      );

  const missingWorkflow =
    materials.filter(
      function (
        material
      ) {
        return (
          !material.workflow ||
          !Array.isArray(
            material
              .workflow
              .actions
          )
        );
      }
    );

  const invalidActions = [];

  materials.forEach(
    function (
      material
    ) {
      const actions =
        material.workflow &&
        Array.isArray(
          material
            .workflow
            .actions
        )
          ? material
              .workflow
              .actions
          : [];

      actions.forEach(
        function (
          action
        ) {
          if (
            !action.action ||
            !action.label ||
            !action.group ||
            !Array.isArray(
              action.requiredFields
            ) ||
            !Array.isArray(
              action.optionalFields
            ) ||
            Number(
              action.maxQuantity ||
              0
            ) <= 0
          ) {
            invalidActions.push({
              fmrLineId:
                material.fmrLineId,

              action:
                action.action || ''
            });
          }
        }
      );
    }
  );

  const materialWithBag =
    materials.find(
      function (
        material
      ) {
        return (
          Array.isArray(
            material.activeBags
          ) &&
          material
            .activeBags
            .length > 0
        );
      }
    );

  const issueFromBagAction =
    materialWithBag &&
    materialWithBag.workflow
      ? materialWithBag
          .workflow
          .actions
          .find(
            function (
              action
            ) {
              return (
                action.action ===
                'ISSUE_FROM_BAG'
              );
            }
          )
      : null;

  const firstBagSource =
    issueFromBagAction &&
    Array.isArray(
      issueFromBagAction
        .sources
    ) &&
    issueFromBagAction
      .sources
      .length
      ? issueFromBagAction
          .sources[0]
      : null;

  const requiredFields =
    issueFromBagAction
      ? issueFromBagAction
          .requiredFields || []
      : [];

  const requiredFieldContract =
    [
      'quantity',
      'bagTagId',
      'issuedToName',
      'performedByName'
    ].every(
      function (
        fieldName
      ) {
        return requiredFields.includes(
          fieldName
        );
      }
    );

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        5
      ) &&
      result.resultCount > 0 &&
      materials.length > 0 &&
      missingWorkflow.length === 0 &&
      invalidActions.length === 0 &&
      Boolean(
        materialWithBag
      ) &&
      Boolean(
        issueFromBagAction
      ) &&
      Boolean(
        firstBagSource
      ) &&
      requiredFieldContract,

    readOnly: true,

    elapsedMs:
      Date.now() - started,

    coreVersion:
      coreVersion,

    authenticatedUser:
      result.user
        ? result.user.email
        : '',

    resultCount:
      result.resultCount,

    materialLineCount:
      materials.length,

    missingWorkflowCount:
      missingWorkflow.length,

    invalidActionCount:
      invalidActions.length,

    activeBagLine:
      materialWithBag
        ? materialWithBag
            .fmrLineId
        : '',

    firstBagTag:
      firstBagSource
        ? firstBagSource
            .tagNumber
        : '',

    issueFromBagMaximum:
      issueFromBagAction
        ? issueFromBagAction
            .maxQuantity
        : 0,

    issueFromBagRequiredFields:
      requiredFields
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!output.passed) {
    throw new Error(
      'Bound Field workflow contract integration failed.'
    );
  }

  return output;
}

function verifyBoundFieldTransactionPreflightV3() {
  const started = Date.now();
  const coreVersion = FMRCoreV3.getFmrV3Version();
  const result = searchPortalV3(
    'V3-ACCEPT-0001',
    'FMR'
  );

  const materials = (result.cards || []).reduce(
    function (all, card) {
      return all.concat(card.materials || []);
    },
    []
  );

  const expectedActions = [
    'CONFIRM_AVAILABLE',
    'BAG',
    'DIRECT_ISSUE',
    'ISSUE_FROM_AVAILABLE',
    'ISSUE_FROM_BAG',
    'BACKORDER_REQUESTED'
  ];

  const coverage = {};
  expectedActions.forEach(function (action) {
    coverage[action] = [];
  });

  const lines = materials.map(function (material) {
    const workflow = material.workflow || {};
    const actions = Array.isArray(workflow.actions)
      ? workflow.actions
      : [];

    const actionSummaries = actions.map(function (action) {
      const sources = Array.isArray(action.sources)
        ? action.sources
        : [];

      const summary = {
        action: action.action,
        label: action.label,
        group: action.group,
        maximumQuantity: Number(
          action.maxQuantity || 0
        ),
        safeTestQuantity:
          Number(action.maxQuantity || 0) > 0
            ? Math.min(
                1,
                Number(action.maxQuantity || 0)
              )
            : 0,
        uom: action.uom || material.uom,
        quantityLimitScope:
          action.quantityLimitScope || 'LINE',
        requiredFields:
          action.requiredFields || [],
        optionalFields:
          action.optionalFields || [],
        helpText: action.helpText || '',
        sources: sources.map(function (source) {
          return {
            bagTagId: source.bagTagId || '',
            tagNumber: source.tagNumber || '',
            storageLocation:
              source.storageLocation || '',
            qtyRemaining: Number(
              source.qtyRemaining || 0
            ),
            uom: source.uom || '',
            status: source.status || ''
          };
        })
      };

      if (
        Object.prototype.hasOwnProperty.call(
          coverage,
          action.action
        )
      ) {
        coverage[action.action].push({
          fmrLineId: material.fmrLineId,
          commodityCode: material.commodityCode,
          isoKey: material.isoKey,
          maximumQuantity:
            summary.maximumQuantity,
          safeTestQuantity:
            summary.safeTestQuantity,
          uom: summary.uom,
          sourceTags: summary.sources.map(
            function (source) {
              return source.tagNumber;
            }
          )
        });
      }

      return summary;
    });

    return {
      fmrLineId: material.fmrLineId,
      lineNumber: material.lineNumber,
      isoKey: material.isoKey,
      commodityCode: material.commodityCode,
      size: material.size,
      description: material.description,
      uom: material.uom,
      quantities: {
        requested: Number(
          material.qtyRequested || 0
        ),
        confirmedLocated: Number(
          material.qtyConfirmedLocated || 0
        ),
        activeBagged: Number(
          material.qtyActiveBagged || 0
        ),
        available: Number(
          material.qtyAvailable || 0
        ),
        issued: Number(
          material.qtyIssued || 0
        ),
        pendingBackorder: Number(
          material.qtyPendingBackorder || 0
        ),
        confirmedBackorder: Number(
          material.qtyConfirmedBackorder || 0
        ),
        notYetLocated: Number(
          material.qtyNotYetLocated || 0
        ),
        remaining: Number(
          material.qtyRemainingRequirement || 0
        )
      },
      lineStatus: material.lineStatus,
      storageLocation:
        material.storageLocation,
      workflowPhase: workflow.phase || '',
      workflowHeadline:
        workflow.headline || '',
      requiresFieldReview: Boolean(
        workflow.requiresFieldReview
      ),
      hasPendingAdminReview: Boolean(
        workflow.hasPendingAdminReview
      ),
      activeBagCount: Number(
        workflow.activeBagCount || 0
      ),
      availableActionCount:
        actionSummaries.length,
      actions: actionSummaries
    };
  });

  const actionCoverage = {};
  expectedActions.forEach(function (action) {
    actionCoverage[action] = {
      available: coverage[action].length > 0,
      candidateCount: coverage[action].length,
      candidates: coverage[action]
    };
  });

  const missingActions = expectedActions.filter(
    function (action) {
      return coverage[action].length === 0;
    }
  );

  const missingWorkflowCount =
    materials.filter(function (material) {
      return (
        !material.workflow ||
        !Array.isArray(
          material.workflow.actions
        )
      );
    }).length;

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        5
      ) &&
      result.resultCount === 1 &&
      materials.length > 0 &&
      missingWorkflowCount === 0,
    readOnly: true,
    destructive: false,
    elapsedMs: Date.now() - started,
    coreVersion: coreVersion,
    authenticatedUser:
      result.user
        ? result.user.email
        : '',
    fmrNumber:
      result.cards && result.cards.length
        ? result.cards[0].fmrNumber
        : '',
    resultCount: result.resultCount,
    materialLineCount: materials.length,
    missingWorkflowCount:
      missingWorkflowCount,
    readyForFullAcceptance:
      missingActions.length === 0,
    missingActions: missingActions,
    actionCoverage: actionCoverage,
    lines: lines
  };

  console.log(
    JSON.stringify(output, null, 2)
  );

  if (!output.passed) {
    throw new Error(
      'Bound Field transaction acceptance preflight failed.'
    );
  }

  return output;
}

function getBoundFieldAcceptanceSnapshotV3() {
  const started = Date.now();
  const result = searchPortalV3(
    'V3-ACCEPT-0001',
    'FMR'
  );

  const materials = (result.cards || []).reduce(
    function (all, card) {
      return all.concat(card.materials || []);
    },
    []
  );

  const output = {
    passed:
      result.resultCount === 1 &&
      materials.length > 0,
    readOnly: true,
    destructive: false,
    elapsedMs: Date.now() - started,
    coreVersion:
      FMRCoreV3.getFmrV3Version(),
    fmrNumber:
      result.cards && result.cards.length
        ? result.cards[0].fmrNumber
        : '',
    lines: materials.map(function (material) {
      return {
        fmrLineId: material.fmrLineId,
        commodityCode:
          material.commodityCode,
        lineStatus: material.lineStatus,
        requested: Number(
          material.qtyRequested || 0
        ),
        confirmedLocated: Number(
          material.qtyConfirmedLocated || 0
        ),
        activeBagged: Number(
          material.qtyActiveBagged || 0
        ),
        available: Number(
          material.qtyAvailable || 0
        ),
        issued: Number(
          material.qtyIssued || 0
        ),
        pendingBackorder: Number(
          material.qtyPendingBackorder || 0
        ),
        confirmedBackorder: Number(
          material.qtyConfirmedBackorder || 0
        ),
        notYetLocated: Number(
          material.qtyNotYetLocated || 0
        ),
        remaining: Number(
          material.qtyRemainingRequirement || 0
        ),
        activeTags:
          (material.activeBags || []).map(
            function (bag) {
              return {
                bagTagId: bag.bagTagId,
                tagNumber: bag.tagNumber,
                qtyRemaining: Number(
                  bag.qtyRemaining || 0
                ),
                status: bag.status
              };
            }
          ),
        workflowPhase:
          material.workflow
            ? material.workflow.phase
            : '',
        actions:
          material.workflow &&
          Array.isArray(
            material.workflow.actions
          )
            ? material.workflow.actions.map(
                function (action) {
                  return {
                    action: action.action,
                    maxQuantity: Number(
                      action.maxQuantity || 0
                    )
                  };
                }
              )
            : []
      };
    })
  };

  console.log(
    JSON.stringify(output, null, 2)
  );

  if (!output.passed) {
    throw new Error(
      'Bound Field acceptance snapshot failed.'
    );
  }

  return output;
}

function verifyBoundFieldMetadataContractV3() {
  const started =
    Date.now();

  const bootstrap =
    getPortalBootstrapV3();

  const coreVersion =
    bootstrap.version ||
    FMRCoreV3.getFmrV3Version();

  const field =
    bootstrap.field || {};

  const options =
    field.options || {};

  const policy =
    field.metadataPolicy || {};

  const storageLocations =
    Array.isArray(
      options.storageLocations
    )
      ? options.storageLocations
      : [];

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        8
      ) &&
      Boolean(
        bootstrap.user
      ) &&
      storageLocations.length > 0 &&
      storageLocations.every(
        function (
          location
        ) {
          return (
            Boolean(
              location
            ) &&
            String(
              location
            ) ===
            String(
              location
            ).toUpperCase()
          );
        }
      ) &&
      policy.authenticatedPerformer ===
        true &&
      policy.storageLocationMode ===
        'FREE_TEXT_WITH_SUGGESTIONS' &&
      Array.isArray(
        policy.storageLocationRequiredFor
      ) &&
      policy
        .storageLocationRequiredFor
        .includes(
          'CONFIRM_AVAILABLE'
        ) &&
      policy
        .storageLocationRequiredFor
        .includes(
          'BAG'
        ),

    readOnly:
      true,

    elapsedMs:
      Date.now() -
      started,

    coreVersion:
      coreVersion,

    authenticatedUser:
      bootstrap.user
        ? bootstrap.user.email
        : '',

    authenticatedPerformer:
      bootstrap.user
        ? (
            bootstrap.user.name ||
            bootstrap.user.email
          )
        : '',

    storageSuggestions:
      storageLocations,

    metadataPolicy:
      policy
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!output.passed) {
    throw new Error(
      'Bound Field metadata contract failed.'
    );
  }

  return output;
}

function verifyBoundFieldBackorderNoticeContractV3() {
  const started =
    Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const expectations = [
    {
      fmrNumber:
        'V3-ADMIN-CONFIRM-0003',

      notices: [
        {
          type:
            'CONFIRMED',

          quantity:
            2,

          actionRequired:
            false
        }
      ]
    },
    {
      fmrNumber:
        'V3-ADMIN-REJECT-0004',

      notices: [
        {
          type:
            'REJECTED',

          quantity:
            2,

          actionRequired:
            true
        }
      ]
    },
    {
      fmrNumber:
        'V3-ADMIN-RETURN-0005',

      notices: [
        {
          type:
            'RETURNED_FOR_REVIEW',

          quantity:
            2,

          actionRequired:
            true
        }
      ]
    },
    {
      fmrNumber:
        'V3-ADMIN-SPLIT-0006',

      notices: [
        {
          type:
            'CONFIRMED',

          quantity:
            1,

          actionRequired:
            false
        },
        {
          type:
            'RETURNED_FOR_REVIEW',

          quantity:
            1,

          actionRequired:
            true
        }
      ]
    }
  ];

  const results =
    expectations.map(
      function (
        expectation
      ) {
        const search =
          searchPortalV3(
            expectation.fmrNumber,
            'FMR'
          );

        const material =
          search.cards &&
          search.cards.length === 1 &&
          search.cards[0].materials &&
          search.cards[0].materials.length === 1
            ? search.cards[0].materials[0]
            : null;

        const notices =
          material &&
          Array.isArray(
            material.backorderNotices
          )
            ? material.backorderNotices
            : [];

        const mismatches = [];

        expectation.notices.forEach(
          function (
            expected
          ) {
            const actual =
              notices.find(
                function (
                  notice
                ) {
                  return (
                    String(
                      notice.type ||
                      ''
                    ).toUpperCase() ===
                    expected.type
                  );
                }
              );

            if (!actual) {
              mismatches.push(
                (
                  'Missing ' +
                  expected.type
                )
              );

              return;
            }

            if (
              Number(
                actual.quantity ||
                0
              ) !==
              expected.quantity
            ) {
              mismatches.push(
                (
                  expected.type +
                  ' quantity expected ' +
                  expected.quantity +
                  ', received ' +
                  Number(
                    actual.quantity ||
                    0
                  )
                )
              );
            }

            if (
              Boolean(
                actual.actionRequired
              ) !==
              expected.actionRequired
            ) {
              mismatches.push(
                (
                  expected.type +
                  ' actionRequired expected ' +
                  expected.actionRequired
                )
              );
            }
          }
        );

        return {
          passed:
            Boolean(
              material
            ) &&
            mismatches.length === 0,

          fmrNumber:
            expectation.fmrNumber,

          noticeCount:
            notices.length,

          notices:
            notices,

          mismatches:
            mismatches
        };
      }
    );

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        9
      ) &&
      results.every(
        function (
          result
        ) {
          return result.passed;
        }
      ),

    readOnly:
      true,

    elapsedMs:
      Date.now() -
      started,

    coreVersion:
      coreVersion,

    fixtureCount:
      results.length,

    results:
      results
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!output.passed) {
    throw new Error(
      'Bound Field backorder notice contract failed.'
    );
  }

  return output;
}

function verifyBoundSystemControlContractV3() {
  const started =
    Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const control =
    getSystemControlV3();

  const environment =
    control.environment || {};

  const summary =
    control.summary || {};

  const users =
    Array.isArray(
      control.users
    )
      ? control.users
      : [];

  const profiles =
    Array.isArray(
      control.roleProfiles
    )
      ? control.roleProfiles
      : [];

  const owner =
    users.find(
      function (
        user
      ) {
        return (
          user.email ===
          environment.ownerEmail
        );
      }
    );

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        10
      ) &&
      Boolean(control) &&
      Boolean(control.configuration) &&
      Boolean(control.environment) &&
      [
        'TEST',
        'PRODUCTION'
      ].includes(
        environment.environmentName
      ) &&
      [
        'TEST',
        'PRODUCTION'
      ].includes(
        environment.boundEnvironment
      ) &&
      environment.environmentName ===
        environment.boundEnvironment &&
      [
        'ENABLED',
        'READ_ONLY'
      ].includes(
        environment.transactionMode
      ) &&
      Boolean(
        environment.databaseFingerprint
      ) &&
      users.length >= 1 &&
      profiles.length === 4 &&
      Boolean(owner) &&
      owner.active === true &&
      owner.canOwnerEdit ===
        true &&
      Number(
        summary.activeUsers ||
        0
      ) >= 1,

    readOnly:
      true,

    elapsedMs:
      Date.now() -
      started,

    coreVersion:
      coreVersion,

    environmentName:
      environment.environmentName,

    boundEnvironment:
      environment.boundEnvironment,

    transactionMode:
      environment.transactionMode,

    databaseFingerprint:
      environment.databaseFingerprint,

    totalUsers:
      Number(
        summary.totalUsers ||
        0
      ),

    activeUsers:
      Number(
        summary.activeUsers ||
        0
      ),

    roleProfileCount:
      profiles.length,

    ownerEmail:
      owner
        ? owner.email
        : ''
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!output.passed) {
    throw new Error(
      'Bound Sprint 4A system-control contract failed.'
    );
  }

  return output;
}

function verifyBoundOperationalReadinessV3() {
  const started =
    Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const center =
    getOperationsCenterV3();

  const health =
    center.currentHealth || {};

  const backup =
    health.backup || {};

  const rollout =
    health.rollout || {};

  const schedule =
    center.schedule || {};

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        11
      ) &&
      Boolean(
        center.settings
      ) &&
      Boolean(
        center.environment
      ) &&
      Boolean(
        center.currentHealth
      ) &&
      health.schema &&
      health.schema.passed ===
        true &&
      health.integrity &&
      health.integrity.passed ===
        true &&
      health.systemControl &&
      health.systemControl.passed ===
        true &&
      backup.exists ===
        true &&
      backup.current ===
        true &&
      rollout.pilotReady ===
        true &&
      schedule.enabled ===
        true &&
      Boolean(
        schedule.timezone
      ),

    readOnly:
      true,

    elapsedMs:
      Date.now() -
      started,

    coreVersion:
      coreVersion,

    environmentName:
      center.environment
        .environmentName,

    boundEnvironment:
      center.environment
        .boundEnvironment,

    transactionMode:
      center.environment
        .transactionMode,

    overallStatus:
      health.overallStatus,

    backupExists:
      backup.exists ===
        true,

    backupCurrent:
      backup.current ===
        true,

    backupAgeHours:
      backup.ageHours,

    pilotReady:
      rollout.pilotReady ===
        true,

    productionReady:
      rollout.productionReady ===
        true,

    scheduleEnabled:
      schedule.enabled ===
        true,

    scheduleHour:
      schedule.hour,

    healthHistoryCount:
      Array.isArray(
        center.healthHistory
      )
        ? center.healthHistory.length
        : 0,

    backupHistoryCount:
      Array.isArray(
        center.backups
      )
        ? center.backups.length
        : 0
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!output.passed) {
    throw new Error(
      'Bound Sprint 4B operational-readiness contract failed.'
    );
  }

  return output;
}

function verifyBoundBulkImportContractV3() {
  const started =
    Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const contract =
    FMRCoreV3.getFmrV3BulkImportContract(
      boundDatabaseIdFmrV3_()
    );

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        16
      ) &&
      Boolean(
        contract
      ) &&
      contract.passed ===
        true &&
      contract.parserVersion ===
        'ALPHA16_FRACTION_SIZE_V1' &&
      contract.sizeDateCoercionMode ===
        'DATE_OBJECT_TO_DAY_MONTH_FRACTION' &&
      contract.existingStagingMode ===
        'EXPLICIT_UPDATE_IN_PLACE' &&
      contract.operationalSheetSource ===
        'LINE_NO_FINAL_TWO_DIGIT_SUFFIX' &&
      contract.sourceShtFieldMode ===
        'IGNORED_SOURCE_EVIDENCE' &&
      contract.maxLinesPerFmr ===
        35 &&
      contract.autoFillMissingFields ===
        false &&
      contract.historicalActivityMode ===
        'SOURCE_EVIDENCE_ONLY' &&
      contract.uomRules &&
      contract.uomRules
        .descriptionStartsWithPipe ===
        'LF' &&
      contract.uomRules.pipet ===
        'EA' &&
      contract.uomRules
        .allOtherDescriptions ===
        'EA',

    readOnly:
      true,

    elapsedMs:
      Date.now() -
      started,

    coreVersion:
      coreVersion,

    parserVersion:
      contract
        .parserVersion,

    sizeDateCoercionMode:
      contract
        .sizeDateCoercionMode,

    existingStagingMode:
      contract
        .existingStagingMode,

    operationalSheetSource:
      contract
        .operationalSheetSource,

    sourceShtFieldMode:
      contract
        .sourceShtFieldMode,

    maxLinesPerFmr:
      contract
        .maxLinesPerFmr,

    maxWorksheets:
      contract
        .maxWorksheets,

    maxUploadBytes:
      contract
        .maxUploadBytes,

    autoFillMissingFields:
      contract
        .autoFillMissingFields,

    historicalActivityMode:
      contract
        .historicalActivityMode,

    uomRules:
      contract.uomRules,

    sheetCount:
      Array.isArray(
        contract.sheets
      )
        ? contract.sheets.length
        : 0
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!output.passed) {
    throw new Error(
      'Bound Sprint 5A bulk-import contract failed.'
    );
  }

  return output;
}

