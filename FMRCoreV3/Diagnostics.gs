function runFmrV3SchemaDiagnostics() {
  setFmrV3DatabaseContext_(FMR_V3.DEFAULT_DATABASE_ID);

  const missingSheets = [];
  const headerMismatches = [];

  Object.keys(FMR_V3_HEADERS).forEach(function (sheetName) {
    const sheet = fmrV3Database_().getSheetByName(sheetName);

    if (!sheet) {
      missingSheets.push(sheetName);
      return;
    }

    try {
      headerMapFmrV3_(sheetName);
    } catch (error) {
      headerMismatches.push({
        sheetName: sheetName,
        message: error.message
      });
    }
  });

  const result = {
    passed:
      missingSheets.length === 0 &&
      headerMismatches.length === 0,
    readOnly: true,
    version: FMR_V3.VERSION,
    databaseId: FMR_V3.DEFAULT_DATABASE_ID,
    spreadsheetName: fmrV3Database_().getName(),
    timezone: fmrV3Database_().getSpreadsheetTimeZone(),
    missingSheets: missingSheets,
    headerMismatches: headerMismatches
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.passed) {
    throw new Error('FMR v3 schema diagnostic failed.');
  }

  return result;
}

function runFmrV3EmptySearchPerformanceDiagnostic() {
  setFmrV3DatabaseContext_(FMR_V3.DEFAULT_DATABASE_ID);

  const started = Date.now();
  const result = searchPublishedFmrV3_(
    'jonathanmura05@gmail.com',
    'FMR-NOT-YET-PUBLISHED',
    'FMR'
  );

  const output = {
    passed: true,
    readOnly: true,
    elapsedMs: Date.now() - started,
    resultCount: result.resultCount
  };

  console.log(JSON.stringify(output, null, 2));
  return output;
}

function verifyFmrV3IndexServiceLoaded() {
  const checks = {
    lookupIndexEntriesFmrV3:
      typeof lookupIndexEntriesFmrV3_,

    getLineByIdFmrV3:
      typeof getLineByIdFmrV3_,

    lookupOperationalRowsFmrV3:
      typeof lookupOperationalRowsFmrV3_
  };

  const missing = Object.keys(checks).filter(
    function (name) {
      return checks[name] !== 'function';
    }
  );

  const result = {
    passed: missing.length === 0,
    checks: checks,
    missing: missing
  };

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  if (!result.passed) {
    throw new Error(
      'IndexService is incomplete. Missing: ' +
      missing.join(', ')
    );
  }

  return result;
}

function runFmrV3KnownSearchPerformanceDiagnostic() {
  setFmrV3DatabaseContext_(FMR_V3.DEFAULT_DATABASE_ID);

  const fmrNumber = 'V3-ACCEPT-0001';
  const started = Date.now();

  const result = searchPublishedFmrV3_(
    'jonathanmura05@gmail.com',
    fmrNumber,
    'FMR'
  );

  const output = {
    passed: result.resultCount > 0,
    readOnly: true,
    elapsedMs: Date.now() - started,
    query: fmrNumber,
    resultCount: result.resultCount,
    materialLineCount: (result.cards || []).reduce(
      function (total, card) {
        return total + (card.materials || []).length;
      },
      0
    )
  };

  console.log(JSON.stringify(output, null, 2));

  if (!output.passed) {
    throw new Error(
      'Known-search diagnostic did not find a published FMR.'
    );
  }

  return output;
}

function runFmrV3KnownSearchPhaseDiagnostic() {
  setFmrV3DatabaseContext_(FMR_V3.DEFAULT_DATABASE_ID);

  const userEmail = 'jonathanmura05@gmail.com';
  const fmrNumber = 'V3-ACCEPT-0001';
  const timings = {};
  const totalStarted = Date.now();

  let started = Date.now();
  const user = assertSearchUserFmrV3_(userEmail);
  timings.authorizationMs = Date.now() - started;

  started = Date.now();
  const keys = normalizeSearchRequestFmrV3_(fmrNumber, 'FMR');
  timings.requestNormalizationMs = Date.now() - started;

  started = Date.now();
  let entries = [];

  keys.some(function (key) {
    const found = lookupIndexEntriesFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX,
      key
    );

    if (found.length) {
      entries = found;
      return true;
    }

    return false;
  });

  timings.searchIndexLookupMs = Date.now() - started;

  started = Date.now();
  const lines = readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.LINES,
    entries.map(function (entry) {
      return entry.Line_Row;
    })
  ).filter(function (line) {
    return yesFmrV3_(line.Active);
  });

  timings.lineReadMs = Date.now() - started;

  started = Date.now();
  const headers = readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.HEADERS,
    entries.map(function (entry) {
      return entry.Header_Row;
    })
  ).filter(function (header) {
    return yesFmrV3_(header.Active);
  });

  timings.headerReadMs = Date.now() - started;

  const lineIds = lines.map(function (line) {
    return normalizeFmrV3_(line.FMR_Line_ID);
  });

  started = Date.now();
  const bagsByLine = getActiveBagsByLineIdsFmrV3_(lineIds);
  timings.activeBagLookupMs = Date.now() - started;

  started = Date.now();
  const returnedByLine =
    getReturnedBackordersByLineIdsFmrV3_(lineIds);
  timings.returnedBackorderLookupMs = Date.now() - started;

  started = Date.now();

  const headersById = {};
  headers.forEach(function (header) {
    headersById[normalizeFmrV3_(header.FMR_ID)] = header;
  });

  const grouped = {};

  lines.forEach(function (line) {
    const fmrId = normalizeFmrV3_(line.FMR_ID);
    const header = headersById[fmrId];

    if (!header) return;

    if (!grouped[fmrId]) {
      grouped[fmrId] = {
        fmrId: fmrId,
        fmrNumber: normalizeFmrV3_(header.FMR_Number),
        materials: []
      };
    }

    const lineId = normalizeFmrV3_(line.FMR_Line_ID);

    grouped[fmrId].materials.push(
      serializeLineForPortalFmrV3_(
        line,
        bagsByLine[lineId] || [],
        returnedByLine[lineId] || []
      )
    );
  });

  timings.serializationMs = Date.now() - started;
  timings.totalMs = Date.now() - totalStarted;

  const output = {
    passed: entries.length > 0 && lines.length > 0,
    readOnly: true,
    query: fmrNumber,
    indexEntryCount: entries.length,
    headerCount: headers.length,
    materialLineCount: lines.length,
    timings: timings,
    user: {
      email: user.email,
      role: user.role
    }
  };

  console.log(JSON.stringify(output, null, 2));

  if (!output.passed) {
    throw new Error(
      'Phase diagnostic could not load the known published FMR.'
    );
  }

  return output;
}

function runFmrV3AdminRegisterPerformanceDiagnostic() {
  setFmrV3DatabaseContext_(FMR_V3.DEFAULT_DATABASE_ID);

  const userEmail = 'jonathanmura05@gmail.com';
  const started = Date.now();

  const result = getAdminFmrRegisterFmrV3_(
    userEmail,
    {
      query: '',
      queryType: 'AUTO',
      status: 'ALL',
      priority: 'ALL',
      exceptionType: 'ALL',
      sortBy: 'LAST_ACTIVITY',
      sortDirection: 'DESC',
      page: 1,
      pageSize: 25
    }
  );

  const output = {
    passed:
      Boolean(result) &&
      Boolean(result.pagination) &&
      Array.isArray(result.records),
    readOnly: true,
    elapsedMs: Date.now() - started,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalRecords: result.pagination.totalRecords,
    returnedRecords: result.records.length,
    statusFilterCount:
      (result.filterOptions.statuses || []).length,
    priorityFilterCount:
      (result.filterOptions.priorities || []).length
  };

  console.log(JSON.stringify(output, null, 2));

  if (!output.passed) {
    throw new Error(
      'Admin register performance diagnostic failed.'
    );
  }

  return output;
}

function runFmrV3AdminDashboardPerformanceDiagnostic() {
  setFmrV3DatabaseContext_(FMR_V3.DEFAULT_DATABASE_ID);

  const userEmail = 'jonathanmura05@gmail.com';
  const started = Date.now();

  const result = getAdminDashboardFmrV3_(userEmail);

  const output = {
    passed:
      Boolean(result) &&
      Boolean(result.kpis) &&
      Array.isArray(result.backorders),
    readOnly: true,
    elapsedMs: Date.now() - started,
    backorderCount: result.backorders.length,
    canReviewBackorders: result.canReviewBackorders,
    publishedFmrs: result.kpis.publishedFmrs,
    activeTags: result.kpis.activeTags
  };

  console.log(JSON.stringify(output, null, 2));

  if (!output.passed) {
    throw new Error(
      'Admin dashboard performance diagnostic failed.'
    );
  }

  return output;
}

function runFmrV3BootstrapPerformanceDiagnostic() {
  setFmrV3DatabaseContext_(FMR_V3.DEFAULT_DATABASE_ID);

  const userEmail = 'jonathanmura05@gmail.com';
  const started = Date.now();

  const result = {
    version: FMR_V3.VERSION,
    user: assertSearchUserFmrV3_(userEmail),
    field: getFieldBootstrapFmrV3_(userEmail)
  };

  const output = {
    passed:
      Boolean(result.user) &&
      Boolean(result.field) &&
      Boolean(result.field.options),
    readOnly: true,
    elapsedMs: Date.now() - started,
    version: result.version,
    role: result.user.role,
    backorderReasonCount:
      (result.field.options.backorderReasons || []).length,
    uomCount:
      (result.field.options.uoms || []).length
  };

  console.log(JSON.stringify(output, null, 2));

  if (!output.passed) {
    throw new Error('Portal bootstrap diagnostic failed.');
  }

  return output;
}
function runFmrV3AdminActiveBagQueueDiagnostic() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const started = Date.now();

  const result =
    getAdminActiveBagQueueFmrV3_(
      'jonathanmura05@gmail.com',
      {
        query: '',
        readiness: 'ALL',
        sortOrder: 'OLDEST_FIRST',
        page: 1,
        pageSize: 10
      }
    );

  const output = {
    passed:
      Boolean(result) &&
      Boolean(result.summary) &&
      Array.isArray(result.records) &&
      result.summary.activeTags > 0 &&
      result.records.length > 0,
    readOnly: true,
    elapsedMs: Date.now() - started,
    indexedEntries:
      result.summary.indexedEntries,
    activeTags:
      result.summary.activeTags,
    activeItems:
      result.summary.activeItems,
    returnedRecords:
      result.records.length,
    firstTag:
      result.records.length
        ? result.records[0].tagNumber
        : '',
    firstReadiness:
      result.records.length
        ? result.records[0].readiness
        : ''
  };

  console.log(
    JSON.stringify(output, null, 2)
  );

  if (!output.passed) {
    throw new Error(
      'Admin Active Bag queue diagnostic failed.'
    );
  }

  return output;
}

function runFmrV3AdminActiveBagPublicApiDiagnostic() {
  const started = Date.now();

  const result = getFmrV3AdminActiveBags(
    FMR_V3.DEFAULT_DATABASE_ID,
    'jonathanmura05@gmail.com',
    {
      query: '',
      readiness: 'ALL',
      sortOrder: 'OLDEST_FIRST',
      page: 1,
      pageSize: 10
    }
  );

  const firstRecord =
    result.records && result.records.length
      ? result.records[0]
      : null;

  const output = {
    passed:
      Boolean(result) &&
      Boolean(result.summary) &&
      Boolean(result.pagination) &&
      Array.isArray(result.records) &&
      result.summary.activeTags === 1 &&
      result.records.length === 1 &&
      Boolean(firstRecord) &&
      firstRecord.tagNumber ===
        'BT-2026-00001',
    readOnly: true,
    elapsedMs: Date.now() - started,
    activeTags:
      result.summary.activeTags,
    activeItems:
      result.summary.activeItems,
    returnedRecords:
      result.records.length,
    firstTag:
      firstRecord
        ? firstRecord.tagNumber
        : '',
    firstReadiness:
      firstRecord
        ? firstRecord.readiness
        : '',
    page:
      result.pagination.page,
    totalRecords:
      result.pagination.totalRecords
  };

  console.log(
    JSON.stringify(output, null, 2)
  );

  if (!output.passed) {
    throw new Error(
      'Admin Active Bag public API diagnostic failed.'
    );
  }

  return output;
}