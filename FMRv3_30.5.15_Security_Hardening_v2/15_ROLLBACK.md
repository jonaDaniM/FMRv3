# Rollback

## Monitoring only

If the manual-edit monitor causes noise:
- remove the installable triggers;
- warning-only protections can be removed;
- no data rollback is required.

## TEST gateway

If TEST fails:
- users remain Editors;
- restore original Bound function bodies;
- leave production untouched.

## Production gateway canary

Users are deliberately still Editors.

Rollback:
1. redeploy the previous known-good Bound version;
2. restore Bound dependency/library as documented if changed;
3. stop using gateway properties;
4. verify `.14` direct writes resume.

No database migration is involved.

## Viewer cutover

If a Viewer cannot transact:
- temporarily restore that account/role to Editor;
- do not alter transaction data manually;
- repair the missing gateway path in TEST.

## Hard protections

If an intended owner function cannot write:
- keep ordinary users as Viewer;
- remove only the `FMR_PRODUCTION_OWNER_ONLY` protection from the affected sheet;
- correct the protection editor configuration;
- reinstall.

## Secret compromise

If `FMR_GATEWAY_SECRET` is exposed:
- generate a new high-entropy secret;
- replace it in Gateway Script Properties;
- replace it in Bound Script Properties;
- do not reuse the old secret.
