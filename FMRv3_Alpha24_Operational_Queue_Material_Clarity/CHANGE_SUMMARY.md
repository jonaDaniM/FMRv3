# Alpha 24 change summary

## Problem corrected

The Admin Backorders queue previously received and displayed only a commodity code for each pending request. Size and material description existed on the published FMR line but were not included in the backorder queue response.

The Active Bags queue included size and description, but rendered the heading as an unlabeled `commodity · size` combination. This made values such as `4` ambiguous.

## Core change

`FMRCoreV3/BackorderService.gs` now enriches each actionable backorder request from its associated published FMR line and returns:

```text
lineNumber
isoNumber
isoSheet
size
materialDescription
uom
```

The enrichment is cached in memory by `FMR_Line_ID` for the duration of the queue request, so duplicate requests for the same line do not cause repeated line reads. A missing legacy line does not take down the entire queue; the existing request data remains usable and the client shows safe fallbacks.

## Bound UI change

Both operational queues now use explicit labels:

```text
Commodity code
Size
ISO
Material description
Reason
Reported by
Reported at
Bagged
Issued
Remaining
```

Long descriptions, notes, ISO values, locations, and commodity codes wrap inside their cards using width containment, `overflow-wrap: anywhere`, and `word-break: break-word`.

## Unchanged behavior

- No spreadsheet schema or header changes
- No material quantity calculation changes
- No Bag & Tag transaction changes
- No issuance changes
- No backorder decision-rule changes
- No role or permission changes
- No database migration
