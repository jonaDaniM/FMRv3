function getFmrV3Version() {
  return FMR_V3.VERSION;
}

function getFmrV3Bootstrap(
  databaseId,
  userEmail,
  interfaceName,
  boundEnvironment
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  const user =
    assertSearchUserFmrV3_(
      userEmail
    );

  recordUserAccessFmrV3_(
    user.email,
    interfaceName ||
    'PORTAL'
  );

  return {
    version:
      FMR_V3.VERSION,

    user:
      user,

    environment:
      runtimeEnvironmentFmrV3_(
        boundEnvironment
      ),

    field:
      getFieldBootstrapFmrV3_(
        userEmail
      )
  };
}


function isoSuffixSearchCandidatesFmrV3_(
  query,
  mode
) {
  const normalizedMode =
    normalizeUpperFmrV3_(
      mode ||
      'AUTO'
    );

  const raw =
    normalizeUpperFmrV3_(
      query
    );

  if (
    !raw ||
    ![
      'AUTO',
      'ISO'
    ].includes(
      normalizedMode
    )
  ) {
    return [
      raw
    ];
  }

  const hasIsoPrefix =
    raw.indexOf(
      'ISO:'
    ) ===
    0;

  const body =
    hasIsoPrefix
      ? raw.slice(
          4
        )
      : raw;

  if (
    body.includes(
      '|'
    ) ||
    body.includes(
      '/'
    ) ||
    /\b(?:SHT|SHEET)\b/.test(
      body
    )
  ) {
    return [
      raw
    ];
  }

  const match =
    body.match(
      /^(.*)-([0-9]{2})$/
    );

  if (
    !match
  ) {
    return [
      raw
    ];
  }

  const isoNumber =
    normalizeUpperFmrV3_(
      match[1]
    );

  const preservedSheet =
    normalizeUpperFmrV3_(
      match[2]
    );

  if (
    !isoNumber ||
    !preservedSheet
  ) {
    return [
      raw
    ];
  }

  const numericSheet =
    Number(
      preservedSheet
    );

  const canonicalSheet =
    (
      Number.isInteger(
        numericSheet
      ) &&
      numericSheet >=
        0
    )
      ? String(
          numericSheet
        )
      : preservedSheet;

  const prefix =
    hasIsoPrefix
      ? 'ISO:'
      : '';

  return Array.from(
    new Set([
      (
        prefix +
        isoNumber +
        '|' +
        canonicalSheet
      ),
      (
        prefix +
        isoNumber +
        '|' +
        preservedSheet
      )
    ])
  );
}

function normalizeAdminRegisterIsoSearchCandidatesFmrV3_(
  request
) {
  const source =
    Object.assign(
      {},
      request ||
      {}
    );

  const queryType =
    normalizeUpperFmrV3_(
      source.queryType ||
      'AUTO'
    );

  const candidates =
    isoSuffixSearchCandidatesFmrV3_(
      source.query,
      queryType
    );

  return candidates.map(
    function (
      candidate
    ) {
      return Object.assign(
        {},
        source,
        {
          query:
            candidate
        }
      );
    }
  );
}

function searchFmrV3(
  databaseId,
  userEmail,
  query,
  mode
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  const candidates =
    isoSuffixSearchCandidatesFmrV3_(
      query,
      mode
    );

  let result =
    null;

  candidates.some(
    function (
      candidate
    ) {
      result =
        searchPublishedFmrV3_(
          userEmail,
          candidate,
          mode
        );

      return (
        numberFmrV3_(
          result &&
          result.resultCount
        ) >
        0
      );
    }
  );

  return result;
}

function performFmrV3FieldAction(
  databaseId,
  userEmail,
  request
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  assertWriteEnabledFmrV3_(
    'Field transaction'
  );

  return performFieldActionFmrV3_(
    userEmail,
    request || {}
  );
}

function getFmrV3AdminDashboard(
  databaseId,
  userEmail
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return getAdminDashboardFmrV3_(
    userEmail
  );
}

function getFmrV3AdminRegister(
  databaseId,
  userEmail,
  request
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  const candidates =
    normalizeAdminRegisterIsoSearchCandidatesFmrV3_(
      request
    );

  let register =
    null;

  candidates.some(
    function (
      candidate
    ) {
      register =
        getAdminFmrRegisterFmrV3_(
          userEmail,
          candidate
        );

      return (
        numberFmrV3_(
          register &&
          register.pagination &&
          register.pagination
            .totalRecords
        ) >
        0
      );
    }
  );

  return enrichAdminRegisterWithIsoSummariesFmrV3_(
    register
  );
}


function getFmrV3AdminIsoSummaryContract(
  databaseId
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return inspectFmrV3AdminIsoSummaryContract();
}


function getFmrV3AdminDecisionContract(
  databaseId
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return inspectFmrV3AdminDecisionContract();
}

function getFmrV3AdminActiveBags(
  databaseId,
  userEmail,
  request
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return getAdminActiveBagQueueFmrV3_(
    userEmail,
    request || {}
  );
}

function reviewFmrV3Backorder(
  databaseId,
  userEmail,
  request
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  assertWriteEnabledFmrV3_(
    'Admin backorder decision'
  );

  return reviewBackorderFmrV3_(
    userEmail,
    request || {}
  );
}

function saveFmrV3Staging(
  databaseId,
  userEmail,
  payload
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  assertWriteEnabledFmrV3_(
    'Owner staging change'
  );

  const source =
    payload || {};

  const activation =
    prepareStagingActivationForUpdateFmrV3_(
      source.stagingFmrId,
      source.officialFmrNumber
    );

  const result =
    saveStagedFmrFmrV3_(
      userEmail,
      source
    );

  recordStagingActivationFromUpdateFmrV3_(
    userEmail,
    activation,
    'Archived staging record restored by Owner edit.',
    'OWNER'
  );

  return result;
}

function getFmrV3StagingList(
  databaseId,
  userEmail,
  maximumRows
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return getOwnerStagingListFmrV3_(
    userEmail,
    maximumRows
  );
}


function getFmrV3StagingWorkspace(
  databaseId,
  userEmail,
  maximumRows
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return getOwnerStagingWorkspaceFmrV3_(
    userEmail,
    maximumRows
  );
}

function archiveFmrV3StagedFmr(
  databaseId,
  userEmail,
  stagingFmrId,
  reason
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  assertWriteEnabledFmrV3_(
    'Staging archive'
  );

  return archiveStagedFmrFmrV3_(
    userEmail,
    stagingFmrId,
    reason
  );
}

function restoreFmrV3StagedFmr(
  databaseId,
  userEmail,
  stagingFmrId,
  reason
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  assertWriteEnabledFmrV3_(
    'Staging restore'
  );

  return restoreStagedFmrFmrV3_(
    userEmail,
    stagingFmrId,
    reason
  );
}

function getFmrV3StagingArchiveContract(
  databaseId
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return inspectFmrV3StagingArchiveContract();
}

function getFmrV3StagedFmr(
  databaseId,
  userEmail,
  stagingFmrId
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return serializeStagedFmrForClientFmrV3_(
    getStagedFmrFmrV3_(
      userEmail,
      stagingFmrId
    )
  );
}

function publishFmrV3StagedFmr(
  databaseId,
  userEmail,
  stagingFmrId
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  assertWriteEnabledFmrV3_(
    'FMR publication'
  );

  return publishStagedFmrAlpha20FmrV3_(
    userEmail,
    stagingFmrId
  );
}

function renumberFmrV3(
  databaseId,
  userEmail,
  fmrId,
  newFmrNumber,
  reason
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  assertWriteEnabledFmrV3_(
    'FMR renumbering'
  );

  return renumberFmrFmrV3_(
    userEmail,
    fmrId,
    newFmrNumber,
    reason
  );
}

function renumberFmrV3ByNumber(
  databaseId,
  userEmail,
  currentFmrNumber,
  newFmrNumber,
  reason
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  assertWriteEnabledFmrV3_(
    'FMR renumbering'
  );

  return renumberFmrByNumberFmrV3_(
    userEmail,
    currentFmrNumber,
    newFmrNumber,
    reason
  );
}

function getFmrV3SystemControl(
  databaseId,
  userEmail,
  boundEnvironment
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return getSystemControlFmrV3_(
    userEmail,
    boundEnvironment
  );
}

function saveFmrV3SystemUser(
  databaseId,
  userEmail,
  payload
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return upsertSystemUserFmrV3_(
    userEmail,
    payload || {}
  );
}

function setFmrV3SystemUserActive(
  databaseId,
  userEmail,
  targetEmail,
  active,
  reason
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return setSystemUserActiveFmrV3_(
    userEmail,
    targetEmail,
    Boolean(
      active
    ),
    reason
  );
}

function saveFmrV3SystemConfiguration(
  databaseId,
  userEmail,
  payload
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return updateSystemConfigurationFmrV3_(
    userEmail,
    payload || {}
  );
}

function getFmrV3OperationsCenter(
  databaseId,
  userEmail,
  boundEnvironment
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return getOperationsCenterFmrV3_(
    userEmail,
    boundEnvironment
  );
}

function runFmrV3OperationalHealth(
  databaseId,
  userEmail,
  triggerType
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return runOperationalHealthCheckFmrV3_(
    userEmail,
    triggerType ||
    'MANUAL'
  );
}

function createFmrV3DatabaseBackup(
  databaseId,
  userEmail,
  triggerType,
  notes
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return createDatabaseBackupFmrV3_(
    userEmail,
    triggerType ||
    'MANUAL',
    notes || ''
  );
}

function saveFmrV3OperationalSettings(
  databaseId,
  userEmail,
  payload
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return updateOperationalSettingsFmrV3_(
    userEmail,
    payload || {}
  );
}

function previewFmrV3Recovery(
  databaseId,
  userEmail,
  request
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return previewRecoveryFmrV3_(
    userEmail,
    request || {}
  );
}

function applyFmrV3Recovery(
  databaseId,
  userEmail,
  request
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return applyRecoveryFmrV3_(
    userEmail,
    request || {}
  );
}

function runFmrV3ScheduledOperations(
  databaseId,
  userEmail,
  boundEnvironment
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return runScheduledOperationsFmrV3_(
    userEmail,
    boundEnvironment
  );
}

function startFmrV3BulkImportUpload(
  databaseId,
  userEmail,
  payload
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return beginBulkImportUploadFmrV3_(
    userEmail,
    payload || {}
  );
}

function startFmrV3BulkImportGoogleSheet(
  databaseId,
  userEmail,
  sourceValue
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return beginBulkImportGoogleSheetFmrV3_(
    userEmail,
    sourceValue
  );
}

function getFmrV3BulkImportBatch(
  databaseId,
  userEmail,
  batchId
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return getBulkImportBatchFmrV3_(
    userEmail,
    batchId
  );
}

function getFmrV3BulkImportItem(
  databaseId,
  userEmail,
  importItemId
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return getBulkImportItemFmrV3_(
    userEmail,
    importItemId
  );
}

function updateFmrV3BulkImportItem(
  databaseId,
  userEmail,
  importItemId,
  payload
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return updateBulkImportItemFmrV3_(
    userEmail,
    importItemId,
    payload || {}
  );
}

function applyFmrV3BulkImportIsoSheetOverride(
  databaseId,
  userEmail,
  batchId,
  importItemIds,
  isoSheet,
  confirmation
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return applyBulkImportIsoSheetOverrideFmrV3_(
    userEmail,
    batchId,
    importItemIds,
    isoSheet,
    confirmation
  );
}

function stageFmrV3BulkImportItems(
  databaseId,
  userEmail,
  batchId,
  importItemIds
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return stageBulkImportItemsFmrV3_(
    userEmail,
    batchId,
    importItemIds
  );
}

function getFmrV3RecentBulkImportBatches(
  databaseId,
  userEmail,
  maximumRows
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return getRecentBulkImportBatchesFmrV3_(
    userEmail,
    maximumRows
  );
}

function getFmrV3BulkImportContract(
  databaseId
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return inspectFmrV3BulkImportContract();
}

