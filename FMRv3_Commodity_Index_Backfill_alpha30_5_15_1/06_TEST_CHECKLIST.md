# TEST checklist

## Preview

Run:

```javascript
runPreviewCommodityIndexBackfillV3()
```

Confirm:

- correct TEST environment;
- owner email is correct;
- `activeLineCount` is plausible;
- `entriesToAdd` is greater than 0 on the first run;
- `missingActiveHeaderLines` is 0 or understood;
- sample entries show `COMMODITY:<CODE>` keys.

## Apply

Run:

```javascript
runApplyCommodityIndexBackfillV3()
```

Expected:

- `applied = true`;
- `noOp = false`;
- `added > 0`;
- no FMR/Header/Line quantity changes.

## Verify Search_Index

Search TEST `Search_Index` column A for:

```text
COMMODITY:5BSG-2
```

You should now see active rows.

## Verify Admin UI

Admin:

```text
Search Type: Commodity Code
Search: 5BSG-2
```

Expected matching FMRs from the production data pattern include:

```text
335
18
23
746-1
926
```

The exact TEST clone may differ if TEST has intentionally diverged.

## Idempotency

Run preview again.

Expected:

```text
entriesToAdd = 0
```

Run apply again.

Expected:

```text
applied = true
noOp = true
added = 0
```
