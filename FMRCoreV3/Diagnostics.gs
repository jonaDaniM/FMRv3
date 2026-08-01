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
