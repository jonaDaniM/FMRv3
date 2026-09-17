# Final go/no-go checklist

## Environment
- [ ] PROD strict diagnostic PASS.
- [ ] TEST strict diagnostic PASS.
- [ ] TEST Core environment is TEST.
- [ ] PROD Core environment is PRODUCTION.
- [ ] TEST and PROD fingerprints differ.

## Ownership
- [ ] `OWNER_EMAIL` remains `jonathanmura05@gmail.com`.
- [ ] Jonathan remains active System Owner.
- [ ] Ernie remains active delegated System Owner.
- [ ] No ownership transfer is being attempted.

## TEST
- [ ] Gateway works while users are Editors.
- [ ] Viewer Field user can complete every required Field write.
- [ ] Viewer Admin can complete Admin write.
- [ ] Raw direct editing is blocked for Viewer.
- [ ] Audit/transaction/bag/index reconciliation passes.
- [ ] Performance telemetry still records.
- [ ] Security-negative tests pass.

## Production canary
- [ ] Gateway deployed with permissions unchanged.
- [ ] At least 20 legitimate Field actions pass.
- [ ] Multiple users pass.
- [ ] Full bag closures pass.
- [ ] Admin path passes.
- [ ] No material/index/audit regression.
- [ ] Performance acceptable.

## Permission cutover
- [ ] Jonathan remains Editor/Owner.
- [ ] Ernie remains Editor.
- [ ] Ordinary Field/Admin users are Viewer.
- [ ] Viewer portal smoke tests pass.

## Hard protection
- [ ] Script Property contains:
  `jonathanmura05@gmail.com,emoralessantillan@turner-industries.com`
- [ ] Hard protections installed only after Viewer validation.
- [ ] Owner maintenance works for intended owners.
- [ ] Manual-edit monitor remains active.

If any required box above is false, stop at that gate rather than pushing forward.
