/**
 * Alpha 30.5 — Admin FMR detail enriched with Field transaction notes.
 *
 * ADD this function to Bound/Adapter.gs.
 */
function getAdminFmrDetailV3(
  fmrNumber
) {
  return FMRCoreV3.getFmrV3AdminFmrDetail(
    boundDatabaseIdFmrV3_(),
    callerEmailFmrV3_(),
    fmrNumber
  );
}
