function installWritePerformanceTelemetryV3() {
  assertCurrentBoundOwnerV3_();

  return FMRCoreV3
    .installFmrV3WritePerformanceTelemetry(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_()
    );
}


function getRecentWritePerformanceEventsV3(
  maximumRows
) {
  assertCurrentBoundOwnerV3_();

  const result =
    FMRCoreV3
      .getFmrV3RecentWritePerformanceEvents(
        boundDatabaseIdFmrV3_(),
        callerEmailFmrV3_(),
        maximumRows ||
        100
      );

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

function recordWritePerformanceEventV3(
  event
) {
  return FMRCoreV3
    .recordFmrV3WritePerformanceEvent(
      boundDatabaseIdFmrV3_(),
      callerEmailFmrV3_(),
      event || {}
    );
}

