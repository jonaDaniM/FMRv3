const FMR_V3_BATCH_READ_POLICY = Object.freeze({
  EXACT_LOOKUP_THRESHOLD: 3
});

function normalizeBatchLookupValuesFmrV3_(values) {
  return Array.from(
    new Set(
      (values || [])
        .map(function (value) {
          return normalizeFmrV3_(value);
        })
        .filter(Boolean)
    )
  );
}

/**
 * Locate rows for several exact values in one column.
 *
 * Small requests retain the existing TextFinder implementation. Larger
 * requests read the target column once and perform Set membership tests in
 * memory, avoiding N TextFinder calls against the same sheet.
 */
function findRowsByExactValuesFmrV3_(sheetName, columnNumber, values) {
  const targets = normalizeBatchLookupValuesFmrV3_(values);

  if (!targets.length) return [];

  if (targets.length <= FMR_V3_BATCH_READ_POLICY.EXACT_LOOKUP_THRESHOLD) {
    const rows = [];

    targets.forEach(function (target) {
      rows.push.apply(
        rows,
        findRowsByExactValueFmrV3_(sheetName, columnNumber, target)
      );
    });

    return Array.from(new Set(rows)).sort(function (left, right) {
      return left - right;
    });
  }

  const targetSet = new Set(
    targets.map(function (target) {
      return normalizeUpperFmrV3_(target);
    })
  );

  const sheet = sheetFmrV3_(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const displayValues = sheet
    .getRange(
      2,
      numberFmrV3_(columnNumber),
      lastRow - 1,
      1
    )
    .getDisplayValues();

  const rows = [];

  displayValues.forEach(function (row, index) {
    if (targetSet.has(normalizeUpperFmrV3_(row[0]))) {
      rows.push(index + 2);
    }
  });

  return rows;
}



/**
 * Read many row objects without turning sparse matches into one Spreadsheet
 * service call per row.
 *
 * readRowsObjectsFmrV3_ is excellent for truly contiguous rows. Search_Index
 * matches are often separated by 1-2 sibling index rows (FMR / ISO / LINE),
 * so a list of logically related matches can otherwise produce dozens or
 * hundreds of getRange().getValues() calls.
 *
 * Strategy:
 * - small sets: preserve the existing helper;
 * - larger sets: merge nearby rows into read windows and discard gap rows in
 *   memory;
 * - if the request would still require too many windows, read the used sheet
 *   rectangle once and select the requested rows in memory.
 */
function readRowsObjectsBatchedFmrV3_(
  sheetName,
  rowNumbers,
  options
) {
  const rows = Array.from(
    new Set(
      (rowNumbers || [])
        .map(numberFmrV3_)
        .filter(function (value) {
          return value >= 2;
        })
    )
  ).sort(function (left, right) {
    return left - right;
  });

  if (!rows.length) return [];

  if (rows.length <= 12) {
    return readRowsObjectsFmrV3_(sheetName, rows);
  }

  const settings = options || {};
  const maxGapRows = Math.max(
    0,
    Math.min(
      100,
      Math.floor(numberFmrV3_(settings.maxGapRows) || 4)
    )
  );
  const maxGroups = Math.max(
    1,
    Math.min(
      50,
      Math.floor(numberFmrV3_(settings.maxGroups) || 20)
    )
  );

  const requested = new Set(rows);
  const groups = [];

  rows.forEach(function (row) {
    const current = groups.length ? groups[groups.length - 1] : null;

    if (
      current &&
      row <= current.end + maxGapRows + 1
    ) {
      current.end = row;
    } else {
      groups.push({
        start: row,
        end: row
      });
    }
  });

  const contract = headerMapFmrV3_(sheetName);
  const sheet = sheetFmrV3_(sheetName);
  const result = [];

  function appendWindow_(startRow, count) {
    const values = sheet
      .getRange(
        startRow,
        1,
        count,
        contract.headers.length
      )
      .getValues();

    values.forEach(function (rowValues, index) {
      const rowNumber = startRow + index;
      if (!requested.has(rowNumber)) return;

      const record = {
        _rowNumber: rowNumber
      };

      contract.headers.forEach(function (header, columnIndex) {
        record[header] = rowValues[columnIndex];
      });

      result.push(record);
    });
  }

  if (groups.length > maxGroups) {
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      appendWindow_(2, lastRow - 1);
    }
  } else {
    groups.forEach(function (group) {
      appendWindow_(
        group.start,
        group.end - group.start + 1
      );
    });
  }

  return result.sort(function (left, right) {
    return left._rowNumber - right._rowNumber;
  });
}

/**
 * Batch form of lookupIndexEntriesFmrV3_.
 *
 * Improvements over Alpha 30.2:
 * - for >3 keys, fetch every existing per-key cache entry in one getAll();
 * - scan the index only for cache misses;
 * - repopulate misses in one putAll();
 * - preserve the exact same per-key cache keys used by the single-key path.
 */
function lookupIndexEntriesForKeysFmrV3_(sheetName, exactKeys) {
  const keys = Array.from(
    new Set(
      (exactKeys || [])
        .map(function (key) {
          return normalizeUpperFmrV3_(key);
        })
        .filter(Boolean)
    )
  );

  const result = {};
  keys.forEach(function (key) {
    result[key] = [];
  });

  if (!keys.length) return result;

  if (keys.length <= FMR_V3_BATCH_READ_POLICY.EXACT_LOOKUP_THRESHOLD) {
    keys.forEach(function (key) {
      result[key] = lookupIndexEntriesFmrV3_(sheetName, key);
    });
    return result;
  }

  const cache = CacheService.getScriptCache();
  const cacheKeyByExactKey = {};
  const cacheKeys = keys.map(function (key) {
    const cacheKey = indexCacheKeyFmrV3_(sheetName, key);
    cacheKeyByExactKey[key] = cacheKey;
    return cacheKey;
  });

  const cachedValues = cache.getAll(cacheKeys) || {};
  const missingKeys = [];

  keys.forEach(function (key) {
    const raw = cachedValues[cacheKeyByExactKey[key]];

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        result[key] = Array.isArray(parsed) ? parsed : [];
        return;
      } catch (error) {
        // Treat malformed/expired cache content as a miss and rebuild it.
      }
    }

    missingKeys.push(key);
  });

  if (!missingKeys.length) return result;

  const missingSet = new Set(missingKeys);
  const keyField =
    sheetName === FMR_V3.SHEETS.SEARCH_INDEX
      ? 'Search_Key'
      : 'Index_Key';

  const rows = findRowsByExactValuesFmrV3_(
    sheetName,
    1,
    missingKeys
  );

  const records = readRowsObjectsBatchedFmrV3_(
    sheetName,
    rows,
    {
      maxGapRows: 4,
      maxGroups: 20
    }
  );

  records.forEach(function (record) {
    const key = normalizeUpperFmrV3_(record[keyField]);

    if (
      missingSet.has(key) &&
      yesFmrV3_(record.Active)
    ) {
      result[key].push(record);
    }
  });

  const ttl = Math.max(
    60,
    Math.min(
      21600,
      numberFmrV3_(getConfigurationFmrV3_().SEARCH_CACHE_SECONDS) || 3600
    )
  );

  const cachePayload = {};
  missingKeys.forEach(function (key) {
    cachePayload[cacheKeyByExactKey[key]] = JSON.stringify(result[key]);
  });

  if (Object.keys(cachePayload).length) {
    cache.putAll(cachePayload, ttl);
  }

  return result;
}

/**
 * Return Operational_Index records grouped by their requested source value.
 */
function lookupOperationalRowsForValuesFmrV3_(type, values) {
  const normalizedValues = normalizeBatchLookupValuesFmrV3_(values);
  const result = {};

  normalizedValues.forEach(function (value) {
    result[value] = [];
  });

  if (!normalizedValues.length) return result;

  const keyByValue = {};
  normalizedValues.forEach(function (value) {
    keyByValue[value] = operationalIndexKeyFmrV3_(type, value);
  });

  const recordsByKey = lookupIndexEntriesForKeysFmrV3_(
    FMR_V3.SHEETS.OPERATIONAL_INDEX,
    normalizedValues.map(function (value) {
      return keyByValue[value];
    })
  );

  normalizedValues.forEach(function (value) {
    const key = normalizeUpperFmrV3_(keyByValue[value]);
    result[value] = recordsByKey[key] || [];
  });

  return result;
}

/**
 * Batch-resolve FMR_Line_Items by FMR_Line_ID.
 *
 * This is the key Alpha 30.5.3 dashboard optimization. The Admin backorder
 * queue can contain hundreds of requests. Previously each distinct request
 * line called getLineByIdFmrV3_(), which caused a per-line Search_Index lookup
 * followed by a per-line row read. This helper resolves all requested LINE:
 * keys together, then reads all referenced line rows in grouped ranges.
 *
 * Return shape:
 *   {
 *     "FMRLINE-...": <FMR_Line_Items record>,
 *     ...
 *   }
 * Keys are normalized uppercase IDs.
 */
function getLinesByIdsFmrV3_(lineIds) {
  const ids = Array.from(
    new Set(
      (lineIds || [])
        .map(function (lineId) {
          return normalizeUpperFmrV3_(lineId);
        })
        .filter(Boolean)
    )
  );

  const result = {};
  if (!ids.length) return result;

  const searchKeyById = {};
  const searchKeys = ids.map(function (lineId) {
    const key = lineSearchKeyFmrV3_(lineId);
    searchKeyById[lineId] = normalizeUpperFmrV3_(key);
    return key;
  });

  const entriesByKey = lookupIndexEntriesForKeysFmrV3_(
    FMR_V3.SHEETS.SEARCH_INDEX,
    searchKeys
  );

  const lineRowById = {};
  const lineRows = [];

  ids.forEach(function (lineId) {
    const key = searchKeyById[lineId];
    const entries = entriesByKey[key] || [];

    const matchingEntry = entries.find(function (entry) {
      return (
        yesFmrV3_(entry.Active) &&
        normalizeUpperFmrV3_(entry.FMR_Line_ID) === lineId &&
        numberFmrV3_(entry.Line_Row) >= 2
      );
    });

    if (!matchingEntry) return;

    const rowNumber = numberFmrV3_(matchingEntry.Line_Row);
    lineRowById[lineId] = rowNumber;
    lineRows.push(rowNumber);
  });

  const rows = readRowsObjectsBatchedFmrV3_(
    FMR_V3.SHEETS.LINES,
    lineRows,
    {
      maxGapRows: 12,
      maxGroups: 20
    }
  );

  const recordByRow = {};
  rows.forEach(function (record) {
    recordByRow[numberFmrV3_(record._rowNumber)] = record;
  });

  ids.forEach(function (lineId) {
    const rowNumber = lineRowById[lineId];
    const record = rowNumber ? recordByRow[rowNumber] : null;

    if (
      record &&
      normalizeUpperFmrV3_(record.FMR_Line_ID) === lineId
    ) {
      result[lineId] = record;
    }
  });

  return result;
}
