/**
 * FMR Operations v3
 * Duplicate FMR Purge Maintenance v2
 *
 * PURPOSE
 * -------
 * Retire a confirmed duplicate published FMR from the live operational dataset,
 * including its invalid field transactions, Bag & Tag records, Backorders,
 * Field notifications, search/operational index entries, and KPI contribution.
 *
 * This version is intentionally configured for:
 *
 *   DUPLICATE FMR: 562
 *   CANONICAL FMR: 44
 *
 * Production data shows:
 * - FMR 44 and FMR 562 share ISO LP131-PV-380003|7.
 * - FMR 562 repeats all 8 material lines currently on FMR 44.
 * - FMR 562 has one additional line:
 *     Line 1
 *     Commodity 5717202L1
 *     PIPE SCH 40 316L SS CL150 RF PTFE LINED
 *     Size 4
 *     Qty 6.5 LF
 * - That additional line is explicitly approved to be discarded because it
 *   should not have been published yet (no spool number assigned).
 *
 * SAFETY MODEL
 * ------------
 * 1. Uses the EXPLICIT production spreadsheet ID, not FMR_V3.DEFAULT_DATABASE_ID.
 * 2. Verifies the spreadsheet ID and spreadsheet name before doing anything.
 * 3. PREVIEW performs zero writes.
 * 4. The duplicate/canonical relationship is explicit. It does not select a
 *    survivor automatically just because an ISO matches.
 * 5. Every canonical material line must exist on the duplicate FMR.
 * 6. Any target-only line must match an explicitly approved discard rule.
 * 7. A full database backup is created before APPLY.
 * 8. Every affected live row is copied to Duplicate_FMR_Purge_Archive.
 * 9. Rows are cleared/deactivated instead of deleteRow() so unrelated indexed
 *    row numbers do not shift.
 * 10. Audit_Log is preserved.
 * 11. Header and line tombstones are retained, inactive, with all KPI quantity
 *     fields zeroed so Dashboard totals are corrected.
 *
 * IMPORTANT
 * ---------
 * This script is for CONFIRMED INVALID DUPLICATE ACTIVITY.
 * Do not use it to move legitimate field activity from one FMR to another.
 */

const DUP_FMR_PURGE_V2 = Object.freeze({
  PRODUCTION_DATABASE_ID:
    '1dB9drNelT2D9OCy6tUyzGrqta4CBFC6P-x2WTlCLb4E',

  EXPECTED_DATABASE_NAME:
    'FMR Operations Database v3 - PRODUCTION',

  TARGETS: Object.freeze([
    Object.freeze({
      duplicateFmrNumber:
        '562',

      canonicalFmrNumber:
        '44',

      /**
       * FMR 562 line 1 is intentionally NOT required to exist on FMR 44.
       * It is approved for discard because it should not have been published
       * before a spool number was assigned.
       *
       * We match the actual material fingerprint rather than trusting only the
       * line number.
       */
      allowedTargetOnlyLines:
        Object.freeze([
          Object.freeze({
            lineNumber:
              '1',

            isoKey:
              'LP131-PV-380003|7',

            commodityCode:
              '5717202L1',

            size:
              '4',

            uom:
              'LF',

            qtyRequested:
              6.5,

            descriptionContains:
              'PIPE SCH 40 316L SS CL150 RF PTFE LINED',

            reason:
              'No spool number assigned; this material must not be published yet.'
          })
        ])
    })
  ]),

  REASON:
    'Confirmed duplicate FMR publication. Duplicate material/activity removed from live operations.',

  /**
   * FMR 562 contains test/duplicate transactions and reversals that are intended
   * to disappear from the live transaction ledger.
   */
  TRANSACTION_POLICY:
    'ARCHIVE_AND_REMOVE',

  /**
   * APPLY remains impossible until you deliberately change CHANGE_ME to the
   * exact required phrase after reviewing previewDuplicateFmrPurgeV2().
   */
  APPLY_CONFIRMATION:
    'CHANGE_ME',

  REQUIRED_APPLY_CONFIRMATION:
    'PURGE_CONFIRMED_DUPLICATE_FMRS',

  ARCHIVE_SHEET:
    'Duplicate_FMR_Purge_Archive',

  LOG_SHEET:
    'Duplicate_FMR_Purge_Log'
});


/* ========================================================================== */
/* PUBLIC ENTRY POINTS                                                        */
/* ========================================================================== */

/**
 * STEP 1 — RUN THIS FIRST.
 *
 * Makes ZERO changes.
 */
function previewDuplicateFmrPurgeV2() {
  dupFmrV2InitializeProductionContext_();

  const owner =
    dupFmrV2AssertOwner_();

  const plan =
    dupFmrV2BuildPlan_(
      owner
    );

  const output =
    dupFmrV2PublicPlan_(
      plan
    );

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  return output;
}


/**
 * STEP 2 — RUN ONLY AFTER PREVIEW RETURNS canApply=true.
 *
 * Before running, change:
 *
 *   APPLY_CONFIRMATION: 'CHANGE_ME'
 *
 * to:
 *
 *   APPLY_CONFIRMATION: 'PURGE_CONFIRMED_DUPLICATE_FMRS'
 */
function applyDuplicateFmrPurgeV2() {
  dupFmrV2InitializeProductionContext_();

  const owner =
    dupFmrV2AssertOwner_();

  if (
    DUP_FMR_PURGE_V2
      .APPLY_CONFIRMATION !==
    DUP_FMR_PURGE_V2
      .REQUIRED_APPLY_CONFIRMATION
  ) {
    throw new Error(
      'APPLY blocked. Set APPLY_CONFIRMATION to "' +
      DUP_FMR_PURGE_V2.REQUIRED_APPLY_CONFIRMATION +
      '" only after previewDuplicateFmrPurgeV2() returns canApply=true.'
    );
  }

  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    30000
  );

  const runId =
    uuidFmrV3_(
      'DUPPURGE'
    );

  try {
    /**
     * Re-assert the exact production context after acquiring the lock.
     */
    dupFmrV2InitializeProductionContext_();

    /**
     * Rebuild the plan under the lock. APPLY never trusts a stale preview.
     */
    const plan =
      dupFmrV2BuildPlan_(
        owner
      );

    if (
      !plan.canApply
    ) {
      throw new Error(
        'APPLY blocked by safety checks:\n- ' +
        plan.blockedReasons.join(
          '\n- '
        )
      );
    }

    /**
     * Existing FMR Operations backup service.
     * A failed backup stops the purge.
     */
    const backup =
      createDatabaseBackupFmrV3_(
        owner.email,
        'RECOVERY',
        'Pre-purge backup for ' +
          runId +
          '. Duplicate FMR(s): ' +
          plan.targetFmrNumbers.join(', ') +
          '. Canonical FMR(s): ' +
          plan.canonicalFmrNumbers.join(', ')
      );

    const backupId =
      normalizeFmrV3_(
        (
          backup &&
          (
            backup.backupId ||
            backup.Backup_ID ||
            backup.id
          )
        ) ||
        ''
      );

    const archiveSheet =
      dupFmrV2EnsureArchiveSheet_();

    const logSheet =
      dupFmrV2EnsureLogSheet_();

    const performedAt =
      nowFmrV3_();

    const dashboardBefore =
      dupFmrV2DashboardSnapshot_();

    /**
     * Capture canonical state before making any changes. Verification will
     * assert that the canonical FMR was not changed by this maintenance run.
     */
    const canonicalBefore =
      plan.items.map(
        function (item) {
          return dupFmrV2CanonicalSnapshot_(
            item
          );
        }
      );

    /**
     * Archive all live rows that will be changed/cleared.
     */
    const archiveRows = [];

    plan.items.forEach(
      function (item) {
        dupFmrV2CollectArchiveRows_(
          archiveRows,
          runId,
          item,
          owner,
          performedAt
        );
      }
    );

    dupFmrV2AppendArchiveRows_(
      archiveSheet,
      archiveRows
    );

    /**
     * Apply each target purge.
     */
    const results =
      plan.items.map(
        function (item) {
          return dupFmrV2ApplyOne_(
            item,
            owner,
            runId,
            backupId
          );
        }
      );

    SpreadsheetApp.flush();

    const dashboardAfter =
      dupFmrV2DashboardSnapshot_();

    const verification =
      dupFmrV2Verify_(
        plan,
        canonicalBefore
      );

    if (
      !verification.passed
    ) {
      throw new Error(
        'Post-purge verification FAILED. ' +
        'Do not perform additional maintenance. ' +
        'Use backup ' +
        backupId +
        ' if rollback is required. ' +
        JSON.stringify(
          verification
        )
      );
    }

    dupFmrV2AppendLog_(
      logSheet,
      runId,
      plan,
      results,
      backupId,
      owner,
      performedAt,
      dashboardBefore,
      dashboardAfter,
      verification
    );

    const output = {
      success:
        true,

      runId:
        runId,

      backupId:
        backupId,

      owner:
        owner.email,

      databaseId:
        DUP_FMR_PURGE_V2
          .PRODUCTION_DATABASE_ID,

      targetFmrNumbers:
        plan.targetFmrNumbers,

      canonicalFmrNumbers:
        plan.canonicalFmrNumbers,

      transactionPolicy:
        DUP_FMR_PURGE_V2
          .TRANSACTION_POLICY,

      archivedRows:
        archiveRows.length,

      results:
        results,

      dashboardBefore:
        dashboardBefore,

      dashboardAfter:
        dashboardAfter,

      verification:
        verification
    };

    console.log(
      JSON.stringify(
        output,
        null,
        2
      )
    );

    return output;
  } finally {
    lock.releaseLock();
  }
}


/**
 * STEP 3 — OPTIONAL.
 *
 * Run after APPLY for a compact independent verification.
 */
function verifyDuplicateFmrPurgeV2() {
  dupFmrV2InitializeProductionContext_();

  const owner =
    dupFmrV2AssertOwner_();

  const plan =
    dupFmrV2BuildVerificationPlan_(
      owner
    );

  const output =
    dupFmrV2VerifyAfterApply_(
      plan
    );

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  return output;
}


/* ========================================================================== */
/* PRODUCTION CONTEXT / OWNER                                                 */
/* ========================================================================== */

function dupFmrV2InitializeProductionContext_() {
  const databaseId =
    normalizeFmrV3_(
      DUP_FMR_PURGE_V2
        .PRODUCTION_DATABASE_ID
    );

  if (
    !databaseId
  ) {
    throw new Error(
      'PRODUCTION_DATABASE_ID is required.'
    );
  }

  setFmrV3DatabaseContext_(
    databaseId
  );

  const spreadsheet =
    fmrV3Database_();

  const actualId =
    normalizeFmrV3_(
      spreadsheet.getId()
    );

  const actualName =
    normalizeFmrV3_(
      spreadsheet.getName()
    );

  if (
    actualId !==
    databaseId
  ) {
    throw new Error(
      'STOP: database context mismatch. Expected ' +
      databaseId +
      ', found ' +
      actualId +
      '.'
    );
  }

  if (
    actualName !==
    DUP_FMR_PURGE_V2
      .EXPECTED_DATABASE_NAME
  ) {
    throw new Error(
      'STOP: expected production spreadsheet "' +
      DUP_FMR_PURGE_V2.EXPECTED_DATABASE_NAME +
      '", found "' +
      actualName +
      '".'
    );
  }

  return {
    databaseId:
      actualId,

    databaseName:
      actualName
  };
}


function dupFmrV2AssertOwner_() {
  const email =
    normalizeEmailFmrV3_(
      Session
        .getEffectiveUser()
        .getEmail() ||
      Session
        .getActiveUser()
        .getEmail()
    );

  if (
    !email
  ) {
    throw new Error(
      'Unable to resolve the effective user email.'
    );
  }

  return assertOwnerFmrV3_(
    email
  );
}


/* ========================================================================== */
/* PLAN / MATERIAL COMPARISON                                                 */
/* ========================================================================== */

function dupFmrV2TargetConfigs_() {
  const configs =
    Array.from(
      DUP_FMR_PURGE_V2
        .TARGETS ||
      []
    );

  if (
    !configs.length
  ) {
    throw new Error(
      'TARGETS is empty.'
    );
  }

  const duplicateSet =
    new Set();

  configs.forEach(
    function (config) {
      const duplicate =
        normalizeFmrV3_(
          config.duplicateFmrNumber
        );

      const canonical =
        normalizeFmrV3_(
          config.canonicalFmrNumber
        );

      if (
        !duplicate ||
        !canonical
      ) {
        throw new Error(
          'Every target must define duplicateFmrNumber and canonicalFmrNumber.'
        );
      }

      if (
        duplicate ===
        canonical
      ) {
        throw new Error(
          'Duplicate FMR and canonical FMR cannot be the same: ' +
          duplicate
        );
      }

      if (
        duplicateSet.has(
          duplicate
        )
      ) {
        throw new Error(
          'Duplicate target configured more than once: ' +
          duplicate
        );
      }

      duplicateSet.add(
        duplicate
      );
    }
  );

  return configs;
}


function dupFmrV2BuildPlan_(
  owner
) {
  const configs =
    dupFmrV2TargetConfigs_();

  const headers =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.HEADERS
    );

  const lines =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.LINES
    );

  const transactions =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.TRANSACTIONS
    );

  const bagHeaders =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.BAG_HEADERS
    );

  const bagItems =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.BAG_ITEMS
    );

  const backorders =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.BACKORDERS
    );

  const searchIndex =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX
    );

  const operationalIndex =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.OPERATIONAL_INDEX
    );

  const fieldNotices =
    fieldNoticeRowsFmrV3_();

  const blockedReasons = [];
  const items = [];

  configs.forEach(
    function (config) {
      const duplicateNumber =
        normalizeFmrV3_(
          config.duplicateFmrNumber
        );

      const canonicalNumber =
        normalizeFmrV3_(
          config.canonicalFmrNumber
        );

      const duplicateHeaders =
        headers.filter(
          function (row) {
            return (
              normalizeFmrV3_(
                row.FMR_Number
              ) ===
              duplicateNumber
            );
          }
        );

      const canonicalHeaders =
        headers.filter(
          function (row) {
            return (
              normalizeFmrV3_(
                row.FMR_Number
              ) ===
              canonicalNumber
            );
          }
        );

      const duplicateActiveHeaders =
        duplicateHeaders.filter(
          function (row) {
            return yesFmrV3_(
              row.Active
            );
          }
        );

      const canonicalActiveHeaders =
        canonicalHeaders.filter(
          function (row) {
            return yesFmrV3_(
              row.Active
            );
          }
        );

      if (
        duplicateHeaders.length !==
        1
      ) {
        blockedReasons.push(
          'Duplicate FMR ' +
          duplicateNumber +
          ' has ' +
          duplicateHeaders.length +
          ' header row(s); expected exactly 1.'
        );
      }

      if (
        duplicateActiveHeaders.length !==
        1
      ) {
        blockedReasons.push(
          'Duplicate FMR ' +
          duplicateNumber +
          ' has ' +
          duplicateActiveHeaders.length +
          ' active header row(s); expected exactly 1.'
        );
      }

      if (
        canonicalHeaders.length !==
        1
      ) {
        blockedReasons.push(
          'Canonical FMR ' +
          canonicalNumber +
          ' has ' +
          canonicalHeaders.length +
          ' header row(s); expected exactly 1.'
        );
      }

      if (
        canonicalActiveHeaders.length !==
        1
      ) {
        blockedReasons.push(
          'Canonical FMR ' +
          canonicalNumber +
          ' has ' +
          canonicalActiveHeaders.length +
          ' active header row(s); expected exactly 1.'
        );
      }

      const duplicateHeader =
        duplicateHeaders[0] ||
        {};

      const canonicalHeader =
        canonicalHeaders[0] ||
        {};

      const duplicateFmrId =
        normalizeFmrV3_(
          duplicateHeader.FMR_ID
        );

      const canonicalFmrId =
        normalizeFmrV3_(
          canonicalHeader.FMR_ID
        );

      const duplicateLines =
        lines.filter(
          function (line) {
            return (
              normalizeFmrV3_(
                line.FMR_Number
              ) ===
                duplicateNumber ||
              (
                duplicateFmrId &&
                normalizeFmrV3_(
                  line.FMR_ID
                ) ===
                  duplicateFmrId
              )
            );
          }
        );

      const canonicalLines =
        lines.filter(
          function (line) {
            return (
              normalizeFmrV3_(
                line.FMR_Number
              ) ===
                canonicalNumber ||
              (
                canonicalFmrId &&
                normalizeFmrV3_(
                  line.FMR_ID
                ) ===
                  canonicalFmrId
              )
            );
          }
        );

      const duplicateActiveLines =
        duplicateLines.filter(
          function (line) {
            return yesFmrV3_(
              line.Active
            );
          }
        );

      const canonicalActiveLines =
        canonicalLines.filter(
          function (line) {
            return yesFmrV3_(
              line.Active
            );
          }
        );

      if (
        !duplicateActiveLines.length
      ) {
        blockedReasons.push(
          'Duplicate FMR ' +
          duplicateNumber +
          ' has no active material lines.'
        );
      }

      if (
        !canonicalActiveLines.length
      ) {
        blockedReasons.push(
          'Canonical FMR ' +
          canonicalNumber +
          ' has no active material lines.'
        );
      }

      /**
       * Require the same ISO set. This pair is intended to represent the same
       * ISO publication, with only explicitly-approved target-only material.
       */
      const duplicateIsoKeys =
        dupFmrV2IsoKeys_(
          duplicateActiveLines
        );

      const canonicalIsoKeys =
        dupFmrV2IsoKeys_(
          canonicalActiveLines
        );

      if (
        JSON.stringify(
          duplicateIsoKeys
        ) !==
        JSON.stringify(
          canonicalIsoKeys
        )
      ) {
        blockedReasons.push(
          'FMR ' +
          duplicateNumber +
          ' and canonical FMR ' +
          canonicalNumber +
          ' do not have the same ISO_Key set. Duplicate=' +
          JSON.stringify(
            duplicateIsoKeys
          ) +
          ', canonical=' +
          JSON.stringify(
            canonicalIsoKeys
          )
        );
      }

      const comparison =
        dupFmrV2CompareMaterialLines_(
          duplicateActiveLines,
          canonicalActiveLines,
          config.allowedTargetOnlyLines ||
            []
        );

      if (
        comparison.canonicalOnly.length
      ) {
        blockedReasons.push(
          'FMR ' +
          duplicateNumber +
          ' does not contain every canonical material line from FMR ' +
          canonicalNumber +
          '. Missing canonical lines: ' +
          JSON.stringify(
            comparison.canonicalOnly
          )
        );
      }

      if (
        comparison.unapprovedTargetOnly.length
      ) {
        blockedReasons.push(
          'FMR ' +
          duplicateNumber +
          ' contains target-only material that is not explicitly approved for discard: ' +
          JSON.stringify(
            comparison.unapprovedTargetOnly
          )
        );
      }

      if (
        comparison.matchedCount !==
        canonicalActiveLines.length
      ) {
        blockedReasons.push(
          'FMR ' +
          duplicateNumber +
          ' matched ' +
          comparison.matchedCount +
          ' canonical line(s), but canonical FMR ' +
          canonicalNumber +
          ' has ' +
          canonicalActiveLines.length +
          ' active line(s).'
        );
      }

      const duplicateLineIds =
        new Set(
          duplicateLines
            .map(
              function (line) {
                return normalizeFmrV3_(
                  line.FMR_Line_ID
                );
              }
            )
            .filter(Boolean)
        );

      const duplicateTransactions =
        transactions.filter(
          function (row) {
            return (
              normalizeFmrV3_(
                row.FMR_Number
              ) ===
                duplicateNumber ||
              (
                duplicateFmrId &&
                normalizeFmrV3_(
                  row.FMR_ID
                ) ===
                  duplicateFmrId
              ) ||
              duplicateLineIds.has(
                normalizeFmrV3_(
                  row.FMR_Line_ID
                )
              )
            );
          }
        );

      if (
        duplicateTransactions.length &&
        normalizeUpperFmrV3_(
          DUP_FMR_PURGE_V2
            .TRANSACTION_POLICY
        ) !==
          'ARCHIVE_AND_REMOVE'
      ) {
        blockedReasons.push(
          'FMR ' +
          duplicateNumber +
          ' has ' +
          duplicateTransactions.length +
          ' Material_Transactions row(s). TRANSACTION_POLICY must be ARCHIVE_AND_REMOVE for this confirmed duplicate purge.'
        );
      }

      const duplicateBagHeaders =
        bagHeaders.filter(
          function (row) {
            return (
              normalizeFmrV3_(
                row.FMR_Number
              ) ===
                duplicateNumber ||
              (
                duplicateFmrId &&
                normalizeFmrV3_(
                  row.FMR_ID
                ) ===
                  duplicateFmrId
              )
            );
          }
        );

      const duplicateBagIds =
        new Set(
          duplicateBagHeaders
            .map(
              function (row) {
                return normalizeFmrV3_(
                  row.Bag_Tag_ID
                );
              }
            )
            .filter(Boolean)
        );

      const duplicateBagItems =
        bagItems.filter(
          function (row) {
            return (
              duplicateLineIds.has(
                normalizeFmrV3_(
                  row.FMR_Line_ID
                )
              ) ||
              duplicateBagIds.has(
                normalizeFmrV3_(
                  row.Bag_Tag_ID
                )
              )
            );
          }
        );

      const duplicateBackorders =
        backorders.filter(
          function (row) {
            return (
              normalizeFmrV3_(
                row.FMR_Number
              ) ===
                duplicateNumber ||
              (
                duplicateFmrId &&
                normalizeFmrV3_(
                  row.FMR_ID
                ) ===
                  duplicateFmrId
              ) ||
              duplicateLineIds.has(
                normalizeFmrV3_(
                  row.FMR_Line_ID
                )
              )
            );
          }
        );

      const duplicateBackorderIds =
        new Set(
          duplicateBackorders
            .map(
              function (row) {
                return normalizeFmrV3_(
                  row.Backorder_Request_ID
                );
              }
            )
            .filter(Boolean)
        );

      const duplicateFieldNotices =
        fieldNotices.filter(
          function (row) {
            return (
              normalizeFmrV3_(
                row.FMR_Number
              ) ===
                duplicateNumber ||
              (
                duplicateFmrId &&
                normalizeFmrV3_(
                  row.FMR_ID
                ) ===
                  duplicateFmrId
              ) ||
              duplicateLineIds.has(
                normalizeFmrV3_(
                  row.FMR_Line_ID
                )
              ) ||
              duplicateBackorderIds.has(
                normalizeFmrV3_(
                  row.Source_ID
                )
              )
            );
          }
        );

      const relatedIds =
        new Set(
          [duplicateFmrId]
            .concat(
              Array.from(
                duplicateLineIds
              )
            )
            .concat(
              Array.from(
                duplicateBagIds
              )
            )
            .concat(
              Array.from(
                duplicateBackorderIds
              )
            )
            .filter(Boolean)
        );

      const duplicateSearchIndex =
        searchIndex.filter(
          function (entry) {
            return (
              (
                duplicateFmrId &&
                normalizeFmrV3_(
                  entry.FMR_ID
                ) ===
                  duplicateFmrId
              ) ||
              normalizeFmrV3_(
                entry.FMR_Number
              ) ===
                duplicateNumber ||
              duplicateLineIds.has(
                normalizeFmrV3_(
                  entry.FMR_Line_ID
                )
              )
            );
          }
        );

      const duplicateOperationalIndex =
        operationalIndex.filter(
          function (entry) {
            return (
              relatedIds.has(
                normalizeFmrV3_(
                  entry.Entity_ID
                )
              ) ||
              relatedIds.has(
                normalizeFmrV3_(
                  entry.Parent_ID
                )
              )
            );
          }
        );

      items.push({
        config:
          config,

        duplicateFmrNumber:
          duplicateNumber,

        canonicalFmrNumber:
          canonicalNumber,

        duplicateFmrId:
          duplicateFmrId,

        canonicalFmrId:
          canonicalFmrId,

        duplicateHeader:
          duplicateHeader,

        canonicalHeader:
          canonicalHeader,

        duplicateLines:
          duplicateLines,

        canonicalLines:
          canonicalLines,

        duplicateTransactions:
          duplicateTransactions,

        duplicateBagHeaders:
          duplicateBagHeaders,

        duplicateBagItems:
          duplicateBagItems,

        duplicateBackorders:
          duplicateBackorders,

        duplicateFieldNotices:
          duplicateFieldNotices,

        duplicateSearchIndex:
          duplicateSearchIndex,

        duplicateOperationalIndex:
          duplicateOperationalIndex,

        comparison:
          comparison,

        transactionSummary:
          dupFmrV2TransactionSummary_(
            duplicateTransactions
          ),

        kpiImpact:
          dupFmrV2KpiImpact_(
            duplicateHeader,
            duplicateLines
          )
      });
    }
  );

  return {
    owner:
      owner.email,

    databaseId:
      DUP_FMR_PURGE_V2
        .PRODUCTION_DATABASE_ID,

    targetFmrNumbers:
      items.map(
        function (item) {
          return item.duplicateFmrNumber;
        }
      ),

    canonicalFmrNumbers:
      items.map(
        function (item) {
          return item.canonicalFmrNumber;
        }
      ),

    canApply:
      blockedReasons.length ===
      0,

    blockedReasons:
      blockedReasons,

    items:
      items
  };
}


function dupFmrV2PublicPlan_(
  plan
) {
  return {
    mode:
      'PREVIEW_ONLY',

    coreVersion:
      FMR_V3.VERSION,

    databaseId:
      plan.databaseId,

    databaseName:
      DUP_FMR_PURGE_V2
        .EXPECTED_DATABASE_NAME,

    owner:
      plan.owner,

    transactionPolicy:
      DUP_FMR_PURGE_V2
        .TRANSACTION_POLICY,

    canApply:
      plan.canApply,

    blockedReasons:
      plan.blockedReasons,

    fmrs:
      plan.items.map(
        function (item) {
          return {
            duplicateFmrNumber:
              item.duplicateFmrNumber,

            canonicalFmrNumber:
              item.canonicalFmrNumber,

            duplicateFmrId:
              item.duplicateFmrId,

            canonicalFmrId:
              item.canonicalFmrId,

            duplicateActive:
              yesFmrV3_(
                item.duplicateHeader.Active
              ),

            canonicalActive:
              yesFmrV3_(
                item.canonicalHeader.Active
              ),

            duplicateStatus:
              normalizeFmrV3_(
                item.duplicateHeader.Current_Status
              ),

            canonicalStatus:
              normalizeFmrV3_(
                item.canonicalHeader.Current_Status
              ),

            comparison:
              item.comparison,

            counts:
              dupFmrV2Counts_(
                item
              ),

            transactionSummary:
              item.transactionSummary,

            kpiImpact:
              item.kpiImpact
          };
        }
      )
  };
}


function dupFmrV2IsoKeys_(
  lines
) {
  return Array.from(
    new Set(
      (
        lines ||
        []
      )
        .map(
          function (line) {
            return normalizeUpperFmrV3_(
              line.ISO_Key
            );
          }
        )
        .filter(Boolean)
    )
  ).sort();
}


function dupFmrV2CompareMaterialLines_(
  duplicateLines,
  canonicalLines,
  allowedTargetOnlyRules
) {
  const duplicateRemaining =
    duplicateLines
      .map(
        function (line) {
          return {
            line:
              line,
            fingerprint:
              dupFmrV2MaterialFingerprint_(
                line
              ),
            matched:
              false
          };
        }
      );

  const canonicalOnly = [];
  let matchedCount = 0;

  canonicalLines.forEach(
    function (canonicalLine) {
      const fingerprint =
        dupFmrV2MaterialFingerprint_(
          canonicalLine
        );

      const match =
        duplicateRemaining.find(
          function (candidate) {
            return (
              !candidate.matched &&
              candidate.fingerprint ===
                fingerprint
            );
          }
        );

      if (
        match
      ) {
        match.matched =
          true;

        matchedCount +=
          1;
      } else {
        canonicalOnly.push(
          dupFmrV2MaterialSummary_(
            canonicalLine
          )
        );
      }
    }
  );

  const targetOnlyLines =
    duplicateRemaining
      .filter(
        function (candidate) {
          return !candidate.matched;
        }
      )
      .map(
        function (candidate) {
          return candidate.line;
        }
      );

  const approvedTargetOnly = [];
  const unapprovedTargetOnly = [];

  targetOnlyLines.forEach(
    function (line) {
      const matchedRule =
        (
          allowedTargetOnlyRules ||
          []
        ).find(
          function (rule) {
            return dupFmrV2LineMatchesDiscardRule_(
              line,
              rule
            );
          }
        );

      const summary =
        dupFmrV2MaterialSummary_(
          line
        );

      if (
        matchedRule
      ) {
        summary.discardReason =
          normalizeFmrV3_(
            matchedRule.reason
          );

        approvedTargetOnly.push(
          summary
        );
      } else {
        unapprovedTargetOnly.push(
          summary
        );
      }
    }
  );

  let classification =
    'EXACT_DUPLICATE';

  if (
    unapprovedTargetOnly.length ||
    canonicalOnly.length
  ) {
    classification =
      'MISMATCH_BLOCKED';
  } else if (
    approvedTargetOnly.length
  ) {
    classification =
      'TARGET_SUPERSET_APPROVED_EXTRA';
  }

  return {
    classification:
      classification,

    matchedCount:
      matchedCount,

    canonicalLineCount:
      canonicalLines.length,

    duplicateLineCount:
      duplicateLines.length,

    canonicalOnly:
      canonicalOnly,

    approvedTargetOnly:
      approvedTargetOnly,

    unapprovedTargetOnly:
      unapprovedTargetOnly
  };
}


function dupFmrV2MaterialFingerprint_(
  line
) {
  return [
    normalizeUpperFmrV3_(
      line.ISO_Key
    ),
    normalizeUpperFmrV3_(
      line.Commodity_Code
    ),
    normalizeUpperFmrV3_(
      line.Size
    ),
    dupFmrV2NormalizeDescription_(
      (line.Material_Description || line.Description)
    ),
    dupFmrV2QuantityKey_(
      line.Qty_Requested
    ),
    normalizeUpperFmrV3_(
      line.UOM
    )
  ].join(
    '||'
  );
}


function dupFmrV2NormalizeDescription_(
  value
) {
  return normalizeUpperFmrV3_(
    value
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


function dupFmrV2QuantityKey_(
  value
) {
  const number =
    numberFmrV3_(
      value
    );

  return String(
    Math.round(
      number *
      1000000
    ) /
    1000000
  );
}


function dupFmrV2LineMatchesDiscardRule_(
  line,
  rule
) {
  const expectedLineNumber =
    normalizeFmrV3_(
      rule.lineNumber
    );

  if (
    expectedLineNumber &&
    normalizeFmrV3_(
      line.Line_Number
    ) !==
      expectedLineNumber
  ) {
    return false;
  }

  const expectedIsoKey =
    normalizeUpperFmrV3_(
      rule.isoKey
    );

  if (
    expectedIsoKey &&
    normalizeUpperFmrV3_(
      line.ISO_Key
    ) !==
      expectedIsoKey
  ) {
    return false;
  }

  const expectedCommodity =
    normalizeUpperFmrV3_(
      rule.commodityCode
    );

  if (
    expectedCommodity &&
    normalizeUpperFmrV3_(
      line.Commodity_Code
    ) !==
      expectedCommodity
  ) {
    return false;
  }

  const expectedSize =
    normalizeUpperFmrV3_(
      rule.size
    );

  if (
    expectedSize &&
    normalizeUpperFmrV3_(
      line.Size
    ) !==
      expectedSize
  ) {
    return false;
  }

  const expectedUom =
    normalizeUpperFmrV3_(
      rule.uom
    );

  if (
    expectedUom &&
    normalizeUpperFmrV3_(
      line.UOM
    ) !==
      expectedUom
  ) {
    return false;
  }

  if (
    rule.qtyRequested !==
      undefined &&
    rule.qtyRequested !==
      null
  ) {
    const expectedQty =
      numberFmrV3_(
        rule.qtyRequested
      );

    const actualQty =
      numberFmrV3_(
        line.Qty_Requested
      );

    if (
      Math.abs(
        expectedQty -
        actualQty
      ) >
      0.000001
    ) {
      return false;
    }
  }

  const descriptionContains =
    dupFmrV2NormalizeDescription_(
      rule.descriptionContains
    );

  if (
    descriptionContains &&
    !dupFmrV2NormalizeDescription_(
      (line.Material_Description || line.Description)
    ).includes(
      descriptionContains
    )
  ) {
    return false;
  }

  return true;
}


function dupFmrV2MaterialSummary_(
  line
) {
  return {
    fmrLineId:
      normalizeFmrV3_(
        line.FMR_Line_ID
      ),

    lineNumber:
      normalizeFmrV3_(
        line.Line_Number
      ),

    isoKey:
      normalizeFmrV3_(
        line.ISO_Key
      ),

    commodityCode:
      normalizeFmrV3_(
        line.Commodity_Code
      ),

    size:
      normalizeFmrV3_(
        line.Size
      ),

    description:
      normalizeFmrV3_(
        line.Material_Description ||
        line.Description
      ),

    qtyRequested:
      numberFmrV3_(
        line.Qty_Requested
      ),

    uom:
      normalizeFmrV3_(
        line.UOM
      )
  };
}


function dupFmrV2Counts_(
  item
) {
  return {
    duplicateHeaders:
      item.duplicateHeader &&
      item.duplicateHeader._rowNumber
        ? 1
        : 0,

    duplicateLines:
      item.duplicateLines.length,

    canonicalLines:
      item.canonicalLines.length,

    transactions:
      item.duplicateTransactions.length,

    bagHeaders:
      item.duplicateBagHeaders.length,

    bagItems:
      item.duplicateBagItems.length,

    backorders:
      item.duplicateBackorders.length,

    fieldNotifications:
      item.duplicateFieldNotices.length,

    searchIndex:
      item.duplicateSearchIndex.length,

    operationalIndex:
      item.duplicateOperationalIndex.length
  };
}


function dupFmrV2TransactionSummary_(
  rows
) {
  const output = {};

  (
    rows ||
    []
  ).forEach(
    function (row) {
      const type =
        normalizeUpperFmrV3_(
          row.Transaction_Type
        ) ||
        'UNKNOWN';

      if (
        !output[type]
      ) {
        output[type] = {
          count:
            0,
          quantity:
            0
        };
      }

      output[type].count +=
        1;

      output[type].quantity +=
        numberFmrV3_(
          row.Quantity
        );
    }
  );

  return output;
}


function dupFmrV2KpiImpact_(
  header,
  lines
) {
  return {
    publishedFmrs:
      yesFmrV3_(
        header.Active
      )
        ? 1
        : 0,

    materialLines:
      (
        lines ||
        []
      ).filter(
        function (line) {
          return yesFmrV3_(
            line.Active
          );
        }
      ).length,

    requestedQty:
      numberFmrV3_(
        header.Qty_Requested
      ),

    locatedQty:
      numberFmrV3_(
        header.Qty_Confirmed_Located
      ),

    baggedQty:
      numberFmrV3_(
        header.Qty_Active_Bagged
      ),

    availableQty:
      numberFmrV3_(
        header.Qty_Available
      ),

    issuedQty:
      numberFmrV3_(
        header.Qty_Issued
      ),

    pendingBackorderQty:
      numberFmrV3_(
        header.Qty_Pending_Backorder
      ),

    confirmedBackorderQty:
      numberFmrV3_(
        header.Qty_Confirmed_Backorder
      ),

    remainingQty:
      numberFmrV3_(
        header.Qty_Remaining_Requirement
      )
  };
}


/* ========================================================================== */
/* APPLY                                                                      */
/* ========================================================================== */

function dupFmrV2ApplyOne_(
  item,
  owner,
  runId,
  backupId
) {
  const now =
    nowFmrV3_();

  const note =
    '[DUPLICATE FMR PURGE ' +
    runId +
    '] ' +
    DUP_FMR_PURGE_V2.REASON +
    ' Canonical FMR=' +
    item.canonicalFmrNumber +
    '.';

  /**
   * 1. Deactivate Search_Index entries.
   *
   * Do NOT delete physical rows because row numbers are referenced elsewhere.
   */
  item.duplicateSearchIndex.forEach(
    function (entry) {
      updateRowObjectFmrV3_(
        FMR_V3.SHEETS
          .SEARCH_INDEX,
        entry._rowNumber,
        {
          Active:
            FMR_V3.NO,
          Updated_At:
            now
        }
      );

      const key =
        normalizeUpperFmrV3_(
          entry.Search_Key
        );

      if (
        key
      ) {
        try {
          invalidateIndexKeyFmrV3_(
            FMR_V3.SHEETS
              .SEARCH_INDEX,
            key
          );
        } catch (
          ignored
        ) {}
      }
    }
  );

  /**
   * 2. Deactivate Operational_Index entries.
   */
  item.duplicateOperationalIndex.forEach(
    function (entry) {
      updateRowObjectFmrV3_(
        FMR_V3.SHEETS
          .OPERATIONAL_INDEX,
        entry._rowNumber,
        {
          Active:
            FMR_V3.NO,
          Updated_At:
            now
        }
      );

      const key =
        normalizeUpperFmrV3_(
          entry.Index_Key
        );

      if (
        key
      ) {
        try {
          invalidateIndexKeyFmrV3_(
            FMR_V3.SHEETS
              .OPERATIONAL_INDEX,
            key
          );
        } catch (
          ignored
        ) {}
      }
    }
  );

  /**
   * 3. Remove invalid duplicate Material_Transactions from the live ledger.
   *
   * They are already preserved in:
   * - the full pre-purge database backup;
   * - Duplicate_FMR_Purge_Archive.
   *
   * clearContent() preserves physical row numbers.
   */
  if (
    normalizeUpperFmrV3_(
      DUP_FMR_PURGE_V2
        .TRANSACTION_POLICY
    ) ===
      'ARCHIVE_AND_REMOVE'
  ) {
    dupFmrV2ClearStandardRows_(
      FMR_V3.SHEETS
        .TRANSACTIONS,
      item.duplicateTransactions
    );
  }

  /**
   * 4. Remove dependent live operational records.
   */
  dupFmrV2ClearStandardRows_(
    FMR_V3.SHEETS
      .BAG_ITEMS,
    item.duplicateBagItems
  );

  dupFmrV2ClearStandardRows_(
    FMR_V3.SHEETS
      .BAG_HEADERS,
    item.duplicateBagHeaders
  );

  dupFmrV2ClearStandardRows_(
    FMR_V3.SHEETS
      .BACKORDERS,
    item.duplicateBackorders
  );

  dupFmrV2ClearFieldNoticeRows_(
    item.duplicateFieldNotices
  );

  /**
   * 5. Preserve FMR_Line_ID identity as inactive tombstones while removing all
   * KPI/operational quantities from the live dataset.
   */
  item.duplicateLines.forEach(
    function (line) {
      updateRowObjectFmrV3_(
        FMR_V3.SHEETS.LINES,
        line._rowNumber,
        {
          Qty_Requested:
            0,

          Qty_Confirmed_Located:
            0,

          Qty_Active_Bagged:
            0,

          Qty_Available:
            0,

          Qty_Issued:
            0,

          Qty_Pending_Backorder:
            0,

          Qty_Confirmed_Backorder:
            0,

          Qty_Not_Yet_Located:
            0,

          Qty_Remaining_Requirement:
            0,

          Line_Status:
            'Cancelled',

          Active:
            FMR_V3.NO,

          Updated_By:
            owner.email,

          Updated_At:
            now,

          Notes:
            dupFmrV2AppendNote_(
              line.Notes,
              note
            )
        }
      );
    }
  );

  /**
   * 6. Zero the Header because Dashboard quantity KPIs SUM FMR_Header quantity
   * fields. Active=NO by itself is not sufficient.
   */
  updateRowObjectFmrV3_(
    FMR_V3.SHEETS.HEADERS,
    item.duplicateHeader._rowNumber,
    {
      Current_Status:
        'Cancelled',

      Total_Lines:
        0,

      Qty_Requested:
        0,

      Qty_Confirmed_Located:
        0,

      Qty_Active_Bagged:
        0,

      Qty_Available:
        0,

      Qty_Issued:
        0,

      Qty_Pending_Backorder:
        0,

      Qty_Confirmed_Backorder:
        0,

      Qty_Remaining_Requirement:
        0,

      Fulfillment_Pct:
        0,

      Active:
        FMR_V3.NO,

      Updated_By:
        owner.email,

      Updated_At:
        now,

      Last_Activity_At:
        now,

      Notes:
        dupFmrV2AppendNote_(
          item.duplicateHeader.Notes,
          note +
          (
            backupId
              ? ' Backup_ID=' +
                backupId
              : ''
          )
        )
    }
  );

  /**
   * 7. Preserve immutable audit history and append the maintenance action.
   */
  appendAuditFmrV3_(
    'FMR',
    item.duplicateFmrId ||
      item.duplicateFmrNumber,
    'DUPLICATE_FMR_PURGED',
    owner,
    runId,
    {
      sourceInterface:
        'OWNER_MAINTENANCE',

      notes:
        DUP_FMR_PURGE_V2
          .REASON,

      payload: {
        duplicateFmrNumber:
          item.duplicateFmrNumber,

        canonicalFmrNumber:
          item.canonicalFmrNumber,

        backupId:
          backupId,

        transactionPolicy:
          DUP_FMR_PURGE_V2
            .TRANSACTION_POLICY,

        materialComparison:
          item.comparison,

        counts:
          dupFmrV2Counts_(
            item
          )
      }
    }
  );

  return {
    duplicateFmrNumber:
      item.duplicateFmrNumber,

    canonicalFmrNumber:
      item.canonicalFmrNumber,

    duplicateFmrId:
      item.duplicateFmrId,

    status:
      'PURGED_FROM_OPERATIONAL_DATA',

    comparison:
      item.comparison,

    affected:
      dupFmrV2Counts_(
        item
      )
  };
}


/* ========================================================================== */
/* CLEAR HELPERS                                                              */
/* ========================================================================== */

function dupFmrV2ClearStandardRows_(
  sheetName,
  records
) {
  const rows =
    dupFmrV2RecordRowNumbers_(
      records
    );

  if (
    !rows.length
  ) {
    return;
  }

  const sheet =
    sheetFmrV3_(
      sheetName
    );

  const width =
    headerMapFmrV3_(
      sheetName
    )
      .headers
      .length;

  dupFmrV2ClearRowsByNumber_(
    sheet,
    width,
    rows
  );
}


function dupFmrV2ClearFieldNoticeRows_(
  records
) {
  const rows =
    dupFmrV2RecordRowNumbers_(
      records
    );

  if (
    !rows.length
  ) {
    return;
  }

  const sheet =
    ensureFieldNoticeSheetFmrV3_();

  const width =
    FMR_V3_FIELD_NOTICE
      .headers
      .length;

  dupFmrV2ClearRowsByNumber_(
    sheet,
    width,
    rows
  );
}


function dupFmrV2RecordRowNumbers_(
  records
) {
  return Array.from(
    new Set(
      (
        records ||
        []
      )
        .map(
          function (record) {
            return numberFmrV3_(
              record._rowNumber
            );
          }
        )
        .filter(
          function (row) {
            return row >=
              2;
          }
        )
    )
  ).sort(
    function (left, right) {
      return left -
        right;
    }
  );
}


function dupFmrV2ClearRowsByNumber_(
  sheet,
  width,
  rows
) {
  const groups = [];

  rows.forEach(
    function (row) {
      const current =
        groups.length
          ? groups[
              groups.length -
              1
            ]
          : null;

      if (
        current &&
        row ===
          current.end +
          1
      ) {
        current.end =
          row;
      } else {
        groups.push({
          start:
            row,
          end:
            row
        });
      }
    }
  );

  groups.forEach(
    function (group) {
      sheet
        .getRange(
          group.start,
          1,
          group.end -
            group.start +
            1,
          width
        )
        .clearContent();
    }
  );
}


function dupFmrV2AppendNote_(
  existing,
  addition
) {
  const before =
    normalizeFmrV3_(
      existing
    );

  const after =
    normalizeFmrV3_(
      addition
    );

  if (
    !before
  ) {
    return after;
  }

  if (
    !after
  ) {
    return before;
  }

  return (
    before +
    '\n' +
    after
  );
}


/* ========================================================================== */
/* ARCHIVE / LOG                                                              */
/* ========================================================================== */

function dupFmrV2EnsureArchiveSheet_() {
  return dupFmrV2EnsureSheet_(
    DUP_FMR_PURGE_V2
      .ARCHIVE_SHEET,
    [
      'Archive_ID',
      'Purge_Run_ID',
      'Duplicate_FMR_Number',
      'Canonical_FMR_Number',
      'FMR_ID',
      'Source_Sheet',
      'Original_Row_Number',
      'Record_JSON',
      'Archived_By',
      'Archived_At'
    ]
  );
}


function dupFmrV2EnsureLogSheet_() {
  return dupFmrV2EnsureSheet_(
    DUP_FMR_PURGE_V2
      .LOG_SHEET,
    [
      'Run_ID',
      'Duplicate_FMR_Number',
      'Canonical_FMR_Number',
      'FMR_ID',
      'Status',
      'Reason',
      'Backup_ID',
      'Line_Count',
      'Transaction_Count',
      'Bag_Header_Count',
      'Bag_Item_Count',
      'Backorder_Count',
      'Field_Notification_Count',
      'Search_Index_Count',
      'Operational_Index_Count',
      'Performed_By',
      'Performed_At',
      'Dashboard_Before_JSON',
      'Dashboard_After_JSON',
      'Verification_JSON',
      'Details_JSON'
    ]
  );
}


function dupFmrV2EnsureSheet_(
  sheetName,
  headers
) {
  const spreadsheet =
    fmrV3Database_();

  let sheet =
    spreadsheet.getSheetByName(
      sheetName
    );

  if (
    !sheet
  ) {
    sheet =
      spreadsheet.insertSheet(
        sheetName
      );
  }

  if (
    sheet.getMaxColumns() <
    headers.length
  ) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      headers.length -
        sheet.getMaxColumns()
    );
  }

  const current =
    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .getDisplayValues()[0];

  headers.forEach(
    function (header, index) {
      if (
        current[index] &&
        current[index] !==
          header
      ) {
        throw new Error(
          sheetName +
          ' header mismatch at column ' +
          (
            index +
            1
          ) +
          '. Expected "' +
          header +
          '", found "' +
          current[index] +
          '".'
        );
      }
    }
  );

  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([
      headers
    ]);

  sheet.setFrozenRows(
    1
  );

  return sheet;
}


function dupFmrV2CollectArchiveRows_(
  output,
  runId,
  item,
  owner,
  archivedAt
) {
  const sources = [
    {
      sheet:
        FMR_V3.SHEETS.HEADERS,
      rows:
        item.duplicateHeader &&
        item.duplicateHeader._rowNumber
          ? [
              item.duplicateHeader
            ]
          : []
    },
    {
      sheet:
        FMR_V3.SHEETS.LINES,
      rows:
        item.duplicateLines
    },
    {
      sheet:
        FMR_V3.SHEETS.TRANSACTIONS,
      rows:
        item.duplicateTransactions
    },
    {
      sheet:
        FMR_V3.SHEETS.BAG_HEADERS,
      rows:
        item.duplicateBagHeaders
    },
    {
      sheet:
        FMR_V3.SHEETS.BAG_ITEMS,
      rows:
        item.duplicateBagItems
    },
    {
      sheet:
        FMR_V3.SHEETS.BACKORDERS,
      rows:
        item.duplicateBackorders
    },
    {
      sheet:
        FMR_V3_FIELD_NOTICE
          .sheetName,
      rows:
        item.duplicateFieldNotices
    },
    {
      sheet:
        FMR_V3.SHEETS.SEARCH_INDEX,
      rows:
        item.duplicateSearchIndex
    },
    {
      sheet:
        FMR_V3.SHEETS.OPERATIONAL_INDEX,
      rows:
        item.duplicateOperationalIndex
    }
  ];

  sources.forEach(
    function (source) {
      source.rows.forEach(
        function (record) {
          const copy =
            Object.assign(
              {},
              record
            );

          delete copy._rowNumber;

          output.push([
            uuidFmrV3_(
              'ARCH'
            ),
            runId,
            item.duplicateFmrNumber,
            item.canonicalFmrNumber,
            item.duplicateFmrId,
            source.sheet,
            record._rowNumber,
            JSON.stringify(
              copy
            ),
            owner.email,
            archivedAt
          ]);
        }
      );
    }
  );
}


function dupFmrV2AppendArchiveRows_(
  sheet,
  rows
) {
  if (
    !rows.length
  ) {
    return;
  }

  const start =
    Math.max(
      2,
      sheet.getLastRow() +
        1
    );

  dupFmrV2EnsureGridCapacity_(
    sheet,
    start +
      rows.length -
      1,
    10
  );

  sheet
    .getRange(
      start,
      1,
      rows.length,
      10
    )
    .setValues(
      rows
    );
}


function dupFmrV2AppendLog_(
  sheet,
  runId,
  plan,
  results,
  backupId,
  owner,
  performedAt,
  before,
  after,
  verification
) {
  const rows =
    results.map(
      function (result) {
        const item =
          plan.items.find(
            function (candidate) {
              return (
                candidate
                  .duplicateFmrNumber ===
                result
                  .duplicateFmrNumber
              );
            }
          );

        const counts =
          dupFmrV2Counts_(
            item
          );

        return [
          runId,
          item.duplicateFmrNumber,
          item.canonicalFmrNumber,
          item.duplicateFmrId,
          result.status,
          DUP_FMR_PURGE_V2.REASON,
          backupId,
          counts.duplicateLines,
          counts.transactions,
          counts.bagHeaders,
          counts.bagItems,
          counts.backorders,
          counts.fieldNotifications,
          counts.searchIndex,
          counts.operationalIndex,
          owner.email,
          performedAt,
          JSON.stringify(
            before
          ),
          JSON.stringify(
            after
          ),
          JSON.stringify(
            verification
          ),
          JSON.stringify({
            comparison:
              item.comparison,
            transactionSummary:
              item.transactionSummary,
            kpiImpact:
              item.kpiImpact,
            transactionPolicy:
              DUP_FMR_PURGE_V2
                .TRANSACTION_POLICY
          })
        ];
      }
    );

  if (
    !rows.length
  ) {
    return;
  }

  const start =
    Math.max(
      2,
      sheet.getLastRow() +
        1
    );

  dupFmrV2EnsureGridCapacity_(
    sheet,
    start +
      rows.length -
      1,
    21
  );

  sheet
    .getRange(
      start,
      1,
      rows.length,
      21
    )
    .setValues(
      rows
    );
}


function dupFmrV2EnsureGridCapacity_(
  sheet,
  lastNeededRow,
  lastNeededColumn
) {
  if (
    sheet.getMaxRows() <
    lastNeededRow
  ) {
    sheet.insertRowsAfter(
      sheet.getMaxRows(),
      Math.max(
        lastNeededRow -
          sheet.getMaxRows(),
        100
      )
    );
  }

  if (
    sheet.getMaxColumns() <
    lastNeededColumn
  ) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      lastNeededColumn -
        sheet.getMaxColumns()
    );
  }
}


/* ========================================================================== */
/* CANONICAL SNAPSHOT / VERIFICATION                                          */
/* ========================================================================== */

function dupFmrV2CanonicalSnapshot_(
  item
) {
  return {
    fmrNumber:
      item.canonicalFmrNumber,

    header:
      dupFmrV2CanonicalHeaderSnapshot_(
        item.canonicalHeader
      ),

    lines:
      item.canonicalLines
        .filter(
          function (line) {
            return yesFmrV3_(
              line.Active
            );
          }
        )
        .map(
          function (line) {
            return dupFmrV2MaterialFingerprint_(
              line
            );
          }
        )
        .sort()
  };
}


function dupFmrV2CanonicalHeaderSnapshot_(
  header
) {
  return {
    fmrId:
      normalizeFmrV3_(
        header.FMR_ID
      ),

    fmrNumber:
      normalizeFmrV3_(
        header.FMR_Number
      ),

    status:
      normalizeFmrV3_(
        header.Current_Status
      ),

    totalLines:
      numberFmrV3_(
        header.Total_Lines
      ),

    requestedQty:
      numberFmrV3_(
        header.Qty_Requested
      ),

    locatedQty:
      numberFmrV3_(
        header.Qty_Confirmed_Located
      ),

    baggedQty:
      numberFmrV3_(
        header.Qty_Active_Bagged
      ),

    availableQty:
      numberFmrV3_(
        header.Qty_Available
      ),

    issuedQty:
      numberFmrV3_(
        header.Qty_Issued
      ),

    pendingBackorderQty:
      numberFmrV3_(
        header.Qty_Pending_Backorder
      ),

    confirmedBackorderQty:
      numberFmrV3_(
        header.Qty_Confirmed_Backorder
      ),

    remainingQty:
      numberFmrV3_(
        header.Qty_Remaining_Requirement
      ),

    active:
      yesFmrV3_(
        header.Active
      )
  };
}


function dupFmrV2Verify_(
  originalPlan,
  canonicalBefore
) {
  SpreadsheetApp.flush();

  const verificationPlan =
    dupFmrV2BuildVerificationPlan_(
      {
        email:
          originalPlan.owner
      }
    );

  const after =
    dupFmrV2VerifyAfterApply_(
      verificationPlan
    );

  const canonicalAfter =
    originalPlan.items.map(
      function (originalItem) {
        const verificationItem =
          verificationPlan.items.find(
            function (candidate) {
              return (
                candidate
                  .canonicalFmrNumber ===
                originalItem
                  .canonicalFmrNumber
              );
            }
          );

        return dupFmrV2CanonicalSnapshot_(
          verificationItem
        );
      }
    );

  const canonicalUnchanged =
    JSON.stringify(
      canonicalBefore
    ) ===
    JSON.stringify(
      canonicalAfter
    );

  return Object.assign(
    {},
    after,
    {
      canonicalUnchanged:
        canonicalUnchanged,

      canonicalBefore:
        canonicalBefore,

      canonicalAfter:
        canonicalAfter,

      passed:
        after.passed &&
        canonicalUnchanged
    }
  );
}


function dupFmrV2BuildVerificationPlan_(
  owner
) {
  const configs =
    dupFmrV2TargetConfigs_();

  const headers =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.HEADERS
    );

  const lines =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.LINES
    );

  const transactions =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.TRANSACTIONS
    );

  const bagHeaders =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.BAG_HEADERS
    );

  const bagItems =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.BAG_ITEMS
    );

  const backorders =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.BACKORDERS
    );

  const searchIndex =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX
    );

  const operationalIndex =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.OPERATIONAL_INDEX
    );

  const fieldNotices =
    fieldNoticeRowsFmrV3_();

  const items =
    configs.map(
      function (config) {
        const duplicateNumber =
          normalizeFmrV3_(
            config.duplicateFmrNumber
          );

        const canonicalNumber =
          normalizeFmrV3_(
            config.canonicalFmrNumber
          );

        const duplicateHeader =
          headers.find(
            function (row) {
              return (
                normalizeFmrV3_(
                  row.FMR_Number
                ) ===
                duplicateNumber
              );
            }
          ) ||
          {};

        const canonicalHeader =
          headers.find(
            function (row) {
              return (
                normalizeFmrV3_(
                  row.FMR_Number
                ) ===
                canonicalNumber
              );
            }
          ) ||
          {};

        const duplicateFmrId =
          normalizeFmrV3_(
            duplicateHeader.FMR_ID
          );

        const canonicalFmrId =
          normalizeFmrV3_(
            canonicalHeader.FMR_ID
          );

        const duplicateLines =
          lines.filter(
            function (line) {
              return (
                normalizeFmrV3_(
                  line.FMR_Number
                ) ===
                  duplicateNumber ||
                (
                  duplicateFmrId &&
                  normalizeFmrV3_(
                    line.FMR_ID
                  ) ===
                    duplicateFmrId
                )
              );
            }
          );

        const canonicalLines =
          lines.filter(
            function (line) {
              return (
                normalizeFmrV3_(
                  line.FMR_Number
                ) ===
                  canonicalNumber ||
                (
                  canonicalFmrId &&
                  normalizeFmrV3_(
                    line.FMR_ID
                  ) ===
                    canonicalFmrId
                )
              );
            }
          );

        const duplicateLineIds =
          new Set(
            duplicateLines
              .map(
                function (line) {
                  return normalizeFmrV3_(
                    line.FMR_Line_ID
                  );
                }
              )
              .filter(Boolean)
          );

        const duplicateTransactions =
          transactions.filter(
            function (row) {
              return (
                normalizeFmrV3_(
                  row.FMR_Number
                ) ===
                  duplicateNumber ||
                (
                  duplicateFmrId &&
                  normalizeFmrV3_(
                    row.FMR_ID
                  ) ===
                    duplicateFmrId
                ) ||
                duplicateLineIds.has(
                  normalizeFmrV3_(
                    row.FMR_Line_ID
                  )
                )
              );
            }
          );

        const duplicateBagHeaders =
          bagHeaders.filter(
            function (row) {
              return (
                normalizeFmrV3_(
                  row.FMR_Number
                ) ===
                  duplicateNumber ||
                (
                  duplicateFmrId &&
                  normalizeFmrV3_(
                    row.FMR_ID
                  ) ===
                    duplicateFmrId
                )
              );
            }
          );

        const duplicateBagIds =
          new Set(
            duplicateBagHeaders
              .map(
                function (row) {
                  return normalizeFmrV3_(
                    row.Bag_Tag_ID
                  );
                }
              )
              .filter(Boolean)
          );

        const duplicateBagItems =
          bagItems.filter(
            function (row) {
              return (
                duplicateLineIds.has(
                  normalizeFmrV3_(
                    row.FMR_Line_ID
                  )
                ) ||
                duplicateBagIds.has(
                  normalizeFmrV3_(
                    row.Bag_Tag_ID
                  )
                )
              );
            }
          );

        const duplicateBackorders =
          backorders.filter(
            function (row) {
              return (
                normalizeFmrV3_(
                  row.FMR_Number
                ) ===
                  duplicateNumber ||
                (
                  duplicateFmrId &&
                  normalizeFmrV3_(
                    row.FMR_ID
                  ) ===
                    duplicateFmrId
                ) ||
                duplicateLineIds.has(
                  normalizeFmrV3_(
                    row.FMR_Line_ID
                  )
                )
              );
            }
          );

        const duplicateBackorderIds =
          new Set(
            duplicateBackorders
              .map(
                function (row) {
                  return normalizeFmrV3_(
                    row.Backorder_Request_ID
                  );
                }
              )
              .filter(Boolean)
          );

        const duplicateFieldNotices =
          fieldNotices.filter(
            function (row) {
              return (
                normalizeFmrV3_(
                  row.FMR_Number
                ) ===
                  duplicateNumber ||
                (
                  duplicateFmrId &&
                  normalizeFmrV3_(
                    row.FMR_ID
                  ) ===
                    duplicateFmrId
                ) ||
                duplicateLineIds.has(
                  normalizeFmrV3_(
                    row.FMR_Line_ID
                  )
                ) ||
                duplicateBackorderIds.has(
                  normalizeFmrV3_(
                    row.Source_ID
                  )
                )
              );
            }
          );

        const relatedIds =
          new Set(
            [duplicateFmrId]
              .concat(
                Array.from(
                  duplicateLineIds
                )
              )
              .concat(
                Array.from(
                  duplicateBagIds
                )
              )
              .concat(
                Array.from(
                  duplicateBackorderIds
                )
              )
              .filter(Boolean)
          );

        const duplicateSearchIndex =
          searchIndex.filter(
            function (entry) {
              return (
                (
                  duplicateFmrId &&
                  normalizeFmrV3_(
                    entry.FMR_ID
                  ) ===
                    duplicateFmrId
                ) ||
                normalizeFmrV3_(
                  entry.FMR_Number
                ) ===
                  duplicateNumber ||
                duplicateLineIds.has(
                  normalizeFmrV3_(
                    entry.FMR_Line_ID
                  )
                )
              );
            }
          );

        const duplicateOperationalIndex =
          operationalIndex.filter(
            function (entry) {
              return (
                relatedIds.has(
                  normalizeFmrV3_(
                    entry.Entity_ID
                  )
                ) ||
                relatedIds.has(
                  normalizeFmrV3_(
                    entry.Parent_ID
                  )
                )
              );
            }
          );

        return {
          duplicateFmrNumber:
            duplicateNumber,

          canonicalFmrNumber:
            canonicalNumber,

          duplicateFmrId:
            duplicateFmrId,

          canonicalFmrId:
            canonicalFmrId,

          duplicateHeader:
            duplicateHeader,

          canonicalHeader:
            canonicalHeader,

          duplicateLines:
            duplicateLines,

          canonicalLines:
            canonicalLines,

          duplicateTransactions:
            duplicateTransactions,

          duplicateBagHeaders:
            duplicateBagHeaders,

          duplicateBagItems:
            duplicateBagItems,

          duplicateBackorders:
            duplicateBackorders,

          duplicateFieldNotices:
            duplicateFieldNotices,

          duplicateSearchIndex:
            duplicateSearchIndex,

          duplicateOperationalIndex:
            duplicateOperationalIndex
        };
      }
    );

  return {
    owner:
      owner.email ||
      owner,

    items:
      items
  };
}


function dupFmrV2VerifyAfterApply_(
  plan
) {
  const perFmr =
    plan.items.map(
      function (item) {
        const activeHeaders =
          item.duplicateHeader &&
          yesFmrV3_(
            item.duplicateHeader.Active
          )
            ? 1
            : 0;

        const activeLines =
          item.duplicateLines.filter(
            function (line) {
              return yesFmrV3_(
                line.Active
              );
            }
          );

        const nonZeroHeader =
          item.duplicateHeader &&
          [
            item.duplicateHeader
              .Total_Lines,
            item.duplicateHeader
              .Qty_Requested,
            item.duplicateHeader
              .Qty_Confirmed_Located,
            item.duplicateHeader
              .Qty_Active_Bagged,
            item.duplicateHeader
              .Qty_Available,
            item.duplicateHeader
              .Qty_Issued,
            item.duplicateHeader
              .Qty_Pending_Backorder,
            item.duplicateHeader
              .Qty_Confirmed_Backorder,
            item.duplicateHeader
              .Qty_Remaining_Requirement,
            item.duplicateHeader
              .Fulfillment_Pct
          ].some(
            function (value) {
              return (
                numberFmrV3_(
                  value
                ) !==
                0
              );
            }
          );

        const nonZeroLines =
          item.duplicateLines.filter(
            function (line) {
              return [
                line.Qty_Requested,
                line.Qty_Confirmed_Located,
                line.Qty_Active_Bagged,
                line.Qty_Available,
                line.Qty_Issued,
                line.Qty_Pending_Backorder,
                line.Qty_Confirmed_Backorder,
                line.Qty_Not_Yet_Located,
                line.Qty_Remaining_Requirement
              ].some(
                function (value) {
                  return (
                    numberFmrV3_(
                      value
                    ) !==
                    0
                  );
                }
              );
            }
          );

        const activeSearchIndex =
          item.duplicateSearchIndex.filter(
            function (entry) {
              return yesFmrV3_(
                entry.Active
              );
            }
          );

        const activeOperationalIndex =
          item.duplicateOperationalIndex.filter(
            function (entry) {
              return yesFmrV3_(
                entry.Active
              );
            }
          );

        const transactionCount =
          item.duplicateTransactions.length;

        const bagHeaderCount =
          item.duplicateBagHeaders.length;

        const bagItemCount =
          item.duplicateBagItems.length;

        const backorderCount =
          item.duplicateBackorders.length;

        const fieldNoticeCount =
          item.duplicateFieldNotices.length;

        const passed =
          activeHeaders ===
            0 &&
          activeLines.length ===
            0 &&
          !nonZeroHeader &&
          nonZeroLines.length ===
            0 &&
          transactionCount ===
            0 &&
          bagHeaderCount ===
            0 &&
          bagItemCount ===
            0 &&
          backorderCount ===
            0 &&
          fieldNoticeCount ===
            0 &&
          activeSearchIndex.length ===
            0 &&
          activeOperationalIndex.length ===
            0 &&
          item.canonicalHeader &&
          yesFmrV3_(
            item.canonicalHeader.Active
          );

        return {
          duplicateFmrNumber:
            item.duplicateFmrNumber,

          canonicalFmrNumber:
            item.canonicalFmrNumber,

          passed:
            passed,

          activeHeaderCount:
            activeHeaders,

          activeLineCount:
            activeLines.length,

          nonZeroHeader:
            Boolean(
              nonZeroHeader
            ),

          nonZeroLineCount:
            nonZeroLines.length,

          remainingTransactionCount:
            transactionCount,

          remainingBagHeaderCount:
            bagHeaderCount,

          remainingBagItemCount:
            bagItemCount,

          remainingBackorderCount:
            backorderCount,

          remainingFieldNotificationCount:
            fieldNoticeCount,

          activeSearchIndexCount:
            activeSearchIndex.length,

          activeOperationalIndexCount:
            activeOperationalIndex.length,

          canonicalStillActive:
            Boolean(
              item.canonicalHeader &&
              yesFmrV3_(
                item.canonicalHeader.Active
              )
            )
        };
      }
    );

  return {
    passed:
      perFmr.every(
        function (item) {
          return item.passed;
        }
      ),

    fmrs:
      perFmr,

    dashboard:
      dupFmrV2DashboardSnapshot_()
  };
}


/* ========================================================================== */
/* DASHBOARD                                                                  */
/* ========================================================================== */

function dupFmrV2DashboardSnapshot_() {
  const sheet =
    sheetFmrV3_(
      FMR_V3.SHEETS.DASHBOARD
    );

  return {
    topKpis:
      sheet
        .getRange(
          'A5:G5'
        )
        .getDisplayValues()[0],

    materialKpis:
      sheet
        .getRange(
          'A9:G9'
        )
        .getDisplayValues()[0]
  };
}
