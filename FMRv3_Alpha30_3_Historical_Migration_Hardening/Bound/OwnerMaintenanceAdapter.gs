/**
 * FMR Operations v3 — Alpha 30.3
 * Bound wrappers for Historical Migration + Owner Corrections.
 *
 * Historical migration wrappers use the hardened Alpha 30.3 Core APIs:
 *   - active-job duplicate protection;
 *   - abandoned-job protection;
 *   - generated working-folder protection;
 *   - explicit Owner abandon action.
 */

function previewHistoricalMigrationV3(
  folderValue,
  options
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.previewFmrV3HistoricalMigrationHardened(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      folderValue,
      options ||
      {}
    )
  );
}

function startHistoricalMigrationV3(
  folderValue,
  options
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.startFmrV3HistoricalMigrationHardened(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      folderValue,
      options ||
      {}
    )
  );
}

function runHistoricalMigrationChunkV3(
  jobId,
  publicationLimit
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.runFmrV3HistoricalMigrationChunkHardened(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      jobId,
      publicationLimit ||
      10
    )
  );
}

function getHistoricalMigrationJobV3(
  jobId
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.getFmrV3HistoricalMigrationJob(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      jobId
    )
  );
}

function retryHistoricalMigrationFileV3(
  migrationFileId
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.retryFmrV3HistoricalMigrationFileHardened(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      migrationFileId
    )
  );
}

function abandonHistoricalMigrationJobV3(
  jobId,
  confirmation
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.abandonFmrV3HistoricalMigrationJob(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      jobId,
      confirmation
    )
  );
}

function searchOwnerLedgerV3(
  query,
  mode
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.searchFmrV3OwnerLedger(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      query,
      mode ||
      'AUTO'
    )
  );
}

function previewOwnerCorrectionV3(
  request
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.previewFmrV3OwnerCorrection(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      request ||
      {}
    )
  );
}

function applyOwnerCorrectionV3(
  request
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.applyFmrV3OwnerCorrection(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      request ||
      {}
    )
  );
}

function getOwnerCorrectionHistoryV3(
  maximumRows
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.getFmrV3OwnerCorrectionHistory(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      maximumRows ||
      50
    )
  );
}

function getRecentHistoricalMigrationJobsV3(
  maximumRows
) {
  return serializeBoundResponseV3_(
    FMRCoreV3.getFmrV3RecentHistoricalMigrationJobs(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      maximumRows ||
      10
    )
  );
}
