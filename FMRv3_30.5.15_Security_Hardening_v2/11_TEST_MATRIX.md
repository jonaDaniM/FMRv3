# TEST matrix — mandatory before production

Use the production-sized TEST clone.

## Gate A — strict environment

Run:

```javascript
runStrictBoundEnvironmentDiagnosticV3()
```

Must PASS and show TEST == TEST.

## Gate B — gateway while users are still Editors

Test:
- Field bootstrap;
- Field search;
- Confirm Available;
- Bag & Tag;
- Direct Issue;
- Issue From Available;
- Issue From Bag partial;
- Issue From Bag full closure;
- Backorder Requested;
- Admin bootstrap;
- dashboard/register reads;
- Admin backorder decision;
- performance event persistence.

Verify all affected data:
- FMR_Line_Items;
- FMR_Header;
- Bag_Tag_Items;
- Bag_Tag_Header;
- Operational_Index;
- Material_Transactions;
- Backorder_Requests;
- Audit_Log;
- Field_Notifications where applicable;
- Performance_Events.

## Gate C — Viewer Field user

In TEST only, change one Field test account:

```text
Editor -> Viewer
```

Verify:
- portal opens;
- search works;
- Field writes succeed;
- raw spreadsheet edit fails.

## Gate D — Viewer Material Admin

In TEST only, change one Material Admin test account:

```text
Editor -> Viewer
```

Verify:
- Admin portal opens;
- reads work;
- backorder decision works;
- raw spreadsheet edit fails.

## Gate E — owners

Keep:
- Jonathan = Editor/primary System Owner;
- Ernie = Editor/delegated System Owner.

Verify both can still perform intended Owner maintenance.

## Gate F — negative security tests

- bad HMAC -> reject;
- stale timestamp -> reject;
- replay same signed request -> reject;
- unsupported operation -> reject;
- Field user attempting Admin decision -> FMRCore rejects;
- inactive user -> FMRCore rejects;
- browser-delivered source contains no gateway secret;
- request cannot choose arbitrary database ID.

## Gate G — performance

Compare `.15` gateway field write times with `.14`.
Some small network/server-to-server overhead is acceptable.
Do not accept large persistent regression or return of 20–40 second outliers.
