# FMR Operations v3 — Alpha 30.5

## Admin Field Notes + Approved Backorder Filter

This is a narrow production update.

### Adds
- Admin FMR detail shows Field notes recorded during issue/location/bag actions.
- Backorder-request Field notes are included from Backorder_Requests.
- Notes are expandable only when notes exist.
- Long text wraps inside a bounded vertically scrollable panel.
- A one-click **Backordered Only** filter is added to Admin.
- When the confirmed-backorder filter is active, opened FMR detail shows only
  material lines with confirmed backordered quantity.

### Does not change
- material quantity arithmetic;
- Field transaction write logic;
- Material_Transactions schema;
- backorder approval arithmetic;
- Search_Index / Operational_Index schema;
- Bag & Tag logic;
- migration parser;
- Owner correction/recovery behavior.

Read `docs/GITHUB_PARITY_REVIEW.md` and `docs/INSTALLATION.md`.
