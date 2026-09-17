# Start here — FMRv3 alpha.30.5.15 security hardening v2

This package supersedes the earlier security ZIP.

The architecture is still the same, but this revision freezes the decisions made after reviewing the live environment:

- no ownership transfer;
- personal account remains primary protected owner;
- Ernie remains delegated System Owner;
- `.14` stays untouched as the rollback point;
- TEST environment label mismatch is fixed before security work;
- no Field/Admin permission is removed until gateway writes are proven.

## What problem this solves

Today the production web app runs as `USER_ACCESSING`.
That is useful because it identifies the real Google user, but it also means a Field/Admin user generally needs spreadsheet write permission for the portal to write.

Google Sheets protections cannot distinguish:

```text
User manually edits raw FMR_Line_Items
```

from:

```text
The portal writes FMR_Line_Items while executing as that user
```

So hard-locking the database today can break the portal.

## Target model

```text
Field/Admin browser
        |
        | Google-authenticated request
        v
Existing Bound web app
USER_ACCESSING
        |
        | real caller email + HMAC-signed request
        v
New FMR Write Gateway
USER_DEPLOYING (primary owner)
        |
        | existing FMRCore APIs
        v
Production database

Raw spreadsheet:
Field/Admin = Viewer
Primary owner = Editor/Owner
Ernie = Editor / delegated System Owner
```

The gateway **does not reproduce FMR business logic**.
It calls the same FMRCore APIs already used by production.

## Safe order

1. Fix TEST environment label.
2. Freeze/backup `.14`.
3. Add non-blocking monitoring only.
4. Build gateway in TEST.
5. Test while users are still Editors.
6. Test representative Field/Admin users as Viewers in TEST.
7. Production gateway canary while production permissions are unchanged.
8. Downgrade ordinary users to Viewer.
9. Apply hard protections for the two System Owners.
10. Keep `.14` rollback path until `.15` is stable.

Never jump directly to step 8 or 9.
