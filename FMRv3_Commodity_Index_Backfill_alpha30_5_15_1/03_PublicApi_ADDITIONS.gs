/**
 * Add these two functions to FMRCoreV3/PublicApi.gs.
 */

function previewFmrV3CommodityIndexBackfill(
  databaseId,
  userEmail
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return previewCommodityIndexBackfillFmrV3_(
    userEmail
  );
}


function applyFmrV3CommodityIndexBackfill(
  databaseId,
  userEmail
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return applyCommodityIndexBackfillFmrV3_(
    userEmail
  );
}
