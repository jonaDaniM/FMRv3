# Installation

## Phase A — safe Bound optimization

In the **Bound** Apps Script project:

1. Open `OwnerMaintenance.html`.
2. Delete its entire contents.
3. Paste the complete contents of:
   `Bound/OwnerMaintenance.html`
4. Save.

This is the only runtime behavior optimization in Alpha 30.1. It prevents
Owner-only maintenance initialization from running on Field/Admin page loads.

## Phase B — database-aware diagnostics

In **FMRCoreV3**:

1. Open `ProductionPerformanceDiagnostic.gs`.
2. Delete its entire contents.
3. Paste the complete contents of:
   `FMRCoreV3/ProductionPerformanceDiagnostic.gs`
4. Change the Config version string to:
   `3.0.0-alpha.30.1`
5. Save.
6. Publish a new immutable library version.

In **Bound**:

1. Create a NEW `.gs` file named:
   `ProductionPerformanceAdapter`
2. Paste:
   `Bound/ProductionPerformanceAdapter.gs`
3. Update `appsscript.json` so the FMRCoreV3 library points to the immutable
   library version created above.
4. Save.
5. Deploy a new TEST version.

## Read-only measurements

From the Bound Apps Script editor, while signed in as a System Owner:

```javascript
runProductionStorageProfileDiagnosticV3()
```

Then:

```javascript
runProductionReadPerformanceDiagnosticV3('KNOWN_TEST_FMR')
```

Record the results before the large migration, after ~50-100 historical FMRs,
and after the full migration.

## Do not change yet

Do not add a Transaction_Index, rewrite publication, cache live operational
queues, or remove ScriptLock/flush/audit/backup safeguards until measurements
show a real bottleneck.
