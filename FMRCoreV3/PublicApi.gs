function getFmrV3Version() {
  return FMR_V3.VERSION;
}

function getFmrV3Bootstrap(databaseId, userEmail) {
  setFmrV3DatabaseContext_(databaseId);

  return {
    version: FMR_V3.VERSION,
    user: assertSearchUserFmrV3_(userEmail),
    field: getFieldBootstrapFmrV3_(userEmail)
  };
}

function searchFmrV3(databaseId, userEmail, query, mode) {
  setFmrV3DatabaseContext_(databaseId);
  return searchPublishedFmrV3_(userEmail, query, mode);
}

function performFmrV3FieldAction(databaseId, userEmail, request) {
  setFmrV3DatabaseContext_(databaseId);
  return performFieldActionFmrV3_(userEmail, request || {});
}

function getFmrV3AdminDashboard(databaseId, userEmail) {
  setFmrV3DatabaseContext_(databaseId);
  return getAdminDashboardFmrV3_(userEmail);
}

function getFmrV3AdminRegister(databaseId, userEmail, request) {
  setFmrV3DatabaseContext_(databaseId);
  return getAdminFmrRegisterFmrV3_(userEmail, request || {});
}

function reviewFmrV3Backorder(databaseId, userEmail, request) {
  setFmrV3DatabaseContext_(databaseId);
  return reviewBackorderFmrV3_(userEmail, request || {});
}

function saveFmrV3Staging(databaseId, userEmail, payload) {
  setFmrV3DatabaseContext_(databaseId);
  return saveStagedFmrFmrV3_(userEmail, payload || {});
}

function getFmrV3StagingList(databaseId, userEmail, maximumRows) {
  setFmrV3DatabaseContext_(databaseId);
  return getOwnerStagingListFmrV3_(userEmail, maximumRows);
}

function getFmrV3StagedFmr(databaseId, userEmail, stagingFmrId) {
  setFmrV3DatabaseContext_(databaseId);
  return serializeStagedFmrForClientFmrV3_(
    getStagedFmrFmrV3_(userEmail, stagingFmrId)
  );
}

function publishFmrV3StagedFmr(databaseId, userEmail, stagingFmrId) {
  setFmrV3DatabaseContext_(databaseId);
  return publishStagedFmrFmrV3_(userEmail, stagingFmrId);
}

function renumberFmrV3(
  databaseId,
  userEmail,
  fmrId,
  newFmrNumber,
  reason
) {
  setFmrV3DatabaseContext_(databaseId);
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
  setFmrV3DatabaseContext_(databaseId);
  return renumberFmrByNumberFmrV3_(
    userEmail,
    currentFmrNumber,
    newFmrNumber,
    reason
  );
}
