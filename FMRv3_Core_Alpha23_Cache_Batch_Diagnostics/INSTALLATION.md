# FMRv3 Core Alpha 23 — Installation

## Scope

This is a controlled Core maintenance release.

It implements:

1. Database-scoped user, list, and last-access cache keys.
2. One batched Search Index lookup for Admin ISO summaries on the visible page.
3. A read-only Core maintenance diagnostic.
4. A read-only Bound identity and environment diagnostic.
5. Core semantic version `3.0.0-alpha.23`.
6. Expected Core library version `23`.

It does not change:

- database sheets, headers, or records;
- Field quantity calculations;
- Bag & Tag calculations;
- backorder decision rules;
- Owner staging or bulk-import behavior;
- role profiles or permission flags;
- the active/effective-user fallback;
- the current TEST database fallback.

## Important deployment order

Do not update the Bound manifest to library version 23 until Core library
version 23 has been created successfully.

## Part 1 — Update the Core Apps Script project

### Replace complete files

Replace:

```text
Security.gs
SystemControlService.gs
AdminIsoSummaryService.gs
```

with the files inside this package's `FMRCoreV3` folder.

### Add one new Core file

Create a script file named:

```text
Alpha23MaintenanceDiagnostic
```

Paste the contents of:

```text
FMRCoreV3/Alpha23MaintenanceDiagnostic.gs
```

### Update the Core version

Follow:

```text
Config_VERSION_PATCH.md
```

The final Core semantic version must be:

```text
3.0.0-alpha.23
```

### Save Core

Save the Core Apps Script project.

## Part 2 — Run the Core diagnostic before publishing

In the Core Apps Script editor, select and run:

```javascript
runFmrV3Alpha23MaintenanceDiagnostic
```

Expected key results:

```text
passed: true
version: 3.0.0-alpha.23
userCacheDatabaseScoped: true
listCacheDatabaseScoped: true
configurationCacheDatabaseScoped: true
adminIsoBatchLookup: true
adminIsoBatchParityPassed: true
adminIsoBatchParityMismatchCount: 0
```

`adminIsoDataPassed` reports whether the sampled active FMR headers have ISO
references in the Search Index. A false value indicates an existing data/index
condition, not necessarily a batching-code mismatch. The release must not be
published when `passed` is false.

## Part 3 — Publish Core library version 23

After the diagnostic passes:

1. Select **Deploy** in the Core Apps Script project.
2. Select **New deployment**.
3. Select deployment type **Library** when applicable, or create a new project
   version through the project version workflow used for the existing library.
4. Use this description:

```text
Alpha 23 database-scoped caches and batched Admin ISO summaries
```

5. Confirm the newly created immutable library version is:

```text
23
```

If Apps Script assigns a number other than 23, use that actual number in the
Bound manifest instead of blindly using the packaged manifest.

## Part 4 — Update the Bound Apps Script project

### Replace Adapter.gs

Replace the complete Bound `Adapter.gs` with:

```text
Bound/Adapter.gs
```

This adds diagnostics only. It does not change caller resolution.

### Update appsscript.json

After the Core library version exists, replace Bound `appsscript.json` with the
packaged file.

Confirm:

```json
"userSymbol": "FMRCoreV3",
"version": "23"
```

Use the actual assigned Core library version if it is not 23.

Save the Bound project.

## Part 5 — Run the Bound diagnostic

In the Bound Apps Script editor, run:

```javascript
runBoundIdentityAndEnvironmentDiagnosticV3
```

Run it while signed in as the configured System Owner.

Expected key results:

```text
passed: true
readOnly: true
activeEnvironment: TEST
databasePropertyKey: FMR_V3_DATABASE_ID_TEST
resolvedDatabaseFingerprint: <12-character value>
coreDatabaseFingerprint: <matching 12-character value>
coreVersion: 3.0.0-alpha.23
```

Review these fields carefully:

```text
activeEmail
effectiveEmail
resolvedCallerEmail
usedEffectiveUserFallback
databasePropertyConfigured
usingDefaultTestDatabaseFallback
```

For the current owner-run editor diagnostic, `resolvedCallerEmail` should be the
owner. Do not remove the fallback based on one test alone.

## Part 6 — Create a new Bound deployment version

1. Select **Deploy**.
2. Select **Manage deployments**.
3. Edit the existing test web deployment.
4. Select **New version**.
5. Use this description:

```text
Core alpha 23 cache isolation and Admin ISO batching
```

6. Deploy while preserving the existing `/exec` URL.

## Part 7 — Acceptance testing

### Field

1. Search by FMR.
2. Search by `ISO-##`.
3. Open material details.
4. Complete one controlled TEST transaction.
5. Confirm quantities and audit data remain correct.

### Admin register

1. Load All Published FMRs.
2. Change register page size to 25.
3. Move between pages.
4. Confirm ISO summaries match the prior deployment.
5. Search by an ISO suffix.
6. Open one FMR and confirm all material lines load.

### Operational Queues

1. Confirm Backorders and Active Bags still load.
2. Expand grouped records.
3. Confirm ISO values remain in `ISO-##` format.
4. Complete one controlled TEST backorder decision.

### Permissions

1. Field User: Field only.
2. Material Admin: Field and Admin; Owner never appears.
3. System Owner: Field, Admin, and Owner.

### Environment

Run the Bound diagnostic again after deployment and confirm:

```text
coreVersion: 3.0.0-alpha.23
resolvedDatabaseFingerprint == coreDatabaseFingerprint
```

## GitHub backup

After Apps Script testing succeeds, copy these exact deployed files to GitHub:

```text
FMRCoreV3/Security.gs
FMRCoreV3/SystemControlService.gs
FMRCoreV3/AdminIsoSummaryService.gs
FMRCoreV3/Alpha23MaintenanceDiagnostic.gs
FMRCoreV3/Config.gs
Bound/Adapter.gs
Bound/appsscript.json
```

GitHub remains a backup of the tested Apps Script source.

## Rollback

See `ROLLBACK.md`.
