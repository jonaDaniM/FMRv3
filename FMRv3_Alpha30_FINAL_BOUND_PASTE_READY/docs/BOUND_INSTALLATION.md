# Bound Alpha 30 — Copy/Paste Installation

## Before you start

The repository is only a backup. Make these changes in the actual **Bound
Google Apps Script project**.

The Core changes are already correct in the latest GitHub backup. Publish the
current FMRCoreV3 Apps Script project as a new immutable library version first.

If Google assigns library version **30**, use the supplied manifest unchanged.
If Google assigns a different number, change only the `version` field in
`appsscript.json`.

---

## Step 1 — OwnerMaintenance.html

Open the Bound Apps Script file:

```text
OwnerMaintenance.html
```

Delete the entire contents.

Paste the entire contents of:

```text
Bound/OwnerMaintenance.html
```

Alpha 30 now owns all of the following in one UI file:

- Historical FMR Migration
- Drive authorization status
- Drive folder preflight
- Owner transaction search
- transaction material identity
- Commodity Code
- Size
- UOM
- ISO
- Material Description
- four-digit reversal verification
- Bag & Tag history
- Backorder history

The migration Preview Folder action now verifies access to the selected Drive
folder before it invokes the migration parser.

---

## Step 2 — OwnerMaintenanceAdapter.gs

Open:

```text
OwnerMaintenanceAdapter.gs
```

Replace the complete file with:

```text
Bound/OwnerMaintenanceAdapter.gs
```

The public Core API names did not change in Alpha 30, so this remains a small
wrapper layer.

---

## Step 3 — OwnerDriveAuthorization.gs

If the file does not exist, create a new script file:

```text
OwnerDriveAuthorization
```

If it already exists, replace the entire contents.

Paste:

```text
Bound/OwnerDriveAuthorization.gs
```

This must live in **Bound**, not FMRCoreV3.

---

## Step 4 — Remove the old Alpha 29.2 material extension

The latest GitHub backup currently contains:

```text
OwnerMaintenanceMaterialContext.html
```

and the current GitHub Index includes it.

Alpha 30 no longer needs the old implementation because the same functionality
is built directly into `OwnerMaintenance.html`.

### Safest immediate option

Replace the complete old file with:

```text
Bound/OwnerMaintenanceMaterialContext.html
```

The Alpha 30 version is intentionally empty. This makes an existing Index
include harmless.

### Clean production option

After TEST passes, remove this Index line:

```html
<?!= includeFmrV3_('OwnerMaintenanceMaterialContext'); ?>
```

and delete the obsolete HTML file.

Your clean final Index tail should be:

```html
<?!= includeFmrV3_('Client'); ?>
<?!= includeFmrV3_('OwnerMaintenance'); ?>
</body>
</html>
```

Do not add a second OwnerMaintenance include.

---

## Step 5 — appsscript.json

Turn on:

```text
Project Settings → Show "appsscript.json" manifest file in editor
```

Replace the entire manifest with:

```text
Bound/appsscript.json
```

Before saving, confirm:

```json
"version": "30"
```

matches the immutable FMRCoreV3 library version you actually published.

The deployment remains:

```text
executeAs = USER_ACCESSING
```

This is important because the migration Drive access should use the authenticated
Owner's Google account.

---

## Step 6 — Authorize the Turner Owner account

While signed into the Turner Google account that owns or can access the
historical FMR folder, run this function directly from the Bound Apps Script
editor:

```javascript
authorizeOwnerMaintenanceV3()
```

Approve the requested permissions.

Run it a second time. It should return `passed: true`.

That Turner email must also be an active FMR **System Owner**.

---

## Step 7 — Save and deploy TEST

Save all files.

Deploy a new TEST version of the existing web app. Preserve the existing TEST
`/exec` deployment URL.

Suggested description:

```text
Alpha 30 - production hardening / owner maintenance
```

Do not promote to PRODUCTION yet.

---

## Step 8 — Required UI verification

### Historical migration

Open:

```text
Owner → Owner Maintenance Center → Historical FMR Migration
```

Confirm the Drive box shows the expected Turner account.

Paste a small TEST folder URL and choose:

```text
Test Folder Access
```

Then use:

```text
Preview Folder
```

The folder preflight must succeed before parsing begins.

### Transaction correction

Search a known FMR containing Bag & Tag / issuance history.

Each transaction group should display:

```text
Commodity Code
Size
UOM
ISO
Material Description
transaction type
transaction quantity
actor/recipient/bag information
```

Preview Reversal should display a four-digit verification code.

---

## Step 9 — Production gate

Run every item in:

```text
docs/TEST_CHECKLIST.md
```

Only after the tests pass should you create the PRODUCTION deployment version.
