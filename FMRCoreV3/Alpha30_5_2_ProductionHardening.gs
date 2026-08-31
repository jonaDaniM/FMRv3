
const FMR_V3_ALPHA30_5_2 = Object.freeze({
  version: '3.0.0-alpha.30.5.2',

  productionDatabaseId:
    '1dB9drNelT2D9OCy6tUyzGrqta4CBFC6P-x2WTlCLb4E',

  productionFingerprint:
    'Pbbv5bSG3STZ',

  dateRepairExpectedSourceDates: Object.freeze({
    '653': '2026-07-24',
    '654': '2026-07-24',
    '655': '2026-07-24',
    '656': '2026-07-24',
    '657': '2026-07-24',
    '658': '2026-07-24',

    '666': '2026-07-21',

    '667': '2026-07-24',
    '668': '2026-07-24',
    '669': '2026-07-24',

    '670': '2026-07-27',
    '671': '2026-07-27',
    '672': '2026-07-27',
    '673': '2026-07-27',
    '674': '2026-07-27',

    '791': '2026-08-10',

    '811': '2026-08-18',
    '812': '2026-08-18',

    '930': '2026-08-27'
  }),

  orphanBackorder: Object.freeze({
    fmrNumber: '209',
    lineId:
      'FMRLINE-9FCBEEC9-5789-4A95-B0BA-F23305F788A8',

    orphanRequestId:
      'BACKORDER-49F182BB-C569-402C-9617-1DFF70D94A5A',

    keeperRequestId:
      'BACKORDER-4622291F-A57C-4B66-B68F-BD82AD37DCBB',

    expectedPendingQuantity: 3
  }),

  excludedManualReview: Object.freeze([
    Object.freeze({
      fmrNumber: '803',
      reason:
        'Bulk Import source shows 2026-07-23 while published/staging shows ' +
        '2026-07-26. This is a different pattern from the 1969 conversion bug ' +
        'and is intentionally NOT auto-repaired.'
    })
  ])
});


function alpha30_5_2TimezoneFmrV3_() {
  try {
    const timezone =
      normalizeFmrV3_(
        fmrV3Database_()
          .getSpreadsheetTimeZone()
      );

    if (timezone) {
      return timezone;
    }
  } catch (error) {
    // Continue to configured/script timezone fallbacks.
  }

  try {
    const configured =
      normalizeFmrV3_(
        getConfigurationFmrV3_()
          .TIMEZONE
      );

    if (configured) {
      return configured;
    }
  } catch (error) {
    // Continue to script timezone fallback.
  }

  return (
    normalizeFmrV3_(
      Session.getScriptTimeZone()
    ) ||
    'America/Indiana/Indianapolis'
  );
}


function alpha30_5_2CalendarYmdFmrV3_(
  value
) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return '';
  }

  const timezone =
    alpha30_5_2TimezoneFmrV3_();

  if (
    Object.prototype.toString.call(
      value
    ) === '[object Date]'
  ) {
    const milliseconds =
      value.getTime();

    if (
      !Number.isFinite(
        milliseconds
      )
    ) {
      return '';
    }

    return Utilities.formatDate(
      value,
      timezone,
      'yyyy-MM-dd'
    );
  }

  const source =
    normalizeFmrV3_(
      value
    );

  if (!source) {
    return '';
  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      source
    )
  ) {
    return source;
  }

  /**
   * ISO-like timestamps are acceptable because their calendar date can be
   * safely normalized into the project timezone. Ambiguous M/D/Y or D/M/Y
   * strings are intentionally not guessed here.
   */
  if (
    /^\d{4}-\d{2}-\d{2}[T\s]/.test(
      source
    )
  ) {
    const parsed =
      new Date(
        source
      );

    if (
      Number.isFinite(
        parsed.getTime()
      )
    ) {
      return Utilities.formatDate(
        parsed,
        timezone,
        'yyyy-MM-dd'
      );
    }
  }

  return '';
}


function alpha30_5_2DateObjectFromYmdFmrV3_(
  ymd
) {
  const source =
    normalizeFmrV3_(
      ymd
    );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      source
    )
  ) {
    throw new Error(
      'Date Required must resolve to YYYY-MM-DD.'
    );
  }

  const timezone =
    alpha30_5_2TimezoneFmrV3_();

  const parsed =
    Utilities.parseDate(
      source + ' 12:00:00',
      timezone,
      'yyyy-MM-dd HH:mm:ss'
    );

  const roundTrip =
    Utilities.formatDate(
      parsed,
      timezone,
      'yyyy-MM-dd'
    );

  if (
    roundTrip !== source
  ) {
    throw new Error(
      'Date Required could not be round-tripped safely: ' +
      source +
      '.'
    );
  }

  return parsed;
}


/**
 * OwnerService.gs calls this helper from validateStagePayloadFmrV3_.
 *
 * IMPORTANT:
 * - Handles native Date objects returned by SpreadsheetApp.getValues().
 * - Handles YYYY-MM-DD strings from the browser/manual staging form.
 * - Rejects suspicious epoch-era dates rather than silently publishing them.
 */
function normalizeStageDateRequiredAlpha30_5_2_(
  value
) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return '';
  }

  const ymd =
    alpha30_5_2CalendarYmdFmrV3_(
      value
    );

  if (!ymd) {
    throw new Error(
      'Date Required is present but could not be interpreted safely. ' +
      'Use YYYY-MM-DD.'
    );
  }

  if (
    ymd < '2000-01-01' ||
    ymd > '2100-12-31'
  ) {
    throw new Error(
      'Date Required is outside the allowed safety range: ' +
      ymd +
      '. Review the source FMR before staging.'
    );
  }

  return alpha30_5_2DateObjectFromYmdFmrV3_(
    ymd
  );
}


function alpha30_5_2HeaderColumnFmrV3_(
  sheetName,
  header
) {
  const contract =
    headerMapFmrV3_(
      sheetName
    );

  if (
    !Object.prototype
      .hasOwnProperty.call(
        contract.indexByHeader,
        header
      )
  ) {
    throw new Error(
      'Missing expected header "' +
      header +
      '" on ' +
      sheetName +
      '.'
    );
  }

  return (
    contract.indexByHeader[
      header
    ] +
    1
  );
}


function alpha30_5_2RowsByHeaderValueFmrV3_(
  sheetName,
  header,
  value
) {
  return findRowsByExactValueFmrV3_(
    sheetName,
    alpha30_5_2HeaderColumnFmrV3_(
      sheetName,
      header
    ),
    value
  );
}


/**
 * FieldService.gs calls this before creating a new backorder request.
 *
 * The guard intentionally reads Backorder_Requests directly rather than
 * trusting Operational_Index. A partially completed prior request can exist
 * before every expected index row has been written.
 */
function alpha30_5_2ActiveBackorderTotalsForLineFmrV3_(
  lineId
) {
  const normalizedLineId =
    normalizeFmrV3_(
      lineId
    );

  if (!normalizedLineId) {
    throw new Error(
      'FMR Line ID is required for the backorder integrity guard.'
    );
  }

  const rows =
    alpha30_5_2RowsByHeaderValueFmrV3_(
      FMR_V3.SHEETS.BACKORDERS,
      'FMR_Line_ID',
      normalizedLineId
    );

  const records =
    readRowsObjectsFmrV3_(
      FMR_V3.SHEETS.BACKORDERS,
      rows
    );

  let pending = 0;
  let confirmed = 0;

  const activeRecords = [];

  records.forEach(
    function (
      request
    ) {
      if (
        !yesFmrV3_(
          request.Active
        )
      ) {
        return;
      }

      const status =
        normalizeUpperFmrV3_(
          request.Status
        );

      if (
        [
          'PENDING ADMIN REVIEW',
          'PARTIALLY CONFIRMED'
        ].includes(
          status
        )
      ) {
        pending +=
          numberFmrV3_(
            request.Qty_Pending
          );
      }

      if (
        [
          'CONFIRMED',
          'PARTIALLY CONFIRMED'
        ].includes(
          status
        )
      ) {
        confirmed +=
          numberFmrV3_(
            request
              .Qty_Confirmed_Backorder
          );
      }

      activeRecords.push({
        requestId:
          normalizeFmrV3_(
            request
              .Backorder_Request_ID
          ),

        status:
          normalizeFmrV3_(
            request.Status
          ),

        qtyPending:
          numberFmrV3_(
            request.Qty_Pending
          ),

        qtyConfirmed:
          numberFmrV3_(
            request
              .Qty_Confirmed_Backorder
          )
      });
    }
  );

  return {
    pending:
      pending,

    confirmed:
      confirmed,

    activeRecords:
      activeRecords
  };
}


function assertBackorderRequestParityBeforeSubmitAlpha30_5_2_(
  line,
  state
) {
  const totals =
    alpha30_5_2ActiveBackorderTotalsForLineFmrV3_(
      line.FMR_Line_ID
    );

  const linePending =
    numberFmrV3_(
      state.pendingBackorder
    );

  const lineConfirmed =
    numberFmrV3_(
      state.confirmedBackorder
    );

  const tolerance =
    0.000001;

  const pendingMismatch =
    Math.abs(
      totals.pending -
      linePending
    ) >
    tolerance;

  const confirmedMismatch =
    Math.abs(
      totals.confirmed -
      lineConfirmed
    ) >
    tolerance;

  if (
    pendingMismatch ||
    confirmedMismatch
  ) {
    throw new Error(
      (
        'Backorder integrity guard blocked this submission for FMR ' +
        normalizeFmrV3_(
          line.FMR_Number
        ) +
        ', line ' +
        normalizeFmrV3_(
          line.Line_Number
        ) +
        '. FMR_Line_Items reports pending=' +
        linePending +
        ' and confirmed=' +
        lineConfirmed +
        ', while active Backorder_Requests reports pending=' +
        totals.pending +
        ' and confirmed=' +
        totals.confirmed +
        '. No new backorder was created. Run the Owner integrity repair ' +
        'before retrying.'
      )
    );
  }

  return totals;
}


/**
 * Used by the Operational Readiness UI patch when a hard failure exists.
 * This keeps the red FAIL state and the explanatory text consistent.
 */
function operationalHardFailureMessagesAlpha30_5_2_(
  schema,
  integrity,
  systemControl
) {
  const messages = [];

  if (
    schema &&
    !schema.passed
  ) {
    const missing =
      Array.isArray(
        schema.missingSheets
      )
        ? schema.missingSheets.length
        : 0;

    const headers =
      Array.isArray(
        schema.headerMismatches
      )
        ? schema.headerMismatches.length
        : 0;

    messages.push(
      'Schema check failed' +
      (
        missing || headers
          ? (
              ' (' +
              missing +
              ' missing sheet(s), ' +
              headers +
              ' header mismatch(es)).'
            )
          : '.'
      )
    );
  }

  if (
    integrity &&
    !integrity.passed
  ) {
    messages.push(
      (
        'Integrity check failed (' +
        numberFmrV3_(
          integrity.lineIssueCount
        ) +
        ' line issue(s), ' +
        numberFmrV3_(
          integrity.headerIssueCount
        ) +
        ' header issue(s), ' +
        numberFmrV3_(
          integrity.bagIndexIssueCount
        ) +
        ' Bag index issue(s)).'
      )
    );
  }

  if (
    systemControl &&
    !systemControl.passed
  ) {
    messages.push(
      'System-control contract failed. Review Owner/User configuration.'
    );
  }

  return messages;
}


function alpha30_5_2AssertProductionOwnerFmrV3_() {
  setFmrV3DatabaseContext_(
    FMR_V3_ALPHA30_5_2
      .productionDatabaseId
  );

  const environment =
    runtimeEnvironmentFmrV3_(
      ''
    );

  const fingerprint =
    databaseFingerprintFmrV3_();

  if (
    normalizeUpperFmrV3_(
      environment.environmentName
    ) !==
    'PRODUCTION'
  ) {
    throw new Error(
      'Alpha 30.5.2 repair refused to run because ENVIRONMENT_NAME is not PRODUCTION.'
    );
  }

  if (
    fingerprint !==
    FMR_V3_ALPHA30_5_2
      .productionFingerprint
  ) {
    throw new Error(
      (
        'Alpha 30.5.2 repair refused to run against database fingerprint ' +
        fingerprint +
        '. Expected ' +
        FMR_V3_ALPHA30_5_2
          .productionFingerprint +
        '.'
      )
    );
  }

  const email =
    normalizeEmailFmrV3_(
      Session
        .getEffectiveUser()
        .getEmail()
    );

  const owner =
    assertOwnerFmrV3_(
      email
    );

  return {
    owner:
      owner,

    environment:
      environment,

    fingerprint:
      fingerprint
  };
}


function alpha30_5_2OneRowFmrV3_(
  sheetName,
  header,
  value
) {
  const rows =
    alpha30_5_2RowsByHeaderValueFmrV3_(
      sheetName,
      header,
      value
    );

  if (
    rows.length !== 1
  ) {
    return {
      found:
        false,

      count:
        rows.length,

      rowNumber:
        0,

      record:
        null
    };
  }

  return {
    found:
      true,

    count:
      1,

    rowNumber:
      rows[0],

    record:
      readRowObjectFmrV3_(
        sheetName,
        rows[0]
      )
  };
}


function alpha30_5_2SourceDateEvidenceFmrV3_(
  fmrNumber
) {
  const rows =
    alpha30_5_2RowsByHeaderValueFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .ITEMS,
      'Official_FMR_Number',
      fmrNumber
    );

  const records =
    readRowsObjectsFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .ITEMS,
      rows
    );

  const values =
    Array.from(
      new Set(
        records
          .map(
            function (
              row
            ) {
              return alpha30_5_2CalendarYmdFmrV3_(
                row.Date_Required
              );
            }
          )
          .filter(Boolean)
      )
    );

  return {
    rowCount:
      records.length,

    uniqueDates:
      values,

    unambiguous:
      values.length === 1,

    dateRequired:
      values.length === 1
        ? values[0]
        : ''
  };
}


function alpha30_5_2BadEpochDateFmrV3_(
  ymd
) {
  const value =
    normalizeFmrV3_(
      ymd
    );

  return (
    Boolean(value) &&
    value <
      '2000-01-01'
  );
}


function alpha30_5_2PreviewDateRepairFmrV3_() {
  const expected =
    FMR_V3_ALPHA30_5_2
      .dateRepairExpectedSourceDates;

  const results = [];

  Object.keys(
    expected
  )
    .sort(
      function (
        left,
        right
      ) {
        return (
          Number(left) -
          Number(right)
        );
      }
    )
    .forEach(
      function (
        fmrNumber
      ) {
        const headerLookup =
          alpha30_5_2OneRowFmrV3_(
            FMR_V3.SHEETS.HEADERS,
            'FMR_Number',
            fmrNumber
          );

        const source =
          alpha30_5_2SourceDateEvidenceFmrV3_(
            fmrNumber
          );

        let stagingLookup = {
          found:
            false,
          count:
            0,
          rowNumber:
            0,
          record:
            null
        };

        if (
          headerLookup.found
        ) {
          const stagingId =
            normalizeFmrV3_(
              headerLookup
                .record
                .Source_Staging_ID
            );

          if (
            stagingId
          ) {
            stagingLookup =
              alpha30_5_2OneRowFmrV3_(
                FMR_V3.SHEETS
                  .STAGING_HEADERS,
                'Staging_FMR_ID',
                stagingId
              );
          }
        }

        const expectedDate =
          expected[
            fmrNumber
          ];

        const publishedDate =
          headerLookup.found
            ? alpha30_5_2CalendarYmdFmrV3_(
                headerLookup
                  .record
                  .Date_Required
              )
            : '';

        const stagedDate =
          stagingLookup.found
            ? alpha30_5_2CalendarYmdFmrV3_(
                stagingLookup
                  .record
                  .Date_Required
              )
            : '';

        const sourceMatches =
          source.unambiguous &&
          source.dateRequired ===
            expectedDate;

        const publishedEligible =
          alpha30_5_2BadEpochDateFmrV3_(
            publishedDate
          );

        const stagingEligible =
          alpha30_5_2BadEpochDateFmrV3_(
            stagedDate
          );

        const publishedCorrect =
          publishedDate ===
          expectedDate;

        const stagingCorrect =
          stagedDate ===
          expectedDate;

        const blockedReasons = [];

        if (
          !headerLookup.found
        ) {
          blockedReasons.push(
            'Published FMR header did not resolve to exactly one row.'
          );
        }

        if (
          !stagingLookup.found
        ) {
          blockedReasons.push(
            'Source staging header did not resolve to exactly one row.'
          );
        }

        if (
          !sourceMatches
        ) {
          blockedReasons.push(
            (
              'Bulk Import source date is not the expected unambiguous date. ' +
              'Expected ' +
              expectedDate +
              '; source values=' +
              JSON.stringify(
                source.uniqueDates
              ) +
              '.'
            )
          );
        }

        if (
          headerLookup.found &&
          !publishedEligible &&
          !publishedCorrect
        ) {
          blockedReasons.push(
            (
              'Published Date Required is neither the known epoch defect nor the expected date: ' +
              (
                publishedDate ||
                '[blank]'
              ) +
              '.'
            )
          );
        }

        if (
          stagingLookup.found &&
          !stagingEligible &&
          !stagingCorrect
        ) {
          blockedReasons.push(
            (
              'Staging Date Required is neither the known epoch defect nor the expected date: ' +
              (
                stagedDate ||
                '[blank]'
              ) +
              '.'
            )
          );
        }

        const blocked =
          blockedReasons.length >
          0;

        const eligible =
          (
            !blocked &&
            (
              publishedEligible ||
              stagingEligible
            )
          );

        const alreadyCorrect =
          (
            !blocked &&
            publishedCorrect &&
            stagingCorrect
          );

        results.push({
          fmrNumber:
            fmrNumber,

          expectedSourceDate:
            expectedDate,

          sourceEvidence:
            source,

          publishedRow:
            headerLookup.rowNumber,

          stagingRow:
            stagingLookup.rowNumber,

          stagingFmrId:
            headerLookup.found
              ? normalizeFmrV3_(
                  headerLookup
                    .record
                    .Source_Staging_ID
                )
              : '',

          publishedDate:
            publishedDate,

          stagedDate:
            stagedDate,

          eligible:
            eligible,

          alreadyCorrect:
            alreadyCorrect,

          blocked:
            blocked,

          blockedReasons:
            blockedReasons
        });
      }
    );

  return {
    count:
      results.length,

    eligible:
      results.filter(
        function (
          row
        ) {
          return row.eligible;
        }
      ).length,

    alreadyCorrect:
      results.filter(
        function (
          row
        ) {
          return row.alreadyCorrect;
        }
      ).length,

    blocked:
      results.filter(
        function (
          row
        ) {
          return row.blocked;
        }
      ).length,

    records:
      results
  };
}


function alpha30_5_2FindBackorderFmrV3_(
  requestId
) {
  return alpha30_5_2OneRowFmrV3_(
    FMR_V3.SHEETS.BACKORDERS,
    'Backorder_Request_ID',
    requestId
  );
}


function alpha30_5_2TransactionsForBackorderFmrV3_(
  requestId
) {
  return getUsedRowsFmrV3_(
    FMR_V3.SHEETS.TRANSACTIONS
  ).filter(
    function (
      row
    ) {
      return (
        normalizeFmrV3_(
          row.Backorder_Request_ID
        ) ===
        normalizeFmrV3_(
          requestId
        )
      );
    }
  );
}


function alpha30_5_2AuditForCorrelationFmrV3_(
  correlationId
) {
  return getUsedRowsFmrV3_(
    FMR_V3.SHEETS.AUDIT
  ).filter(
    function (
      row
    ) {
      return (
        normalizeFmrV3_(
          row.Correlation_ID
        ) ===
        normalizeFmrV3_(
          correlationId
        )
      );
    }
  );
}


function alpha30_5_2PreviewOrphanBackorderFmrV3_() {
  const target =
    FMR_V3_ALPHA30_5_2
      .orphanBackorder;

  const lineLookup =
    alpha30_5_2OneRowFmrV3_(
      FMR_V3.SHEETS.LINES,
      'FMR_Line_ID',
      target.lineId
    );

  const orphanLookup =
    alpha30_5_2FindBackorderFmrV3_(
      target.orphanRequestId
    );

  const keeperLookup =
    alpha30_5_2FindBackorderFmrV3_(
      target.keeperRequestId
    );

  const orphanTransactions =
    orphanLookup.found
      ? alpha30_5_2TransactionsForBackorderFmrV3_(
          target.orphanRequestId
        )
      : [];

  const keeperTransactions =
    keeperLookup.found
      ? alpha30_5_2TransactionsForBackorderFmrV3_(
          target.keeperRequestId
        )
      : [];

  const orphanAudit =
    orphanLookup.found
      ? alpha30_5_2AuditForCorrelationFmrV3_(
          orphanLookup
            .record
            .Correlation_ID
        )
      : [];

  const keeperAudit =
    keeperLookup.found
      ? alpha30_5_2AuditForCorrelationFmrV3_(
          keeperLookup
            .record
            .Correlation_ID
        )
      : [];

  const blockedReasons = [];

  if (
    !lineLookup.found
  ) {
    blockedReasons.push(
      'Target FMR 209 line did not resolve to exactly one row.'
    );
  }

  if (
    !orphanLookup.found
  ) {
    blockedReasons.push(
      'Known orphan Backorder_Request did not resolve to exactly one row.'
    );
  }

  if (
    !keeperLookup.found
  ) {
    blockedReasons.push(
      'Known keeper Backorder_Request did not resolve to exactly one row.'
    );
  }

  if (
    lineLookup.found &&
    normalizeFmrV3_(
      lineLookup
        .record
        .FMR_Number
    ) !==
      target.fmrNumber
  ) {
    blockedReasons.push(
      'Target line no longer belongs to FMR 209.'
    );
  }

  if (
    lineLookup.found &&
    numberFmrV3_(
      lineLookup
        .record
        .Qty_Pending_Backorder
    ) !==
      target
        .expectedPendingQuantity
  ) {
    blockedReasons.push(
      (
        'FMR 209 line pending quantity changed. Expected ' +
        target.expectedPendingQuantity +
        ', found ' +
        numberFmrV3_(
          lineLookup
            .record
            .Qty_Pending_Backorder
        ) +
        '.'
      )
    );
  }

  if (
    orphanLookup.found &&
    normalizeFmrV3_(
      orphanLookup
        .record
        .FMR_Line_ID
    ) !==
      target.lineId
  ) {
    blockedReasons.push(
      'Known orphan request no longer belongs to the expected FMR line.'
    );
  }

  if (
    keeperLookup.found &&
    normalizeFmrV3_(
      keeperLookup
        .record
        .FMR_Line_ID
    ) !==
      target.lineId
  ) {
    blockedReasons.push(
      'Known keeper request no longer belongs to the expected FMR line.'
    );
  }

  if (
    orphanLookup.found &&
    numberFmrV3_(
      orphanLookup
        .record
        .Qty_Pending
    ) !==
      target
        .expectedPendingQuantity
  ) {
    blockedReasons.push(
      'Known orphan request quantity changed.'
    );
  }

  if (
    keeperLookup.found &&
    numberFmrV3_(
      keeperLookup
        .record
        .Qty_Pending
    ) !==
      target
        .expectedPendingQuantity
  ) {
    blockedReasons.push(
      'Known keeper request quantity changed.'
    );
  }

  if (
    orphanTransactions.length !==
    0
  ) {
    blockedReasons.push(
      'Known orphan request now has a Material_Transactions record; automatic retirement is no longer safe.'
    );
  }

  if (
    orphanAudit.length !==
    0
  ) {
    blockedReasons.push(
      'Known orphan request now has Audit_Log history; automatic retirement is no longer safe.'
    );
  }

  if (
    keeperAudit.length <
    1
  ) {
    blockedReasons.push(
      'Known keeper request no longer has the expected Audit_Log history.'
    );
  }

  if (
    keeperTransactions.filter(
      function (
        row
      ) {
        return (
          normalizeUpperFmrV3_(
            row.Transaction_Type
          ) ===
          'BACKORDER_REQUESTED'
        );
      }
    ).length <
    1
  ) {
    blockedReasons.push(
      'Known keeper request no longer has its BACKORDER_REQUESTED transaction.'
    );
  }

  const orphanActive =
    orphanLookup.found &&
    yesFmrV3_(
      orphanLookup
        .record
        .Active
    );

  const orphanAlreadyRetired =
    orphanLookup.found &&
    !yesFmrV3_(
      orphanLookup
        .record
        .Active
    );

  const keeperActive =
    keeperLookup.found &&
    yesFmrV3_(
      keeperLookup
        .record
        .Active
    );

  if (
    keeperLookup.found &&
    !keeperActive
  ) {
    blockedReasons.push(
      'Known keeper request is no longer active.'
    );
  }

  const eligible =
    (
      blockedReasons.length ===
        0 &&
      orphanActive &&
      keeperActive
    );

  const alreadyCorrect =
    (
      blockedReasons.length ===
        0 &&
      orphanAlreadyRetired &&
      keeperActive
    );

  return {
    fmrNumber:
      target.fmrNumber,

    lineId:
      target.lineId,

    orphanRequestId:
      target.orphanRequestId,

    keeperRequestId:
      target.keeperRequestId,

    linePending:
      lineLookup.found
        ? numberFmrV3_(
            lineLookup
              .record
              .Qty_Pending_Backorder
          )
        : null,

    orphanActive:
      orphanActive,

    keeperActive:
      keeperActive,

    orphanTransactionCount:
      orphanTransactions.length,

    keeperTransactionCount:
      keeperTransactions.length,

    orphanAuditCount:
      orphanAudit.length,

    keeperAuditCount:
      keeperAudit.length,

    eligible:
      eligible,

    alreadyCorrect:
      alreadyCorrect,

    blocked:
      blockedReasons.length >
        0,

    blockedReasons:
      blockedReasons
  };
}


/**
 * READ-ONLY. Run this first from the FMRCoreV3 Apps Script editor.
 */
function previewAlpha30_5_2ProductionRepair() {
  const context =
    alpha30_5_2AssertProductionOwnerFmrV3_();

  const dateRepair =
    alpha30_5_2PreviewDateRepairFmrV3_();

  const orphanBackorder =
    alpha30_5_2PreviewOrphanBackorderFmrV3_();

  const output = {
    passed:
      (
        dateRepair.blocked ===
          0 &&
        !orphanBackorder.blocked
      ),

    readOnly:
      true,

    version:
      FMR_V3_ALPHA30_5_2
        .version,

    environment:
      context
        .environment
        .environmentName,

    databaseFingerprint:
      context.fingerprint,

    dateRepair:
      dateRepair,

    orphanBackorder:
      orphanBackorder,

    excludedManualReview:
      FMR_V3_ALPHA30_5_2
        .excludedManualReview
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


function alpha30_5_2DeactivateOperationalIndexEntityFmrV3_(
  entityId
) {
  const rows =
    alpha30_5_2RowsByHeaderValueFmrV3_(
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX,
      'Entity_ID',
      entityId
    );

  const records =
    readRowsObjectsFmrV3_(
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX,
      rows
    );

  const keys = {};

  let changed = 0;

  records.forEach(
    function (
      row
    ) {
      if (
        !yesFmrV3_(
          row.Active
        )
      ) {
        return;
      }

      updateRowObjectFmrV3_(
        FMR_V3.SHEETS
          .OPERATIONAL_INDEX,
        row._rowNumber,
        {
          Active:
            FMR_V3.NO,

          Updated_At:
            nowFmrV3_()
        }
      );

      keys[
        normalizeFmrV3_(
          row.Index_Key
        )
      ] = true;

      changed +=
        1;
    }
  );

  Object.keys(
    keys
  ).forEach(
    function (
      key
    ) {
      if (
        key
      ) {
        invalidateIndexKeyFmrV3_(
          FMR_V3.SHEETS
            .OPERATIONAL_INDEX,
          key
        );
      }
    }
  );

  return {
    found:
      records.length,

    deactivated:
      changed,

    invalidatedKeys:
      Object.keys(
        keys
      )
  };
}


function alpha30_5_2ApplyDateRepairsFmrV3_(
  owner,
  preview
) {
  const now =
    nowFmrV3_();

  const applied = [];

  preview.records
    .filter(
      function (
        row
      ) {
        return row.eligible;
      }
    )
    .forEach(
      function (
        row
      ) {
        const targetDate =
          alpha30_5_2DateObjectFromYmdFmrV3_(
            row.expectedSourceDate
          );

        const published =
          readRowObjectFmrV3_(
            FMR_V3.SHEETS.HEADERS,
            row.publishedRow
          );

        const staging =
          readRowObjectFmrV3_(
            FMR_V3.SHEETS
              .STAGING_HEADERS,
            row.stagingRow
          );

        const oldPublished =
          alpha30_5_2CalendarYmdFmrV3_(
            published.Date_Required
          );

        const oldStaging =
          alpha30_5_2CalendarYmdFmrV3_(
            staging.Date_Required
          );

        if (
          alpha30_5_2BadEpochDateFmrV3_(
            oldPublished
          )
        ) {
          updateRowObjectFmrV3_(
            FMR_V3.SHEETS.HEADERS,
            published._rowNumber,
            {
              Date_Required:
                targetDate,

              Updated_By:
                owner.email,

              Updated_At:
                now
            }
          );
        }

        if (
          alpha30_5_2BadEpochDateFmrV3_(
            oldStaging
          )
        ) {
          updateRowObjectFmrV3_(
            FMR_V3.SHEETS
              .STAGING_HEADERS,
            staging._rowNumber,
            {
              Date_Required:
                targetDate,

              Updated_At:
                now
            }
          );
        }

        const correlationId =
          uuidFmrV3_(
            'CORR'
          );

        appendAuditFmrV3_(
          'FMR',
          published.FMR_ID,
          'ALPHA30_5_2_DATE_REQUIRED_REPAIR',
          owner,
          correlationId,
          {
            sourceInterface:
              'OWNER',

            fieldName:
              'Date_Required',

            oldValue:
              oldPublished,

            newValue:
              row.expectedSourceDate,

            notes:
              'Corrected known Date Required epoch-conversion defect.',

            payload: {
              fmrNumber:
                row.fmrNumber,

              stagingFmrId:
                row.stagingFmrId,

              sourceDate:
                row.expectedSourceDate,

              oldPublishedDate:
                oldPublished,

              oldStagingDate:
                oldStaging
            }
          }
        );

        applied.push({
          fmrNumber:
            row.fmrNumber,

          newDate:
            row.expectedSourceDate,

          oldPublishedDate:
            oldPublished,

          oldStagingDate:
            oldStaging,

          correlationId:
            correlationId
        });
      }
    );

  return applied;
}


function alpha30_5_2ApplyOrphanRepairFmrV3_(
  owner,
  preview
) {
  if (
    !preview.eligible
  ) {
    return {
      applied:
        false,

      alreadyCorrect:
        preview.alreadyCorrect,

      requestId:
        preview.orphanRequestId
    };
  }

  const orphanLookup =
    alpha30_5_2FindBackorderFmrV3_(
      preview.orphanRequestId
    );

  const lineLookup =
    alpha30_5_2OneRowFmrV3_(
      FMR_V3.SHEETS.LINES,
      'FMR_Line_ID',
      preview.lineId
    );

  if (
    !orphanLookup.found ||
    !lineLookup.found
  ) {
    throw new Error(
      'Repair precondition changed after preview. No orphan repair was applied.'
    );
  }

  const now =
    nowFmrV3_();

  const correlationId =
    uuidFmrV3_(
      'CORR'
    );

  updateRowObjectFmrV3_(
    FMR_V3.SHEETS.BACKORDERS,
    orphanLookup.rowNumber,
    {
      Status:
        'Voided',

      Admin_Decision:
        'SYSTEM_REPAIR',

      Admin_Notes:
        (
          'Alpha 30.5.2 orphan duplicate retirement. ' +
          'The request had no corresponding BACKORDER_REQUESTED transaction; ' +
          'the completed request ' +
          FMR_V3_ALPHA30_5_2
            .orphanBackorder
            .keeperRequestId +
          ' remains authoritative.'
        ),

      Decided_By_Email:
        owner.email,

      Decided_By_Name:
        owner.name,

      Decided_At:
        now,

      Active:
        FMR_V3.NO,

      Updated_At:
        now
    }
  );

  const indexResult =
    alpha30_5_2DeactivateOperationalIndexEntityFmrV3_(
      preview.orphanRequestId
    );

  const line =
    lineLookup.record;

  syncFieldNotificationsForLineFmrV3_(
    line
  );

  refreshHeaderFromIndexedLinesFmrV3_(
    line.FMR_ID,
    line.FMR_Number,
    owner
  );

  appendAuditFmrV3_(
    'BACKORDER',
    preview.orphanRequestId,
    'ALPHA30_5_2_ORPHAN_BACKORDER_RETIRED',
    owner,
    correlationId,
    {
      sourceInterface:
        'OWNER',

      oldValue:
        'ACTIVE DUPLICATE',

      newValue:
        'INACTIVE / VOIDED',

      notes:
        'Retired orphan request while preserving the completed request and the correct 3 EA line state.',

      payload: {
        fmrNumber:
          preview.fmrNumber,

        lineId:
          preview.lineId,

        orphanRequestId:
          preview.orphanRequestId,

        keeperRequestId:
          preview.keeperRequestId,

        linePending:
          preview.linePending,

        operationalIndex:
          indexResult
      }
    }
  );

  return {
    applied:
      true,

    alreadyCorrect:
      false,

    requestId:
      preview.orphanRequestId,

    keeperRequestId:
      preview.keeperRequestId,

    indexResult:
      indexResult,

    correlationId:
      correlationId
  };
}


/**
 * WRITE OPERATION.
 *
 * Safety controls:
 * - hard-coded Production DB + fingerprint guard;
 * - System Owner authorization;
 * - ScriptLock;
 * - fresh read-only preview immediately before writing;
 * - automatic Production database backup before any repair;
 * - exact known-record verification;
 * - Audit_Log entries for every repaired FMR and the orphan request;
 * - idempotent behavior on a second run.
 */
function applyAlpha30_5_2ProductionRepair() {
  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const context =
      alpha30_5_2AssertProductionOwnerFmrV3_();

    const preview = {
      dateRepair:
        alpha30_5_2PreviewDateRepairFmrV3_(),

      orphanBackorder:
        alpha30_5_2PreviewOrphanBackorderFmrV3_()
    };

    if (
      preview
        .dateRepair
        .blocked >
        0
    ) {
      throw new Error(
        (
          'Date repair preview contains ' +
          preview
            .dateRepair
            .blocked +
          ' blocked record(s). No changes were applied.'
        )
      );
    }

    if (
      preview
        .orphanBackorder
        .blocked
    ) {
      throw new Error(
        (
          'Orphan-backorder repair preview is blocked: ' +
          preview
            .orphanBackorder
            .blockedReasons
            .join(' | ')
        )
      );
    }

    const hasChanges =
      (
        preview
          .dateRepair
          .eligible >
          0 ||
        preview
          .orphanBackorder
          .eligible
      );

    if (
      !hasChanges
    ) {
      const integrity =
        inspectFmrV3DataIntegrity();

      const output = {
        success:
          true,

        alreadyApplied:
          true,

        backup:
          null,

        dateRepairs:
          [],

        orphanBackorder:
          {
            applied:
              false,

            alreadyCorrect:
              preview
                .orphanBackorder
                .alreadyCorrect
          },

        postIntegrity:
          {
            passed:
              integrity.passed,

            lineIssueCount:
              integrity
                .lineIssueCount,

            headerIssueCount:
              integrity
                .headerIssueCount,

            bagIndexIssueCount:
              integrity
                .bagIndexIssueCount
          }
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

    const backup =
      createDatabaseBackupFmrV3_(
        context
          .owner
          .email,
        'OWNER',
        'Alpha 30.5.2 pre-repair automatic backup.'
      );

    if (
      !backup ||
      !backup.success
    ) {
      throw new Error(
        'Automatic Production backup did not complete successfully. No repair was applied.'
      );
    }

    const dateRepairs =
      alpha30_5_2ApplyDateRepairsFmrV3_(
        context.owner,
        preview.dateRepair
      );

    const orphanBackorder =
      alpha30_5_2ApplyOrphanRepairFmrV3_(
        context.owner,
        preview.orphanBackorder
      );

    SpreadsheetApp.flush();

    const postIntegrity =
      inspectFmrV3DataIntegrity();

    const postHealth =
      calculateOperationalHealthFmrV3_();

    const output = {
      success:
        true,

      alreadyApplied:
        false,

      environment:
        context
          .environment
          .environmentName,

      databaseFingerprint:
        context.fingerprint,

      backup:
        backup,

      dateRepairCount:
        dateRepairs.length,

      dateRepairs:
        dateRepairs,

      orphanBackorder:
        orphanBackorder,

      postIntegrity: {
        passed:
          postIntegrity.passed,

        lineIssueCount:
          postIntegrity
            .lineIssueCount,

        headerIssueCount:
          postIntegrity
            .headerIssueCount,

        bagIndexIssueCount:
          postIntegrity
            .bagIndexIssueCount
      },

      postHealth: {
        overallStatus:
          postHealth
            .overallStatus,

        warnings:
          postHealth
            .warnings,

        staleBackorders:
          postHealth
            .counts
            .staleBackorders,

        staleBagItems:
          postHealth
            .counts
            .staleBagItems
      },

      excludedManualReview:
        FMR_V3_ALPHA30_5_2
          .excludedManualReview
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
