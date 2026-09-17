# Test matrix

## A. Rebuild TEST Search_Index

After the Core source change is active in TEST, use the existing Owner recovery action:

```text
REBUILD_SEARCH_INDEX
```

Do this on TEST first.

The rebuild must use the updated `buildSearchEntriesForPublishedLineFmrV3_`
and therefore generate:

```text
COMMODITY:<CODE>
```

entries for existing published material lines.

## B. Verify index construction

Pick a commodity code known to exist in several material lines.

In `Search_Index`, verify:

- `Search_Type = COMMODITY`
- `Search_Key = COMMODITY:<UPPERCASE NORMALIZED CODE>`
- correct `FMR_ID`
- correct `FMR_Line_ID`
- correct `Header_Row`
- correct `Line_Row`
- `Active = YES`

If one FMR has the commodity on three lines, three index rows are fine; the Admin result must still show that FMR only once.

## C. Functional tests

1. Exact code, exact case.
2. Same code typed lowercase/mixed case.
3. Commodity present on one FMR.
4. Commodity present on many FMRs.
5. Commodity repeated on multiple lines inside one FMR.
6. Nonexistent commodity.
7. Commodity search + Status filter.
8. Commodity search + Priority filter.
9. Commodity search + Operational Filter.
10. Pagination when result count exceeds page size.
11. Open a matching FMR and confirm its detail/material lines still load normally.
12. Reset filters and confirm normal Admin register behavior.

## D. Existing search regression

Verify all still work:

- AUTO
- FMR Number
- ISO -##
- IWP / Text
- Admin register pagination
- Admin register sorting
- Field search
- Field transaction workflow

## E. New-publish lifecycle

In TEST:

1. publish a controlled test FMR containing a unique commodity;
2. search that commodity immediately;
3. verify the new FMR appears without requiring another global rebuild.

This confirms normal publication uses the same updated search-index builder.

## F. Index replacement/lifecycle

If you have a safe TEST Owner workflow that changes a published line's commodity:

1. note old commodity;
2. change it through the controlled application path;
3. verify the old commodity no longer returns that line/FMR if no other matching line exists;
4. verify the new commodity does.

If that maintenance path does not rebuild/replace Search_Index automatically, do not enable arbitrary commodity edits in production until that path is corrected.

## G. Performance

Measure at least:

- first search for a commodity after cache clear/cold state;
- second identical search;
- a high-frequency commodity that returns many lines/FMRs.

The commodity lookup itself should use the exact Search_Index path and ScriptCache.
The Admin header-register read may still be the dominant cost because the current
register reads active FMR headers before filtering.

The goal is no `FMR_Line_Items` table scan per search.
