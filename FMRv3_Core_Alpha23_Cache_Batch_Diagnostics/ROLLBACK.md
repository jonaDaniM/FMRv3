# Alpha 23 Rollback

## Bound rollback

1. Edit the existing Bound web deployment.
2. Select the previous Bound project version that used Core library version 22.
3. Deploy.
4. Confirm the `/exec` URL reports Core version `3.0.0-alpha.22`.

## Source rollback

Restore the previous Bound files:

```text
Adapter.gs
appsscript.json
```

The previous manifest must reference:

```json
"version": "22"
```

## Core rollback

Core library versions are immutable. Do not delete version 23.

Restore runtime behavior by pointing Bound back to Core library version 22.

The alpha.23 cache keys create new cache entries only. They do not mutate
database records or require a database rollback.

The batched Admin ISO lookup is read-only and does not require database repair.
