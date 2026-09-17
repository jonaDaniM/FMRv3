# Locked assumptions for this package

Prepared for the current FMRv3 production architecture.

## Production baseline being preserved

- Repository: `jonaDaniM/FMRv3`
- Git baseline: `30cc8ad1d59ed63acea66bc3bd7aaf9d67d9ea44`
- FMRCore: `3.0.0-alpha.30.5.14`
- Bound dependency: FMRCoreV3 library version `53`
- Current Bound web app execution model: `USER_ACCESSING`
- Production database: `FMR Operations Database v3 - PRODUCTION`
- Production is currently healthy and must remain available.

## Ownership decision

This package assumes **NO ownership migration**.

Keep:
- `jonathanmura05@gmail.com` as the protected PRIMARY System Owner and current Apps Script/deployment owner.
- `emoralessantillan@turner-industries.com` as a DELEGATED System Owner.
- The current FMRCore project under the personal account.
- The current Bound project and production deployment under the personal account.
- The current production spreadsheet/database in place.

Do NOT:
- transfer Apps Script ownership;
- replace the production database;
- change `OWNER_EMAIL`;
- remove the personal primary owner;
- demote Ernie;
- move deployments;
- change the production `/exec` URL as part of this security release.

## Protection editors after final cutover

When hard protections are finally applied, the intended approved editors are:

- `jonathanmura05@gmail.com`
- `emoralessantillan@turner-industries.com`

All ordinary Field and Material Admin users should eventually be Viewer on the raw database, while continuing to transact through the portal.

## Important TEST prerequisite

The production-copy TEST database must report:

- Bound environment = `TEST`
- Core/database environment = `TEST`

A copied production database may still contain `Configuration.ENVIRONMENT_NAME = PRODUCTION`.
Fix that in TEST before beginning the gateway cutover.
