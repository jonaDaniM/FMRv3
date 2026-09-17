# Production deployment

After TEST passes:

1. Take a fresh PROD backup.
2. Confirm `.14` rollback library/deployment details are recorded.
3. Create a new immutable Core library version containing `.15`.
4. Update TEST Bound to the immutable library and smoke-test.
5. Update PROD Bound dependency to that immutable library version.
6. Deploy a new Bound version using the existing production deployment/URL workflow.
7. Confirm banner shows `FMRCore 3.0.0-alpha.30.5.15`.
8. From Owner Operations, run `REBUILD_SEARCH_INDEX` once in PROD.
9. Search 3–5 known commodity codes:
   - common commodity;
   - rare commodity;
   - mixed-case input;
   - no-match code.
10. Verify existing FMR and ISO searches.
11. Watch execution durations for `getAdminFmrRegisterV3`.
12. Keep `.14` available for rollback.

The Search_Index rebuild is the only data-maintenance step required for
existing published FMRs. The authoritative FMR headers/lines are not altered
by the feature.
