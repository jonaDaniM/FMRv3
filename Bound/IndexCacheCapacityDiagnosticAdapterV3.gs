function runIndexCacheCapacityDiagnosticV3() {
  assertCurrentBoundOwnerV3_();

  return serializeBoundResponseV3_(
    FMRCoreV3
      .runFmrV3IndexCacheCapacityDiagnostic(
        boundDatabaseIdFmrV3_(),
        callerEmailFmrV3_()
      )
  );
}
