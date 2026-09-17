/**
 * Add these functions to the Bound project.
 *
 * Run manually from the Apps Script editor by a System Owner.
 */

function runPreviewCommodityIndexBackfillV3() {
  const result =
    FMRCoreV3
      .previewFmrV3CommodityIndexBackfill(
        boundDatabaseIdFmrV3_(),
        callerEmailFmrV3_()
      );

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}


function runApplyCommodityIndexBackfillV3() {
  const result =
    FMRCoreV3
      .applyFmrV3CommodityIndexBackfill(
        boundDatabaseIdFmrV3_(),
        callerEmailFmrV3_()
      );

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}
