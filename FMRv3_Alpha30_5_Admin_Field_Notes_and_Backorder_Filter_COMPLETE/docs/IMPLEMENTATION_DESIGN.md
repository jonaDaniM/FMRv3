# Alpha 30.5 Implementation Design

## Field Notes

The existing Field form already accepts up to 500 characters of Notes.
The existing Core writes those notes to immutable
`Material_Transactions.Notes`.

Backorder submission separately stores the Field note in
`Backorder_Requests.Field_Notes`.

Alpha 30.5 does NOT duplicate those values into FMR_Line_Items.

When an Admin opens one FMR:
1. existing indexed FMR detail is loaded;
2. Material_Transactions is read by exact FMR_Number;
3. Backorder_Requests is read by exact FMR_Number;
4. Field-originated notes are grouped by FMR_Line_ID;
5. each material line receives a read-only Field-note collection.

Normal Admin register loading remains lightweight.

Field transaction types included:
- CONFIRM_AVAILABLE
- BAG
- DIRECT_ISSUE
- ISSUE_FROM_AVAILABLE
- ISSUE_FROM_BAG

Backorder-request Field notes are included from the dedicated Field_Notes field.

Admin decision notes and Owner correction notes are intentionally not presented
as Field notes.

## Rendering

A material line with zero Field notes displays no expandable control.

A material line with notes displays:
`Field Notes (N)`

The disclosure shows newest notes first with:
- Field action;
- quantity/UOM;
- performer;
- issued-to recipient when applicable;
- timestamp;
- note body.

CSS uses:
- `white-space: pre-wrap`;
- `overflow-wrap: anywhere`;
- `word-break: break-word`;
- bounded max height;
- vertical scrolling;
- hidden horizontal overflow.

## Approved Backorder Filter

The Core/Admin Register already supports the authoritative filter
`CONFIRMED_BACKORDER`, based on `Qty_Confirmed_Backorder > 0`.

Alpha 30.5 does not create another backorder data model.

It:
- renames the option to `Approved / Confirmed Backorders`;
- adds a one-click `Backordered Only` button;
- synchronizes the button with the existing dropdown;
- when active, opened FMR detail displays only material lines whose
  `qtyConfirmedBackorder > 0`.

Pending Backorder Review remains a separate existing filter.
