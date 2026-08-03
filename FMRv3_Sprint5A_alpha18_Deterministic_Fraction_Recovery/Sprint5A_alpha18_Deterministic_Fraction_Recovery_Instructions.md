# Sprint 5A alpha.18 — deterministic fractional Size recovery

## Confirmed alpha.17 result

```text
fractionSizeRepairCount: 0
unrepairedDateLikeSizeCount: 42
```

The strict full-string parser did not match Google's exact cell representation.

## Release

```text
Core: 3.0.0-alpha.18
Library: 18
Parser: ALPHA18_FRACTION_SIZE_V3
```

Alpha.18 extracts month and day tokens directly instead of relying on complete
date-string parsing.

Examples:

```text
Wed Aug 05 2026 ... -> 5/8
Fri Apr 03 2026 ... -> 3/4
Sun Feb 01 2026 ... -> 1/2
```

Any date-like Size that remains unresolved becomes a blocking import issue and
cannot be staged.

## Installation

Replace:

```text
FMRCoreV3/BulkImportService.gs
Bound/Adapter.gs
Bound/appsscript.json
```

Apply the Config patch.

No migration, Client, Index, or Styles change is required.

Run:

```javascript
runFmrV3BulkImportContractDiagnostic
```

Expected:

```text
passed: true
version: 3.0.0-alpha.18
parserVersion: ALPHA18_FRACTION_SIZE_V3
sizeDateCoercionMode:
  DATE_OBJECT_OR_DATE_TEXT_TOKEN_TO_DAY_MONTH_FRACTION
unresolvedSizeDatePolicy: BLOCK_ITEM
```

Create immutable library version 18 and update the Bound deployment.

## Re-import K408A

Upload the unchanged workbook again and run:

```javascript
inspectFmrV3BulkImportBatch
```

Required:

```text
passed: true
fractionSizeRepairCount: 42
fractionSizeRepairItemCount: 13
unrepairedDateLikeSizeCount: 0
unrepairedDateLikeSizeSamples: []
uomCounts.EA: 227
uomCounts.LF: 1
```

Do not stage anything unless these conditions pass.

Then select FMR 42 only, stage it again, and confirm the stud-bolt Size values:

```text
5/8
5/8
5/8
1/2
1/2
```

There must be no weekday, GMT, Standard Time, or Daylight Time text.
