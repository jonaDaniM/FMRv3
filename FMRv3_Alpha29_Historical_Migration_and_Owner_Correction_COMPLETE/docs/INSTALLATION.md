# Alpha 29 Installation Instructions

## Current baseline

This package was developed against GitHub commit:

```text
6b39c0235958a1a68b5ed4f119695abb93ac6f07
```

The reviewed source is:

```text
FMR Core 3.0.0-alpha.28
Apps Script Library v28
```

The package is intentionally additive. It creates new Apps Script files rather
than replacing the working `Client.html` or existing services.

---

# Part 1 — FMRCoreV3 library

## Step 1 — Add HistoricalMigrationService

In the **FMRCoreV3** Apps Script project create a new `.gs` file named:

```text
HistoricalMigrationService
```

Paste the complete contents of:

```text
FMRCoreV3/HistoricalMigrationService.gs
```

## Step 2 — Add OwnerCorrectionService

Create another `.gs` file named:

```text
OwnerCorrectionService
```

Paste:

```text
FMRCoreV3/OwnerCorrectionService.gs
```

## Step 3 — Update the Core version

Open `Config.gs`.

Change only:

```javascript
VERSION: '3.0.0-alpha.28',
```

to:

```javascript
VERSION: '3.0.0-alpha.29',
```

The replacement line is included in:

```text
FMRCoreV3/CONFIG_VERSION_LINE.txt
```

Do not add the new migration/correction sheets to `FMR_V3_HEADERS`.
These services intentionally manage their own control-sheet contracts so the
existing production database schema remains backward compatible.

## Step 4 — Save Core

Save all files.

## Step 5 — Publish a new immutable library version

Publish a **new** FMRCoreV3 library version.

Record the version number Apps Script actually assigns. Do not assume that the
new library version will be `29`.

---

# Part 2 — Bound web app

## Step 6 — Add OwnerMaintenanceAdapter

Create a new `.gs` file in the **Bound** Apps Script project:

```text
OwnerMaintenanceAdapter
```

Paste:

```text
Bound/OwnerMaintenanceAdapter.gs
```

## Step 7 — Add OwnerMaintenance HTML

Create a new HTML file:

```text
OwnerMaintenance
```

Paste:

```text
Bound/OwnerMaintenance.html
```

This contains the CSS and client JavaScript for the new Owner-only web section.
It injects itself into the existing `#ownerView`; therefore the production
`Client.html` does not need to be replaced.

## Step 8 — Include OwnerMaintenance

Open `Index.html`.

At the bottom find:

```html
<?!= includeFmrV3_('Client'); ?>
```

Immediately after it paste:

```html
<?!= includeFmrV3_('OwnerMaintenance'); ?>
```

The bottom should become:

```html
<?!= includeFmrV3_('Client'); ?>
<?!= includeFmrV3_('OwnerMaintenance'); ?>
</body>
</html>
```

## Step 9 — Update Bound library dependency

Open `appsscript.json`.

Change the FMRCoreV3 dependency from `28` to the **actual new library version**
created in Step 5.

## Step 10 — Save and deploy TEST

Deploy a new version of the existing TEST `/exec` deployment.

Suggested description:

```text
Alpha 29 historical migration and Owner transaction correction
```

Do not use either write feature against Production until
`docs/TEST_CHECKLIST.md` is complete.

---

# Part 3 — Historical migration workflow

## Recommended source preparation

1. Create one Google Drive folder for the legacy FMR migration.
2. Copy all approved Excel workbooks into it.
3. Do not mix unrelated spreadsheets into the folder.
4. Freeze the folder population before the final Production migration.
5. Keep the original source workbooks unchanged as migration evidence.

## Owner web workflow

Open:

```text
Owner → Owner Maintenance Center → Historical FMR Migration
```

Then:

1. Paste the Drive folder URL.
2. Choose whether to include subfolders.
3. Leave `Auto-publish WARNING items` OFF for the first pass.
4. Select a chunk size. Start with 10 in TEST.
5. Click **Preview Folder**.
6. Review the exact file inventory.
7. Click **Start Migration**.
8. Enter the requested confirmation phrase.
9. Leave the page open if `Continue automatically` is selected.
10. The browser repeatedly invokes resumable server chunks.
11. If the page is closed, reopen Owner Maintenance and open the job under
    **Recent Migration Jobs**.
12. Failed files can be reset with **Retry File**.

## Migration behavior

Each source workbook is processed through:

```text
Existing Bulk Import parser
        ↓
Existing staging service
        ↓
Existing FMR publication service
        ↓
FMR_Header / FMR_Line_Items / Search_Index
```

BLOCKED FMRs never auto-publish.

WARNING FMRs only auto-publish when the Owner explicitly enables that option.

### Historical activity policy

Alpha 29 does **not** translate legacy `Issued`, `Back Ordered`, or
`Action Taken` cells into live operational transactions.

Those values remain evidence in the Bulk Import records.

That prevents 600 historical workbooks from manufacturing transaction history
whose business meaning has not yet been formally reconciled.

---

# Part 4 — Owner transaction correction

Open:

```text
Owner → Owner Maintenance Center → Transaction Correction
```

Search using:

```text
FMR Number
or
ISO -##
```

The tool returns:

- material lines/current quantities;
- all recorded transactions for those lines;
- transaction groups based on `Correlation_ID`;
- Bag & Tag history;
- Backorder history.

## Why transaction groups are used

One user action can create several linked transactions.

For example a Bag & Tag can also automatically locate material and can consume
a confirmed backorder.

Reversing only the visible BAG transaction could leave the FMR quantities
incorrect.

The correction service therefore reverses the entire logical correlation group.

## Apply workflow

1. Choose **Preview Reversal** on the intended group.
2. Enter a written business reason.
3. The server validates current dependencies and computes before/after state.
4. Review the preview.
5. Choose **Apply Reversal**.
6. Enter the exact confirmation phrase.
7. An automatic database backup is created.
8. The correction is applied.
9. New `REVERSAL_*` transactions are appended.
10. Header totals and Field notices are refreshed.
11. The Admin KPI/dashboard uses the corrected operational state after refresh.

Original transaction rows are retained unchanged.
