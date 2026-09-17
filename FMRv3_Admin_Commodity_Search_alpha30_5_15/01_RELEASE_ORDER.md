# Release order

Do not apply directly to production first.

1. Make sure the production-copy TEST database has `ENVIRONMENT_NAME = TEST`.
2. Take a fresh TEST backup if desired.
3. Apply the Core changes in this package to the existing Core development source.
4. Use TEST Bound with library development mode / Head only for initial validation.
5. Rebuild `Search_Index` in TEST so existing published material lines receive COMMODITY entries.
6. Run the test matrix in `07_TEST_MATRIX.md`.
7. Create a new immutable Core library version only after TEST passes.
8. Pin TEST Bound to that immutable version and smoke-test again.
9. Deploy to PROD using the existing production release process.
10. Rebuild the PROD search index once, during a controlled Owner operation.
11. Verify several known commodity searches in PROD.
12. Push the final exact source to GitHub.

Do not begin the `.16` security implementation until this feature is stable.
