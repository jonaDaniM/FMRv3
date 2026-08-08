# FMR Operations v3 — Alpha 30.1 Safe Performance Pass

Reviewed baseline:

- Repository: `jonaDaniM/FMRv3`
- Commit: `24c592bf541c78c85092f2e6bddbb8eea17a53fb`
- Commit message: `bound alpha 30 changes`

This package intentionally avoids changing material arithmetic, transaction
writing, backorder decisions, Bag & Tag behavior, reversal rules, indexes, or
migration publication behavior.

## Changes included

1. `Bound/OwnerMaintenance.html`
   - Complete replacement.
   - Prevents Owner Maintenance from initializing in Field/Admin sessions.
   - This removes unnecessary Owner authorization and migration-history server
     calls from non-Owner page loads.

2. `FMRCoreV3/ProductionPerformanceDiagnostic.gs`
   - Complete replacement.
   - Keeps diagnostics read-only.
   - Makes diagnostics database-aware so they can measure the Bound app's
     active TEST/PRODUCTION database instead of always using the default DB.

3. `Bound/ProductionPerformanceAdapter.gs`
   - New file.
   - Allows the Bound project to invoke the read-only diagnostics against its
     active environment.

No schema changes are included.
