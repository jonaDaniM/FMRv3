# Diagnostic Adapter Fix

## What happened

The storage diagnostic passed.

The read diagnostic was started from the Apps Script editor by running:

```text
runProductionReadPerformanceDiagnosticV3
```

The editor Run button does not supply the `fmrNumber` parameter.

That caused the Core compatibility parser to receive:

```text
databaseId
ownerEmail
undefined
```

and interpret the call as its older two-argument signature.

The database ID was therefore treated as the user email, producing:

```text
Unauthorized user: <database-id>
```

This is a diagnostic invocation problem, not an FMR security failure.

## Install

In the Bound Apps Script project:

1. Open `ProductionPerformanceAdapter.gs`.
2. Delete the entire file.
3. Paste the complete contents of:

```text
Bound/ProductionPerformanceAdapter.gs
```

4. Save.

No FMRCoreV3 change or new Core library version is required for this fix.

## Configure one published FMR

In the Bound Apps Script project:

1. Open **Project Settings**.
2. Go to **Script properties**.
3. Add:

```text
Property:
FMR_V3_PERFORMANCE_DIAGNOSTIC_FMR
```

4. Set its value to one real, already-published FMR number from the current
   TEST database.

Example only:

```text
FMR-000123
```

Use a real FMR from your system, not that example unless it actually exists.

## Verify configuration

Run from the Bound editor:

```javascript
inspectProductionPerformanceDiagnosticV3()
```

Expected:

```text
passed: true
configured: true
callerEmail: your owner email
databaseFingerprint: zpng2GNiXABY
configuredFmr: your selected FMR
```

## Rerun the diagnostics

Run:

```javascript
runProductionStorageProfileDiagnosticV3()
```

Then:

```javascript
runProductionReadPerformanceDiagnosticV3()
```

Because the FMR number is now stored as a Script Property, the no-argument
editor Run button works correctly.

## What to send back

Send the JSON output from:

```text
runProductionReadPerformanceDiagnosticV3()
```

especially:

```text
timings
ownerLedgerPhaseTimings
counts
ownerPreview
```

That is the data needed for the next performance decision.
