/**
 * Admin KPI and actionable operational-queue service.
 *
 * Alpha 30.5.6:
 * - Backorders remain the Admin operational queue because they require action.
 * - Active Bag & Tag is now a Register material-state filter (HAS_BAGGED).
 * - Dashboard no longer calls getAdminActiveBagQueueFmrV3_(), eliminating an
 *   unnecessary high-cardinality Operational_Index read on every Admin load.
 *
 * The empty activeBags compatibility fields are intentionally retained so an
 * older Bound client does not fail while Core/Bound are being advanced through
 * Test Deployment.
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
     * Preserved for compatibility with the existing Admin interface.
     */
    backorders:
      backorderQueue.requests,

    /**
     * Deprecated compatibility payload.
     *
     * Alpha 30.5.6 intentionally does NOT query active Bag items here.
     * Use Admin Register exceptionType HAS_BAGGED instead.
     */
    activeBags: [],

    operationalRail: {
      backorders: {
        count:
          backorderQueue.count,

        canReview:
          backorderQueue.canReview,

        requests:
          backorderQueue.requests
      },

      activeBags: {
        deprecated:
          true,

        filter:
          'HAS_BAGGED',

        summary: {
          activeTags:
            values[5][5],

          activeItems:
            0,

          matchingItems:
            0
        },

        pagination: {
          page: 1,
          pageSize: 0,
          totalRecords: 0,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
          firstRecord: 0,
          lastRecord: 0
        },

        records: []
      }
    }
  };
}
