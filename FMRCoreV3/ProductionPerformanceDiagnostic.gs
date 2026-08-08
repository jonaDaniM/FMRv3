/**
 * FMR Operations v3 — Alpha 30
 * Read-only production performance diagnostics.
 *
 * Add as a NEW Core script file named ProductionPerformanceDiagnostic.
 * These functions do not write operational data.
 */

function runFmrV3ProductionReadPerformanceDiagnostic(
  ownerEmail,
  fmrNumber
) {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const email =
    normalizeEmailFmrV3_(
      ownerEmail ||
      Session
        .getEffectiveUser()
        .getEmail()
    );

  const query =
    normalizeFmrV3_(
      fmrNumber
    );

  if (!query) {
    throw new Error(
      'A known FMR number is required.'
    );
  }

  const output = {
    passed: true,
    readOnly: true,
    version: FMR_V3.VERSION,
    fmrNumber: query,
    timings: {}
  };

  let started = Date.now();

  const fieldSearch =
    searchPublishedFmrV3_(
      email,
      query,
      'FMR'
    );

  output.timings.fieldSearchMs =
    Date.now() - started;

  started = Date.now();

  const ownerLedger =
    searchOwnerLedgerFmrV3_(
      email,
      query,
      'FMR'
    );

  output.timings.ownerLedgerMs =
    Date.now() - started;

  const reversible =
    (
      ownerLedger.groups ||
      []
    ).find(function (group) {
      return group.canPreviewReversal;
    });

  if (reversible) {
    started = Date.now();

    const preview =
      previewOwnerCorrectionFmrV3_(
        email,
        {
          groupId: reversible.groupId,
          reason: 'Read-only production performance diagnostic'
        }
      );

    output.timings.ownerPreviewMs =
      Date.now() - started;

    output.ownerPreview = {
      groupReference:
        reversible.groupReference ||
        reversible.groupId,

      verificationCodeLength:
        String(
          preview.requiredConfirmation ||
          ''
        ).length,

      materialCount:
        (
          reversible.materials ||
          []
        ).length,

      transactionCount:
        (
          reversible.transactions ||
          []
        ).length
    };
  }

  started = Date.now();

  const dashboard =
    getAdminDashboardFmrV3_(
      email
    );

  output.timings.adminDashboardMs =
    Date.now() - started;

  started = Date.now();

  const register =
    getAdminFmrRegisterFmrV3_(
      email,
      {
        query: query,
        queryType: 'FMR',
        status: 'ALL',
        priority: 'ALL',
        exceptionType: 'ALL',
        sortBy: 'LAST_ACTIVITY',
        sortDirection: 'DESC',
        page: 1,
        pageSize: 25
      }
    );

  output.timings.adminRegisterExactSearchMs =
    Date.now() - started;

  output.counts = {
    fieldResultCount:
      numberFmrV3_(
        fieldSearch.resultCount
      ),

    ownerLineCount:
      numberFmrV3_(
        ownerLedger.resultCount
      ),

    ownerGroupCount:
      (
        ownerLedger.groups ||
        []
      ).length,

    adminBackorders:
      (
        dashboard.backorders ||
        []
      ).length,

    adminRegisterMatches:
      register.pagination
        ? numberFmrV3_(
            register.pagination.totalRecords
          )
        : 0
  };

  output.ownerLedgerPhaseTimings =
    ownerLedger.timings ||
    {};

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  return output;
}

function runFmrV3ProductionStorageProfileDiagnostic() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const sheetNames = [
    FMR_V3.SHEETS.HEADERS,
    FMR_V3.SHEETS.LINES,
    FMR_V3.SHEETS.SEARCH_INDEX,
    FMR_V3.SHEETS.OPERATIONAL_INDEX,
    FMR_V3.SHEETS.TRANSACTIONS,
    FMR_V3.SHEETS.BAG_HEADERS,
    FMR_V3.SHEETS.BAG_ITEMS,
    FMR_V3.SHEETS.BACKORDERS,
    FMR_V3.SHEETS.AUDIT
  ];

  if (
    typeof FMR_V3_FIELD_NOTICE !==
    'undefined'
  ) {
    sheetNames.push(
      FMR_V3_FIELD_NOTICE.sheetName
    );
  }

  if (
    typeof FMR_V3_OWNER_CORRECTIONS !==
    'undefined'
  ) {
    sheetNames.push(
      FMR_V3_OWNER_CORRECTIONS.SHEET
    );
  }

  const rowCounts = {};

  sheetNames.forEach(function (sheetName) {
    const sheet =
      fmrV3Database_()
        .getSheetByName(
          sheetName
        );

    rowCounts[sheetName] =
      sheet
        ? Math.max(
            0,
            sheet.getLastRow() - 1
          )
        : null;
  });

  const output = {
    passed: true,
    readOnly: true,
    version: FMR_V3.VERSION,
    rows: rowCounts
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
