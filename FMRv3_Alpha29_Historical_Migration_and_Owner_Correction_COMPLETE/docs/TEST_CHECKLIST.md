# Alpha 29 TEST Checklist

## Installation
- [ ] Core reports `3.0.0-alpha.29`.
- [ ] Bound points to the new immutable Core library version.
- [ ] Owner Maintenance Center renders only inside Owner view.
- [ ] Existing Field/Admin/Bulk Import interfaces still load.

## Historical migration
- [ ] Owner can preview a Drive folder.
- [ ] Non-Owner cannot call migration functions.
- [ ] `.xlsx` workbook converts/parses.
- [ ] `.xls` workbook converts/parses.
- [ ] Google Sheet parses without conversion.
- [ ] Unsupported Drive files are ignored.
- [ ] Source files remain unchanged.
- [ ] BLOCKED FMRs remain unpublished.
- [ ] WARNING FMRs remain held when warnings are disabled.
- [ ] WARNING FMRs can publish only when explicitly enabled.
- [ ] Valid FMR numbers are preserved.
- [ ] Size fractions remain text.
- [ ] Published FMR search works.
- [ ] Published ISO search works.
- [ ] Closing Owner page does not lose job state.
- [ ] Recent Migration Jobs can reopen a job.
- [ ] Failed file can be retried.
- [ ] Migration totals reconcile to published records.
- [ ] Legacy activity columns do not create live transactions.

## Owner ledger
- [ ] Search by FMR works.
- [ ] Search by ISO -## works.
- [ ] All matching lines are returned.
- [ ] Material transactions are grouped by Correlation_ID.
- [ ] Historical Bag & Tag records are shown.
- [ ] Historical Backorder records are shown.
- [ ] Non-Owner cannot access correction server functions.

## Reversal — Issue Available
- [ ] Issued decreases.
- [ ] Available increases.
- [ ] Remaining increases.
- [ ] Header totals/KPI reconcile.

## Reversal — Direct Issue
- [ ] Issued decreases.
- [ ] Located decreases.
- [ ] Not Yet Located increases.
- [ ] Remaining increases.

## Reversal — Confirm Available
- [ ] Works when material remains Available.
- [ ] Blocked when downstream Bag/Issue activity exists.

## Reversal — Bag & Tag
- [ ] Bag creation reverses when no bag-issued quantity remains.
- [ ] Bag creation is blocked when downstream Bag issue exists.
- [ ] Issue From Bag reversal restores quantity into original bag.
- [ ] Active Bag operational indexes are restored/deactivated correctly.

## Reversal — Backorders
- [ ] Pending request can be reversed before Admin action.
- [ ] Original request reversal is blocked after downstream Admin action.
- [ ] Admin Confirm can return to Pending/Partially Confirmed.
- [ ] Admin Reject can return to Pending/Partially Confirmed.
- [ ] Admin Return can be restored.
- [ ] Correlation reversal restores backorder fulfillment effects.
- [ ] Field notification state is synchronized.

## Governance
- [ ] Reason minimum is enforced.
- [ ] Exact confirmation phrase is enforced.
- [ ] Cancelled prompt performs zero writes.
- [ ] Backup is created before correction writes.
- [ ] Original Material_Transactions rows remain unchanged.
- [ ] `REVERSAL_*` transaction rows are appended.
- [ ] Owner_Corrections row is written.
- [ ] Audit_Log row is written.
- [ ] Second reversal of same group is blocked.

## Production gate
- [ ] TEST health check passes after migration.
- [ ] TEST health check passes after reversals.
- [ ] Search index diagnostics pass.
- [ ] Active Bag diagnostics pass.
- [ ] Backorder diagnostics pass.
- [ ] Backup/recovery diagnostics pass.
- [ ] Migration source folder population is frozen/approved.
