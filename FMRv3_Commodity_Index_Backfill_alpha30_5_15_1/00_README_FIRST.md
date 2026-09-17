# FMRv3 Commodity Search Index Backfill

Release target:

```text
3.0.0-alpha.30.5.15.1
```

This is a narrow hotfix for the Admin Commodity Code search released in
`3.0.0-alpha.30.5.15`.

## Confirmed root cause

The `.15` application code is present, but historical production FMRs were
published before commodity entries were added to `Search_Index`.

The production material table contains commodity code `5BSG-2`, including
active lines in FMRs:

```text
335
18
23
746-1
926
```

but the production `Search_Index` currently has no
`COMMODITY:5BSG-2` entry.

Therefore the Admin service correctly performs an indexed lookup and receives
zero index rows.

## What this package does

It adds an Owner-only, one-time, idempotent backfill that:

- reads existing active published headers and material lines;
- identifies active material lines with a nonblank Commodity_Code;
- detects commodity index entries that already exist;
- appends ONLY missing `COMMODITY:*` search-index rows;
- leaves existing FMR / ISO / LINE index rows untouched;
- invalidates the affected commodity cache keys;
- writes one Owner audit record;
- can be rerun safely;
- does not modify FMR quantities, Bag & Tag, backorders, transactions, or
  material records.

## Safety model

TEST first.

For PRODUCTION, the apply function refuses to run unless:

```text
TRANSACTION_MODE = READ_ONLY
```

This prevents a global index maintenance operation from racing with live
publication/renumber/maintenance activity.

The preview function is read-only and can be run at any time.

## Important UI behavior

For this release, use:

```text
Search Type = Commodity Code
```

when searching commodity codes.

`Auto Detect` is intentionally unchanged in this hotfix.
