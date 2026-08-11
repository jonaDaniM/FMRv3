# BulkImportService.gs — Alpha 30.3 Exact Edits

These are the only two edits required in the existing
`FMRCoreV3/BulkImportService.gs`.

## Edit 1 — parser fingerprint/version

Find:

```javascript
parserVersion:
      'ALPHA19_FRACTION_STORAGE_V1', // located
```

Replace with:

```javascript
parserVersion:
      'ALPHA30_3_LF_QUANTITY_NORMALIZATION_V1', // complete
```

This is required. Historical source fingerprints include `parserVersion`.
Without the version change, a workbook that was already parsed under the old
quantity logic can reuse its prior blocked batch instead of being reparsed.

## Edit 2 — quantity parsing block

Inside `parseBulkImportWorksheetFmrV3_`, find this exact block:

```javascript
      const lineNumber = //same
        lines.length + 1; // same

      const quantity = 
        numberFmrV3_(
          rawQuantity !== '' &&
          rawQuantity !== null
            ? rawQuantity
            : displayQuantity
        );

      const inferred =
        inferBulkImportUomFmrV3_(
          description
        );

      const lineIssues = [];
```

Replace it with:

```javascript
      const lineNumber =
        lines.length + 1;

      const inferred =
        inferBulkImportUomFmrV3_(
          description
        );

      const quantityNormalization =
        normalizeBulkImportQuantityAlpha30_3FmrV3_(
          rawQuantity,
          displayQuantity,
          inferred.uom
        );

      const quantity =
        quantityNormalization
          .value;

      const lineIssues = [];

      if (
        quantityNormalization
          .normalized
      ) {
        lineIssues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .INFO,
            'QUANTITY_UNIT_NORMALIZED',
            'Quantity',
            lineNumber,
            (
              'Linear-foot quantity "' +
              quantityNormalization
                .sourceText +
              '" was normalized to ' +
              quantity +
              ' LF.'
            ),
            quantityNormalization
              .sourceText
          )
        );
      }
```
//// complete
Do not change the later existing `if (quantity <= 0)` validation.

That validation is intentionally preserved so blank historical quantities stay
BLOCKED.

## Expected behavior

| Source Quantity | Inferred UOM | Result |
|---|---|---|
| `40.2'` | LF | 40.2 LF + INFO issue |
| `66.7'` | LF | 66.7 LF + INFO issue |
| `0.3'` | LF | 0.3 LF + INFO issue |
| `12 LF` | LF | 12 LF + INFO issue |
| `12 FT` | LF | 12 LF + INFO issue |
| blank | LF | 0, existing QUANTITY_INVALID ERROR |
| `2'-6"` | LF | 0, existing QUANTITY_INVALID ERROR |
| `40.2'` | EA | 0, existing QUANTITY_INVALID ERROR |

