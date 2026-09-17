# Production canary — permissions remain unchanged

This stage is intentionally reversible.

## Before deployment

- fresh PROD backup;
- strict PROD environment diagnostic PASS;
- TEST Viewer gates PASS;
- record latest Git commit/library/deployment;
- confirm Jonathan and Ernie still have Owner access.

## Deploy `.15`

Deploy only the Bound routing/gateway changes.

Do NOT:
- downgrade Drive permissions yet;
- install hard protections yet;
- change OWNER_EMAIL;
- transfer any projects;
- remove the old deployment.

## Observe live traffic

Recommended minimum:
- 20 legitimate Field transactions;
- several full Issue From Bag closures;
- multiple user accounts;
- at least one Backorder Requested;
- at least one Admin decision when naturally available;
- user bootstrap;
- performance telemetry.

Reconcile:
- transaction quantity;
- line/header totals;
- bag states;
- index states;
- audit correlation IDs.

## If clean

Proceed to Viewer permission cutover.

## If not clean

Rollback Bound to `.14` immediately.
Because users are still Editors during canary, the old direct-write path will work again.
