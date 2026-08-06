function inspectFmrV3Alpha23MaintenanceContract() {
  setFmrV3DatabaseContext_(
    FMR_V3_DATABASE_ID_ ||
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const databaseFingerprint =
    databaseFingerprintFmrV3_();

  const userCacheKey =
    userCacheKeyFmrV3_(
      'alpha23-cache-contract@example.com'
    );

  const listCacheKey =
    listCacheKeyFmrV3_(
      'UOM'
    );

  const configurationCacheKey =
    configurationCacheKeyFmrV3_();

  const adminIso =
    inspectFmrV3AdminIsoSummaryContract();

  const output = {
    passed:
      (
        FMR_V3.VERSION ===
          '3.0.0-alpha.23' &&
        userCacheKey.indexOf(
          databaseFingerprint
        ) >=
          0 &&
        listCacheKey.indexOf(
          databaseFingerprint
        ) >=
          0 &&
        configurationCacheKey.indexOf(
          FMR_V3_DATABASE_ID_
        ) >=
          0 &&
        adminIso.passed &&
        adminIso.batchParityPassed
      ),

    readOnly:
      true,

    diagnostic:
      'CORE_ALPHA23_CACHE_AND_ADMIN_ISO',

    version:
      FMR_V3.VERSION,

    databaseFingerprint:
      databaseFingerprint,

    userCacheDatabaseScoped:
      userCacheKey.indexOf(
        databaseFingerprint
      ) >=
        0,

    listCacheDatabaseScoped:
      listCacheKey.indexOf(
        databaseFingerprint
      ) >=
        0,

    configurationCacheDatabaseScoped:
      configurationCacheKey.indexOf(
        FMR_V3_DATABASE_ID_
      ) >=
        0,

    adminIsoBatchLookup:
      adminIso.batchLookup,

    adminIsoBatchParityPassed:
      adminIso.batchParityPassed,

    adminIsoBatchParityMismatchCount:
      adminIso
        .batchParityMismatchCount,

    adminIsoDataPassed:
      adminIso.dataPassed
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

function runFmrV3Alpha23MaintenanceDiagnostic() {
  const output =
    inspectFmrV3Alpha23MaintenanceContract();

  if (!output.passed) {
    throw new Error(
      'FMR v3 alpha.23 maintenance diagnostic failed.'
    );
  }

  return output;
}
