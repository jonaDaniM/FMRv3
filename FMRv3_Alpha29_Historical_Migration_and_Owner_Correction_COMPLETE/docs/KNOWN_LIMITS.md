# Known Limits / Deliberate Alpha 29 Controls

## Historical state reconstruction is not included

The migration publishes the existing FMR definition and requested quantities.

It does not automatically reconstruct prior:

- issued quantities;
- prior Bag & Tag history;
- backorder history;
- free-form Action Taken history.

That should be a separate reconciled migration phase if management requires the
system to begin with historical fulfillment state.

## Correction scope

The first correction engine supports these transaction types:

```text
CONFIRM_AVAILABLE
DIRECT_ISSUE
ISSUE_FROM_AVAILABLE
BAG
ISSUE_FROM_BAG
BACKORDER_REQUESTED
BACKORDER_CONFIRMED
BACKORDER_REJECTED
BACKORDER_RETURNED
BACKORDER_FULFILLED
BACKORDER_RETURN_RESOLVED
```

`REVERSAL_*` rows cannot themselves be reversed in Alpha 29.

## Correction is not a normal Field workflow

Every applied correction requires a database backup. It is intentionally slower
and more controlled than ordinary Field actions.

## Rare mid-apply failures

The service performs a full preflight and backup before writing, but Google
Sheets does not provide a multi-sheet ACID transaction.

If an unexpected provider error occurs after writes have begun, the service
records a FAILED Owner_Corrections row and reports the backup ID. Inspect the
database before retrying.
