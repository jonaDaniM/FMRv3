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

function searchFmrV3(
  databaseId,
  userEmail,
  query,
  mode
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return searchPublishedFmrV3_(
    userEmail,
    query,
    mode
  );
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

  return getAdminFmrRegisterFmrV3_(
    userEmail,
    request || {}
  );
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

  return saveStagedFmrFmrV3_(
    userEmail,
    payload || {}
  );
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

  return publishStagedFmrFmrV3_(
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
