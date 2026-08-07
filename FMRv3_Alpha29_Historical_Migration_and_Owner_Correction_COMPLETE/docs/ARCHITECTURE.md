# Alpha 29 Architecture

## Historical migration

The high-volume migration is an orchestration layer, not a second importer.

```text
Drive folder
   ↓
HistoricalMigrationService
   ↓
existing BulkImportService parser
   ↓
existing staging service
   ↓
existing publication service
   ↓
published FMR tables + Search_Index
```

### New control sheets

The service creates:

```text
Historical_Migration_Jobs
Historical_Migration_Files
```

They store progress/checkpoint information only.

This makes the operation resumable and lets the Owner distinguish:

```text
PUBLISHED
BLOCKED
SKIPPED
FAILED
```

without changing the legacy source workbooks.

## Transaction correction

```text
FMR / ISO search
      ↓
Search_Index
      ↓
FMR_Line_Items
      ↓
Material_Transactions
Bag_Tag_Header / Bag_Tag_Items
Backorder_Requests
      ↓
group transactions by Correlation_ID
      ↓
dependency-aware inverse preview
      ↓
mandatory backup
      ↓
operational inverse
      ↓
REVERSAL_* transactions
      ↓
refresh FMR header + Field notices
```

## Transaction immutability

The ledger uses compensating transactions.

Example:

```text
Original:
ISSUE_FROM_BAG        4 EA

Correction:
REVERSAL_ISSUE_FROM_BAG   4 EA
```

The original row remains part of the permanent operational history.

## KPI behavior

The correction code does not manually edit KPI cells.

It updates the authoritative FMR line state, then invokes the existing header
recalculation. The Dashboard/KPI formulas continue to derive their values from
the corrected operational data.

## Dependency protection

A reversal is rejected when its current downstream state cannot be safely
inverted.

Examples:

- Confirm Available cannot be reversed after its quantity has been bagged or
  issued; reverse those later transactions first.
- Bag creation cannot be reversed while material from that bag remains issued.
- Backorder Requested cannot be reversed after Admin has acted; reverse the
  later Admin decision first.
