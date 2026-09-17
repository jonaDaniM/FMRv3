# Deployment order

## TEST

1. Confirm TEST points to the TEST database.
2. Add `02_CommodityIndexBackfillAlpha30_5_15_1.gs` to FMRCoreV3.
3. Add the two public wrappers from `03_PublicApi_ADDITIONS.gs`.
4. Change the Core version string using `04_CONFIG_VERSION_CHANGE.txt`.
5. Save Core.
6. Test using library development mode / Head if that is your normal TEST
   workflow.
7. Add the Bound runner functions from `05_BOUND_RUNNERS.gs`.
8. Run `runPreviewCommodityIndexBackfillV3()` from the TEST Bound editor.
9. Review the returned/logged counts.
10. Run `runApplyCommodityIndexBackfillV3()` in TEST.
11. Search `5BSG-2` using **Search Type = Commodity Code**.
12. Confirm the expected FMRs populate.
13. Run preview again. Expected `entriesToAdd = 0`.

## Immutable release

After TEST passes:

1. Create a new immutable FMRCore library version.
2. Pin TEST Bound to that immutable library version.
3. Smoke-test commodity search once more.
4. Update PROD Bound to the same immutable Core library version using your
   established deployment process.

## PRODUCTION

1. Take a fresh production backup.
2. Put production into `READ_ONLY`.
3. Wait for current user transactions/executions to finish.
4. Run `runPreviewCommodityIndexBackfillV3()`.
5. Review counts.
6. Run `runApplyCommodityIndexBackfillV3()`.
7. Run preview again and confirm `entriesToAdd = 0`.
8. Search `5BSG-2` with **Commodity Code** selected.
9. Confirm FMRs 335, 18, 23, 746-1, and 926 appear, subject to any additional
   Admin status/priority/operational filters you have selected.
10. Test 2–3 other known commodity codes.
11. Restore `TRANSACTION_MODE = ENABLED`.
12. Monitor Admin register execution times.

Do not start the `.16` security implementation until this hotfix has been
validated.
