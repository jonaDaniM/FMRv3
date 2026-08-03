# Sprint 5A alpha.17 — serialized fractional Size correction

## Cause

Alpha.16 repaired fractional Size values only when the Google-converted cell
was returned as a JavaScript `Date` object. This workbook returns the converted
value as a serialized date string, such as:

```text
Wed Aug 05 2026 00:00:00 GMT-0400 (Eastern Daylight Time)
```

## Release

```text
Core: 3.0.0-alpha.17
Library: 17
Parser: ALPHA17_FRACTION_SIZE_V2
```

## Install

Replace:

```text
FMRCoreV3/BulkImportService.gs
Bound/Adapter.gs
Bound/appsscript.json
```

Apply the Config version patch. No migration, Client, Index, or Styles change
is required.

Run:

```javascript
runFmrV3BulkImportContractDiagnostic
```

Create immutable library version 17:

```text
3.0.0-alpha.17 — Restore serialized fractional material sizes
```

Update the Bound deployment.

## Re-import and inspect

Upload the unchanged K408A workbook again, then run:

```javascript
inspectFmrV3BulkImportBatch
```

Expected:

```text
passed: true
parserVersion: ALPHA17_FRACTION_SIZE_V2
fractionSizeRepairCount: 42
fractionSizeRepairItemCount: 13
unrepairedDateLikeSizeCount: 0
uomCounts.EA: 227
uomCounts.LF: 1
```

Do not proceed unless the repair count is exactly 42 and the unrepaired count
is zero.

## Repair staged FMR 42

In the alpha.17 batch, select FMR 42 only and choose `Stage Selected FMRs`.
This updates the existing unpublished staging record.

Reopen FMR 42 and verify these Size values:

```text
5/8
5/8
5/8
1/2
1/2
```

There must be no weekday, GMT, Standard Time, or Daylight Time text.

Run:

```javascript
runFmrV3DataIntegrityDiagnostic
runFmrV3BulkImportContractDiagnostic
inspectFmrV3BulkImportBatch
verifyBoundBulkImportContractV3
verifyBoundFmrV3Connection
```

Do not publish FMR 42 until the staging view and all diagnostics pass.
