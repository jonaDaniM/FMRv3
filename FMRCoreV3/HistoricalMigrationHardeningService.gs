/**
 * FMR Operations v3 — Alpha 30.3
 * Historical Migration hardening.
 *
 * ADD AS A NEW FMRCoreV3 FILE:
 *   HistoricalMigrationHardeningService
 *
 * No historical-migration table schema changes are introduced.
 *
 * Adds:
 *   - duplicate active-job guard by source folder;
 *   - hardened preview information;
 *   - Owner-controlled ABANDON action for interrupted jobs;
 *   - safe run/retry wrappers that refuse abandoned jobs;
 *   - generated working-folder/file identification helpers.
 */

const FMR_V3_HISTORICAL_MIGRATION_HARDENING =
  Object.freeze({
    ABANDONED:
      'ABANDONED',

    ACTIVE_JOB_STATUSES:
      Object.freeze([
        'READY',
        'RUNNING'
      ]),

    WORKING_FOLDER_PREFIX:
      '_FMRv3_Historical_Migration_Working_',

    CONVERTED_FILE_PREFIX:
      '[FMR MIGRATION] '
  });

function historicalMigrationGeneratedWorkingFolderFmrV3_(
  name
) {
  return normalizeFmrV3_(
    name
  )
    .toUpperCase()
    .startsWith(
      FMR_V3_HISTORICAL_MIGRATION_HARDENING
        .WORKING_FOLDER_PREFIX
        .toUpperCase()
    );
}

function historicalMigrationGeneratedConvertedFileFmrV3_(
  name
) {
  return normalizeFmrV3_(
    name
  )
    .toUpperCase()
    .startsWith(
      FMR_V3_HISTORICAL_MIGRATION_HARDENING
        .CONVERTED_FILE_PREFIX
        .toUpperCase()
    );
}

function historicalMigrationActiveJobsForFolderFmrV3_(
  folderId
) {
  const target =
    normalizeFmrV3_(
      folderId
    );

  if (!target) {
    return [];
  }

  return historicalReadRowsFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION
      .JOB_SHEET,
    FMR_V3_HISTORICAL_MIGRATION
      .JOB_HEADERS
  )
    .filter(
      function (
        job
      ) {
        return (
          normalizeFmrV3_(
            job.Source_Folder_ID
          ) ===
            target &&
          FMR_V3_HISTORICAL_MIGRATION_HARDENING
            .ACTIVE_JOB_STATUSES
            .includes(
              normalizeUpperFmrV3_(
                job.Status
              )
            )
        );
      }
    )
    .sort(
      function (
        left,
        right
      ) {
        return (
          new Date(
            right.Updated_At ||
            right.Created_At ||
            0
          ).getTime() -
          new Date(
            left.Updated_At ||
            left.Created_At ||
            0
          ).getTime()
        );
      }
    );
}

function historicalMigrationActiveJobSummaryFmrV3_(
  job
) {
  if (!job) {
    return null;
  }

  return {
    jobId:
      normalizeFmrV3_(
        job.Job_ID
      ),

    sourceFolderName:
      normalizeFmrV3_(
        job.Source_Folder_Name
      ),

    status:
      normalizeUpperFmrV3_(
        job.Status
      ),

    fileCount:
      numberFmrV3_(
        job.File_Count
      ),

    filesCompleted:
      numberFmrV3_(
        job.Files_Completed
      ),

    fmrsDiscovered:
      numberFmrV3_(
        job.FMRs_Discovered
      ),

    fmrsPublished:
      numberFmrV3_(
        job.FMRs_Published
      ),

    updatedAt:
      formatDateTimeFmrV3_(
        job.Updated_At
      )
  };
}

function previewHistoricalMigrationHardenedFmrV3_(
  userEmail,
  folderValue,
  options
) {
  const preview =
    previewHistoricalMigrationFmrV3_(
      userEmail,
      folderValue,
      options ||
      {}
    );

  const activeJobs =
    historicalMigrationActiveJobsForFolderFmrV3_(
      preview &&
      preview.inventory
        ? preview
            .inventory
            .folderId
        : ''
    );

  const activeJob =
    activeJobs.length
      ? historicalMigrationActiveJobSummaryFmrV3_(
          activeJobs[0]
        )
      : null;

  if (activeJob) {
    preview.canStart =
      false;

    preview.startBlockedReason =
      (
        'An active historical migration already exists for this folder: ' +
        activeJob.jobId +
        ' (' +
        activeJob.status +
        ', ' +
        activeJob.filesCompleted +
        '/' +
        activeJob.fileCount +
        ' files complete). Resume or abandon that job before starting another.'
      );
  }

  preview.activeJob =
    activeJob;

  preview.generatedArtifactProtection =
    {
      workingFoldersExcluded:
        true,

      convertedFilesExcluded:
        true
    };

  return preview;
}

function assertNoActiveHistoricalMigrationForFolderFmrV3_(
  folderId
) {
  const activeJobs =
    historicalMigrationActiveJobsForFolderFmrV3_(
      folderId
    );

  if (!activeJobs.length) {
    return;
  }

  const active =
    historicalMigrationActiveJobSummaryFmrV3_(
      activeJobs[0]
    );

  throw new Error(
    (
      'An active historical migration already exists for this folder: ' +
      active.jobId +
      ' (' +
      active.status +
      ', ' +
      active.filesCompleted +
      '/' +
      active.fileCount +
      ' files complete). Open the existing job and Resume it, or Abandon it, before starting a new migration.'
    )
  );
}

function historicalMigrationAbandonConfirmationFmrV3_(
  jobId
) {
  const normalized =
    normalizeFmrV3_(
      jobId
    );

  return (
    'ABANDON ' +
    normalized
      .slice(
        -8
      )
      .toUpperCase()
  );
}

function abandonHistoricalMigrationJobFmrV3_(
  userEmail,
  jobId,
  confirmation
) {
  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const owner =
      assertOwnerFmrV3_(
        userEmail
      );

    assertWriteEnabledFmrV3_(
      'Historical FMR migration abandon'
    );

    ensureHistoricalMigrationStorageFmrV3_();

    const job =
      historicalJobByIdFmrV3_(
        jobId
      );

    const status =
      normalizeUpperFmrV3_(
        job.Status
      );

    if (
      status ===
      FMR_V3_HISTORICAL_MIGRATION_HARDENING
        .ABANDONED
    ) {
      return getHistoricalMigrationJobFmrV3_(
        owner.email,
        job.Job_ID
      );
    }

    if (
      !FMR_V3_HISTORICAL_MIGRATION_HARDENING
        .ACTIVE_JOB_STATUSES
        .includes(
          status
        )
    ) {
      throw new Error(
        (
          'Only READY or RUNNING migration jobs can be abandoned. ' +
          'Current status: ' +
          status
        )
      );
    }

    const required =
      historicalMigrationAbandonConfirmationFmrV3_(
        job.Job_ID
      );

    if (
      normalizeUpperFmrV3_(
        confirmation
      ) !==
      normalizeUpperFmrV3_(
        required
      )
    ) {
      throw new Error(
        (
          'Confirmation must exactly match "' +
          required +
          '".'
        )
      );
    }

    const now =
      nowFmrV3_();

    historicalFilesForJobFmrV3_(
      job.Job_ID
    ).forEach(
      function (
        file
      ) {
        if (
          [
            'PENDING',
            'PARSING',
            'PUBLISHING'
          ].includes(
            normalizeUpperFmrV3_(
              file.Status
            )
          )
        ) {
          historicalUpdateFmrV3_(
            FMR_V3_HISTORICAL_MIGRATION
              .FILE_SHEET,
            FMR_V3_HISTORICAL_MIGRATION
              .FILE_HEADERS,
            file._rowNumber,
            {
              Status:
                FMR_V3_HISTORICAL_MIGRATION_HARDENING
                  .ABANDONED,

              Updated_At:
                now
            }
          );
        }
      }
    );

    const existingNotes =
      normalizeFmrV3_(
        job.Notes
      );

    historicalUpdateFmrV3_(
      FMR_V3_HISTORICAL_MIGRATION
        .JOB_SHEET,
      FMR_V3_HISTORICAL_MIGRATION
        .JOB_HEADERS,
      job._rowNumber,
      {
        Status:
          FMR_V3_HISTORICAL_MIGRATION_HARDENING
            .ABANDONED,

        Updated_At:
          now,

        Last_Error:
          '',

        Notes:
          (
            existingNotes
              ? existingNotes +
                ' | '
              : ''
          ) +
          'Abandoned by ' +
          owner.email +
          ' at ' +
          formatDateTimeFmrV3_(
            now
          ) +
          '.'
      }
    );

    appendAuditFmrV3_(
      'HISTORICAL_MIGRATION',
      job.Job_ID,
      'HISTORICAL_MIGRATION_ABANDONED',
      owner,
      uuidFmrV3_(
        'CORR'
      ),
      {
        sourceInterface:
          'OWNER',

        payload:
          {
            sourceFolder:
              normalizeFmrV3_(
                job.Source_Folder_Name
              ),

            filesCompleted:
              numberFmrV3_(
                job.Files_Completed
              ),

            fileCount:
              numberFmrV3_(
                job.File_Count
              )
          }
      }
    );

    SpreadsheetApp.flush();

    return getHistoricalMigrationJobFmrV3_(
      owner.email,
      job.Job_ID
    );
  } finally {
    lock.releaseLock();
  }
}

/* Hardened public library APIs */

function previewFmrV3HistoricalMigrationHardened(
  databaseId,
  userEmail,
  folderValue,
  options
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return previewHistoricalMigrationHardenedFmrV3_(
    userEmail,
    folderValue,
    options ||
    {}
  );
}

function startFmrV3HistoricalMigrationHardened(
  databaseId,
  userEmail,
  folderValue,
  options
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const owner =
      assertOwnerFmrV3_(
        userEmail
      );

    assertWriteEnabledFmrV3_(
      'Historical FMR migration'
    );

    ensureHistoricalMigrationStorageFmrV3_();

    const folderId =
      historicalFolderIdFmrV3_(
        folderValue
      );

    assertNoActiveHistoricalMigrationForFolderFmrV3_(
      folderId
    );

    return startHistoricalMigrationFmrV3_(
      owner.email,
      folderValue,
      options ||
      {}
    );
  } finally {
    lock.releaseLock();
  }
}

function runFmrV3HistoricalMigrationChunkHardened(
  databaseId,
  userEmail,
  jobId,
  publicationLimit
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const job =
    historicalJobByIdFmrV3_(
      jobId
    );

  if (
    normalizeUpperFmrV3_(
      job.Status
    ) ===
    FMR_V3_HISTORICAL_MIGRATION_HARDENING
      .ABANDONED
  ) {
    throw new Error(
      (
        'Historical migration job is ABANDONED and cannot be resumed: ' +
        normalizeFmrV3_(
          job.Job_ID
        )
      )
    );
  }

  return runHistoricalMigrationChunkFmrV3_(
    owner.email,
    job.Job_ID,
    publicationLimit
  );
}

function retryFmrV3HistoricalMigrationFileHardened(
  databaseId,
  userEmail,
  migrationFileId
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const target =
    normalizeFmrV3_(
      migrationFileId
    );

  const files =
    historicalReadRowsFmrV3_(
      FMR_V3_HISTORICAL_MIGRATION
        .FILE_SHEET,
      FMR_V3_HISTORICAL_MIGRATION
        .FILE_HEADERS
    )
      .filter(
        function (
          row
        ) {
          return (
            normalizeFmrV3_(
              row.Migration_File_ID
            ) ===
            target
          );
        }
      );

  if (
    files.length !==
    1
  ) {
    throw new Error(
      'Migration file record not found: ' +
      target
    );
  }

  const job =
    historicalJobByIdFmrV3_(
      files[0].Job_ID
    );

  if (
    normalizeUpperFmrV3_(
      job.Status
    ) ===
    FMR_V3_HISTORICAL_MIGRATION_HARDENING
      .ABANDONED
  ) {
    throw new Error(
      'Files belonging to an ABANDONED migration cannot be retried.'
    );
  }

  return retryHistoricalMigrationFileFmrV3_(
    owner.email,
    target
  );
}

function abandonFmrV3HistoricalMigrationJob(
  databaseId,
  userEmail,
  jobId,
  confirmation
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return abandonHistoricalMigrationJobFmrV3_(
    userEmail,
    jobId,
    confirmation
  );
}
