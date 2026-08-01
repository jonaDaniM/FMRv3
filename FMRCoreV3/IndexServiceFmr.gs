function indexCacheKeyFmrV3_(sheetName, exactKey) {
  const version = normalizeFmrV3_(
    getConfigurationFmrV3_().SEARCH_INDEX_VERSION
  ) || '1';

  const digest = Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      `${sheetName}|${exactKey}|${version}`
    )
  ).slice(0, 40);

  return `fmr3:index:${digest}`;
}

function lookupIndexEntriesFmrV3_(sheetName, exactKey) {
  const key = normalizeUpperFmrV3_(exactKey);
  if (!key) return [];

  const cache = CacheService.getScriptCache();
  const cacheKey = indexCacheKeyFmrV3_(sheetName, key);
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const rows = findRowsByExactValueFmrV3_(sheetName, 1, key);
  const keyField = sheetName === FMR_V3.SHEETS.SEARCH_INDEX
    ? 'Search_Key'
    : 'Index_Key';

  const records = readRowsObjectsFmrV3_(sheetName, rows)
    .filter(function (record) {
      return normalizeUpperFmrV3_(record[keyField]) === key &&
        yesFmrV3_(record.Active);
    });

  const ttl = Math.max(60, Math.min(
    21600,
    numberFmrV3_(getConfigurationFmrV3_().SEARCH_CACHE_SECONDS) || 3600
  ));

  cache.put(cacheKey, JSON.stringify(records), ttl);
  return records;
}

function invalidateIndexKeyFmrV3_(sheetName, exactKey) {
  CacheService.getScriptCache().remove(
    indexCacheKeyFmrV3_(sheetName, normalizeUpperFmrV3_(exactKey))
  );
}

function appendSearchIndexEntriesFmrV3_(entries) {
  const rows = appendObjectsFmrV3_(FMR_V3.SHEETS.SEARCH_INDEX, entries);
  (entries || []).forEach(function (entry) {
    invalidateIndexKeyFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX,
      entry.Search_Key
    );
  });
  return rows;
}

function appendOperationalIndexEntriesFmrV3_(entries) {
  const rows = appendObjectsFmrV3_(
    FMR_V3.SHEETS.OPERATIONAL_INDEX,
    entries
  );

  (entries || []).forEach(function (entry) {
    invalidateIndexKeyFmrV3_(
      FMR_V3.SHEETS.OPERATIONAL_INDEX,
      entry.Index_Key
    );
  });
  return rows;
}

function deactivateExactIndexRowsFmrV3_(sheetName, exactKey, entityId) {
  const records = lookupIndexEntriesFmrV3_(sheetName, exactKey);

  records.forEach(function (record) {
    if (
      !entityId ||
      normalizeFmrV3_(record.Entity_ID || record.FMR_Line_ID) ===
      normalizeFmrV3_(entityId)
    ) {
      updateRowObjectFmrV3_(sheetName, record._rowNumber, {
        Active: FMR_V3.NO,
        Updated_At: nowFmrV3_()
      });
    }
  });

  invalidateIndexKeyFmrV3_(sheetName, exactKey);
}

function buildSearchEntriesForPublishedLineFmrV3_(
  header,
  headerRow,
  line,
  lineRow
) {
  const version = numberFmrV3_(
    getConfigurationFmrV3_().SEARCH_INDEX_VERSION
  ) || 1;

  const common = {
    FMR_ID: line.FMR_ID,
    FMR_Number: line.FMR_Number,
    FMR_Line_ID: line.FMR_Line_ID,
    Header_Row: headerRow,
    Line_Row: lineRow,
    ISO_Key: line.ISO_Key,
    Active: FMR_V3.YES,
    Index_Version: version,
    Updated_At: nowFmrV3_()
  };

  return [
    Object.assign({
      Search_Key: fmrSearchKeyFmrV3_(header.FMR_Number),
      Search_Type: 'FMR'
    }, common),
    Object.assign({
      Search_Key: `ISO:${line.ISO_Key}`,
      Search_Type: 'ISO'
    }, common),
    Object.assign({
      Search_Key: lineSearchKeyFmrV3_(line.FMR_Line_ID),
      Search_Type: 'LINE'
    }, common)
  ];
}

function getLineByIdFmrV3_(lineId) {
  const entries = lookupIndexEntriesFmrV3_(
    FMR_V3.SHEETS.SEARCH_INDEX,
    lineSearchKeyFmrV3_(lineId)
  );

  if (!entries.length) throw new Error(`FMR line not found: ${lineId}`);
  return readRowObjectFmrV3_(FMR_V3.SHEETS.LINES, entries[0].Line_Row);
}

function lookupOperationalRowsFmrV3_(type, value) {
  return lookupIndexEntriesFmrV3_(
    FMR_V3.SHEETS.OPERATIONAL_INDEX,
    operationalIndexKeyFmrV3_(type, value)
  );
}
