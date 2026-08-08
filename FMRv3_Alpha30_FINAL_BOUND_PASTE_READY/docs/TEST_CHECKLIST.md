# Alpha 30 Bound TEST Checklist

## Core/library

- [ ] FMRCoreV3 current source reports `3.0.0-alpha.30`.
- [ ] A new immutable Core library version has been created.
- [ ] Bound `appsscript.json` points to that exact immutable version.
- [ ] TEST bootstrap reports the expected Core version.

## Owner UI load

- [ ] Owner Maintenance Center loads once.
- [ ] No duplicate Owner Maintenance panel appears.
- [ ] No duplicate transaction material cards appear.
- [ ] Only one Owner ledger server request occurs per Search click.
- [ ] Old Alpha 29.2 material-context client code is not active.

## Drive / historical migration

- [ ] Turner Owner account is an active FMR System Owner.
- [ ] `authorizeOwnerMaintenanceV3()` succeeds from the Bound editor.
- [ ] Drive status shows the expected Turner email.
- [ ] Test Folder Access succeeds.
- [ ] Preview Folder succeeds on a 2–3 workbook TEST folder.
- [ ] Invalid / inaccessible folder produces a clear error before migration.
- [ ] Start Migration remains confirmation-gated.
- [ ] Migration can resume after a page refresh.
- [ ] Failed source file can be retried.
- [ ] Existing request-only legacy migration policy is preserved.

## Owner transaction search

- [ ] Search by FMR works.
- [ ] Search by ISO works.
- [ ] Transaction groups display Commodity Code.
- [ ] Transaction groups display Size.
- [ ] Transaction groups display UOM.
- [ ] Transaction groups display ISO.
- [ ] Transaction groups display Material Description.
- [ ] Long descriptions wrap without horizontal overflow.
- [ ] Bag & Tag history still displays.
- [ ] Backorder history still displays.

## Reversal preview / apply — TEST data only

- [ ] Preview identifies the exact material.
- [ ] Preview identifies every transaction in the correlation group.
- [ ] Verification code is exactly four digits.
- [ ] Wrong code is rejected.
- [ ] Cancel performs zero writes.
- [ ] Written reason remains required.
- [ ] Automatic pre-change backup is created.
- [ ] Original Material_Transactions remain unchanged.
- [ ] Compensating REVERSAL_* rows are appended.
- [ ] Owner_Corrections record is created.
- [ ] Audit_Log record is created.
- [ ] Header totals reconcile after the reversal.
- [ ] KPI reflects corrected state after refresh.
- [ ] Field notice state reflects corrected Backorder state.

## Normal Field/Admin regression

- [ ] Field search works.
- [ ] Confirm Available works.
- [ ] Bag & Tag works.
- [ ] Direct Issue works.
- [ ] Issue Available works.
- [ ] Issue From Bag works.
- [ ] Submit Backorder works.
- [ ] Admin Confirm works.
- [ ] Admin Reject works.
- [ ] Admin Return works.
- [ ] Operational Queues display correctly.
- [ ] No duplicate Field notifications appear.

## Performance

Run from FMRCoreV3 Apps Script editor:

```javascript
runFmrV3ProductionStorageProfileDiagnostic()
```

Then:

```javascript
runFmrV3ProductionReadPerformanceDiagnostic(
  'TURNER_OWNER_EMAIL',
  'KNOWN_TEST_FMR'
)
```

- [ ] Record pre-migration timings.
- [ ] Import a representative batch.
- [ ] Run the same diagnostic again.
- [ ] Compare Owner ledger and Field search timings.
- [ ] Do not add a Transaction_Index unless measured latency justifies it.

## Production cutover

- [ ] Current production database backup exists.
- [ ] All core diagnostics pass.
- [ ] All Bound tests above pass.
- [ ] TEST and PRODUCTION database fingerprints are verified.
- [ ] PRODUCTION transaction mode is intentionally enabled.
