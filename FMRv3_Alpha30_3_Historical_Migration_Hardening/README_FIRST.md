# FMRv3 Alpha 30.3 — Historical Migration Hardening

This package implements the narrow changes discovered during the 10-workbook
migration rehearsal.

## Fixed

- Strict LF quantity normalization for historical values such as `40.2'`,
  `66.7'`, and `0.3'`.
- Parser fingerprint bump so affected workbooks are reparsed under the new rule.
- Duplicate active-job prevention for the same source folder.
- Explicit Resume / Abandon workflow for interrupted migration jobs.
- Generated `_FMRv3_Historical_Migration_Working_*` folders excluded from
  recursive source discovery.
- Converted `[FMR MIGRATION] ...` files excluded from source discovery.
- Clearer migration UI terminology and current-file progress.
- `Published` clarified as `Published / Exists` because current historical job
  totals include records that already exist in FMR_Header.

## Deliberately unchanged

- Blank historical requested quantities remain BLOCKED.
- Blank official FMR numbers remain BLOCKED.
- REQUEST_ONLY historical policy remains unchanged.
- No historical transactions are manufactured.
- No Field/Admin/Bag/Backorder/Owner-correction logic is changed.
- No migration table schema change is introduced.
- Cross-file migration execution is not redesigned before the production target.

Read `docs/INSTALLATION.md` first.
