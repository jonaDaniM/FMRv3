/**
 * FMRv3 commodity search-index historical backfill.
 *
 * Release: 3.0.0-alpha.30.5.15.1
 *
 * Owner-only.
 * Idempotent.
 * Search_Index only.
 */

function commodityIndexBackfillEnvironmentFmrV3_() {
  const configuration =
    getConfigurationFmrV3_();

  return {
    environment:
      normalizeUpperFmrV3_(
        configuration
          .ENVIRONMENT_NAME
      ) ||
      'UNKNOWN',

    transactionMode:
      normalizeUpperFmrV3_(
        configuration
          .TRANSACTION_MODE
      ) ||
      'UNKNOWN',

    indexVersion:
      numberFmrV3_(
        configuration
          .SEARCH_INDEX_VERSION
      ) ||
      1
  };
}


function buildCommodityIndexBackfillPlanFmrV3_() {
  const environment =
    commodityIndexBackfillEnvironmentFmrV3_();

  const activeHeaders =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.HEADERS
    )
      .filter(
        function (
          header
        ) {
          return yesFmrV3_(
            header.Active
          );
        }
      );

  const headerByFmrId = {};

  activeHeaders.forEach(
    function (
      header
    ) {
      const fmrId =
        normalizeFmrV3_(
          header.FMR_ID
        );

      if (fmrId) {
        headerByFmrId[
          fmrId
        ] =
          header;
      }
    }
  );

  const activeLines =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.LINES
    )
      .filter(
        function (
          line
        ) {
          return yesFmrV3_(
            line.Active
          );
        }
      );

  const existingCommodityRows =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .SEARCH_INDEX
    )
      .filter(
        function (
          row
        ) {
          return (
            yesFmrV3_(
              row.Active
            ) &&
            normalizeUpperFmrV3_(
              row.Search_Type
            ) ===
              'COMMODITY'
          );
        }
      );

  const existingPairs =
    new Set();

  existingCommodityRows.forEach(
    function (
      row
    ) {
      const searchKey =
        normalizeUpperFmrV3_(
          row.Search_Key
        );

      const lineId =
        normalizeFmrV3_(
          row.FMR_Line_ID
        );

      if (
        searchKey &&
        lineId
      ) {
        existingPairs.add(
          searchKey +
          '|' +
          lineId
        );
      }
    }
  );

  const entries = [];
  const affectedKeys =
    new Set();
  const uniqueCommodityCodes =
    new Set();

  let blankCommodity = 0;
  let missingActiveHeader = 0;
  let alreadyPresent = 0;
  let eligibleLines = 0;

  const updatedAt =
    nowFmrV3_();

  activeLines.forEach(
    function (
      line
    ) {
      const commodityKey =
        commoditySearchKeyFmrV3_(
          line.Commodity_Code
        );

      if (!commodityKey) {
        blankCommodity += 1;
        return;
      }

      const fmrId =
        normalizeFmrV3_(
          line.FMR_ID
        );

      const header =
        headerByFmrId[
          fmrId
        ];

      if (!header) {
        missingActiveHeader += 1;
        return;
      }

      eligibleLines += 1;

      const commodityCode =
        normalizeUpperFmrV3_(
          line.Commodity_Code
        );

      if (commodityCode) {
        uniqueCommodityCodes.add(
          commodityCode
        );
      }

      const pairKey =
        commodityKey +
        '|' +
        normalizeFmrV3_(
          line.FMR_Line_ID
        );

      if (
        existingPairs.has(
          pairKey
        )
      ) {
        alreadyPresent += 1;
        return;
      }

      entries.push({
        Search_Key:
          commodityKey,

        Search_Type:
          'COMMODITY',

        FMR_ID:
          line.FMR_ID,

        FMR_Number:
          line.FMR_Number,

        FMR_Line_ID:
          line.FMR_Line_ID,

        Header_Row:
          header._rowNumber,

        Line_Row:
          line._rowNumber,

        ISO_Key:
          line.ISO_Key,

        Active:
          FMR_V3.YES,

        Index_Version:
          environment
            .indexVersion,

        Updated_At:
          updatedAt
      });

      affectedKeys.add(
        commodityKey
      );
    }
  );

  return {
    environment:
      environment,

    activeHeaderCount:
      activeHeaders.length,

    activeLineCount:
      activeLines.length,

    existingActiveCommodityIndexRows:
      existingCommodityRows.length,

    eligibleLines:
      eligibleLines,

    blankCommodityLines:
      blankCommodity,

    missingActiveHeaderLines:
      missingActiveHeader,

    alreadyPresent:
      alreadyPresent,

    uniqueCommodityCodes:
      uniqueCommodityCodes.size,

    entriesToAdd:
      entries.length,

    affectedKeyCount:
      affectedKeys.size,

    entries:
      entries,

    affectedKeys:
      Array.from(
        affectedKeys
      )
  };
}


function serializeCommodityIndexBackfillPlanFmrV3_(
  plan
) {
  const source =
    plan || {};

  return {
    environment:
      source.environment ||
      {},

    activeHeaderCount:
      numberFmrV3_(
        source.activeHeaderCount
      ),

    activeLineCount:
      numberFmrV3_(
        source.activeLineCount
      ),

    existingActiveCommodityIndexRows:
      numberFmrV3_(
        source
          .existingActiveCommodityIndexRows
      ),

    eligibleLines:
      numberFmrV3_(
        source.eligibleLines
      ),

    blankCommodityLines:
      numberFmrV3_(
        source.blankCommodityLines
      ),

    missingActiveHeaderLines:
      numberFmrV3_(
        source
          .missingActiveHeaderLines
      ),

    alreadyPresent:
      numberFmrV3_(
        source.alreadyPresent
      ),

    uniqueCommodityCodes:
      numberFmrV3_(
        source.uniqueCommodityCodes
      ),

    entriesToAdd:
      numberFmrV3_(
        source.entriesToAdd
      ),

    affectedKeyCount:
      numberFmrV3_(
        source.affectedKeyCount
      ),

    sampleEntries:
      (
        source.entries ||
        []
      )
        .slice(
          0,
          20
        )
        .map(
          function (
            entry
          ) {
            return {
              Search_Key:
                entry.Search_Key,

              FMR_Number:
                entry.FMR_Number,

              FMR_Line_ID:
                entry.FMR_Line_ID,

              Line_Row:
                entry.Line_Row
            };
          }
        )
  };
}


function previewCommodityIndexBackfillFmrV3_(
  userEmail
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const plan =
    buildCommodityIndexBackfillPlanFmrV3_();

  return {
    preview:
      true,

    ownerEmail:
      owner.email,

    version:
      FMR_V3.VERSION,

    plan:
      serializeCommodityIndexBackfillPlanFmrV3_(
        plan
      )
  };
}


function assertCommodityIndexBackfillWindowFmrV3_(
  plan
) {
  const environment =
    normalizeUpperFmrV3_(
      plan &&
      plan.environment &&
      plan.environment
        .environment
    );

  const transactionMode =
    normalizeUpperFmrV3_(
      plan &&
      plan.environment &&
      plan.environment
        .transactionMode
    );

  if (
    environment ===
      'PRODUCTION' &&
    transactionMode !==
      'READ_ONLY'
  ) {
    throw new Error(
      'Production commodity-index backfill requires TRANSACTION_MODE = READ_ONLY.'
    );
  }
}


function applyCommodityIndexBackfillFmrV3_(
  userEmail
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const plan =
      buildCommodityIndexBackfillPlanFmrV3_();

    assertCommodityIndexBackfillWindowFmrV3_(
      plan
    );

    if (
      !plan.entries.length
    ) {
      return {
        applied:
          true,

        noOp:
          true,

        ownerEmail:
          owner.email,

        version:
          FMR_V3.VERSION,

        added:
          0,

        plan:
          serializeCommodityIndexBackfillPlanFmrV3_(
            plan
          )
      };
    }

    const appendedRows =
      appendObjectsFmrV3_(
        FMR_V3.SHEETS
          .SEARCH_INDEX,
        plan.entries
      );

    plan.affectedKeys
      .forEach(
        function (
          searchKey
        ) {
          invalidateIndexKeyFmrV3_(
            FMR_V3.SHEETS
              .SEARCH_INDEX,
            searchKey
          );
        }
      );

    const correlationId =
      uuidFmrV3_(
        'CORR'
      );

    appendAuditFmrV3_(
      'SYSTEM',
      'SEARCH_INDEX',
      'COMMODITY_INDEX_BACKFILL',
      owner,
      correlationId,
      {
        sourceInterface:
          'OWNER',

        payload: {
          version:
            FMR_V3.VERSION,

          environment:
            plan.environment
              .environment,

          activeLines:
            plan.activeLineCount,

          eligibleLines:
            plan.eligibleLines,

          alreadyPresent:
            plan.alreadyPresent,

          entriesAdded:
            appendedRows.length,

          uniqueCommodityCodes:
            plan.uniqueCommodityCodes,

          affectedKeyCount:
            plan.affectedKeyCount
        }
      }
    );

    return {
      applied:
        true,

      noOp:
        false,

      ownerEmail:
        owner.email,

      version:
        FMR_V3.VERSION,

      correlationId:
        correlationId,

      added:
        appendedRows.length,

      firstAppendedRow:
        appendedRows.length
          ? appendedRows[0]
          : 0,

      lastAppendedRow:
        appendedRows.length
          ? appendedRows[
              appendedRows.length -
              1
            ]
          : 0,

      plan:
        serializeCommodityIndexBackfillPlanFmrV3_(
          plan
        )
    };
  } finally {
    lock.releaseLock();
  }
}
