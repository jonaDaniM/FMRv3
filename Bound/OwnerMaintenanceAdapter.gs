/**
 * FMR Operations v3 — Alpha 29
 * Bound wrappers for Historical Migration + Owner Corrections.
 */
function previewHistoricalMigrationV3(folderValue, options) {
  return serializeBoundResponseV3_(
    FMRCoreV3.previewFmrV3HistoricalMigration(
      boundDatabaseIdFmrV3_(), callerEmailFmrV3_(), folderValue, options || {}
    )
  );
}

function startHistoricalMigrationV3(folderValue, options) {
  return serializeBoundResponseV3_(
    FMRCoreV3.startFmrV3HistoricalMigration(
      boundDatabaseIdFmrV3_(), callerEmailFmrV3_(), folderValue, options || {}
    )
  );
}

function runHistoricalMigrationChunkV3(jobId, publicationLimit) {
  return serializeBoundResponseV3_(
    FMRCoreV3.runFmrV3HistoricalMigrationChunk(
      boundDatabaseIdFmrV3_(), callerEmailFmrV3_(), jobId, publicationLimit || 10
    )
  );
}

function getHistoricalMigrationJobV3(jobId) {
  return serializeBoundResponseV3_(
    FMRCoreV3.getFmrV3HistoricalMigrationJob(
      boundDatabaseIdFmrV3_(), callerEmailFmrV3_(), jobId
    )
  );
}

function retryHistoricalMigrationFileV3(migrationFileId) {
  return serializeBoundResponseV3_(
    FMRCoreV3.retryFmrV3HistoricalMigrationFile(
      boundDatabaseIdFmrV3_(), callerEmailFmrV3_(), migrationFileId
    )
  );
}

function searchOwnerLedgerV3(query, mode) {
  return serializeBoundResponseV3_(
    FMRCoreV3.searchFmrV3OwnerLedger(
      boundDatabaseIdFmrV3_(), callerEmailFmrV3_(), query, mode || 'AUTO'
    )
  );
}

function previewOwnerCorrectionV3(request) {
  return serializeBoundResponseV3_(
    FMRCoreV3.previewFmrV3OwnerCorrection(
      boundDatabaseIdFmrV3_(), callerEmailFmrV3_(), request || {}
    )
  );
}

function applyOwnerCorrectionV3(request) {
  return serializeBoundResponseV3_(
    FMRCoreV3.applyFmrV3OwnerCorrection(
      boundDatabaseIdFmrV3_(), callerEmailFmrV3_(), request || {}
    )
  );
}

function getOwnerCorrectionHistoryV3(maximumRows) {
  return serializeBoundResponseV3_(
    FMRCoreV3.getFmrV3OwnerCorrectionHistory(
      boundDatabaseIdFmrV3_(), callerEmailFmrV3_(), maximumRows || 50
    )
  );
}


function getRecentHistoricalMigrationJobsV3(maximumRows) {
  return serializeBoundResponseV3_(
    FMRCoreV3.getFmrV3RecentHistoricalMigrationJobs(
      boundDatabaseIdFmrV3_(), callerEmailFmrV3_(), maximumRows || 10
    )
  );
}
