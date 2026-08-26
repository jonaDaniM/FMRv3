# Alpha 30.5 Test Plan

## A — parity
- [ ] TEST header = FMRCore 3.0.0-alpha.30.5
- [ ] TEST uses the new immutable Core version
- [ ] PROD remains READ_ONLY until TEST passes
- [ ] final GitHub appsscript.json matches deployed Core dependency

## B — existing Field note
Use a line with an existing Material_Transactions.Notes value.

Admin FMR detail:
- [ ] note control appears only on the affected line
- [ ] summary displays correct note count
- [ ] expand/collapse works
- [ ] action context is displayed
- [ ] performer is displayed when available
- [ ] issued-to recipient is displayed for issue actions
- [ ] timestamp is displayed
- [ ] note body exactly matches stored Field note

## C — long note
In TEST create a Field transaction with a note near 500 characters.

Verify:
- [ ] no overlap into neighboring cells
- [ ] text never exits the note panel
- [ ] long unbroken strings wrap
- [ ] line breaks are preserved
- [ ] expanded note list scrolls vertically when needed
- [ ] no uncontrolled horizontal note overflow

## D — read-only note display
Opening Admin detail must NOT modify:
- [ ] Material_Transactions
- [ ] Backorder_Requests
- [ ] FMR_Line_Items
- [ ] FMR_Header

## E — Backordered Only
Click `Backordered Only`.

Verify:
- [ ] existing Operational Filter becomes CONFIRMED_BACKORDER
- [ ] button becomes active / says `Showing Backorders`
- [ ] register contains only FMRs with confirmed B/O quantity > 0
- [ ] opening an FMR shows only lines with qtyConfirmedBackorder > 0
- [ ] explanatory notice appears

Click active quick filter again:
- [ ] filter returns to ALL
- [ ] normal register returns

## F — dropdown parity
Select `Approved / Confirmed Backorders` directly and Apply.
- [ ] same data as quick filter
- [ ] quick-filter state synchronizes

Select `Pending Backorder Review`.
- [ ] existing pending behavior remains unchanged

## G — regression
- [ ] Field search
- [ ] issue transaction
- [ ] Bag & Tag
- [ ] submit Backorder
- [ ] Admin approve Backorder
- [ ] Admin Active Bags
- [ ] Admin FMR register search
- [ ] Admin Open/Close detail
- [ ] Owner view

## H — performance
Normal Admin register should remain similar because Field notes are fetched only
for the single FMR opened by the Admin.

Only the detail-open path adds:
- one exact Material_Transactions lookup by FMR_Number;
- one exact Backorder_Requests lookup by FMR_Number.

## PASS
Pass only when notes render safely, approved-backorder filtering is correct, and
no operational arithmetic/regression is observed.
