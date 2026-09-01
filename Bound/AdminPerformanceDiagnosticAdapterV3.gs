
function runAdminHotPathPerformanceDiagnosticV3() {
  assertCurrentBoundOwnerV3_();

  return serializeBoundResponseV3_(
    FMRCoreV3
      .runFmrV3AdminHotPathDiagnostic(
        boundDatabaseIdFmrV3_(),
        callerEmailFmrV3_()
      )
  );
}
