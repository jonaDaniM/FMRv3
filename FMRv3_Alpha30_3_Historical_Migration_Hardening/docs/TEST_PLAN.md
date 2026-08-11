# Alpha 30.3 TEST Plan

## A. Deployment parity

- [x] Web app header = `FMRCore 3.0.0-alpha.30.3`.
- [x] TEST fingerprint remains `zpng2GNiXABY`.
- [x] GitHub / Apps Script Core / Bound deployment contain the same Alpha 30.3 changes.

## B. Active-job safety

The current database contains an old interrupted RUNNING job.

1. Before abandoning it, preview the same source folder.
2. Expected:
  - [x] Preview identifies an active job.
     [ ] `Start Migration` is disabled.
     [ ] Message tells the Owner to Resume or Abandon the existing job.
3. In Recent Migration Jobs:
  - [ ] `View Job` loads it.
     [ ] `Resume` is visible for READY/RUNNING.
     [ ] `Abandon` is visible for READY/RUNNING.
4. Abandon the stale job.
5. Expected:
  - [x] Job status becomes `ABANDONED`.
     [ ] Remaining PENDING/PARSING/PUBLISHING files become `ABANDONED`.
     [ ] Already-published FMRs remain published.
     [ ] Job cannot be resumed.
     [ ] Audit_Log receives `HISTORICAL_MIGRATION_ABANDONED`.



## C. Recursive working-folder protection

The source folder already contains `_FMRv3_Historical_Migration_Working_*`
folders.

1. Preview with Include subfolders OFF. TRUE
2. Record supported source-file count: 
3. Preview with Include subfolders ON.
4. Confirm generated working folders / `[FMR MIGRATION]` converted sheets are
  not added to the source inventory.
5. The only extra recursively discovered files should be legitimate user source
  files in real subfolders.



## D. Linear-foot quantity parser test

Use a small controlled copy/folder containing the affected workbook(s).

### D0012 source workbook

For the two worksheets with blank FMR number:

- `40.2'` must parse as `40.2 LF`.
- `66.7'` must parse as `66.7 LF`.
- `QUANTITY_INVALID` must disappear for those two pipe lines.
- An INFO issue `QUANTITY_UNIT_NORMALIZED` should be recorded.
- Both worksheets must remain BLOCKED because Official FMR Number is blank.



### FMR 688

- `0.3'` must parse as `0.3 LF`.
- The normalized line must no longer have QUANTITY_INVALID.
- FMR 688 must remain BLOCKED because other pipe/spool Quantity cells are blank.



### Blank quantity controls

The following must remain BLOCKED:

- FMRs 675–679
- FMR 724
- FMR 725

Reason: source Quantity is genuinely blank.

Alpha 30.3 must never manufacture a requested quantity.

## E. Unsupported quantity syntax control

A source such as:

`2'-6"`

must NOT be guessed.

Expected:

- quantity remains invalid;
- FMR remains blocked;
- existing QUANTITY_INVALID error remains.



## F. New job after stale-job abandonment

After the interrupted job is abandoned:

1. Preview a controlled source folder.
2. Start one new migration job.
3. Leave Continue automatically ON.
4. Expected:
  - [ ] no second active job can be started against the same folder;
     [ ] UI shows current/next source file;
     [ ] label reads FMRs / Server Pass;
     [ ] UI explains one source workbook is handled per server pass;
     [ ] tab-open requirement is visible;
     [ ] completed job disables Process Next Server Pass.



## G. No operational regression

Run storage profile before and after REQUEST_ONLY migration.

Migration alone must not manufacture:

- Material_Transactions
- Bag_Tag_Header
- Bag_Tag_Items
- Backorder_Requests
- Field_Notifications
- Owner_Corrections



## H. Performance

Alpha 30.3 does not redesign cross-file migration execution.

Expect Excel conversion/open/parse to remain the dominant migration cost.

Do not increase the server-pass limit to hide source conversion latency.

## PASS gate

Alpha 30.3 passes when:

- [ ] valid LF suffix quantities normalize correctly;
- [ ] blank quantities remain blocked;
- [ ] missing FMR numbers remain blocked;
- [ ] duplicate active migration start is prevented;
- [ ] stale jobs can be explicitly abandoned;
- [ ] recursive discovery excludes generated working folders;
- [ ] automatic continuation/resume behavior is understandable;
- [ ] operational tables remain correct.