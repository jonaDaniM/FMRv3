# Rollback

If commodity search has a problem:

1. Repoint/deploy Bound to the previous known-good `.14` Core library/deployment.
2. Do not delete production FMR data.
3. Extra `COMMODITY:*` Search_Index rows are non-authoritative acceleration data.
4. If desired, run the old `.14` `REBUILD_SEARCH_INDEX` after rollback; the old
   builder will reconstruct the index without commodity entries.
5. Verify ordinary FMR/ISO/Admin/Field behavior.

No material quantities, bag records, transactions, or audit history need to
be reversed for a commodity-search rollback.
