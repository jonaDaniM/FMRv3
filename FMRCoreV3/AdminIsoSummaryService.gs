const FMR_V3_ADMIN_ISO_SUMMARY =
  Object.freeze({
    source:
      'SEARCH_INDEX_VISIBLE_PAGE_ONLY',

    displayMode:
      'ISO_NUMBER_WITH_FINAL_TWO_DIGIT_SUFFIX',

    maximumDisplayedReferences:
      3,

    materialLineLoadingPolicy:
      'DETAIL_ONLY',

    replacedColumn:
      'DATE_REQUIRED',

    visibleColumn:
      'ISO_CHILDREN',

    searchInputMode:
      'HYPHEN_SUFFIX_WITH_CANONICAL_AND_PRESERVED_FALLBACK'
  });

function splitAdminIsoKeyFmrV3_(
  isoKey
) {
  const value =
    normalizeUpperFmrV3_(
      isoKey
    );

  const splitIndex =
    value.lastIndexOf(
      '|'
    );

  if (
    splitIndex <= 0 ||
    splitIndex >=
      value.length - 1
  ) {
    return null;
  }

  const isoNumber =
    normalizeUpperFmrV3_(
      value.slice(
        0,
        splitIndex
      )
    );

  const isoSheet =
    normalizeUpperFmrV3_(
      value.slice(
        splitIndex + 1
      )
    );

  if (
    !isoNumber ||
    !isoSheet
  ) {
    return null;
  }

  const numericSheet =
    Number(
      isoSheet
    );

  const displaySheet =
    (
      Number.isInteger(
        numericSheet
      ) &&
      numericSheet >=
        0 &&
      numericSheet <=
        99
    )
      ? String(
          numericSheet
        ).padStart(
          2,
          '0'
        )
      : isoSheet;

  return {
    isoNumber:
      isoNumber,

    isoSheet:
      isoSheet,

    displaySheet:
      displaySheet,

    isoKey:
      (
        isoNumber +
        '|' +
        isoSheet
      ),

    display:
      (
        isoNumber +
        '-' +
        displaySheet
      ),

    searchValue:
      (
        isoNumber +
        '-' +
        displaySheet
      )
  };
}

function compareAdminIsoReferencesFmrV3_(
  left,
  right
) {
  const isoComparison =
    normalizeFmrV3_(
      left.isoNumber
    ).localeCompare(
      normalizeFmrV3_(
        right.isoNumber
      ),
      undefined,
      {
        numeric:
          true,

        sensitivity:
          'base'
      }
    );

  if (
    isoComparison !==
    0
  ) {
    return isoComparison;
  }

  return normalizeFmrV3_(
    left.isoSheet
  ).localeCompare(
    normalizeFmrV3_(
      right.isoSheet
    ),
    undefined,
    {
      numeric:
        true,

      sensitivity:
        'base'
    }
  );
}

function indexedAdminIsoReferencesFmrV3_(
  record
) {
  const source =
    record || {};

  const fmrNumber =
    normalizeFmrV3_(
      source.fmrNumber ||
      source.FMR_Number
    );

  const fmrId =
    normalizeFmrV3_(
      source.fmrId ||
      source.FMR_ID
    );

  if (!fmrNumber) {
    return [];
  }

  const entries =
    lookupIndexEntriesFmrV3_(
      FMR_V3.SHEETS
        .SEARCH_INDEX,
      fmrSearchKeyFmrV3_(
        fmrNumber
      )
    );

  const references = {};

  entries.forEach(
    function (
      entry
    ) {
      if (
        !yesFmrV3_(
          entry.Active
        )
      ) {
        return;
      }

      if (
        fmrId &&
        normalizeFmrV3_(
          entry.FMR_ID
        ) !==
          fmrId
      ) {
        return;
      }

      const parsed =
        splitAdminIsoKeyFmrV3_(
          entry.ISO_Key
        );

      if (!parsed) {
        return;
      }

      references[
        parsed.isoKey
      ] = parsed;
    }
  );

  return Object.keys(
    references
  )
    .map(
      function (
        key
      ) {
        return references[
          key
        ];
      }
    )
    .sort(
      compareAdminIsoReferencesFmrV3_
    );
}

function enrichAdminRegisterRecordWithIsoFmrV3_(
  record
) {
  const source =
    record || {};

  const references =
    indexedAdminIsoReferencesFmrV3_(
      source
    );

  const isoNumbers =
    Array.from(
      new Set(
        references.map(
          function (
            reference
          ) {
            return reference
              .isoNumber;
          }
        )
      )
    );

  return Object.assign(
    {},
    source,
    {
      isoReferences:
        references,

      isoReferenceCount:
        references.length,

      isoNumbers:
        isoNumbers,

      isoNumberCount:
        isoNumbers.length,

      primaryIsoNumber:
        references.length
          ? references[0]
              .isoNumber
          : '',

      primaryIsoSheet:
        references.length
          ? references[0]
              .isoSheet
          : '',

      primaryIsoKey:
        references.length
          ? references[0]
              .isoKey
          : '',

      hasMultipleIsoReferences:
        references.length >
        1,

      isoSummarySource:
        FMR_V3_ADMIN_ISO_SUMMARY
          .source
    }
  );
}

function enrichAdminRegisterWithIsoSummariesFmrV3_(
  register
) {
  const source =
    register || {};

  const records =
    Array.isArray(
      source.records
    )
      ? source.records
      : [];

  return Object.assign(
    {},
    source,
    {
      records:
        records.map(
          enrichAdminRegisterRecordWithIsoFmrV3_
        ),

      isoSummaryPolicy: {
        source:
          FMR_V3_ADMIN_ISO_SUMMARY
            .source,

        displayMode:
          FMR_V3_ADMIN_ISO_SUMMARY
            .displayMode,

        maximumDisplayedReferences:
          FMR_V3_ADMIN_ISO_SUMMARY
            .maximumDisplayedReferences,

        materialLineLoadingPolicy:
          FMR_V3_ADMIN_ISO_SUMMARY
            .materialLineLoadingPolicy,

        replacedColumn:
          FMR_V3_ADMIN_ISO_SUMMARY
            .replacedColumn,

        visibleColumn:
          FMR_V3_ADMIN_ISO_SUMMARY
            .visibleColumn
      }
    }
  );
}

function inspectFmrV3AdminIsoSummaryContract() {
  const activeHeaders =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .HEADERS
    )
      .filter(
        function (
          row
        ) {
          return yesFmrV3_(
            row.Active
          );
        }
      )
      .slice(
        0,
        25
      );

  const sampleRecords =
    activeHeaders.map(
      function (
        row
      ) {
        return {
          fmrId:
            normalizeFmrV3_(
              row.FMR_ID
            ),

          fmrNumber:
            normalizeFmrV3_(
              row.FMR_Number
            ),

          totalLines:
            numberFmrV3_(
              row.Total_Lines
            )
        };
      }
    );

  const enriched =
    sampleRecords.map(
      enrichAdminRegisterRecordWithIsoFmrV3_
    );

  const missing =
    enriched.filter(
      function (
        record
      ) {
        return (
          numberFmrV3_(
            record.totalLines
          ) >
            0 &&
          numberFmrV3_(
            record.isoReferenceCount
          ) ===
            0
        );
      }
    );

  const multiIso =
    enriched.filter(
      function (
        record
      ) {
        return (
          numberFmrV3_(
            record.isoReferenceCount
          ) >
          1
        );
      }
    );

  const output = {
    passed:
      true,

    dataPassed:
      missing.length ===
        0,

    readOnly:
      true,

    version:
      FMR_V3.VERSION,

    summarySource:
      FMR_V3_ADMIN_ISO_SUMMARY
        .source,

    displayMode:
      FMR_V3_ADMIN_ISO_SUMMARY
        .displayMode,

    maximumDisplayedReferences:
      FMR_V3_ADMIN_ISO_SUMMARY
        .maximumDisplayedReferences,

    materialLineLoadingPolicy:
      FMR_V3_ADMIN_ISO_SUMMARY
        .materialLineLoadingPolicy,

    replacedColumn:
      FMR_V3_ADMIN_ISO_SUMMARY
        .replacedColumn,

    visibleColumn:
      FMR_V3_ADMIN_ISO_SUMMARY
        .visibleColumn,

    searchInputMode:
      FMR_V3_ADMIN_ISO_SUMMARY
        .searchInputMode,

    searchCandidateSamples: [
      {
        input:
          'LP131-PV-180003-17',

        candidates:
          isoSuffixSearchCandidatesFmrV3_(
            'LP131-PV-180003-17',
            'ISO'
          )
      },
      {
        input:
          'LP131-SYLR(-20)-805002-04',

        candidates:
          isoSuffixSearchCandidatesFmrV3_(
            'LP131-SYLR(-20)-805002-04',
            'ISO'
          )
      }
    ],

    inspectedFmrCount:
      enriched.length,

    missingIsoSummaryCount:
      missing.length,

    missingIsoSummarySamples:
      missing
        .slice(
          0,
          10
        )
        .map(
          function (
            record
          ) {
            return {
              fmrNumber:
                record.fmrNumber,

              fmrId:
                record.fmrId,

              totalLines:
                record.totalLines
            };
          }
        ),

    multiIsoFmrCount:
      multiIso.length,

    multiIsoSamples:
      multiIso
        .slice(
          0,
          10
        )
        .map(
          function (
            record
          ) {
            return {
              fmrNumber:
                record.fmrNumber,

              isoReferenceCount:
                record
                  .isoReferenceCount,

              isoReferences:
                record
                  .isoReferences
            };
          }
        ),

    sample:
      enriched
        .slice(
          0,
          10
        )
        .map(
          function (
            record
          ) {
            return {
              fmrNumber:
                record.fmrNumber,

              isoReferenceCount:
                record
                  .isoReferenceCount,

              isoReferences:
                record
                  .isoReferences
            };
          }
        )
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

function runFmrV3AdminIsoSummaryContractDiagnostic() {
  setFmrV3DatabaseContext_(
    FMR_V3_DATABASE_ID_ ||
    FMR_V3.DEFAULT_DATABASE_ID
  );

  return inspectFmrV3AdminIsoSummaryContract();
}
