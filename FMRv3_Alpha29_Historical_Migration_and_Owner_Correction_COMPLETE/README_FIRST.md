# FMR Operations v3 — Alpha 29

## Baseline reviewed

```text
Repository: jonaDaniM/FMRv3
Commit: 6b39c0235958a1a68b5ed4f119695abb93ac6f07
Commit: UI operational queues changes
Core: 3.0.0-alpha.28
Bound library: 28
```

## New capabilities

### 1. Historical FMR Migration Center

Imports large populations of already-built FMR workbooks from a Google Drive
folder without requiring the Owner to manually review/publish every FMR through
the normal Bulk Import Wizard.

It deliberately reuses the existing parser, staging service, and publication
service rather than writing raw operational rows.

### 2. Owner Transaction Correction

Adds an Owner-only web section that searches by FMR or ISO and retrieves:

- FMR material-line state;
- Material_Transactions;
- logical transaction groups by Correlation_ID;
- Bag & Tag history;
- Backorder history.

The Owner may preview and reverse a supported transaction group.

Original transactions are never deleted or edited. The service creates an
automatic pre-change backup, applies the inverse operational state, appends
`REVERSAL_*` transactions, refreshes FMR totals/Field notices, and records the
correction in `Owner_Corrections` plus `Audit_Log`.

## Start here

```text
docs/INSTALLATION.md
```
