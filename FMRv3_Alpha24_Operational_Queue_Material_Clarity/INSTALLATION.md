# FMR Operations v3 Alpha 24 installation

## Release

```text
Core semantic version: 3.0.0-alpha.24
Expected Core library version: 24
Environment: TEST first
Database migration: none
```

## Deployment order

Core must be updated and published before the Bound manifest is changed to the new library version.

## 1. Update the Core Apps Script project

Replace the complete current file:

```text
BackorderService.gs
```

with:

```text
FMRCoreV3/BackorderService.gs
```

Then follow `Config_VERSION_PATCH.md` and change the Core semantic version to `3.0.0-alpha.24`.

Save the Core project.

## 2. Create the new Core library version

Create a new immutable project/library version with this description:

```text
Alpha 24 operational queue material clarity
```

The expected version is `24`. Apps Script controls the actual number. When Apps Script assigns a different number, use that actual number in the Bound manifest.

## 3. Update the Bound Apps Script project

Replace the complete files:

```text
Client.html
AdminQueueStyles.html
```

with the corresponding files in the package's `Bound` folder.

After the Core library version exists, replace `appsscript.json`. Confirm the `FMRCoreV3` library entry uses the actual new library version.

Do not replace `Adapter.gs`; Alpha 24 does not require an adapter change.

## 4. Save and deploy Bound

1. Save the Bound project.
2. Select **Deploy → Manage deployments**.
3. Edit the existing TEST web-app deployment.
4. Select **New version**.
5. Use this description:

```text
Alpha 24 clearer backorder and active bag material details
```

6. Deploy while preserving the existing `/exec` URL.
7. Open the TEST URL in an Incognito or Private window.

## 5. Run acceptance testing

Follow `ACCEPTANCE_TESTING.md`.

## 6. Back up the tested Apps Script source to GitHub

After TEST acceptance succeeds, copy these exact deployed files to GitHub:

```text
FMRCoreV3/BackorderService.gs
FMRCoreV3/Config.gs
Bound/Client.html
Bound/AdminQueueStyles.html
Bound/appsscript.json
```

GitHub remains a backup of the tested Apps Script source.
