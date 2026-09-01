function runOperationalReadinessPerformanceDiagnosticV3() {
  assertCurrentBoundOwnerV3_();

  return serializeBoundResponseV3_(
    FMRCoreV3
      .runFmrV3OperationalReadinessPerformanceDiagnostic(
        boundDatabaseIdFmrV3_(),
        callerEmailFmrV3_(),
        activeBoundEnvironmentV3_()
      )
  );
}
