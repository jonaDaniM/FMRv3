# Alpha 30.5 Rollback

No spreadsheet schema or data migration is introduced.

If a repeatable regression occurs:
1. set PROD READ_ONLY;
2. restore the previous Bound files/deployment version;
3. point Bound back to the previous known-good immutable Core version;
4. create a new version of the existing PROD web deployment;
5. verify prior runtime;
6. re-enable writes only after health checks.

A database restore should not be required for this display/filter release.
