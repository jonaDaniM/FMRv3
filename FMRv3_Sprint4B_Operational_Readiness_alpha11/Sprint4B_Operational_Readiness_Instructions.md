# Sprint 4B — Operational monitoring, backups, recovery, and rollout readiness

## Release

Sprint 4B advances the system to:

```text
Core version: 3.0.0-alpha.11
Apps Script library version: 11
```

Keep the active Bound environment on `TEST` throughout acceptance.

## Scope

Sprint 4B adds:

- Operational health snapshots and history.
- Current backup-age monitoring.
- Manual Google Sheets database backups.
- Daily scheduled backup followed by health validation.
- Configurable backup retention and stale-item thresholds.
- Backup-history retention cleanup.
- Rollout-readiness indicators.
- Controlled recovery previews.
- Recovery application only while the environment is `READ_ONLY`.
- Automatic pre-recovery backup.
- Audited recovery actions for:
  - Refresh Header Totals
  - Rebuild Search Index
  - Synchronize Field Notices
  - Safe Reconcile
- Active-database context corrections so TEST and PRODUCTION do not
  accidentally read diagnostics or Field notices from the other database.

Full database restoration remains intentionally manual. Sprint 4B creates
restorable database copies and records the backup ID, but it does not silently
replace the live database.

---

## Core installation

### 1. Patch Config.gs

Apply:

```text
FMRCoreV3_Config_alpha11_patch.md
```

This:

- Advances Core to `3.0.0-alpha.11`.
- Adds sheet constants and header contracts for:
  - `Operational_Health_Log`
  - `Backup_History`
  - `Recovery_Actions`

Do not run a schema diagnostic after the Config patch until the migration has
created the three physical sheets.

### 2. Create

```text
FMRCoreV3/OperationalReadinessService.gs
```

Use the complete:

```text
FMRCoreV3_OperationalReadinessService_alpha11.gs
```

### 3. Replace completely

```text
FMRCoreV3/PublicApi.gs
FMRCoreV3/IntegrityService.gs
FMRCoreV3/SystemControlService.gs
FMRCoreV3/FieldBackorderNoticeService.gs
```

Use:

```text
FMRCoreV3_PublicApi_alpha11.gs
FMRCoreV3_IntegrityService_alpha11.gs
FMRCoreV3_SystemControlService_alpha11.gs
FMRCoreV3_FieldBackorderNoticeService_alpha11.gs
```

The last three replacements preserve the active database context. This is
required before PRODUCTION environment activation.

### 4. Core manifest

No Core manifest change is required. The project already enables Drive v3 and
the required Google Drive scope.

### 5. Run the migration immediately

Save all Core files, then run:

```javascript
migrateFmrV3OperationalReadiness
```

Expected:

```text
passed: true
migration: ALPHA11_OPERATIONAL_READINESS
version: 3.0.0-alpha.11
postDiagnostic.passed: true
```

The migration creates the three new sheets and adds these Configuration rows:

```text
BACKUP_FOLDER_ID
BACKUP_RETENTION_DAYS
BACKUP_MAX_AGE_HOURS
STALE_BACKORDER_HOURS
STALE_BAG_DAYS
HEALTH_HISTORY_LIMIT
```

`BACKUP_FOLDER_ID` remains blank until the first successful backup. The first
backup creates the environment-specific folder and stores its ID internally.

---

## Core diagnostics

Run:

```javascript
runFmrV3OperationalReadinessDiagnostic
runFmrV3SystemControlDiagnostic
runFmrV3DataIntegrityDiagnostic
runFmrV3FieldNotificationDiagnostic
runFmrV3FieldMetadataDiagnostic
runFmrV3FieldWorkflowContractDiagnostic
runFmrV3KnownSearchPerformanceDiagnostic
runFmrV3BootstrapPerformanceDiagnostic
```

Expected operational-readiness result:

```text
passed: true
version: 3.0.0-alpha.11
three valid operational sheets
positive backup and stale-item thresholds
```

After all Core diagnostics pass, create immutable library version 11:

```text
3.0.0-alpha.11 — Operational monitoring, backups, and controlled recovery
```

---

## Bound installation

### Replace completely

```text
Bound/Adapter.gs
Bound/Client.html
Bound/appsscript.json
```

Use:

```text
Bound_Adapter_alpha11.gs
Bound_Client_Sprint4B_alpha11.html
Bound_appsscript_alpha11.json
```

### Patch Index.html

Use:

```text
Bound_Index_Sprint4B_alpha11_patch.html
```

Insert the complete Operational Readiness block after the existing
Sprint 4A `Production Controls` panel and before `Owner Intake`.

### Patch Styles.html

Append:

```text
Bound_Styles_Sprint4B_alpha11_patch.css
```

immediately before the final:

```html
</style>
```

Save the Bound project and update the existing web-app deployment.

---

## Initial Bound acceptance

Open the Owner view.

Expected new section:

```text
Operational Readiness
Overall Health
Latest Backup
Daily Schedule
Rollout
Operational Thresholds
Backup History
Health History
Controlled Recovery
Recovery History
```

The first calculated health status may be `WARN` because no successful backup
exists yet. Schema, integrity, and system-control subchecks must remain healthy.

---

## Backup acceptance

Select:

```text
Create Backup
```

Use notes:

```text
Sprint 4B manual backup acceptance
```

Expected:

- An environment-specific backup folder is created on the first run.
- A complete copy of the database spreadsheet is created in that folder.
- `Backup_History` receives one `SUCCESS` row.
- The Owner UI shows the backup as current.
- The database ID and folder ID are displayed only as fingerprints.

Then select:

```text
Run Health Check
```

Expected:

- `Operational_Health_Log` receives a new row.
- Backup status is `SUCCESS`.
- Backup age is within the configured limit.
- Schema, integrity, and system-control checks pass.
- Rollout shows at least `Pilot ready` while the environment remains TEST.

Operational exceptions such as genuinely stale bags or backorders may keep the
overall health at `WARN`; they must not cause schema or integrity failure.

---

## Daily schedule acceptance

Set the approximate schedule hour to:

```text
2
```

Select:

```text
Install Daily Schedule
```

Google may request authorization for installable triggers.

Expected:

```text
Daily near 02:00 · America/Indiana/Indianapolis
```

From the Bound Apps Script editor, manually run once:

```javascript
runBoundScheduledOperationsV3
```

This validates the scheduled path without waiting overnight.

Expected:

- One new scheduled backup.
- One new scheduled health record.
- Both records show `SCHEDULED`.
- The backup is created before the health check.
- The schedule remains installed after the manual handler test.

Then run:

```javascript
verifyBoundOperationalReadinessV3
```

Expected:

```text
passed: true
coreVersion: 3.0.0-alpha.11
environmentName: TEST
boundEnvironment: TEST
backupExists: true
backupCurrent: true
pilotReady: true
scheduleEnabled: true
```

Also rerun:

```javascript
verifyBoundFmrV3Connection
verifyBoundSystemControlContractV3
verifyBoundAdminOperationalRailV3
verifyBoundFieldWorkflowContractV3
verifyBoundFieldBackorderNoticeContractV3
```

---

## Controlled recovery acceptance

Use the preserved fixture:

```text
V3-ADMIN-CONFIRM-0003
```

In Controlled Recovery:

```text
FMR: V3-ADMIN-CONFIRM-0003
Action: SAFE_RECONCILE
```

Select:

```text
Preview Recovery
```

Expected preview:

- Recovery ID
- FMR number
- Material-line count
- Current versus expected search-index count
- Remaining quantity
- Notice that READ_ONLY mode and an automatic backup are required

Do not apply while transaction mode is ENABLED. Attempting to apply must return:

```text
Recovery application requires Transaction Mode READ_ONLY.
```

In Production Controls, change:

```text
Transaction Mode: READ_ONLY
Maintenance Message:
Sprint 4B controlled recovery acceptance
```

Save Configuration.

Enter this recovery reason:

```text
Sprint 4B safe reconciliation acceptance for indexed fixture data.
```

Generate a fresh preview if the original 15-minute token expired, then select:

```text
Apply Previewed Recovery
```

Expected:

- A `RECOVERY` backup is created before repair.
- Existing active Search Index rows for the FMR are deactivated.
- Exactly three current Search Index rows are rebuilt per active material line.
- Header totals are refreshed.
- Field notices are synchronized.
- Post-recovery data integrity passes.
- `Recovery_Actions` changes from `PREVIEWED` to `APPLIED`.
- The result displays the backup ID.
- Audit actions record the preview and application.

After acceptance, return Production Controls to:

```text
Transaction Mode: ENABLED
Maintenance Message: blank
```

Save Configuration.

Then rerun:

```javascript
verifyBoundOperationalReadinessV3
verifyBoundAdminOperationalRailV3
verifyBoundFieldBackorderNoticeContractV3
```

---

## Threshold and retention acceptance

Default settings:

```text
Backup retention: 30 days
Maximum backup age: 30 hours
Stale backorder: 48 hours
Stale Bag & Tag: 7 days
```

Saving new values updates the Configuration sheet through the Owner service and
records an audit action.

Retention cleanup only affects successful backup files recorded by this
system, marked active, and older than the configured retention period. It does
not scan or delete unrelated Drive files.

---

## TEST and PRODUCTION behavior

The alpha.11 replacements ensure these operations use the current database
context:

- Data-integrity inspection
- System-control inspection
- Field notification reads and writes
- Operational health checks
- Backups
- Recovery preview and application

Do not activate PRODUCTION until the separate production database has:

- The alpha.10 system-control migration
- The alpha.11 operational-readiness migration
- The configured System Owner
- A successful backup
- A successful health check
- A daily Bound schedule
- All Bound rollout diagnostics passing

---

## GitHub push

Push only these production paths:

```text
FMRCoreV3/Config.gs
FMRCoreV3/OperationalReadinessService.gs
FMRCoreV3/PublicApi.gs
FMRCoreV3/IntegrityService.gs
FMRCoreV3/SystemControlService.gs
FMRCoreV3/FieldBackorderNoticeService.gs
Bound/Adapter.gs
Bound/Client.html
Bound/Index.html
Bound/Styles.html
Bound/appsscript.json
```

Do not commit:

- The ZIP
- Extracted package directories
- Patch instruction files
- `.DS_Store`

Commit message:

```text
Add operational readiness and controlled recovery
```
