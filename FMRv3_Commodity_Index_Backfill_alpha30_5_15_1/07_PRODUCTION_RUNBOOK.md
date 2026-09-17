# PRODUCTION runbook

Use a short controlled maintenance window.

1. Confirm production banner currently shows `.15` before starting.
2. Create a fresh production backup.
3. Set production `TRANSACTION_MODE` to `READ_ONLY`.
4. Wait for in-flight field/admin write executions to finish.
5. Deploy/pin the immutable Core library containing `.15.1`.
6. Confirm production banner reports `3.0.0-alpha.30.5.15.1`.
7. Run:

```javascript
runPreviewCommodityIndexBackfillV3()
```

8. Save the preview output.
9. If counts are plausible, run:

```javascript
runApplyCommodityIndexBackfillV3()
```

10. Run preview again. It must report:

```text
entriesToAdd = 0
```

11. In Admin search, explicitly select:

```text
Commodity Code
```

12. Search:

```text
5BSG-2
```

13. With no additional filters excluding them, expected PROD FMRs are:

```text
335
18
23
746-1
926
```

14. Search at least two other known commodity codes.
15. Verify ordinary FMR Number and ISO Admin searches still work.
16. Restore:

```text
TRANSACTION_MODE = ENABLED
```

17. Watch Admin register executions for the first few searches.
