# Alpha 24 rollback

Rollback is only required when TEST acceptance finds a functional regression, incorrect queue data, a permission issue, or a deployment failure.

## Bound rollback

1. Open **Deploy → Manage deployments** in the Bound project.
2. Edit the existing TEST web-app deployment.
3. Select the previous Bound project version that referenced Core library version 23.
4. Deploy.
5. Confirm the portal reports `FMRCore 3.0.0-alpha.23`.

## Source rollback

Restore the previous versions of:

```text
Bound/Client.html
Bound/AdminQueueStyles.html
Bound/appsscript.json
```

The previous manifest references Core library version `23`.

## Core rollback

Core library versions are immutable. Keep version 24 available, but point Bound back to version 23. No spreadsheet rollback is required because Alpha 24 changes only queue read enrichment and presentation.
