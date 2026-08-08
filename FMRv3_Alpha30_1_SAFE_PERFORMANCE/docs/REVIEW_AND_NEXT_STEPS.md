# Code Review and Recommended Next Steps

## Current state

The Alpha 30 Core hot-path changes are in place:
- exact transaction/backorder retrieval for Owner correction;
- four-digit reversal verification;
- material context on transaction groups;
- reduced duplicate line reads on reversal apply;
- exact Backorder/Field-notice lookups on normal Field synchronization.

The latest Bound commit also:
- removed the obsolete OwnerMaintenanceMaterialContext include;
- retained USER_ACCESSING Drive authorization;
- added folder preflight;
- points Bound to FMRCoreV3 library version 30.

## Important performance finding

`OwnerMaintenance.html` is included in the common page and `#ownerView` exists
even when the requested interface is Field or Admin. Therefore checking only for
`#ownerView` is not enough to prevent Owner Maintenance initialization.

Without the Alpha 30.1 guard, Field/Admin page loads can still attempt:
- `getOwnerMaintenanceAuthorizationV3`
- `getRecentHistoricalMigrationJobsV3`

Those are Owner-only calls and provide no value to Field/Admin users.

Alpha 30.1 exits the OwnerMaintenance IIFE before binding or server calls unless
`REQUESTED_VIEW === 'owner'`.

## What should NOT be optimized yet

### Live Dashboard / queues
Avoid caching live queue responses before measuring them. A stale Bag or
Backorder queue is worse than a small latency gain.

### ScriptLock
Keep it. It protects multi-user transaction correctness.

### Audit writes
Keep them. This system is approaching production and correction history matters.

### Automatic correction backup
Keep it. Reversals are exceptional and can tolerate extra latency.

### Search_Index / Operational_Index
Keep the current architecture. It is already the correct abstraction.

### Historical publisher
Do not rewrite it immediately before the 600+ FMR import.

## Next production sequence

1. Install Alpha 30.1 in TEST.
2. Run storage/read timing baseline.
3. Complete transaction regression.
4. Import a representative 50-100 FMR historical batch.
5. Repeat timing tests.
6. If timings remain acceptable, perform the full historical migration.
7. Repeat diagnostics at full production-like scale.
8. Only then consider a Transaction_Index or additional server-side caching.

## Thresholds to investigate

These are engineering targets, not guarantees:

- Exact Field FMR search: investigate if consistently > 1.5 s server-side.
- Owner ledger search: investigate if consistently > 2.5 s.
- Admin dashboard: investigate if consistently > 2 s.
- Exact Admin FMR register search: investigate if consistently > 1.5 s.
- Normal transaction write: investigate if consistently > 3 s excluding user
  network variability.
- Owner reversal apply can be slower because it intentionally includes backup.

Use repeated measurements rather than one execution; Apps Script cold starts
can distort single-run timings.
