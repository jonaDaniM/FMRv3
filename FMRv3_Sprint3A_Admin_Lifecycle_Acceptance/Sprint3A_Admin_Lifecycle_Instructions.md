# Sprint 3A — Admin backorder lifecycle acceptance

## Before beginning

Remove the two repository-only artifacts:

```text
.DS_Store
Bound_Adapter_alpha8.gs
```

Add `.gitignore`:

```gitignore
.DS_Store
**/.DS_Store
```

Commit:

```text
Clean alpha.8 release artifacts
```

No Apps Script deployment is required for that cleanup.

## Install the Core-only acceptance service

Create:

```text
FMRCoreV3/AdminAcceptanceFixtureService.gs
```

Paste the complete contents of:

```text
FMRCoreV3_AdminAcceptanceFixtureService.gs
```

Do not change:

- Core `3.0.0-alpha.8`
- Core library version `8`
- Bound manifest
- Any production transaction service

## Create four isolated fixtures

Run:

```javascript
createAdminAcceptanceFixturesFmrV3
```

It creates:

```text
V3-ADMIN-CONFIRM-0003
V3-ADMIN-REJECT-0004
V3-ADMIN-RETURN-0005
V3-ADMIN-SPLIT-0006
```

Each begins with:

```text
Requested: 6 EA
Pending backorder: 2 EA
Confirmed backorder: 0
Not located: 6 EA
Remaining: 6 EA
```

Then run:

```javascript
verifyAdminAcceptanceInitialFmrV3
```

All four fixtures must pass.

## Admin sequence

Use this note unless another note is specified:

```text
Sprint 3A Admin lifecycle acceptance
```

### 1. Partial and final confirmation

For `V3-ADMIN-CONFIRM-0003`:

1. Confirm `1 EA`.
2. Run `verifyAdminConfirmPartialFmrV3`.
3. Confirm the remaining `1 EA`.
4. Run `verifyAdminConfirmFinalFmrV3`.

Expected final state:

```text
Pending backorder: 0
Confirmed backorder: 2
Request status: Confirmed
Request absent from actionable Admin queue
```

### 2. Rejection

For `V3-ADMIN-REJECT-0004`:

1. Select Reject.
2. Submit the standard note.
3. Run `verifyAdminRejectFinalFmrV3`.

Expected:

```text
Pending backorder: 0
Confirmed backorder: 0
Request status: Rejected
Request inactive
No actionable BACKORDER or BACKORDERLINE index
```

### 3. Return for Field review

For `V3-ADMIN-RETURN-0005`:

1. Select Return.
2. Enter:

```text
Field must provide a more precise material search location.
```

3. Run `verifyAdminReturnFinalFmrV3`.

Expected:

```text
Request status: Returned for Review
Request leaves Admin queue
Field workflow: FIELD_REVIEW_REQUIRED
Returned quantity visible to Field: 2 EA
```

Open Field and search `V3-ADMIN-RETURN-0005`. Confirm the reason is visible. Do not perform a Field action yet.

### 4. Partial confirmation and returned balance

For `V3-ADMIN-SPLIT-0006`:

1. Confirm `1 EA`.
2. Run `verifyAdminSplitPartialFmrV3`.
3. Return the remaining `1 EA` using:

```text
Field must recheck the unresolved balance.
```

4. Run `verifyAdminSplitReturnFinalFmrV3`.

Expected:

```text
Original row:
  Confirmed: 1
  Pending: 0
  Status: Confirmed

Split row:
  Confirmed: 0
  Pending: 1
  Status: Returned for Review

Line:
  Pending backorder: 0
  Confirmed backorder: 1

Field:
  FIELD_REVIEW_REQUIRED
  Returned quantity: 1 EA
```

## Final regressions

Core:

```javascript
runFmrV3DataIntegrityDiagnostic
runFmrV3FieldMetadataDiagnostic
runFmrV3FieldWorkflowContractDiagnostic
runFmrV3KnownSearchPerformanceDiagnostic
runFmrV3BootstrapPerformanceDiagnostic
```

Bound:

```javascript
verifyBoundFmrV3Connection
verifyBoundAdminOperationalRailV3
verifyBoundFieldWorkflowContractV3
verifyBoundFieldMetadataContractV3
```

## GitHub push

Push:

```text
FMRCoreV3/AdminAcceptanceFixtureService.gs
.gitignore
```

Commit message:

```text
Add Sprint 3A Admin lifecycle acceptance
```

No new Core library version or Bound deployment is required.
