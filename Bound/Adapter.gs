const FMR_V3_DATABASE_ID =
  '1nDEsty3PTVppEPAkKpN9RVXCl_P0pgQALyGPficjz68';

function callerEmailFmrV3_() {
  const email = Session.getActiveUser().getEmail();

  if (!email) {
    throw new Error(
      'Authenticated Google account email is unavailable.'
    );
  }

  return email;
}

function getPortalBootstrapV3() {
  return FMRCoreV3.getFmrV3Bootstrap(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_()
  );
}

function searchPortalV3(query, mode) {
  return FMRCoreV3.searchFmrV3(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    query,
    mode || 'AUTO'
  );
}

function performFieldActionV3(request) {
  return FMRCoreV3.performFmrV3FieldAction(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    request || {}
  );
}

function getAdminDashboardV3() {
  return FMRCoreV3.getFmrV3AdminDashboard(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_()
  );
}

function getAdminFmrRegisterV3(request) {
  return FMRCoreV3.getFmrV3AdminRegister(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    request || {}
  );
}

function getAdminActiveBagsV3(request) {
  return FMRCoreV3.getFmrV3AdminActiveBags(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    request || {}
  );
}

function reviewBackorderV3(request) {
  return FMRCoreV3.reviewFmrV3Backorder(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    request || {}
  );
}

function saveStagingV3(payload) {
  return FMRCoreV3.saveFmrV3Staging(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    payload || {}
  );
}

function getStagingListV3(maximumRows) {
  return FMRCoreV3.getFmrV3StagingList(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    maximumRows || 100
  );
}

function getStagedFmrV3(stagingFmrId) {
  return FMRCoreV3.getFmrV3StagedFmr(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    stagingFmrId
  );
}

function publishStagedFmrV3(stagingFmrId) {
  return FMRCoreV3.publishFmrV3StagedFmr(
    FMR_V3_DATABASE_ID,
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
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    fmrId,
    newFmrNumber,
    reason
  );
}

function verifyBoundFmrV3Connection() {
  const result = getPortalBootstrapV3();
  console.log(JSON.stringify(result, null, 2));
  return result;
}


function renumberPublishedFmrByNumberV3(
  currentFmrNumber,
  newFmrNumber,
  reason
) {
  return FMRCoreV3.renumberFmrV3ByNumber(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    currentFmrNumber,
    newFmrNumber,
    reason
  );
}

function verifyBoundAdminActiveBagsV3() {
  const started = Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const result = getAdminActiveBagsV3({
    query: '',
    readiness: 'ALL',
    sortOrder: 'OLDEST_FIRST',
    page: 1,
    pageSize: 10
  });

  const firstRecord =
    result.records && result.records.length
      ? result.records[0]
      : null;

  const output = {
    passed:
      coreVersion === '3.0.0-alpha.3' &&
      Boolean(result) &&
      Boolean(result.summary) &&
      Boolean(result.pagination) &&
      Array.isArray(result.records) &&
      result.summary.activeTags === 1 &&
      result.records.length === 1 &&
      Boolean(firstRecord) &&
      firstRecord.tagNumber ===
        'BT-2026-00001',
    readOnly: true,
    elapsedMs: Date.now() - started,
    coreVersion: coreVersion,
    activeTags:
      result.summary.activeTags,
    activeItems:
      result.summary.activeItems,
    returnedRecords:
      result.records.length,
    firstTag:
      firstRecord
        ? firstRecord.tagNumber
        : '',
    firstReadiness:
      firstRecord
        ? firstRecord.readiness
        : '',
    authenticatedUser:
      result.user
        ? result.user.email
        : ''
  };

  console.log(
    JSON.stringify(output, null, 2)
  );

  if (!output.passed) {
    throw new Error(
      'Bound Admin Active Bag integration diagnostic failed.'
    );
  }

  return output;
}
