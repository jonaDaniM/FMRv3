# Rollback

The backfill does not modify authoritative material state.

If `.15.1` causes a problem:

1. Keep production in READ_ONLY during rollback.
2. Redeploy/repoint Bound to the previous `.15` / library v54 release.
3. Existing added `COMMODITY:*` Search_Index rows are non-authoritative.
4. They can remain without affecting FMR/ISO/LINE search behavior.
5. If you want a completely clean old-style index, use the prior `.15`
   search-index rebuild process under controlled maintenance.
6. Verify normal Admin/Field operations.
7. Re-enable transactions.

Do not reverse:
- Material_Transactions;
- FMR quantities;
- Bag_Tag records;
- Backorder records;
- Audit history.

None of those are changed by this hotfix.
