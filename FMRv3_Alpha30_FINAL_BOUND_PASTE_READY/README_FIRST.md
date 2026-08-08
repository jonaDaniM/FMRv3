# FMR Operations v3 — Alpha 30 Final Bound Paste Package

This package is for the **Bound Google Apps Script project**.

Reviewed GitHub baseline:

- Repository: `jonaDaniM/FMRv3`
- Commit: `c2c26a4bed321de57c5a73dfe6588ecc5647eec6`
- Commit message: `review alpha 30`

## Core review result

The Alpha 30 Core implementation in GitHub is correct for the changes reviewed.

The GitHub blob hashes for the two files that were manually corrected match the
exact locally validated files:

- `FMRCoreV3/OwnerCorrectionService.gs`
  - GitHub blob: `4ed0006dbc70a31f755158ab22d8883ee7c37a8b`
- `FMRCoreV3/FieldBackorderNoticeService.gs`
  - GitHub blob: `96f90477c8a1abccc1f452031764da444088d62d`

`ProductionPerformanceDiagnostic.gs` also matches the validated Alpha 30
diagnostic source, and `Config.gs` reports `3.0.0-alpha.30`.

## Important Bound finding

The GitHub backup currently contains BOTH:

- the complete Alpha 30 material/reversal rendering inside
  `OwnerMaintenance.html`; and
- the older Alpha 29.2 `OwnerMaintenanceMaterialContext.html` extension.

The current GitHub `Index.html` also includes both files.

That old extension is no longer needed. Leaving the 594-line Alpha 29.2
extension active would attach extra event handlers and can perform an additional
Owner ledger call after a correction search.

The package replaces it with an intentionally empty compatibility shim.

For the cleanest production Index, eventually remove the
`OwnerMaintenanceMaterialContext` include entirely.

## Files to paste

1. `Bound/OwnerMaintenance.html` — complete replacement.
2. `Bound/OwnerMaintenanceAdapter.gs` — complete replacement.
3. `Bound/OwnerDriveAuthorization.gs` — complete replacement/addition.
4. `Bound/appsscript.json` — complete replacement.
5. `Bound/OwnerMaintenanceMaterialContext.html` — replace old extension with
   the supplied empty compatibility shim **if the file/include currently
   exists**.

You do not need to change `Client.html`, `Adapter.gs`, `Styles.html`,
`FieldWorkflowStyles.html`, or `AdminQueueStyles.html` for Alpha 30.

Read `docs/BOUND_INSTALLATION.md` before pasting.
