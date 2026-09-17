# Known production verification — 5BSG-2

Before the backfill, live production contains active `FMR_Line_Items` with
Commodity_Code `5BSG-2`.

Known matching FMR numbers:

```text
335
18
23
746-1
926
```

There are multiple matching lines inside some of those FMRs.

The Admin register should still show each FMR only once because the Admin
service converts matching Search_Index rows into a Set of FMR_ID values.

After backfill:

```text
Search_Index.Search_Key = COMMODITY:5BSG-2
Search_Index.Search_Type = COMMODITY
Search_Index.Active = YES
```

should exist for the matching active material lines.

Admin search:

```text
Search Type = Commodity Code
Search = 5BSG-2
```

should return the five matching FMRs unless another selected filter excludes
one.
