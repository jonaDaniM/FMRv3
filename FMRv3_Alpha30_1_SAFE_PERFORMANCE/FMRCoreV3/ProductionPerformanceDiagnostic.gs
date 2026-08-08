/**
 * FMR Operations v3 — Alpha 30.1
 * Read-only production performance diagnostics.
 *
 * This file is safe to paste as a COMPLETE replacement for:
 *   FMRCoreV3/ProductionPerformanceDiagnostic.gs
 *
 * Alpha 30.1 preserves the original direct-editor calls while adding a
 * database-aware form so the Bound app can measure its ACTIVE environment
 * instead of silently falling back to FMR_V3.DEFAULT_DATABASE_ID.
 */

function productionDiagnosticContextFmrV3_(
  databaseId
) {
  const resolved =
    normalizeFmrV3_(
      databaseId
    ) ||
    normalizeFmrV3_(
      FMR_V3.DEFAULT_DATABASE_ID
    );

  if (!resolved) {
    throw new Error(
      'A database ID is required for the production performance diagnostic.'
    );
  }

  setFmrV3DatabaseContext_(
    resolved
  );

  return resolved;
}

function productionDiagnosticReadArgsFmrV3_(
  databaseIdOrOwnerEmail,
  ownerEmailOrFmrNumber,
  maybeFmrNumber
) {
  /**
   * Backward-compatible direct-editor form:
   *
   * runFmrV3ProductionReadPerformanceDiagnostic(
   *   'owner@company.com',
   *   'FMR-42'
   * )
   */
  if (
    maybeFmrNumber ===
      undefined
  ) {
    return {
      databaseId:
        normalizeFmrV3_(
          FMR_V3.DEFAULT_DATABASE_ID
        ),

      ownerEmail:
        normalizeEmailFmrV3_(
          databaseIdOrOwnerEmail ||
          Session
            .getEffectiveUser()
            .getEmail()
        ),

      fmrNumber:
        normalizeFmrV3_(
          ownerEmailOrFmrNumber
        )
    };
  }

  /**
   * Database-aware Bound form:
   *
   * runFmrV3ProductionReadPerformanceDiagnostic(
   *   databaseId,
   *   ownerEmail,
   *   fmrNumber
   * )
   */
  return {
    databaseId:
      normalizeFmrV3_(
        databaseIdOrOwnerEmail
      ),

    ownerEmail:
      normalizeEmailFmrV3_(
        ownerEmailOrFmrNumber ||
        Session
          .getEffectiveUser()
          .getEmail()
      ),

    fmrNumber:
      normalizeFmrV3_(
        maybeFmrNumber
      )
  };
}

function runFmrV3ProductionReadPerformanceDiagnostic(
  databaseIdOrOwnerEmail,
  ownerEmailOrFmrNumber,
  maybeFmrNumber
) {
  const args =
    productionDiagnosticReadArgsFmrV3_(
      databaseIdOrOwnerEmail,
      ownerEmailOrFmrNumber,
      maybeFmrNumber
    );

  const databaseId =
    productionDiagnosticContextFmrV3_(
      args.databaseId
    );

  const email =
    args.ownerEmail;

  const query =
    args.fmrNumber;

  if (!email) {
    throw new Error(
      'An Owner email is required.'
    );
  }

  if (!query) {
    throw new Error(
      'A known FMR number is required.'
    );
  }

  /**
   * This is a diagnostic, but it calls Owner-ledger/preview functions which
   * enforce Owner authorization internally. No operational writes are made.
   */
  const output = {
    passed:
      true,

    readOnly:
      true,

    version:
      FMR_V3.VERSION,

    databaseFingerprint:
      typeof databaseFingerprintFmrV3_ === 'function'
        ? databaseFingerprintFmrV3_(
            databaseId
          )
        : '',

    fmrNumber:
      query,

    timings:
      {}
  };

  let started =
    Date.now();

  const fieldSearch =
    searchPublishedFmrV3_(
      email,
      query,
      'FMR'
    );

  output.timings.fieldSearchMs =
    Date.now() -
    started;

  started =
    Date.now();

  const ownerLedger =
    searchOwnerLedgerFmrV3_(
      email,
      query,
      'FMR'
    );

  output.timings.ownerLedgerMs =
    Date.now() -
    started;

  const reversible =
    (
      ownerLedger.groups ||
      []
    ).find(
      function (
        group
      ) {
        return group.canPreviewReversal;
      }
    );

  if (reversible) {
    started =
      Date.now();

    const preview =
      previewOwnerCorrectionFmrV3_(
        email,
        {
          groupId:
            reversible.groupId,

          reason:
            'Read-only production performance diagnostic'
        }
      );

    output.timings.ownerPreviewMs =
      Date.now() -
      started;

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

  started =
    Date.now();

  const dashboard =
    getAdminDashboardFmrV3_(
      email
    );

  output.timings.adminDashboardMs =
    Date.now() -
    started;

  started =
    Date.now();

  const register =
    getAdminFmrRegisterFmrV3_(
      email,
      {
        query:
          query,

        queryType:
          'FMR',

        status:
          'ALL',

        priority:
          'ALL',

        exceptionType:
          'ALL',

        sortBy:
          'LAST_ACTIVITY',

        sortDirection:
          'DESC',

        page:
          1,

        pageSize:
          25
      }
    );

  output.timings.adminRegisterExactSearchMs =
    Date.now() -
    started;

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

function runFmrV3ProductionStorageProfileDiagnostic(
  databaseId
) {
  const resolvedDatabaseId =
    productionDiagnosticContextFmrV3_(
      databaseId
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
      FMR_V3_FIELD_NOTICE
        .sheetName
    );
  }

  if (
    typeof FMR_V3_OWNER_CORRECTIONS !==
    'undefined'
  ) {
    sheetNames.push(
      FMR_V3_OWNER_CORRECTIONS
        .SHEET
    );
  }

  const rowCounts = {};

  sheetNames.forEach(
    function (
      sheetName
    ) {
      const sheet =
        fmrV3Database_()
          .getSheetByName(
            sheetName
          );

      rowCounts[
        sheetName
      ] =
        sheet
          ? Math.max(
              0,
              sheet.getLastRow() -
              1
            )
          : null;
    }
  );

  const output = {
    passed:
      true,

    readOnly:
      true,

    version:
      FMR_V3.VERSION,

    databaseFingerprint:
      typeof databaseFingerprintFmrV3_ === 'function'
        ? databaseFingerprintFmrV3_(
            resolvedDatabaseId
          )
        : '',

    rows:
      rowCounts
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
