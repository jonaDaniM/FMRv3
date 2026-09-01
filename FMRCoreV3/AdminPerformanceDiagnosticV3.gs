
function runFmrV3AdminHotPathDiagnostic(
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

  const output = {
    passed:
      true,

    readOnly:
      true,

    version:
      FMR_V3.VERSION,

    databaseFingerprint:
      databaseFingerprintFmrV3_(),

    user:
      user.email,

    timings:
      {},

    counts:
      {}
  };

  let started =
    Date.now();

  const baseRegister =
    getAdminFmrRegisterFmrV3_(
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

  output.timings.registerHeaderScanFilterSortMs =
    Date.now() -
    started;

  started =
    Date.now();

  const enrichedRegister =
    enrichAdminRegisterWithIsoSummariesFmrV3_(
      baseRegister
    );

  output.timings.registerVisibleIsoEnrichmentMs =
    Date.now() -
    started;

  output.timings.registerTotalMs =
    output.timings.registerHeaderScanFilterSortMs +
    output.timings.registerVisibleIsoEnrichmentMs;

  output.counts.registerTotalRecords =
    numberFmrV3_(
      enrichedRegister &&
      enrichedRegister.pagination &&
      enrichedRegister.pagination.totalRecords
    );

  output.counts.registerVisibleRecords =
    (
      enrichedRegister.records || []
    ).length;

  started =
    Date.now();

  const backorders =
    getBackorderQueueFmrV3_(
      userEmail
    );

  output.timings.backorderQueueMs =
    Date.now() -
    started;

  output.counts.backorderRequests =
    numberFmrV3_(
      backorders.count
    );

  started =
    Date.now();

  const bags =
    getAdminActiveBagQueueFmrV3_(
      userEmail,
      {
        query: '',
        readiness: 'ALL',
        sortOrder: 'OLDEST_FIRST',
        page: 1,
        pageSize: 10
      }
    );

  output.timings.activeBagQueueMs =
    Date.now() -
    started;

  output.counts.activeBagIndexedEntries =
    numberFmrV3_(
      bags &&
      bags.summary &&
      bags.summary.indexedEntries
    );

  output.counts.activeBagItems =
    numberFmrV3_(
      bags &&
      bags.summary &&
      bags.summary.activeItems
    );

  /**
   * This final Dashboard timing is deliberately labeled WARM because the
   * queue-specific measurements above have already populated the same caches.
   */
  started =
    Date.now();

  const dashboard =
    getAdminDashboardFmrV3_(
      userEmail
    );

  output.timings.dashboardAfterWarmupMs =
    Date.now() -
    started;

  output.counts.dashboardBackorders =
    (
      dashboard.backorders || []
    ).length;

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  return output;
}
