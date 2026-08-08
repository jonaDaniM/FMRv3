/**
 * FMR Operations v3 — Alpha 30.1
 * Bound adapters for read-only production performance diagnostics.
 *
 * Add this as a NEW Bound Apps Script file:
 *   ProductionPerformanceAdapter.gs
 *
 * These calls always use the Bound app's ACTIVE database/environment.
 */

function runProductionReadPerformanceDiagnosticV3(
  fmrNumber
) {
  assertCurrentBoundOwnerV3_();

  return serializeBoundResponseV3_(
    FMRCoreV3
      .runFmrV3ProductionReadPerformanceDiagnostic(
        boundDatabaseIdFmrV3_(),
        callerEmailFmrV3_(),
        fmrNumber
      )
  );
}

function runProductionStorageProfileDiagnosticV3() {
  assertCurrentBoundOwnerV3_();

  return serializeBoundResponseV3_(
    FMRCoreV3
      .runFmrV3ProductionStorageProfileDiagnostic(
        boundDatabaseIdFmrV3_()
      )
  );
}
