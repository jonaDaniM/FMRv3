# GitHub / Production State Review — August 25, 2026

Repository: `jonaDaniM/FMRv3`

Latest GitHub commit reviewed:
`73c108d907e23f0e926827759d6ce2e2d082d21a`
Message: `FMR 250 fix`

## Confirmed current in GitHub
The repository contains the Alpha 30.4.1 FMR 250/cache-isolation source fix:
- Config runtime version is `3.0.0-alpha.30.4.1`.
- Search/Operational index cache keys are database-scoped.
- Bulk import validates `ALREADY_PUBLISHED` against FMR_Header.

## Remaining parity issue
GitHub `Bound/appsscript.json` still references immutable Core library version
`35`.

That manifest value predates the Alpha 30.4.1 Core source change. Because the
Apps Script projects are deployed manually, GitHub cannot prove which immutable
library version the live TEST/PROD deployments currently use.

Alpha 30.5 deployment must resolve this:
1. publish a new immutable Alpha 30.5 Core version;
2. set TEST Bound to that exact version and validate;
3. set PROD Bound to the same version and validate;
4. push the final manifest to GitHub.

## Production Configuration
The Production Configuration sheet still has descriptive `APP_VERSION =
3.0.0-alpha.30.4`. It is not the runtime Core version, but after Alpha 30.5 is
validated it should be updated to `3.0.0-alpha.30.5` for human-readable parity.

Production currently reports:
- `ENVIRONMENT_NAME = PRODUCTION`
- `TRANSACTION_MODE = ENABLED`
- dedicated Production backup folder configured

Create a fresh Production backup before deployment.
