/**
 * FMR Operations v3 — Alpha 30.1
 * Bound adapters for read-only production performance diagnostics.
 *
 * COMPLETE REPLACEMENT for:
 *   Bound/ProductionPerformanceAdapter.gs
 *
 * Why this revision exists:
 * Apps Script's editor Run button invokes a function with no arguments.
 * The read-performance diagnostic needs an FMR number. If no FMR is supplied,
 * this adapter now resolves one from a Script Property instead of passing
 * `undefined` into the Core library.
 *
 * Script Property:
 *   FMR_V3_PERFORMANCE_DIAGNOSTIC_FMR
 *
 * Example value:
 *   FMR-000123
 *
 * No transaction, migration, Bag & Tag, Backorder, or correction behavior is
 * changed by this file.
 */

const FMR_V3_PERFORMANCE_DIAGNOSTIC_FMR_PROPERTY =
  'FMR_V3_PERFORMANCE_DIAGNOSTIC_FMR';

function resolveProductionPerformanceFmrV3_(
  fmrNumber
) {
  const explicit =
    String(
      fmrNumber || ''
    ).trim();

  if (explicit) {
    return explicit;
  }

  const configured =
    String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          FMR_V3_PERFORMANCE_DIAGNOSTIC_FMR_PROPERTY
        ) ||
      ''
    ).trim();

  if (configured) {
    return configured;
  }

  throw new Error(
    'No performance-test FMR is configured. ' +
    'In Bound > Project Settings > Script properties, add ' +
    FMR_V3_PERFORMANCE_DIAGNOSTIC_FMR_PROPERTY +
    ' with the value of a known published FMR number. ' +
    'Then run this diagnostic again.'
  );
}

function inspectProductionPerformanceDiagnosticV3() {
  assertCurrentBoundOwnerV3_();

  const databaseId =
    boundDatabaseIdFmrV3_();

  const configuredFmr =
    String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          FMR_V3_PERFORMANCE_DIAGNOSTIC_FMR_PROPERTY
        ) ||
      ''
    ).trim();

  const output = {
    passed:
      Boolean(
        databaseId &&
        callerEmailFmrV3_()
      ),

    readOnly:
      true,

    activeEnvironment:
      activeBoundEnvironmentV3_(),

    databaseFingerprint:
      boundDatabaseFingerprintV3_(
        databaseId
      ),

    callerEmail:
      callerEmailFmrV3_(),

    configuredFmr:
      configuredFmr,

    configured:
      Boolean(
        configuredFmr
      ),

    scriptProperty:
      FMR_V3_PERFORMANCE_DIAGNOSTIC_FMR_PROPERTY
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

function runProductionReadPerformanceDiagnosticV3(
  fmrNumber
) {
  assertCurrentBoundOwnerV3_();

  const resolvedFmr =
    resolveProductionPerformanceFmrV3_(
      fmrNumber
    );

  return serializeBoundResponseV3_(
    FMRCoreV3
      .runFmrV3ProductionReadPerformanceDiagnostic(
        boundDatabaseIdFmrV3_(),
        callerEmailFmrV3_(),
        resolvedFmr
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
