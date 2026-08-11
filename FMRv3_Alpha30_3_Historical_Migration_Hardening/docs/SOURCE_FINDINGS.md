# Migration Findings Behind Alpha 30.3

Source folder reviewed:

`1T9zBoqOHAtT1lo8dB6LmQTn7BM-jrn1N`

## Confirmed source-data findings

### IP-SMM10D0012FPP-K447-101_FMR.xlsx

- First worksheet has FMR `726`.
- The next two worksheets actually have blank `FMR NO.` fields in the source.
- Those two worksheets contain valid decimal pipe lengths `40.2'` and `66.7'`.
- Alpha 30.2 correctly blocked the missing FMR number but incorrectly treated the
  linear-foot quantity strings as zero.

After Alpha 30.3:
- `40.2'` becomes `40.2 LF`.
- `66.7'` becomes `66.7 LF`.
- Both worksheets remain BLOCKED because Official FMR Number is genuinely blank.

### IP-SMM10B0013FPP-K447-111_FMR.xlsx — FMR 688

- Several pipe/spool lines have genuinely blank Quantity cells.
- One line contains `0.3'`.

After Alpha 30.3:
- `0.3'` becomes `0.3 LF`.
- FMR 688 remains BLOCKED because its other requested quantities are blank.

### IP-SMM10R125MSPP-K447-101_FMR.xlsx — FMRs 724–725

FMR numbers exist, but pipe Quantity cells are genuinely blank.

These FMRs must remain BLOCKED. Alpha 30.3 does not invent quantities.

### IP-SMM20B0012FPP-K447-106_FMR_PIPE.xlsx — FMRs 675–679

FMR numbers exist, but requested pipe Quantity cells are genuinely blank.

These FMRs must remain BLOCKED.

## Job-state finding

Two migration jobs were created against the same source folder:
- an older job remained RUNNING after 4/10 files;
- a newer job subsequently processed all 10 files.

This caused duplicate conversion/parsing work and `ALREADY_PUBLISHED` issue noise.

Alpha 30.3 prevents a new job from starting while the same source folder has a
READY/RUNNING job and adds explicit Resume / Abandon controls.
