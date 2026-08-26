# Alpha 30.5 Installation

## 0. Protect Production
1. Set PROD `TRANSACTION_MODE = READ_ONLY`.
2. Set maintenance message:
   `Production maintenance: Admin notes/backorder filter update.`
3. Create a manual Production backup.
4. Confirm backup `SUCCESS`.

Deploy TEST first.

## 1. Core — new file
Create a new FMRCoreV3 Apps Script file:

`AdminFieldNotesService`

Paste:
`FMRCoreV3/AdminFieldNotesService.gs`

## 2. Core — runtime version
In `Config.gs` change only:

```javascript
VERSION: '3.0.0-alpha.30.5',
```

Do not change the historical-import parser version.

## 3. Publish immutable Core
Save FMRCoreV3 and publish a NEW immutable library version.
Record the exact version Apps Script creates.

## 4. Bound — Adapter.gs
Add the complete function from:

`Bound/Adapter_ADD_getAdminFmrDetailV3.gs`

## 5. Bound — Client.html
Replace the ENTIRE current `Bound/Client.html` with:

`Bound/Client.html`

The replacement was generated from the exact current GitHub Client blob:
`40d6764e93f0d829ae0165b6cf1f362328b0fc5a`.

## 6. Bound — AdminQueueStyles.html
Append the CSS rules from:

`Bound/AdminQueueStyles_APPEND.html`

If the existing file already has one `<style>` block, paste only the rules
between the supplied `<style>` and `</style>` immediately before the existing
closing `</style>`.

## 7. Bound — appsscript.json
Update the FMRCoreV3 dependency in TEST to the new immutable Alpha 30.5 version.

Deploy TEST and confirm:
`FMRCore 3.0.0-alpha.30.5`

Run `docs/TEST_PLAN.md`.

## 8. Production
Only after TEST passes:
1. update PROD Bound to the same new immutable Core version;
2. create a new version of the EXISTING production web deployment;
3. keep PROD READ_ONLY while smoke testing;
4. confirm `PRODUCTION · READ_ONLY · FMRCore 3.0.0-alpha.30.5`.

## 9. Production smoke test
Open a known FMR whose Material_Transactions contains a Field note.
Confirm the affected material row has an expandable `Field Notes` control and
that the note text matches the stored transaction.

Then click `Backordered Only`.
Confirm:
- only FMRs with confirmed backordered quantity remain;
- opening one shows only lines with confirmed B/O quantity > 0.

## 10. Re-enable writes
Run Operational Readiness / Health Check.
If backup, schema, integrity and system controls pass:
- clear maintenance message;
- set `TRANSACTION_MODE = ENABLED`.

## 11. GitHub
Push:
- AdminFieldNotesService.gs
- Config version
- Adapter.gs addition
- complete Client.html
- AdminQueueStyles.html change
- final appsscript.json with the ACTUAL immutable Core version

Suggested commit:
`Alpha 30.5 — Admin Field notes and approved backorder filter`

After validation, optionally update Production Configuration `APP_VERSION` to
`3.0.0-alpha.30.5`.
