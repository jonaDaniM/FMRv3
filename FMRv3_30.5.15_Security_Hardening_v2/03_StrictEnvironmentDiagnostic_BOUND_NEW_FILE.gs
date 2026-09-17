/**
 * FMRv3 alpha.30.5.15 preflight diagnostic.
 *
 * Add to the Bound project.
 * Read-only.
 *
 * This strengthens the existing diagnostic by requiring the Bound environment
 * and the database/Core environment to match.
 */
function runStrictBoundEnvironmentDiagnosticV3() {
  const base =
    inspectBoundIdentityAndEnvironmentV3();

  const boundEnvironment =
    String(base.activeEnvironment || '')
      .trim()
      .toUpperCase();

  const coreEnvironment =
    String(base.coreEnvironment || '')
      .trim()
      .toUpperCase();

  const environmentMatch =
    Boolean(boundEnvironment) &&
    Boolean(coreEnvironment) &&
    boundEnvironment === coreEnvironment;

  const fingerprintMatch =
    Boolean(base.resolvedDatabaseFingerprint) &&
    base.resolvedDatabaseFingerprint ===
      base.coreDatabaseFingerprint;

  const passed =
    base.passed === true &&
    base.databasePropertyConfigured === true &&
    base.usingDefaultTestDatabaseFallback === false &&
    environmentMatch &&
    fingerprintMatch;

  const output =
    Object.assign(
      {},
      base,
      {
        strictDiagnostic:
          'BOUND_ENVIRONMENT_STRICT_ALPHA30_5_15',
        environmentMatch:
          environmentMatch,
        fingerprintMatch:
          fingerprintMatch,
        passed:
          passed
      }
    );

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!passed) {
    throw new Error(
      'Strict Bound environment diagnostic failed. ' +
      'Do not perform a security/permission cutover.'
    );
  }

  return output;
}
