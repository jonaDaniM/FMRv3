const FMR_V3_INDEX_CACHE_SAFE_VALUE_BYTES_ = 75000;
const FMR_V3_INDEX_CACHE_META_VERSION_ = 2;
const FMR_V3_INDEX_CACHE_MAX_CHUNKS_ = 100;

function indexCacheNamespaceFmrV3_() {
  let fingerprint = '';

  try {
    fingerprint =
      normalizeFmrV3_(
        databaseFingerprintFmrV3_()
      );
  } catch (ignored) {
    fingerprint = '';
  }

  if (fingerprint) {
    return 'DB:' + fingerprint;
  }

  const configuration =
    getConfigurationFmrV3_();

  const environment =
    normalizeUpperFmrV3_(
      configuration &&
      configuration.ENVIRONMENT_NAME
    ) ||
    'UNKNOWN';

  return 'ENV:' + environment;
}

function indexCacheKeyFmrV3_(
  sheetName,
  exactKey
) {
  const version =
    normalizeFmrV3_(
      getConfigurationFmrV3_()
        .SEARCH_INDEX_VERSION
    ) ||
    '1';

  const namespace =
    indexCacheNamespaceFmrV3_();

  const digest =
    Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        (
          namespace +
          '|' +
          sheetName +
          '|' +
          exactKey +
          '|' +
          version
        )
      )
    ).slice(0, 40);

  return 'fmr3:index:' + digest;
}

function indexCacheMetaKeyFmrV3_(
  cacheKey
) {
  return cacheKey + ':meta2';
}

function indexCacheChunkKeyFmrV3_(
  cacheKey,
  generation,
  index
) {
  return (
    cacheKey +
    ':chunk2:' +
    generation +
    ':' +
    index
  );
}

function indexCacheUtf8BytesFmrV3_(
  value
) {
  return Utilities
    .newBlob(
      String(
        value == null
          ? ''
          : value
      ),
      'text/plain'
    )
    .getBytes()
    .length;
}

function buildIndexCacheChunksFmrV3_(
  records,
  maximumBytes
) {
  const source =
    Array.isArray(records)
      ? records
      : [];

  const limit =
    Math.max(
      1000,
      numberFmrV3_(
        maximumBytes
      ) ||
      FMR_V3_INDEX_CACHE_SAFE_VALUE_BYTES_
    );

  const chunks = [];
  let currentParts = [];
  let currentBytes = 2; // []

  source.forEach(function (record) {
    const recordJson =
      JSON.stringify(
        record
      );

    const recordBytes =
      indexCacheUtf8BytesFmrV3_(
        recordJson
      );

    if (
      recordBytes + 2 >
      limit
    ) {
      throw new Error(
        'One index cache record exceeds the safe cache chunk size.'
      );
    }

    const separatorBytes =
      currentParts.length
        ? 1
        : 0;

    if (
      currentParts.length &&
      (
        currentBytes +
        separatorBytes +
        recordBytes
      ) >
      limit
    ) {
      chunks.push(
        '[' +
        currentParts.join(',') +
        ']'
      );

      currentParts = [];
      currentBytes = 2;
    }

    currentParts.push(
      recordJson
    );

    currentBytes +=
      (
        currentParts.length >
          1
          ? 1
          : 0
      ) +
      recordBytes;
  });

  if (
    currentParts.length
  ) {
    chunks.push(
      '[' +
      currentParts.join(',') +
      ']'
    );
  }

  if (
    !chunks.length
  ) {
    chunks.push(
      '[]'
    );
  }

  return chunks;
}

function readChunkMetadataFmrV3_(
  cache,
  cacheKey
) {
  const metadataKey =
    indexCacheMetaKeyFmrV3_(
      cacheKey
    );

  const raw =
    cache.get(
      metadataKey
    );

  if (!raw) {
    return null;
  }

  try {
    const metadata =
      JSON.parse(
        raw
      );

    const chunkKeys =
      Array.isArray(
        metadata.chunkKeys
      )
        ? metadata.chunkKeys
        : [];

    const validKeys =
      chunkKeys.length >
        0 &&
      chunkKeys.length <=
        FMR_V3_INDEX_CACHE_MAX_CHUNKS_ &&
      chunkKeys.every(
        function (key) {
          return (
            typeof key ===
              'string' &&
            key.indexOf(
              cacheKey +
              ':chunk2:'
            ) ===
              0
          );
        }
      );

    if (
      numberFmrV3_(
        metadata.version
      ) !==
        FMR_V3_INDEX_CACHE_META_VERSION_ ||
      normalizeUpperFmrV3_(
        metadata.strategy
      ) !==
        'CHUNKED' ||
      !validKeys
    ) {
      return null;
    }

    return metadata;
  } catch (ignored) {
    return null;
  }
}

function readIndexCacheRecordsFmrV3_(
  cache,
  cacheKey
) {
  /*
   * New chunked metadata is checked first so a valid Alpha 30.5.5 cache
   * generation always wins over any stale legacy single-value cache entry.
   */
  const metadata =
    readChunkMetadataFmrV3_(
      cache,
      cacheKey
    );

  if (metadata) {
    const records = [];
    let totalBytes = 0;

    try {
      metadata.chunkKeys
        .forEach(
          function (chunkKey) {
            const raw =
              cache.get(
                chunkKey
              );

            if (!raw) {
              throw new Error(
                'Missing index cache chunk.'
              );
            }

            totalBytes +=
              indexCacheUtf8BytesFmrV3_(
                raw
              );

            const parsed =
              JSON.parse(
                raw
              );

            if (
              !Array.isArray(
                parsed
              )
            ) {
              throw new Error(
                'Invalid index cache chunk.'
              );
            }

            Array.prototype.push
              .apply(
                records,
                parsed
              );
          }
        );

      if (
        numberFmrV3_(
          metadata.recordCount
        ) !==
          records.length
      ) {
        throw new Error(
          'Index cache chunk count mismatch.'
        );
      }

      return {
        hit: true,
        strategy:
          'CHUNKED',
        records:
          records,
        chunkCount:
          metadata.chunkKeys
            .length,
        serializedBytes:
          numberFmrV3_(
            metadata.serializedBytes
          ) ||
          totalBytes
      };
    } catch (
      error
    ) {
      /*
       * A partially evicted cache must be treated as a miss. Cache is an
       * acceleration layer; the Spreadsheet remains authoritative.
       */
      try {
        invalidateIndexCacheStorageFmrV3_(
          cache,
          cacheKey
        );
      } catch (ignored) {
        // Fall through to a fresh authoritative read.
      }

      return {
        hit: false,
        strategy:
          'MISS',
        records: [],
        chunkCount: 0,
        serializedBytes: 0
      };
    }
  }

  /*
   * Legacy/small fast path.
   */
  const cached =
    cache.get(
      cacheKey
    );

  if (cached) {
    try {
      const records =
        JSON.parse(
          cached
        );

      if (
        Array.isArray(
          records
        )
      ) {
        return {
          hit: true,
          strategy:
            'SINGLE',
          records:
            records,
          chunkCount: 1,
          serializedBytes:
            indexCacheUtf8BytesFmrV3_(
              cached
            )
        };
      }
    } catch (ignored) {
      try {
        cache.remove(
          cacheKey
        );
      } catch (ignoredRemove) {}
    }
  }

  return {
    hit: false,
    strategy:
      'MISS',
    records: [],
    chunkCount: 0,
    serializedBytes: 0
  };
}

function invalidateIndexCacheStorageFmrV3_(
  cache,
  cacheKey
) {
  const metadataKey =
    indexCacheMetaKeyFmrV3_(
      cacheKey
    );

  const metadata =
    readChunkMetadataFmrV3_(
      cache,
      cacheKey
    );

  /*
   * Remove metadata first so no reader begins a chunked read while the
   * generation is being invalidated.
   */
  cache.remove(
    metadataKey
  );

  cache.remove(
    cacheKey
  );

  if (
    metadata &&
    Array.isArray(
      metadata.chunkKeys
    )
  ) {
    metadata.chunkKeys
      .forEach(
        function (chunkKey) {
          cache.remove(
            chunkKey
          );
        }
      );
  }
}

function writeIndexCacheRecordsFmrV3_(
  cache,
  cacheKey,
  records,
  ttl
) {
  const source =
    Array.isArray(
      records
    )
      ? records
      : [];

  const serialized =
    JSON.stringify(
      source
    );

  const serializedBytes =
    indexCacheUtf8BytesFmrV3_(
      serialized
    );

  try {
    if (
      serializedBytes <=
      FMR_V3_INDEX_CACHE_SAFE_VALUE_BYTES_
    ) {
      /*
       * Remove a previous chunked generation before restoring the ordinary
       * one-key fast path.
       */
      invalidateIndexCacheStorageFmrV3_(
        cache,
        cacheKey
      );

      cache.put(
        cacheKey,
        serialized,
        ttl
      );

      return {
        cached: true,
        strategy:
          'SINGLE',
        chunkCount: 1,
        recordCount:
          source.length,
        serializedBytes:
          serializedBytes
      };
    }

    const chunks =
      buildIndexCacheChunksFmrV3_(
        source,
        FMR_V3_INDEX_CACHE_SAFE_VALUE_BYTES_
      );

    if (
      chunks.length >
      FMR_V3_INDEX_CACHE_MAX_CHUNKS_
    ) {
      throw new Error(
        'Index cache result requires too many chunks.'
      );
    }

    /*
     * Start a new generation. Metadata is published LAST, so another reader
     * never sees a half-written generation.
     */
    const generation =
      Utilities
        .getUuid()
        .replace(
          /-/g,
          ''
        )
        .slice(
          0,
          12
        );

    const chunkKeys =
      chunks.map(
        function (_, index) {
          return indexCacheChunkKeyFmrV3_(
            cacheKey,
            generation,
            index
          );
        }
      );

    /*
     * Remove the previous generation and any legacy single-value entry.
     */
    invalidateIndexCacheStorageFmrV3_(
      cache,
      cacheKey
    );

    chunkKeys.forEach(
      function (
        chunkKey,
        index
      ) {
        /*
         * Individual puts are intentional. They prevent a large putAll()
         * argument from becoming another aggregate-size failure.
         */
        cache.put(
          chunkKey,
          chunks[index],
          ttl
        );
      }
    );

    const metadata = {
      version:
        FMR_V3_INDEX_CACHE_META_VERSION_,
      strategy:
        'CHUNKED',
      generation:
        generation,
      recordCount:
        source.length,
      serializedBytes:
        serializedBytes,
      chunkCount:
        chunkKeys.length,
      chunkKeys:
        chunkKeys
    };

    /*
     * Publish metadata last.
     */
    cache.put(
      indexCacheMetaKeyFmrV3_(
        cacheKey
      ),
      JSON.stringify(
        metadata
      ),
      ttl
    );

    return {
      cached: true,
      strategy:
        'CHUNKED',
      chunkCount:
        chunkKeys.length,
      recordCount:
        source.length,
      serializedBytes:
        serializedBytes
    };
  } catch (
    error
  ) {
    /*
     * Critical Alpha 30.5.5 behavior:
     * cache capacity/quota errors must NEVER make the FMR read itself fail.
     * The caller already has authoritative records from Sheets.
     */
    try {
      invalidateIndexCacheStorageFmrV3_(
        cache,
        cacheKey
      );
    } catch (ignored) {}

    console.warn(
      'Index cache bypassed for one key: ' +
      normalizeFmrV3_(
        error &&
        error.message
      )
    );

    return {
      cached: false,
      strategy:
        'BYPASS',
      chunkCount: 0,
      recordCount:
        source.length,
      serializedBytes:
        serializedBytes,
      error:
        normalizeFmrV3_(
          error &&
          error.message
        )
    };
  }
}

function inspectIndexCacheStorageFmrV3_(
  sheetName,
  exactKey
) {
  const key =
    normalizeUpperFmrV3_(
      exactKey
    );

  if (!key) {
    return {
      hit: false,
      strategy: 'MISS',
      recordCount: 0,
      chunkCount: 0,
      serializedBytes: 0
    };
  }

  const cache =
    CacheService
      .getScriptCache();

  const cacheKey =
    indexCacheKeyFmrV3_(
      sheetName,
      key
    );

  const read =
    readIndexCacheRecordsFmrV3_(
      cache,
      cacheKey
    );

  return {
    hit:
      read.hit,
    strategy:
      read.strategy,
    recordCount:
      (
        read.records ||
        []
      ).length,
    chunkCount:
      numberFmrV3_(
        read.chunkCount
      ),
    serializedBytes:
      numberFmrV3_(
        read.serializedBytes
      )
  };
}

function lookupIndexEntriesFmrV3_(
  sheetName,
  exactKey
) {
  const key =
    normalizeUpperFmrV3_(
      exactKey
    );

  if (!key) {
    return [];
  }

  const cache =
    CacheService
      .getScriptCache();

  const cacheKey =
    indexCacheKeyFmrV3_(
      sheetName,
      key
    );

  const cached =
    readIndexCacheRecordsFmrV3_(
      cache,
      cacheKey
    );

  if (
    cached.hit
  ) {
    return cached.records;
  }

  const rows =
    findRowsByExactValueFmrV3_(
      sheetName,
      1,
      key
    );

  const keyField =
    sheetName ===
      FMR_V3.SHEETS
        .SEARCH_INDEX
      ? 'Search_Key'
      : 'Index_Key';

  /*
   * Preserve Alpha 30.5.3's bounded/windowed Spreadsheet read optimization.
   */
  const records =
    readRowsObjectsBatchedFmrV3_(
      sheetName,
      rows,
      {
        maxGapRows: 4,
        maxGroups: 20
      }
    ).filter(
      function (record) {
        return (
          normalizeUpperFmrV3_(
            record[
              keyField
            ]
          ) ===
            key &&
          yesFmrV3_(
            record.Active
          )
        );
      }
    );

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

  /*
   * The result returned to the caller is never dependent on cache success.
   */
  writeIndexCacheRecordsFmrV3_(
    cache,
    cacheKey,
    records,
    ttl
  );

  return records;
}

function invalidateIndexKeyFmrV3_(
  sheetName,
  exactKey
) {
  const key =
    normalizeUpperFmrV3_(
      exactKey
    );

  if (!key) {
    return;
  }

  const cache =
    CacheService
      .getScriptCache();

  invalidateIndexCacheStorageFmrV3_(
    cache,
    indexCacheKeyFmrV3_(
      sheetName,
      key
    )
  );
}

function appendSearchIndexEntriesFmrV3_(
  entries
) {
  const rows =
    appendObjectsFmrV3_(
      FMR_V3.SHEETS
        .SEARCH_INDEX,
      entries
    );

  (
    entries ||
    []
  ).forEach(
    function (entry) {
      invalidateIndexKeyFmrV3_(
        FMR_V3.SHEETS
          .SEARCH_INDEX,
        entry.Search_Key
      );
    }
  );

  return rows;
}

function appendOperationalIndexEntriesFmrV3_(
  entries
) {
  const rows =
    appendObjectsFmrV3_(
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX,
      entries
    );

  (
    entries ||
    []
  ).forEach(
    function (entry) {
      invalidateIndexKeyFmrV3_(
        FMR_V3.SHEETS
          .OPERATIONAL_INDEX,
        entry.Index_Key
      );
    }
  );

  return rows;
}

function deactivateExactIndexRowsFmrV3_(
  sheetName,
  exactKey,
  entityId
) {
  const key =
    normalizeUpperFmrV3_(
      exactKey
    );

  const targetEntityId =
    normalizeFmrV3_(
      entityId
    );

  if (!key) {
    return;
  }

  let records = [];

  if (
    targetEntityId &&
    sheetName ===
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX
  ) {
    const contract =
      headerMapFmrV3_(
        sheetName
      );

    if (
      !Object.prototype
        .hasOwnProperty
        .call(
          contract.indexByHeader,
          'Entity_ID'
        )
    ) {
      throw new Error(
        'Operational_Index Entity_ID column is unavailable.'
      );
    }

    const entityIdColumn =
      contract
        .indexByHeader
        .Entity_ID +
      1;

    const rows =
      findRowsByExactValueFmrV3_(
        sheetName,
        entityIdColumn,
        targetEntityId
      );

    records =
      readRowsObjectsFmrV3_(
        sheetName,
        rows
      )
        .filter(
          function (
            record
          ) {
            return (
              normalizeUpperFmrV3_(
                record.Index_Key
              ) ===
                key &&
              yesFmrV3_(
                record.Active
              )
            );
          }
        );
  } else {
    records =
      lookupIndexEntriesFmrV3_(
        sheetName,
        key
      );
  }

  records.forEach(
    function (
      record
    ) {
      if (
        !targetEntityId ||
        normalizeFmrV3_(
          record.Entity_ID ||
          record.FMR_Line_ID
        ) ===
          targetEntityId
      ) {
        updateRowObjectFmrV3_(
          sheetName,
          record._rowNumber,
          {
            Active:
              FMR_V3.NO,

            Updated_At:
              nowFmrV3_()
          }
        );
      }
    }
  );

  invalidateIndexKeyFmrV3_(
    sheetName,
    key
  );
}


function buildSearchEntriesForPublishedLineFmrV3_(
  header,
  headerRow,
  line,
  lineRow
) {
  const version =
    numberFmrV3_(
      getConfigurationFmrV3_()
        .SEARCH_INDEX_VERSION
    ) ||
    1;

  const common = {
    FMR_ID:
      line.FMR_ID,
    FMR_Number:
      line.FMR_Number,
    FMR_Line_ID:
      line.FMR_Line_ID,
    Header_Row:
      headerRow,
    Line_Row:
      lineRow,
    ISO_Key:
      line.ISO_Key,
    Active:
      FMR_V3.YES,
    Index_Version:
      version,
    Updated_At:
      nowFmrV3_()
  };

  return [
    Object.assign(
      {
        Search_Key:
          fmrSearchKeyFmrV3_(
            header
              .FMR_Number
          ),
        Search_Type:
          'FMR'
      },
      common
    ),
    Object.assign(
      {
        Search_Key:
          `ISO:${line.ISO_Key}`,
        Search_Type:
          'ISO'
      },
      common
    ),
    Object.assign(
      {
        Search_Key:
          lineSearchKeyFmrV3_(
            line
              .FMR_Line_ID
          ),
        Search_Type:
          'LINE'
      },
      common
    )
  ];
}

function getLineByIdFmrV3_(
  lineId
) {
  const entries =
    lookupIndexEntriesFmrV3_(
      FMR_V3.SHEETS
        .SEARCH_INDEX,
      lineSearchKeyFmrV3_(
        lineId
      )
    );

  if (
    !entries.length
  ) {
    throw new Error(
      `FMR line not found: ${lineId}`
    );
  }

  return readRowObjectFmrV3_(
    FMR_V3.SHEETS
      .LINES,
    entries[0]
      .Line_Row
  );
}

function lookupOperationalRowsFmrV3_(
  type,
  value
) {
  return lookupIndexEntriesFmrV3_(
    FMR_V3.SHEETS
      .OPERATIONAL_INDEX,
    operationalIndexKeyFmrV3_(
      type,
      value
    )
  );
}
