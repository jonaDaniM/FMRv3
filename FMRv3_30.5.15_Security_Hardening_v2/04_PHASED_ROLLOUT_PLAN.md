# Phased rollout — do not skip gates

## Phase 0 — preserve known-good production

Before changing code:

- keep `.14` deployed and operational;
- retain Git commit `30cc8ad1d59ed63acea66bc3bd7aaf9d67d9ea44`;
- record current production deployment ID and `/exec` URL;
- record FMRCore library v53;
- create a fresh production backup;
- run the strict environment diagnostic in PROD and TEST.

No ownership change is part of this release.

## Phase 1 — safe controls only

Do these while every currently required user remains Editor:

- prevent editors from changing sharing permissions;
- ensure Drive General access is Restricted;
- remove stale former users only;
- install the manual-edit monitor;
- optionally install warning-only protections.

Then leave production alone long enough to prove normal transactions still work.

## Phase 2 — create gateway under the current primary owner

Create a NEW standalone Apps Script project under:

`jonathanmura05@gmail.com`

Name suggestion:

`FMRv3 Write Gateway - SECURITY`

Add the existing immutable FMRCore library.

For initial TEST, use the same stable Core library version you are testing against.

The gateway stores fixed TEST/PRODUCTION database IDs in its own Script Properties.

## Phase 3 — route only necessary non-owner writes

Preserve browser-facing function names.

Route:
- `getPortalBootstrapV3` because it writes Last_Login_At / Last_Interface;
- `performFieldActionV3`;
- `reviewBackorderV3`;
- `recordWritePerformanceEventV3`.

Leave read-only APIs direct for now.

Leave Owner maintenance direct because Jonathan and Ernie remain spreadsheet editors.

## Phase 4 — TEST as Editors

Run the complete functional matrix.

No Drive-role change yet.

## Phase 5 — TEST as Viewers

On the TEST database only:

- one Field user: Editor -> Viewer;
- one Material Admin: Editor -> Viewer.

Verify portal writes still succeed and raw cell edits fail.

Restore to Editor immediately if any required write bypasses the gateway.

## Phase 6 — production gateway canary, permissions unchanged

Deploy the `.15` Bound routing to production while existing user Drive roles are still unchanged.

Observe real traffic.

Minimum suggested canary:
- 20 legitimate Field actions;
- several full bag closures;
- more than one user;
- one backorder request;
- one Admin decision when available;
- bootstrap/login;
- performance telemetry.

## Phase 7 — production Viewer cutover

Only after canary success:

- ordinary Field/Admin accounts -> Viewer;
- keep Jonathan and Ernie as Editor/Owner;
- do immediate smoke tests.

## Phase 8 — hard sheet protections

Only after Viewer cutover is stable:

- run the owner-only protection installer;
- approved editors must be Jonathan + Ernie;
- keep manual-edit monitor enabled.

## Phase 9 — stabilization

Keep `.14` rollback information for at least one full working cycle.
Do not remove the old production deployment or personal primary owner as part of `.15`.
