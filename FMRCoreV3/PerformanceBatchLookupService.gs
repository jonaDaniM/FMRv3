/**
 * FMR Operations v3 — Alpha 30.2
 * Batched read helpers for production-scale multi-line lookups.
 *
 * ADD AS A NEW FMRCoreV3 SCRIPT FILE:
 *   PerformanceBatchLookupService
 *
 * Purpose:
 *   Keep the current exact indexed lookup behavior for small/single-line
 *   operations while avoiding N-per-line TextFinder calls when an entire FMR
 *   contains many material lines.
 *
 * This file does NOT:
 *   - change database schemas;
 *   - change transaction arithmetic;
 *   - write operational data;
 *   - replace Search_Index or Operational_Index;
 *   - alter lock/audit/backup behavior.
 */

const FMR_V3_BATCH_READ_POLICY =
  Object.freeze({
    EXACT_LOOKUP_THRESHOLD:
      3
  });

function normalizeBatchLookupValuesFmrV3_(
  values
) {
  return Array.from(
    new Set(
      (
        values ||
        []
      )
        .map(
          function (
            value
          ) {
            return normalizeFmrV3_(
              value
            );
          }
        )
        .filter(Boolean)
    )
  );
}

/**
 * Locate rows for multiple exact values in one column.
 *
 * Small requests retain the existing TextFinder implementation so normal
 * one-line operational transactions keep their current cached/indexed path.
 *
 * Larger requests read the target column once and match all requested values
 * in memory. This is substantially cheaper than 10-30 separate TextFinder
 * calls when loading a multi-line FMR.
 */
function findRowsByExactValuesFmrV3_(
  sheetName,
  columnNumber,
  values
) {
  const targets =
    normalizeBatchLookupValuesFmrV3_(
      values
    );

  if (
    !targets.length
  ) {
    return [];
  }

  if (
    targets.length <=
    FMR_V3_BATCH_READ_POLICY
      .EXACT_LOOKUP_THRESHOLD
  ) {
    const rows = [];

    targets.forEach(
      function (
        target
      ) {
        rows.push.apply(
          rows,
          findRowsByExactValueFmrV3_(
            sheetName,
            columnNumber,
            target
          )
        );
      }
    );

    return Array.from(
      new Set(
        rows
      )
    ).sort(
      function (
        left,
        right
      ) {
        return left -
          right;
      }
    );
  }

  const targetSet =
    new Set(
      targets.map(
        function (
          target
        ) {
          return normalizeUpperFmrV3_(
            target
          );
        }
      )
    );

  const sheet =
    sheetFmrV3_(
      sheetName
    );

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow <
    2
  ) {
    return [];
  }

  const displayValues =
    sheet
      .getRange(
        2,
        numberFmrV3_(
          columnNumber
        ),
        lastRow -
        1,
        1
      )
      .getDisplayValues();

  const rows = [];

  displayValues.forEach(
    function (
      row,
      index
    ) {
      if (
        targetSet.has(
          normalizeUpperFmrV3_(
            row[0]
          )
        )
      ) {
        rows.push(
          index +
          2
        );
      }
    }
  );

  return rows;
}

/**
 * Batch form of lookupIndexEntriesFmrV3_.
 *
 * <= 3 keys:
 *   use the existing per-key cached lookup.
 *
 * > 3 keys:
 *   locate every key in one column read, batch-read the matching index rows,
 *   group them in memory, and populate the same ScriptCache entries used by
 *   lookupIndexEntriesFmrV3_.
 */
function lookupIndexEntriesForKeysFmrV3_(
  sheetName,
  exactKeys
) {
  const keys =
    Array.from(
      new Set(
        (
          exactKeys ||
          []
        )
          .map(
            function (
              key
            ) {
              return normalizeUpperFmrV3_(
                key
              );
            }
          )
          .filter(Boolean)
      )
    );

  const result = {};

  keys.forEach(
    function (
      key
    ) {
      result[
        key
      ] = [];
    }
  );

  if (
    !keys.length
  ) {
    return result;
  }

  if (
    keys.length <=
    FMR_V3_BATCH_READ_POLICY
      .EXACT_LOOKUP_THRESHOLD
  ) {
    keys.forEach(
      function (
        key
      ) {
        result[
          key
        ] =
          lookupIndexEntriesFmrV3_(
            sheetName,
            key
          );
      }
    );

    return result;
  }

  const keySet =
    new Set(
      keys
    );

  const keyField =
    sheetName ===
      FMR_V3.SHEETS
        .SEARCH_INDEX
      ? 'Search_Key'
      : 'Index_Key';

  const rows =
    findRowsByExactValuesFmrV3_(
      sheetName,
      1,
      keys
    );

  const records =
    readRowsObjectsFmrV3_(
      sheetName,
      rows
    );

  records.forEach(
    function (
      record
    ) {
      const key =
        normalizeUpperFmrV3_(
          record[
            keyField
          ]
        );

      if (
        keySet.has(
          key
        ) &&
        yesFmrV3_(
          record.Active
        )
      ) {
        result[
          key
        ].push(
          record
        );
      }
    }
  );

  /**
   * Populate the existing per-key cache so later single-line operations can
   * immediately use lookupIndexEntriesFmrV3_ without rescanning the index.
   */
  const cache =
    CacheService
      .getScriptCache();

  const ttl =
    Math.max(
      60,
      Math.min(
        21600,
        numberFmrV3_(
          getConfigurationFmrV3_()
            .SEARCH_CACHE_SECONDS
        ) ||
        3600
      )
    );

  keys.forEach(
    function (
      key
    ) {
      cache.put(
        indexCacheKeyFmrV3_(
          sheetName,
          key
        ),
        JSON.stringify(
          result[
            key
          ]
        ),
        ttl
      );
    }
  );

  return result;
}

/**
 * Return Operational_Index records grouped by their requested source value.
 *
 * Example:
 *   lookupOperationalRowsForValuesFmrV3_(
 *     'BAGLINE',
 *     [lineId1, lineId2, ...]
 *   )
 *
 * returns:
 *   {
 *     lineId1: [indexRecord, ...],
 *     lineId2: [indexRecord, ...]
 *   }
 */
function lookupOperationalRowsForValuesFmrV3_(
  type,
  values
) {
  const normalizedValues =
    normalizeBatchLookupValuesFmrV3_(
      values
    );

  const result = {};

  normalizedValues.forEach(
    function (
      value
    ) {
      result[
        value
      ] = [];
    }
  );

  if (
    !normalizedValues.length
  ) {
    return result;
  }

  const keyByValue = {};

  normalizedValues.forEach(
    function (
      value
    ) {
      keyByValue[
        value
      ] =
        operationalIndexKeyFmrV3_(
          type,
          value
        );
    }
  );

  const recordsByKey =
    lookupIndexEntriesForKeysFmrV3_(
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX,
      normalizedValues.map(
        function (
          value
        ) {
          return keyByValue[
            value
          ];
        }
      )
    );

  normalizedValues.forEach(
    function (
      value
    ) {
      const key =
        normalizeUpperFmrV3_(
          keyByValue[
            value
          ]
        );

      result[
        value
      ] =
        recordsByKey[
          key
        ] ||
        [];
    }
  );

  return result;
}
