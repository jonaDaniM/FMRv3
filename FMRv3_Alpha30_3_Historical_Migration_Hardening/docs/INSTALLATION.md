# Alpha 30.3 Installation — Historical Migration Hardening

## Scope

This is intentionally isolated to historical migration.

Do **not** change Field, Admin, Bag & Tag, Backorder, transaction arithmetic,
Owner transaction correction, Search_Index, Operational_Index, or publication
semantics.

## 0. Before editing

Create or confirm a current TEST backup.

Do not resume the old interrupted migration job.

## 1. Add Core quantity helper

Create a NEW FMRCoreV3 file:

`BulkImportQuantityNormalization`

Paste:

`FMRCoreV3/BulkImportQuantityNormalization.gs`

## 2. Edit BulkImportService.gs

Follow:

`docs/BULK_IMPORT_SERVICE_EDIT.md`

There are exactly two changes:

1. Change parserVersion to:

```javascript
parserVersion:
      'ALPHA30_3_LF_QUANTITY_NORMALIZATION_V1',
```

2. Replace the quantity/inferred-UOM block inside
   `parseBulkImportWorksheetFmrV3_` with the supplied Alpha 30.3 block.

Do not remove the existing `quantity <= 0` validation.

## 3. Add Core migration hardening service

Create a NEW FMRCoreV3 file:

`HistoricalMigrationHardeningService`

Paste:

`FMRCoreV3/HistoricalMigrationHardeningService.gs`

## 4. Replace one function in HistoricalMigrationService.gs

Replace the complete existing function:

`historicalCollectFilesFmrV3_`

with:

`FMRCoreV3/HistoricalMigrationService_REPLACE_historicalCollectFilesFmrV3_.gs`

This excludes generated migration working folders and converted files during
recursive discovery.

## 5. Core version

In `Config.gs` set:

```javascript
VERSION: '3.0.0-alpha.30.3',
```

## 6. Publish new immutable Core library version

Save Core and publish a new immutable library version.

Record the actual Apps Script library version number.

## 7. Bound adapter

Replace the entire:

`Bound/OwnerMaintenanceAdapter.gs`

with the file in this package.

## 8. Bound Owner Maintenance UI

Replace the entire:

`Bound/OwnerMaintenance.html`

with the file in this package.

This file was generated from the exact current GitHub OwnerMaintenance blob
`6468dd34fbcec578b1576f75079cdba17353fc17`.

## 9. Update Bound library dependency

In `Bound/appsscript.json`, change only the FMRCoreV3 library version to the new
immutable Core library version.

## 10. Redeploy TEST

Create a new version of the existing TEST web app deployment.

Confirm the deployed header shows:

`FMRCore 3.0.0-alpha.30.3`

## 11. Close the old interrupted job

In Recent Migration Jobs, find the old job that is still RUNNING with 4/10
files complete.

Use **Abandon**.

The UI will require a confirmation in the form:

`ABANDON <last 8 characters of Job ID>`

Abandoning the job does not delete FMRs it already published.

## 12. Run the Alpha 30.3 test plan

Use `docs/TEST_PLAN.md`.

Do not proceed to the full historical population until the test plan passes.
