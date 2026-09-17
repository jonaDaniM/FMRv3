# Required preflight — correct the TEST database environment label

The read-only diagnostics showed:

```text
Bound activeEnvironment = TEST
Core/database environment = PRODUCTION
```

The database fingerprint was different from production, so routing was correct.
The mismatch happened because the TEST spreadsheet was copied from production and inherited:

```text
Configuration.ENVIRONMENT_NAME = PRODUCTION
```

## Fix

Using the TEST Owner/System Configuration interface, set:

```text
ENVIRONMENT_NAME = TEST
TRANSACTION_MODE = ENABLED
```

Do not change production.

Then run:

```javascript
runBoundIdentityAndEnvironmentDiagnosticV3()
```

Expected TEST result:

```text
activeEnvironment: TEST
databasePropertyKey: FMR_V3_DATABASE_ID_TEST
databasePropertyConfigured: true
usingDefaultTestDatabaseFallback: false
resolvedDatabaseFingerprint: <TEST fingerprint>
coreDatabaseFingerprint: <same TEST fingerprint>
coreEnvironment: TEST
transactionMode: ENABLED
coreVersion: 3.0.0-alpha.30.5.14
```

Production should remain:

```text
activeEnvironment: PRODUCTION
coreEnvironment: PRODUCTION
resolvedDatabaseFingerprint == coreDatabaseFingerprint
```

Do not start permission/security cutover until both environments are internally consistent.
