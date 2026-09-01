/**
 * Alpha 30.5.6 read-only performance diagnostic.
 *
 * Measures:
 * - lightweight Operations Center load;
 * - full integrity inspection after the N+1/NxN Bag index lookup removal;
 * - Admin Dashboard without Active Bag queue loading.
 *
 * No spreadsheet business data is modified.
 */
function runFmrV3OperationalReadinessPerformanceDiagnostic(
  databaseId,
  userEmail,
  boundEnvironment
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const result = {
    passed: false,
    readOnly: true,
    version:
      FMR_V3.VERSION,
    databaseFingerprint:
      databaseFingerprintFmrV3_(),
    user:
      owner.email,
    timings: {},
    integrity: {},
    operationsCenter: {},
    dashboard: {}
  };

  const centerStarted =
    Date.now();

  const center =
    getOperationsCenterFmrV3_(
      userEmail,
      boundEnvironment
    );

  result.timings.operationsCenterMs =
    Date.now() -
    centerStarted;

  result.operationsCenter = {
    status:
      center &&
      center.currentHealth
        ? center.currentHealth
            .overallStatus
        : '',
    integrityPassed:
      center &&
      center.currentHealth &&
      center.currentHealth
        .integrity
        ? center.currentHealth
            .integrity
            .passed
        : null,
    integritySkipped:
      Boolean(
        center &&
        center.currentHealth &&
        center.currentHealth
          .integrity &&
        center.currentHealth
          .integrity
          .skipped
      ),
    integritySource:
      center &&
      center.currentHealth &&
      center.currentHealth
        .integrity
        ? center.currentHealth
            .integrity
            .source
        : ''
  };

  const integrityStarted =
    Date.now();

  const integrity =
    inspectFmrV3DataIntegrity(
      databaseId
    );

  result.timings.fullIntegrityMs =
    Date.now() -
    integrityStarted;

  result.integrity = {
    passed:
      integrity.passed,
    linesScanned:
      integrity.linesScanned,
    headersScanned:
      integrity.headersScanned,
    backordersScanned:
      integrity.backordersScanned,
    activeBagItems:
      integrity.activeBagItems,
    lineIssueCount:
      integrity.lineIssueCount,
    headerIssueCount:
      integrity.headerIssueCount,
    bagIndexIssueCount:
      integrity.bagIndexIssueCount,
    elapsedMs:
      integrity.elapsedMs
  };

  const dashboardStarted =
    Date.now();

  const dashboard =
    getAdminDashboardFmrV3_(
      userEmail
    );

  result.timings.adminDashboardMs =
    Date.now() -
    dashboardStarted;

  result.dashboard = {
    backorders:
      dashboard &&
      dashboard.operationalRail &&
      dashboard.operationalRail
        .backorders
        ? Number(
            dashboard
              .operationalRail
              .backorders
              .count ||
            0
          )
        : 0,
    activeBagQueueDeprecated:
      Boolean(
        dashboard &&
        dashboard.operationalRail &&
        dashboard.operationalRail
          .activeBags &&
        dashboard.operationalRail
          .activeBags
          .deprecated
      )
  };

  result.passed =
    Boolean(
      result.dashboard
        .activeBagQueueDeprecated &&
      result.timings
        .operationsCenterMs >=
        0 &&
      result.timings
        .fullIntegrityMs >=
        0 &&
      result.timings
        .adminDashboardMs >=
        0
    );

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  if (!result.passed) {
    throw new Error(
      'Alpha 30.5.6 operational-readiness performance diagnostic failed.'
    );
  }

  return result;
}
