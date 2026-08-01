/**
 * Admin KPI and actionable backorder queue service.
 * KPI values are read from the small bounded Dashboard sheet range.
 */

function getAdminDashboardFmrV3_(userEmail) {
  const user = assertSearchUserFmrV3_(userEmail);
  const values = sheetFmrV3_(FMR_V3.SHEETS.DASHBOARD)
    .getRange('A4:G9')
    .getDisplayValues();

  const queue = getBackorderQueueFmrV3_(userEmail);

  return {
    generatedAt: formatDateTimeFmrV3_(nowFmrV3_()),
    user: user,
    canReviewBackorders: user.canAdminBackorder,
    kpis: {
      publishedFmrs: values[1][0],
      openFmrs: values[1][1],
      materialLines: values[1][2],
      requestedQty: values[1][3],
      locatedQty: values[1][4],
      issuedQty: values[1][5],
      remainingQty: values[1][6],
      availableQty: values[5][0],
      baggedQty: values[5][1],
      pendingBackorderQty: values[5][2],
      confirmedBackorderQty: values[5][3],
      returnedReviewRequests: values[5][4],
      activeTags: values[5][5],
      fulfillment: values[5][6]
    },
    backorders: queue.requests
  };
}
