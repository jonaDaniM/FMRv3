# Permission cutover

Only do this after production gateway canary is clean.

## Keep editor access

Keep raw database Editor/Owner permission for:

```text
jonathanmura05@gmail.com
emoralessantillan@turner-industries.com
```

Jonathan remains the protected primary System Owner.
Ernie remains delegated System Owner.

## Downgrade ordinary users

Change ordinary Field and Material Admin database access:

```text
Editor -> Viewer
```

Do not remove Viewer access yet because read APIs still execute as `USER_ACCESSING`.

## Immediate smoke test

Using a Viewer Field account:
- open Field portal;
- search;
- perform one legitimate transaction;
- verify transaction/audit state;
- confirm direct raw cell edit is blocked.

Using a Viewer Admin:
- open Admin portal;
- dashboard/register;
- perform an Admin write when appropriate;
- confirm direct raw cell edit is blocked.

## Failure rule

If a required portal write fails because of spreadsheet permission:

1. restore only the affected account/role to Editor;
2. capture the exact server execution/error;
3. identify the write path that still bypasses the gateway;
4. fix it in TEST;
5. redeploy;
6. downgrade again.

Do not mass-edit the database and do not remove protections as the first response.
