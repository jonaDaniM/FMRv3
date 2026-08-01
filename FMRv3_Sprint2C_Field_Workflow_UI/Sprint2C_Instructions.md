# FMR v3 — Sprint 2C Field Workflow UI

## Files

- `Bound_Client_Sprint2C.html`
  - Replace the entire contents of `Bound/Client.html`.

- `Bound_FieldWorkflowStyles.html`
  - In the Bound Apps Script project, create a new HTML file named:
    `FieldWorkflowStyles`
  - Paste the complete file contents into it.

## Update `Bound/Index.html`

In the `<head>`, locate:

```html
<?!= includeFmrV3_('Styles'); ?>
```

Change it to:

```html
<?!= includeFmrV3_('Styles'); ?>
<?!= includeFmrV3_('FieldWorkflowStyles'); ?>
```

No other `Index.html` changes are required.

## Correct the two historical Adapter diagnostics

In `verifyBoundAdminActiveBagsV3()`, replace the exact alpha.5 comparison with:

```javascript
isCompatibleFmrV3Alpha_(
  coreVersion,
  3
) &&
```

In `verifyBoundAdminOperationalRailV3()`, replace the exact alpha.5 comparison with:

```javascript
isCompatibleFmrV3Alpha_(
  coreVersion,
  4
) &&
```

The existing `verifyBoundFieldWorkflowContractV3()` should continue using:

```javascript
isCompatibleFmrV3Alpha_(
  coreVersion,
  5
)
```

## Save and test

Update the Bound web-app deployment, then open the Field view.

Use:

```text
V3-ACCEPT-0001
```

Confirm:

1. Two material lines render as guided cards instead of one dense table.
2. Each card shows quantities, storage, status, and a recommended next step.
3. The active Bag & Tag appears on the partially issued line.
4. Actions are grouped under Issue, Reserve, Locate, or Exception.
5. Selecting `Issue From Bag` displays the active tag and sets the quantity maximum to the selected tag's remaining quantity.
6. Changing the selected tag updates the quantity ceiling.
7. Canceling the modal makes no database change.
8. Admin and Owner views still load correctly.
9. These diagnostics still pass:
   - `verifyBoundAdminActiveBagsV3`
   - `verifyBoundAdminOperationalRailV3`
   - `verifyBoundFieldWorkflowContractV3`

## GitHub push

Push:

```text
Bound/Client.html
Bound/FieldWorkflowStyles.html
Bound/Index.html
Bound/Adapter.gs
```

Commit message:

```text
Render guided Field material workflows
```

This is a Bound-only UI release. Do not create Core library version 6.
