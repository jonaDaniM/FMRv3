# Alpha 30 Core Review

## Baseline

Latest GitHub commit reviewed:

```text
c2c26a4bed321de57c5a73dfe6588ecc5647eec6
review alpha 30
```

## Verified implementation

### Config.gs

Core version is:

```text
3.0.0-alpha.30
```

### OwnerCorrectionService.gs

The GitHub blob SHA is:

```text
4ed0006dbc70a31f755158ab22d8883ee7c37a8b
```

This exactly matches the locally syntax/structure-validated
`OwnerCorrectionService_ALPHA30_CORRECTED.gs`.

Verified Alpha 30 behavior includes:

- deterministic four-digit reversal verification code;
- no old `REVERSE CORR-...` confirmation phrase;
- FMR/ISO ledger material context;
- Commodity Code / Size / Material Description included in reversal data;
- FMR-level transaction/backorder loading;
- exact Correlation_ID transaction-group lookup;
- correction-history Set used for group status;
- updated line records reused after writes;
- header refresh deduplicated per FMR;
- public Owner correction library API retained.

### FieldBackorderNoticeService.gs

The GitHub blob SHA is:

```text
96f90477c8a1abccc1f452031764da444088d62d
```

This exactly matches the locally syntax/structure-validated
`FieldBackorderNoticeService_ALPHA30_CORRECTED.gs`.

Verified Alpha 30 behavior includes:

- exact Source_ID notification lookup;
- exact FMR_Line_ID notification lookup;
- exact Backorder_Requests FMR_Line_ID lookup during per-line synchronization;
- rejected-notice lifecycle retained;
- notification migration retained;
- notification diagnostic retained;
- Sprint 3B test fixtures retained.

### ProductionPerformanceDiagnostic.gs

GitHub blob SHA:

```text
c60c76bb81503c9fa04c74cc6be2465b6a767b7a
```

Matches the Alpha 30 generated diagnostic source.

### HistoricalMigrationService.gs

The public Alpha 29 migration API still exposes the functions used by the
Bound Owner adapter:

```text
previewFmrV3HistoricalMigration
startFmrV3HistoricalMigration
runFmrV3HistoricalMigrationChunk
getFmrV3HistoricalMigrationJob
retryFmrV3HistoricalMigrationFile
getFmrV3RecentHistoricalMigrationJobs
```

No adapter API rename is required for Alpha 30.

## Core conclusion

No additional Core source correction is required before beginning the Bound
Alpha 30 integration.

The remaining required work is:

1. publish the corrected Core as a new immutable Apps Script library version;
2. point Bound to that immutable version;
3. paste/test the Bound files in this package;
4. run the production-gate regression tests before PRODUCTION cutover.
