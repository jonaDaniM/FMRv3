/**
 * Admin KPI and operational-rail service.
 *
 * Returns:
 * - KPI values
 * - Backorders awaiting Admin action
 * - Active Bag & Tag items
 */
function getAdminDashboardFmrV3_(userEmail) {
  const user = assertSearchUserFmrV3_(
    userEmail
  );

  const values = sheetFmrV3_(
    FMR_V3.SHEETS.DASHBOARD
  )
    .getRange('A4:G9')
    .getDisplayValues();

  const backorderQueue =
    getBackorderQueueFmrV3_(
      userEmail
    );

  const activeBagQueue =
    getAdminActiveBagQueueFmrV3_(
      userEmail,
      {
        query: '',
        readiness: 'ALL',
        sortOrder: 'OLDEST_FIRST',
        page: 1,
        pageSize: 10
      }
    );

  return {
    generatedAt: formatDateTimeFmrV3_(
      nowFmrV3_()
    ),
    user: user,
    canReviewBackorders:
      user.canAdminBackorder,

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

    /**
     * Preserved for compatibility with the
     * existing Admin interface.
     */
    backorders: backorderQueue.requests,

    /**
     * Preserved as a simple direct collection
     * for lightweight clients.
     */
    activeBags: activeBagQueue.records,

    /**
     * Primary Sprint 1 Admin right-rail payload.
     */
    operationalRail: {
      backorders: {
        count: backorderQueue.count,
        canReview:
          backorderQueue.canReview,
        requests:
          backorderQueue.requests
      },

      activeBags: {
        summary:
          activeBagQueue.summary,
        pagination:
          activeBagQueue.pagination,
        records:
          activeBagQueue.records
      }
    }
  };
}