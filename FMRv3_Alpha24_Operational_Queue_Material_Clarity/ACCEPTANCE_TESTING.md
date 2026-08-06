# Alpha 24 acceptance testing

## A. Backorder queue data

Create or use one TEST backorder whose published FMR line contains:

```text
Commodity code
Size
Material description
UOM
ISO and sheet
```

Open Admin → Operational Queues → Backorders and expand the request. Confirm:

- Commodity code has an explicit label.
- Size has an explicit label.
- ISO has an explicit label.
- Material description is visible in full.
- Pending quantity includes its UOM when available.
- Reason, reporter, and timestamp are separately labeled.
- Confirm, Reject, and Return buttons still work.

## B. Long-description overflow

Use a material description long enough to wrap across several lines. Confirm:

- the description remains inside the request card;
- the queue rail does not become wider;
- text does not overlap action buttons;
- the main page and queue continue scrolling normally.

## C. Active Bags queue clarity

Open an active TEST tag and expand its item. Confirm:

- the heading says `Commodity code`;
- the value previously shown as an unlabeled suffix is now shown under `Size`;
- ISO and material description are separately labeled;
- Bagged, Issued, and Remaining quantities are displayed as separate metrics;
- the UOM appears with quantities;
- long descriptions and notes wrap inside the card.

## D. Search

In Backorders, verify search works for:

```text
FMR
ISO
Commodity code
Size
Material description text
Reporter
Reason
```

In Active Bags, verify search continues to work for tag, FMR, ISO, commodity, size, description, and location.

## E. Regression checks

- Admin register still loads.
- Inline FMR details still load.
- Backorder Confirm, Reject, and Return still update TEST records correctly.
- Active bags still disappear from the active queue after full issue.
- Field search and Field transactions are unchanged.
- Material Admin still cannot see Owner.
- Core version shown in the portal is `3.0.0-alpha.24`.

## Acceptance decision

```text
[ ] Backorder size displayed
[ ] Backorder description displayed
[ ] Backorder UOM displayed
[ ] Long text contained
[ ] Bag item size clearly labeled
[ ] Bag quantities clearly labeled
[ ] Search expanded correctly
[ ] Decisions still function
[ ] No permission regression
[ ] No rollback required
```
