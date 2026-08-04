const FMR_V3_STAGING_ARCHIVE =
  Object.freeze({
    statuses:
      Object.freeze({
        ARCHIVED:
          'ARCHIVED',

        DRAFT:
          'DRAFT',

        DRAFT_WITH_ERRORS:
          'DRAFT_WITH_ERRORS',

        PUBLISHED:
          'PUBLISHED',

        VOIDED:
          'VOIDED'
      }),

    auditActions:
      Object.freeze({
        ARCHIVE:
          'ARCHIVE_STAGING',

        RESTORE:
          'RESTORE_STAGING'
      }),

    contract:
      Object.freeze({
        archiveMode:
          'STATUS_ONLY_NO_PHYSICAL_DELETE',

        restoreMode:
          'SAME_STAGING_ID',

        publicationPolicy:
          'BLOCK_ARCHIVED',

        workspaceMode:
          'ACTIVE_AND_ARCHIVED',

        bulkRestageMode:
          'UPDATE_IN_PLACE_AND_RESTORE'
      })
  });

function stagingHeaderByIdFmrV3_(
  stagingFmrId
) {
  const id =
    normalizeFmrV3_(
      stagingFmrId
    );

  if (!id) {
    throw new Error(
      'Staging FMR ID is required.'
    );
  }

  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS
        .STAGING_HEADERS,
      1,
      id
    );

  if (!rows.length) {
    throw new Error(
      'Staged FMR not found: ' +
      id
    );
  }

  if (
    rows.length !==
    1
  ) {
    throw new Error(
      (
        'Staging FMR ID resolves to ' +
        rows.length +
        ' header rows: ' +
        id
      )
    );
  }

  return readRowObjectFmrV3_(
    FMR_V3.SHEETS
      .STAGING_HEADERS,
    rows[0]
  );
}

function activeStagingStatusFmrV3_(
  status
) {
  const value =
    normalizeUpperFmrV3_(
      status
    );

  return (
    value !==
      FMR_V3_STAGING_ARCHIVE
        .statuses
        .ARCHIVED &&
    value !==
      FMR_V3_STAGING_ARCHIVE
        .statuses
        .PUBLISHED &&
    value !==
      FMR_V3_STAGING_ARCHIVE
        .statuses
        .VOIDED
  );
}

function archivedStagingStatusFmrV3_(
  status
) {
  return (
    normalizeUpperFmrV3_(
      status
    ) ===
    FMR_V3_STAGING_ARCHIVE
      .statuses
      .ARCHIVED
  );
}

function stagingActiveLineCountsFmrV3_() {
  const counts = {};

  getUsedRowsFmrV3_(
    FMR_V3.SHEETS
      .STAGING_LINES
  ).forEach(
    function (
      line
    ) {
      const status =
        normalizeUpperFmrV3_(
          line.Status
        );

      if (
        [
          'SUPERSEDED',
          'VOIDED'
        ].includes(
          status
        )
      ) {
        return;
      }

      const id =
        normalizeFmrV3_(
          line.Staging_FMR_ID
        );

      if (!id) {
        return;
      }

      counts[id] =
        numberFmrV3_(
          counts[id]
        ) +
        1;
    }
  );

  return counts;
}

function serializeStagingWorkspaceItemFmrV3_(
  row,
  lineCounts
) {
  const id =
    normalizeFmrV3_(
      row.Staging_FMR_ID
    );

  return {
    stagingFmrId:
      id,

    officialFmrNumber:
      normalizeFmrV3_(
        row.Official_FMR_Number
      ),

    iwpNumber:
      normalizeFmrV3_(
        row.IWP_Number
      ),

    sourceFileName:
      normalizeFmrV3_(
        row.Source_File_Name
      ),

    status:
      normalizeUpperFmrV3_(
        row.Status
      ),

    lineCount:
      numberFmrV3_(
        lineCounts[
          id
        ]
      ),

    updatedAt:
      formatDateTimeFmrV3_(
        row.Updated_At
      ),

    validationErrors:
      normalizeFmrV3_(
        row.Validation_Errors
      )
  };
}

function getOwnerStagingWorkspaceFmrV3_(
  userEmail,
  maximumRows
) {
  assertOwnerFmrV3_(
    userEmail
  );

  const limit =
    Math.max(
      1,
      Math.min(
        500,
        numberFmrV3_(
          maximumRows
        ) ||
        100
      )
    );

  const lineCounts =
    stagingActiveLineCountsFmrV3_();

  const rows =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .STAGING_HEADERS
    ).sort(
      function (
        left,
        right
      ) {
        return (
          new Date(
            right.Updated_At ||
            0
          ).getTime() -
          new Date(
            left.Updated_At ||
            0
          ).getTime()
        );
      }
    );

  const active =
    rows
      .filter(
        function (
          row
        ) {
          return activeStagingStatusFmrV3_(
            row.Status
          );
        }
      )
      .slice(
        0,
        limit
      )
      .map(
        function (
          row
        ) {
          return serializeStagingWorkspaceItemFmrV3_(
            row,
            lineCounts
          );
        }
      );

  const archived =
    rows
      .filter(
        function (
          row
        ) {
          return archivedStagingStatusFmrV3_(
            row.Status
          );
        }
      )
      .slice(
        0,
        limit
      )
      .map(
        function (
          row
        ) {
          return serializeStagingWorkspaceItemFmrV3_(
            row,
            lineCounts
          );
        }
      );

  return {
    generatedAt:
      formatDateTimeFmrV3_(
        nowFmrV3_()
      ),

    activeCount:
      active.length,

    archivedCount:
      archived.length,

    active:
      active,

    archived:
      archived,

    policy: {
      archiveMode:
        FMR_V3_STAGING_ARCHIVE
          .contract
          .archiveMode,

      restoreMode:
        FMR_V3_STAGING_ARCHIVE
          .contract
          .restoreMode,

      publicationPolicy:
        FMR_V3_STAGING_ARCHIVE
          .contract
          .publicationPolicy
    }
  };
}

function requireStagingReasonFmrV3_(
  reason,
  label
) {
  const value =
    normalizeFmrV3_(
      reason
    );

  if (
    value.length <
    3
  ) {
    throw new Error(
      (
        (label || 'Reason') +
        ' must contain at least 3 characters.'
      )
    );
  }

  return value;
}

function otherActiveStagingForNumberFmrV3_(
  officialFmrNumber,
  excludedStagingFmrId
) {
  const number =
    normalizeUpperFmrV3_(
      officialFmrNumber
    );

  const excluded =
    normalizeFmrV3_(
      excludedStagingFmrId
    );

  if (!number) {
    return [];
  }

  return getUsedRowsFmrV3_(
    FMR_V3.SHEETS
      .STAGING_HEADERS
  ).filter(
    function (
      row
    ) {
      return (
        normalizeFmrV3_(
          row.Staging_FMR_ID
        ) !==
          excluded &&
        normalizeUpperFmrV3_(
          row.Official_FMR_Number
        ) ===
          number &&
        activeStagingStatusFmrV3_(
          row.Status
        )
      );
    }
  );
}

function assertStagingActivationAllowedFmrV3_(
  stagingFmrId,
  officialFmrNumber
) {
  const duplicates =
    otherActiveStagingForNumberFmrV3_(
      officialFmrNumber,
      stagingFmrId
    );

  if (
    duplicates.length
  ) {
    throw new Error(
      (
        'Another active staging record already uses FMR ' +
        normalizeUpperFmrV3_(
          officialFmrNumber
        ) +
        '. Archive the obsolete active copy before restoring this record.'
      )
    );
  }

  return true;
}

function archiveStagedFmrFmrV3_(
  userEmail,
  stagingFmrId,
  reason
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

    const note =
      requireStagingReasonFmrV3_(
        reason,
        'Archive reason'
      );

    const header =
      stagingHeaderByIdFmrV3_(
        stagingFmrId
      );

    const status =
      normalizeUpperFmrV3_(
        header.Status
      );

    if (
      status ===
      FMR_V3_STAGING_ARCHIVE
        .statuses
        .ARCHIVED
    ) {
      throw new Error(
        'The staged FMR is already archived.'
      );
    }

    if (
      [
        FMR_V3_STAGING_ARCHIVE
          .statuses
          .PUBLISHED,
        FMR_V3_STAGING_ARCHIVE
          .statuses
          .VOIDED
      ].includes(
        status
      )
    ) {
      throw new Error(
        (
          'Only an unpublished active staging record can be archived. ' +
          'Current status: ' +
          status +
          '.'
        )
      );
    }

    const now =
      nowFmrV3_();

    updateRowObjectFmrV3_(
      FMR_V3.SHEETS
        .STAGING_HEADERS,
      header._rowNumber,
      {
        Status:
          FMR_V3_STAGING_ARCHIVE
            .statuses
            .ARCHIVED,

        Updated_At:
          now
      }
    );

    const correlationId =
      uuidFmrV3_(
        'CORR'
      );

    appendAuditFmrV3_(
      'STAGED_FMR',
      normalizeFmrV3_(
        header.Staging_FMR_ID
      ),
      FMR_V3_STAGING_ARCHIVE
        .auditActions
        .ARCHIVE,
      owner,
      correlationId,
      {
        sourceInterface:
          'OWNER',

        oldValue:
          status,

        newValue:
          FMR_V3_STAGING_ARCHIVE
            .statuses
            .ARCHIVED,

        notes:
          note,

        payload: {
          officialFmrNumber:
            normalizeFmrV3_(
              header.Official_FMR_Number
            ),

          iwpNumber:
            normalizeFmrV3_(
              header.IWP_Number
            ),

          reason:
            note
        }
      }
    );

    SpreadsheetApp.flush();

    return {
      success:
        true,

      stagingFmrId:
        normalizeFmrV3_(
          header.Staging_FMR_ID
        ),

      officialFmrNumber:
        normalizeFmrV3_(
          header.Official_FMR_Number
        ),

      previousStatus:
        status,

      status:
        FMR_V3_STAGING_ARCHIVE
          .statuses
          .ARCHIVED,

      correlationId:
        correlationId,

      message:
        (
          'Archived unpublished FMR ' +
          (
            normalizeFmrV3_(
              header.Official_FMR_Number
            ) ||
            normalizeFmrV3_(
              header.Staging_FMR_ID
            )
          ) +
          '.'
        )
    };
  } finally {
    lock.releaseLock();
  }
}

function restoreStagedFmrFmrV3_(
  userEmail,
  stagingFmrId,
  reason
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

    const note =
      requireStagingReasonFmrV3_(
        reason,
        'Restore reason'
      );

    const header =
      stagingHeaderByIdFmrV3_(
        stagingFmrId
      );

    const status =
      normalizeUpperFmrV3_(
        header.Status
      );

    if (
      status !==
      FMR_V3_STAGING_ARCHIVE
        .statuses
        .ARCHIVED
    ) {
      throw new Error(
        (
          'Only an archived staging record can be restored. ' +
          'Current status: ' +
          status +
          '.'
        )
      );
    }

    assertStagingActivationAllowedFmrV3_(
      header.Staging_FMR_ID,
      header.Official_FMR_Number
    );

    const nextStatus =
      normalizeFmrV3_(
        header.Validation_Errors
      )
        ? FMR_V3_STAGING_ARCHIVE
            .statuses
            .DRAFT_WITH_ERRORS
        : FMR_V3_STAGING_ARCHIVE
            .statuses
            .DRAFT;

    const now =
      nowFmrV3_();

    updateRowObjectFmrV3_(
      FMR_V3.SHEETS
        .STAGING_HEADERS,
      header._rowNumber,
      {
        Status:
          nextStatus,

        Updated_At:
          now
      }
    );

    const correlationId =
      uuidFmrV3_(
        'CORR'
      );

    appendAuditFmrV3_(
      'STAGED_FMR',
      normalizeFmrV3_(
        header.Staging_FMR_ID
      ),
      FMR_V3_STAGING_ARCHIVE
        .auditActions
        .RESTORE,
      owner,
      correlationId,
      {
        sourceInterface:
          'OWNER',

        oldValue:
          status,

        newValue:
          nextStatus,

        notes:
          note,

        payload: {
          officialFmrNumber:
            normalizeFmrV3_(
              header.Official_FMR_Number
            ),

          iwpNumber:
            normalizeFmrV3_(
              header.IWP_Number
            ),

          reason:
            note
        }
      }
    );

    SpreadsheetApp.flush();

    return {
      success:
        true,

      stagingFmrId:
        normalizeFmrV3_(
          header.Staging_FMR_ID
        ),

      officialFmrNumber:
        normalizeFmrV3_(
          header.Official_FMR_Number
        ),

      previousStatus:
        status,

      status:
        nextStatus,

      correlationId:
        correlationId,

      message:
        (
          'Restored unpublished FMR ' +
          (
            normalizeFmrV3_(
              header.Official_FMR_Number
            ) ||
            normalizeFmrV3_(
              header.Staging_FMR_ID
            )
          ) +
          ' to the active staging queue.'
        )
    };
  } finally {
    lock.releaseLock();
  }
}

function prepareStagingActivationForUpdateFmrV3_(
  stagingFmrId,
  officialFmrNumber
) {
  const id =
    normalizeFmrV3_(
      stagingFmrId
    );

  if (!id) {
    return {
      stagingFmrId:
        '',

      wasArchived:
        false,

      previousStatus:
        ''
    };
  }

  const header =
    stagingHeaderByIdFmrV3_(
      id
    );

  const wasArchived =
    archivedStagingStatusFmrV3_(
      header.Status
    );

  if (wasArchived) {
    assertStagingActivationAllowedFmrV3_(
      id,
      officialFmrNumber ||
      header.Official_FMR_Number
    );
  }

  return {
    stagingFmrId:
      id,

    wasArchived:
      wasArchived,

    previousStatus:
      normalizeUpperFmrV3_(
        header.Status
      ),

    officialFmrNumber:
      normalizeFmrV3_(
        officialFmrNumber ||
        header.Official_FMR_Number
      ),

    iwpNumber:
      normalizeFmrV3_(
        header.IWP_Number
      )
  };
}

function recordStagingActivationFromUpdateFmrV3_(
  userEmail,
  activation,
  reason,
  sourceInterface
) {
  const context =
    activation || {};

  if (
    !context.wasArchived
  ) {
    return null;
  }

  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const note =
    normalizeFmrV3_(
      reason
    ) ||
    'Archived staging record restored by an approved update.';

  const correlationId =
    uuidFmrV3_(
      'CORR'
    );

  appendAuditFmrV3_(
    'STAGED_FMR',
    context.stagingFmrId,
    FMR_V3_STAGING_ARCHIVE
      .auditActions
      .RESTORE,
    owner,
    correlationId,
    {
      sourceInterface:
        normalizeUpperFmrV3_(
          sourceInterface
        ) ||
        'OWNER',

      oldValue:
        context.previousStatus,

      newValue:
        FMR_V3_STAGING_ARCHIVE
          .statuses
          .DRAFT,

      notes:
        note,

      payload: {
        officialFmrNumber:
          context.officialFmrNumber,

        iwpNumber:
          context.iwpNumber,

        reason:
          note,

        restoredByUpdate:
          true
      }
    }
  );

  return {
    correlationId:
      correlationId,

    restored:
      true
  };
}

function publishStagedFmrAlpha20FmrV3_(
  userEmail,
  stagingFmrId
) {
  const header =
    stagingHeaderByIdFmrV3_(
      stagingFmrId
    );

  if (
    archivedStagingStatusFmrV3_(
      header.Status
    )
  ) {
    throw new Error(
      (
        'Archived staging records cannot be published. ' +
        'Restore this FMR to the active staging queue first.'
      )
    );
  }

  return publishStagedFmrFmrV3_(
    userEmail,
    stagingFmrId
  );
}

function inspectFmrV3StagingArchiveContract() {
  const rows =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .STAGING_HEADERS
    );

  const active =
    rows.filter(
      function (
        row
      ) {
        return activeStagingStatusFmrV3_(
          row.Status
        );
      }
    );

  const archived =
    rows.filter(
      function (
        row
      ) {
        return archivedStagingStatusFmrV3_(
          row.Status
        );
      }
    );

  const groups = {};

  active.forEach(
    function (
      row
    ) {
      const number =
        normalizeUpperFmrV3_(
          row.Official_FMR_Number
        );

      if (!number) {
        return;
      }

      if (!groups[number]) {
        groups[number] = [];
      }

      groups[number].push({
        stagingFmrId:
          normalizeFmrV3_(
            row.Staging_FMR_ID
          ),

        status:
          normalizeUpperFmrV3_(
            row.Status
          ),

        iwpNumber:
          normalizeFmrV3_(
            row.IWP_Number
          ),

        updatedAt:
          formatDateTimeFmrV3_(
            row.Updated_At
          )
      });
    }
  );

  const duplicates =
    Object.keys(
      groups
    )
      .filter(
        function (
          number
        ) {
          return (
            groups[number]
              .length >
            1
          );
        }
      )
      .map(
        function (
          number
        ) {
          return {
            officialFmrNumber:
              number,

            activeCount:
              groups[number]
                .length,

            records:
              groups[number]
          };
        }
      );

  const output = {
    passed:
      true,

    dataPassed:
      duplicates.length ===
        0,

    readOnly:
      true,

    version:
      FMR_V3.VERSION,

    archiveStatus:
      FMR_V3_STAGING_ARCHIVE
        .statuses
        .ARCHIVED,

    archiveMode:
      FMR_V3_STAGING_ARCHIVE
        .contract
        .archiveMode,

    restoreMode:
      FMR_V3_STAGING_ARCHIVE
        .contract
        .restoreMode,

    publicationPolicy:
      FMR_V3_STAGING_ARCHIVE
        .contract
        .publicationPolicy,

    workspaceMode:
      FMR_V3_STAGING_ARCHIVE
        .contract
        .workspaceMode,

    bulkRestageMode:
      FMR_V3_STAGING_ARCHIVE
        .contract
        .bulkRestageMode,

    activeCount:
      active.length,

    archivedCount:
      archived.length,

    duplicateActiveOfficialNumberCount:
      duplicates.length,

    duplicateActiveOfficialNumbers:
      duplicates
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  return output;
}

function runFmrV3StagingArchiveContractDiagnostic() {
  setFmrV3DatabaseContext_(
    FMR_V3_DATABASE_ID_ ||
    FMR_V3.DEFAULT_DATABASE_ID
  );

  return inspectFmrV3StagingArchiveContract();
}
