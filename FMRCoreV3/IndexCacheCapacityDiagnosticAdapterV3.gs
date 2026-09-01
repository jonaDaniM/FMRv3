/**
 * Alpha 30.5.5 read-only diagnostic for high-cardinality Search/Operational
 * index cache entries.
 *
 * It invalidates cache entries only; it does not modify spreadsheet data.
 */
function runFmrV3IndexCacheCapacityDiagnostic(
  databaseId,
  userEmail
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  const user =
    assertSearchUserFmrV3_(
      userEmail
    );

  const cases = [
    {
      name:
        'ACTIVE_BAGS',
      sheetName:
        FMR_V3.SHEETS
          .OPERATIONAL_INDEX,
      exactKey:
        operationalIndexKeyFmrV3_(
          'BAGSTATUS',
          'ACTIVE'
        )
    },
    {
      name:
        'BACKORDERS_PENDING',
      sheetName:
        FMR_V3.SHEETS
          .OPERATIONAL_INDEX,
      exactKey:
        operationalIndexKeyFmrV3_(
          'BACKORDERSTATUS',
          'Pending Admin Review'
        )
    },
    {
      name:
        'BACKORDERS_PARTIAL',
      sheetName:
        FMR_V3.SHEETS
          .OPERATIONAL_INDEX,
      exactKey:
        operationalIndexKeyFmrV3_(
          'BACKORDERSTATUS',
          'Partially Confirmed'
        )
    }
  ];

  const results =
    cases.map(
      function (testCase) {
        const output = {
          name:
            testCase.name,
          exactKey:
            testCase.exactKey,
          coldMs: 0,
          warmMs: 0,
          recordCount: 0,
          warmRecordCount: 0,
          cacheHit:
            false,
          cacheStrategy:
            'MISS',
          cacheChunkCount: 0,
          serializedBytes: 0,
          passed:
            false
        };

        try {
          invalidateIndexKeyFmrV3_(
            testCase
              .sheetName,
            testCase
              .exactKey
          );

          const coldStarted =
            Date.now();

          const coldRecords =
            lookupIndexEntriesFmrV3_(
              testCase
                .sheetName,
              testCase
                .exactKey
            );

          output.coldMs =
            Date.now() -
            coldStarted;

          output.recordCount =
            coldRecords.length;

          const afterCold =
            inspectIndexCacheStorageFmrV3_(
              testCase
                .sheetName,
              testCase
                .exactKey
            );

          const warmStarted =
            Date.now();

          const warmRecords =
            lookupIndexEntriesFmrV3_(
              testCase
                .sheetName,
              testCase
                .exactKey
            );

          output.warmMs =
            Date.now() -
            warmStarted;

          output.warmRecordCount =
            warmRecords.length;

          const afterWarm =
            inspectIndexCacheStorageFmrV3_(
              testCase
                .sheetName,
              testCase
                .exactKey
            );

          output.cacheHit =
            Boolean(
              afterWarm.hit
            );

          output.cacheStrategy =
            afterWarm.strategy;

          output.cacheChunkCount =
            afterWarm.chunkCount;

          output.serializedBytes =
            afterWarm
              .serializedBytes ||
            afterCold
              .serializedBytes ||
            0;

          output.passed =
            (
              output
                .recordCount ===
                output
                  .warmRecordCount &&
              output
                .cacheHit ===
                true &&
              [
                'SINGLE',
                'CHUNKED'
              ].includes(
                output
                  .cacheStrategy
              )
            );
        } catch (
          error
        ) {
          output.error =
            normalizeFmrV3_(
              error &&
              error.message
            );

          output.passed =
            false;
        }

        return output;
      }
    );

  const output = {
    passed:
      results.every(
        function (result) {
          return (
            result.passed ===
            true
          );
        }
      ),
    readOnly:
      true,
    cacheMutationOnly:
      true,
    version:
      FMR_V3.VERSION,
    databaseFingerprint:
      databaseFingerprintFmrV3_(),
    user:
      user.email,
    safeValueBytes:
      FMR_V3_INDEX_CACHE_SAFE_VALUE_BYTES_,
    cases:
      results
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (
    !output.passed
  ) {
    throw new Error(
      'FMR v3 index cache capacity diagnostic failed.'
    );
  }

  return output;
}
