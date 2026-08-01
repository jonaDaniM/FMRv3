function fieldLocatableQuantityFmrV3_(state) {
  const value = state || {};

  return Math.max(
    0,
    Math.min(
      numberFmrV3_(
        value.notYetLocated
      ),
      numberFmrV3_(
        value.remaining
      )
    ) -
    numberFmrV3_(
      value.pendingBackorder
    )
  );
}

function fieldNewBackorderQuantityFmrV3_(
  state
) {
  const value = state || {};

  return Math.max(
    0,
    fieldLocatableQuantityFmrV3_(
      value
    ) -
    numberFmrV3_(
      value.confirmedBackorder
    )
  );
}

function fieldReservableQuantityFmrV3_(
  state
) {
  const value = state || {};

  return Math.max(
    0,
    numberFmrV3_(
      value.available
    ) +
    fieldLocatableQuantityFmrV3_(
      value
    )
  );
}

function fieldActionLimitsFromStateFmrV3_(
  state
) {
  const value = state || {};

  return {
    confirmAvailable:
      fieldLocatableQuantityFmrV3_(
        value
      ),

    bag:
      fieldReservableQuantityFmrV3_(
        value
      ),

    directIssue:
      Math.min(
        fieldLocatableQuantityFmrV3_(
          value
        ),
        Math.max(
          0,
          numberFmrV3_(
            value.remaining
          )
        )
      ),

    issueAvailable:
      Math.min(
        Math.max(
          0,
          numberFmrV3_(
            value.available
          )
        ),
        Math.max(
          0,
          numberFmrV3_(
            value.remaining
          )
        )
      ),

    backorder:
      fieldNewBackorderQuantityFmrV3_(
        value
      )
  };
}

function backorderOutstandingReturnedFmrV3_(
  backorder
) {
  const explicitPending =
    numberFmrV3_(
      backorder.Qty_Pending
    );

  if (explicitPending > 0) {
    return explicitPending;
  }

  return Math.max(
    0,
    numberFmrV3_(
      backorder.Qty_Requested_Backorder
    ) -
    numberFmrV3_(
      backorder.Qty_Confirmed_Backorder
    )
  );
}

function activeBackordersForLineFmrV3_(
  lineId
) {
  const normalizedLineId =
    normalizeFmrV3_(
      lineId
    );

  if (!normalizedLineId) {
    return [];
  }

  const entries =
    lookupOperationalRowsFmrV3_(
      'BACKORDERLINE',
      normalizedLineId
    );

  const rowNumbers =
    Array.from(
      new Set(
        entries.map(
          function (
            entry
          ) {
            return numberFmrV3_(
              entry.Row_Number
            );
          }
        ).filter(
          function (
            rowNumber
          ) {
            return rowNumber > 1;
          }
        )
      )
    );

  if (!rowNumbers.length) {
    return [];
  }

  return readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.BACKORDERS,
    rowNumbers
  ).filter(
    function (
      request
    ) {
      return (
        yesFmrV3_(
          request.Active
        ) &&
        normalizeFmrV3_(
          request.FMR_Line_ID
        ) ===
          normalizedLineId
      );
    }
  ).sort(
    function (
      left,
      right
    ) {
      return (
        new Date(
          left.Reported_At ||
          0
        ).getTime() -
        new Date(
          right.Reported_At ||
          0
        ).getTime()
      );
    }
  );
}

function transitionBackorderStatusFmrV3_(
  backorder,
  line,
  nextStatus,
  keepOperational,
  timestamp
) {
  const requestId =
    normalizeFmrV3_(
      backorder.Backorder_Request_ID
    );

  const oldStatus =
    normalizeFmrV3_(
      backorder.Status
    );

  const normalizedNextStatus =
    normalizeFmrV3_(
      nextStatus
    );

  const now =
    timestamp ||
    nowFmrV3_();

  if (
    normalizeUpperFmrV3_(
      oldStatus
    ) !==
    normalizeUpperFmrV3_(
      normalizedNextStatus
    )
  ) {
    deactivateExactIndexRowsFmrV3_(
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX,
      operationalIndexKeyFmrV3_(
        'BACKORDERSTATUS',
        oldStatus
      ),
      requestId
    );

    appendOperationalIndexEntriesFmrV3_([
      {
        Index_Key:
          operationalIndexKeyFmrV3_(
            'BACKORDERSTATUS',
            normalizedNextStatus
          ),

        Index_Type:
          'BACKORDERSTATUS',

        Entity_ID:
          requestId,

        Parent_ID:
          line.FMR_Line_ID,

        Row_Number:
          backorder._rowNumber,

        Secondary_Row_Number:
          line._rowNumber,

        Active:
          FMR_V3.YES,

        Updated_At:
          now
      }
    ]);
  }

  if (!keepOperational) {
    deactivateExactIndexRowsFmrV3_(
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX,
      operationalIndexKeyFmrV3_(
        'BACKORDERLINE',
        line.FMR_Line_ID
      ),
      requestId
    );

    deactivateExactIndexRowsFmrV3_(
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX,
      operationalIndexKeyFmrV3_(
        'BACKORDER',
        requestId
      ),
      requestId
    );
  }
}

function planLocationBackorderTransitionsFmrV3_(
  line,
  state,
  newlyLocated
) {
  const locatedQuantity =
    Math.max(
      0,
      numberFmrV3_(
        newlyLocated
      )
    );

  const requests =
    activeBackordersForLineFmrV3_(
      line.FMR_Line_ID
    );

  const confirmedRequired =
    Math.min(
      locatedQuantity,
      Math.max(
        0,
        numberFmrV3_(
          state.confirmedBackorder
        )
      )
    );

  const confirmedCandidates =
    requests.filter(
      function (
        request
      ) {
        return (
          [
            'CONFIRMED',
            'PARTIALLY CONFIRMED'
          ].includes(
            normalizeUpperFmrV3_(
              request.Status
            )
          ) &&
          numberFmrV3_(
            request
              .Qty_Confirmed_Backorder
          ) > 0
        );
      }
    );

  const confirmedAvailable =
    confirmedCandidates.reduce(
      function (
        total,
        request
      ) {
        return (
          total +
          numberFmrV3_(
            request
              .Qty_Confirmed_Backorder
          )
        );
      },
      0
    );

  if (
    confirmedAvailable <
    confirmedRequired
  ) {
    throw new Error(
      'Confirmed backorder state is missing its active operational request. ' +
      'Run the alpha.6 integrity migration before recording more material.'
    );
  }

  let confirmedToApply =
    confirmedRequired;

  const confirmedSteps = [];

  confirmedCandidates.forEach(
    function (
      request
    ) {
      if (
        confirmedToApply <= 0
      ) {
        return;
      }

      const currentConfirmed =
        numberFmrV3_(
          request
            .Qty_Confirmed_Backorder
        );

      const applied =
        Math.min(
          currentConfirmed,
          confirmedToApply
        );

      const confirmedAfter =
        currentConfirmed -
        applied;

      const pending =
        numberFmrV3_(
          request.Qty_Pending
        );

      let nextStatus;

      if (
        confirmedAfter > 0 &&
        pending > 0
      ) {
        nextStatus =
          'Partially Confirmed';
      } else if (
        confirmedAfter > 0
      ) {
        nextStatus =
          'Confirmed';
      } else if (
        pending > 0
      ) {
        nextStatus =
          'Pending Admin Review';
      } else {
        nextStatus =
          'Fulfilled';
      }

      confirmedSteps.push({
        request:
          request,

        applied:
          applied,

        confirmedBefore:
          currentConfirmed,

        confirmedAfter:
          confirmedAfter,

        pending:
          pending,

        nextStatus:
          nextStatus,

        keepOperational:
          (
            confirmedAfter > 0 ||
            pending > 0
          )
      });

      confirmedToApply -=
        applied;
    }
  );

  let returnedToApply =
    locatedQuantity -
    confirmedRequired;

  const returnedSteps = [];

  requests.filter(
    function (
      request
    ) {
      return (
        normalizeUpperFmrV3_(
          request.Status
        ) ===
        'RETURNED FOR REVIEW'
      );
    }
  ).forEach(
    function (
      request
    ) {
      if (
        returnedToApply <= 0
      ) {
        return;
      }

      const currentReturned =
        backorderOutstandingReturnedFmrV3_(
          request
        );

      if (
        currentReturned <= 0
      ) {
        return;
      }

      const applied =
        Math.min(
          currentReturned,
          returnedToApply
        );

      const returnedAfter =
        currentReturned -
        applied;

      returnedSteps.push({
        request:
          request,

        applied:
          applied,

        returnedBefore:
          currentReturned,

        returnedAfter:
          returnedAfter,

        nextStatus:
          returnedAfter > 0
            ? 'Returned for Review'
            : 'Resolved by Field',

        keepOperational:
          returnedAfter > 0
      });

      returnedToApply -=
        applied;
    }
  );

  return {
    newlyLocated:
      locatedQuantity,

    confirmedConsumed:
      confirmedSteps.reduce(
        function (
          total,
          step
        ) {
          return (
            total +
            step.applied
          );
        },
        0
      ),

    returnedResolved:
      returnedSteps.reduce(
        function (
          total,
          step
        ) {
          return (
            total +
            step.applied
          );
        },
        0
      ),

    confirmedSteps:
      confirmedSteps,

    returnedSteps:
      returnedSteps
  };
}

function applyLocationBackorderTransitionsFmrV3_(
  line,
  state,
  plan,
  user,
  correlationId,
  sourceAction
) {
  const transitionPlan =
    plan || {
      confirmedSteps: [],
      returnedSteps: [],
      confirmedConsumed: 0,
      returnedResolved: 0
    };

  const now =
    nowFmrV3_();

  (
    transitionPlan.confirmedSteps ||
    []
  ).forEach(
    function (
      step
    ) {
      const request =
        step.request;

      updateRowObjectFmrV3_(
        FMR_V3.SHEETS
          .BACKORDERS,
        request._rowNumber,
        {
          Qty_Confirmed_Backorder:
            step.confirmedAfter,

          Status:
            step.nextStatus,

          Active:
            step.keepOperational
              ? FMR_V3.YES
              : FMR_V3.NO,

          Updated_At:
            now
        }
      );

      transitionBackorderStatusFmrV3_(
        request,
        line,
        step.nextStatus,
        step.keepOperational,
        now
      );

      appendTransactionFmrV3_(
        line,
        'BACKORDER_FULFILLED',
        step.applied,
        user,
        {
          correlationId:
            correlationId,

          backorderRequestId:
            request
              .Backorder_Request_ID,

          performedByName:
            user.name,

          notes:
            (
              'Confirmed backorder fulfilled during ' +
              normalizeUpperFmrV3_(
                sourceAction
              ) +
              '.'
            )
        }
      );

      appendAuditFmrV3_(
        'BACKORDER',
        request
          .Backorder_Request_ID,
        'BACKORDER_FULFILLED_BY_FIELD',
        user,
        correlationId,
        {
          sourceInterface:
            'FIELD',

          payload: {
            sourceAction:
              normalizeUpperFmrV3_(
                sourceAction
              ),

            fulfilledQuantity:
              step.applied,

            confirmedBefore:
              step.confirmedBefore,

            confirmedAfter:
              step.confirmedAfter,

            nextStatus:
              step.nextStatus
          }
        }
      );
    }
  );

  state.confirmedBackorder =
    Math.max(
      0,
      numberFmrV3_(
        state.confirmedBackorder
      ) -
      numberFmrV3_(
        transitionPlan
          .confirmedConsumed
      )
    );

  (
    transitionPlan.returnedSteps ||
    []
  ).forEach(
    function (
      step
    ) {
      const request =
        step.request;

      updateRowObjectFmrV3_(
        FMR_V3.SHEETS
          .BACKORDERS,
        request._rowNumber,
        {
          Qty_Pending:
            step.returnedAfter,

          Status:
            step.nextStatus,

          Active:
            step.keepOperational
              ? FMR_V3.YES
              : FMR_V3.NO,

          Updated_At:
            now
        }
      );

      transitionBackorderStatusFmrV3_(
        request,
        line,
        step.nextStatus,
        step.keepOperational,
        now
      );

      appendTransactionFmrV3_(
        line,
        'BACKORDER_RETURN_RESOLVED',
        step.applied,
        user,
        {
          correlationId:
            correlationId,

          backorderRequestId:
            request
              .Backorder_Request_ID,

          performedByName:
            user.name,

          notes:
            (
              'Returned review resolved during ' +
              normalizeUpperFmrV3_(
                sourceAction
              ) +
              '.'
            )
        }
      );

      appendAuditFmrV3_(
        'BACKORDER',
        request
          .Backorder_Request_ID,
        'BACKORDER_RETURN_RESOLVED_BY_FIELD',
        user,
        correlationId,
        {
          sourceInterface:
            'FIELD',

          payload: {
            sourceAction:
              normalizeUpperFmrV3_(
                sourceAction
              ),

            resolvedQuantity:
              step.applied,

            returnedBefore:
              step.returnedBefore,

            returnedAfter:
              step.returnedAfter,

            nextStatus:
              step.nextStatus
          }
        }
      );
    }
  );

  return {
    confirmedConsumed:
      numberFmrV3_(
        transitionPlan
          .confirmedConsumed
      ),

    returnedResolved:
      numberFmrV3_(
        transitionPlan
          .returnedResolved
      )
  };
}

function planReturnedBackorderResubmissionFmrV3_(
  line,
  quantity
) {
  let quantityToApply =
    Math.max(
      0,
      numberFmrV3_(
        quantity
      )
    );

  const steps = [];

  activeBackordersForLineFmrV3_(
    line.FMR_Line_ID
  ).filter(
    function (
      request
    ) {
      return (
        normalizeUpperFmrV3_(
          request.Status
        ) ===
        'RETURNED FOR REVIEW'
      );
    }
  ).forEach(
    function (
      request
    ) {
      if (
        quantityToApply <= 0
      ) {
        return;
      }

      const currentReturned =
        backorderOutstandingReturnedFmrV3_(
          request
        );

      if (
        currentReturned <= 0
      ) {
        return;
      }

      const applied =
        Math.min(
          currentReturned,
          quantityToApply
        );

      const returnedAfter =
        currentReturned -
        applied;

      steps.push({
        request:
          request,

        applied:
          applied,

        returnedBefore:
          currentReturned,

        returnedAfter:
          returnedAfter,

        nextStatus:
          returnedAfter > 0
            ? 'Returned for Review'
            : 'Resubmitted',

        keepOperational:
          returnedAfter > 0
      });

      quantityToApply -=
        applied;
    }
  );

  return {
    steps:
      steps,

    resubmittedQuantity:
      steps.reduce(
        function (
          total,
          step
        ) {
          return (
            total +
            step.applied
          );
        },
        0
      )
  };
}

function applyReturnedBackorderResubmissionFmrV3_(
  line,
  plan,
  user,
  correlationId
) {
  const now =
    nowFmrV3_();

  const steps =
    plan &&
    Array.isArray(
      plan.steps
    )
      ? plan.steps
      : [];

  steps.forEach(
    function (
      step
    ) {
      const request =
        step.request;

      updateRowObjectFmrV3_(
        FMR_V3.SHEETS
          .BACKORDERS,
        request._rowNumber,
        {
          Qty_Pending:
            step.returnedAfter,

          Status:
            step.nextStatus,

          Active:
            step.keepOperational
              ? FMR_V3.YES
              : FMR_V3.NO,

          Updated_At:
            now
        }
      );

      transitionBackorderStatusFmrV3_(
        request,
        line,
        step.nextStatus,
        step.keepOperational,
        now
      );

      appendTransactionFmrV3_(
        line,
        'BACKORDER_RESUBMITTED',
        step.applied,
        user,
        {
          correlationId:
            correlationId,

          backorderRequestId:
            request
              .Backorder_Request_ID,

          performedByName:
            user.name,

          notes:
            'Returned backorder quantity resubmitted by Field.'
        }
      );

      appendAuditFmrV3_(
        'BACKORDER',
        request
          .Backorder_Request_ID,
        'BACKORDER_RESUBMITTED_BY_FIELD',
        user,
        correlationId,
        {
          sourceInterface:
            'FIELD',

          payload: {
            resubmittedQuantity:
              step.applied,

            returnedBefore:
              step.returnedBefore,

            returnedAfter:
              step.returnedAfter,

            nextStatus:
              step.nextStatus
          }
        }
      );
    }
  );

  return {
    resubmittedQuantity:
      plan
        ? numberFmrV3_(
            plan
              .resubmittedQuantity
          )
        : 0
  };
}

function approximatelyEqualFmrV3_(
  left,
  right
) {
  return (
    Math.abs(
      numberFmrV3_(left) -
      numberFmrV3_(right)
    ) <
    0.000001
  );
}

function inspectFmrV3DataIntegrity() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const started =
    Date.now();

  const lines =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.LINES
    ).filter(
      function (
        line
      ) {
        return yesFmrV3_(
          line.Active
        );
      }
    );

  const headers =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.HEADERS
    ).filter(
      function (
        header
      ) {
        return yesFmrV3_(
          header.Active
        );
      }
    );

  const bagHeaders =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .BAG_HEADERS
    );

  const bagItems =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .BAG_ITEMS
    );

  const backorders =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .BACKORDERS
    );

  const activeBagStatuses = [
    'ACTIVE',
    'PARTIALLY ISSUED'
  ];

  const bagHeadersById = {};

  bagHeaders.forEach(
    function (
      header
    ) {
      bagHeadersById[
        normalizeFmrV3_(
          header.Bag_Tag_ID
        )
      ] = header;
    }
  );

  const activeBagTotalsByLine = {};
  const bagIndexIssues = [];

  bagItems.forEach(
    function (
      item
    ) {
      const header =
        bagHeadersById[
          normalizeFmrV3_(
            item.Bag_Tag_ID
          )
        ];

      const remaining =
        numberFmrV3_(
          item
            .Qty_Remaining_In_Bag
        );

      if (
        !header ||
        remaining <= 0 ||
        !activeBagStatuses.includes(
          normalizeUpperFmrV3_(
            header.Status
          )
        )
      ) {
        return;
      }

      const lineId =
        normalizeFmrV3_(
          item.FMR_Line_ID
        );

      activeBagTotalsByLine[
        lineId
      ] =
        numberFmrV3_(
          activeBagTotalsByLine[
            lineId
          ]
        ) +
        remaining;

      const bagLineEntries =
        lookupOperationalRowsFmrV3_(
          'BAGLINE',
          lineId
        ).filter(
          function (
            entry
          ) {
            return (
              normalizeFmrV3_(
                entry.Parent_ID
              ) ===
                normalizeFmrV3_(
                  item.Bag_Tag_ID
                ) &&
              numberFmrV3_(
                entry.Row_Number
              ) ===
                numberFmrV3_(
                  item._rowNumber
                )
            );
          }
        );

      const statusEntries =
        lookupOperationalRowsFmrV3_(
          'BAGSTATUS',
          'ACTIVE'
        ).filter(
          function (
            entry
          ) {
            return (
              normalizeFmrV3_(
                entry.Entity_ID
              ) ===
              normalizeFmrV3_(
                item.Bag_Tag_ID
              )
            );
          }
        );

      if (
        !bagLineEntries.length ||
        !statusEntries.length
      ) {
        bagIndexIssues.push({
          lineId:
            lineId,

          tagNumber:
            normalizeFmrV3_(
              item.Tag_Number
            ),

          missingBagLineIndex:
            !bagLineEntries.length,

          missingActiveStatusIndex:
            !statusEntries.length
        });
      }
    }
  );

  const pendingByLine = {};
  const confirmedByLine = {};
  const returnedByLine = {};

  backorders.forEach(
    function (
      request
    ) {
      if (
        !yesFmrV3_(
          request.Active
        )
      ) {
        return;
      }

      const lineId =
        normalizeFmrV3_(
          request.FMR_Line_ID
        );

      const status =
        normalizeUpperFmrV3_(
          request.Status
        );

      if (
        [
          'PENDING ADMIN REVIEW',
          'PARTIALLY CONFIRMED'
        ].includes(
          status
        )
      ) {
        pendingByLine[lineId] =
          numberFmrV3_(
            pendingByLine[lineId]
          ) +
          numberFmrV3_(
            request.Qty_Pending
          );
      }

      if (
        [
          'CONFIRMED',
          'PARTIALLY CONFIRMED'
        ].includes(
          status
        )
      ) {
        confirmedByLine[lineId] =
          numberFmrV3_(
            confirmedByLine[
              lineId
            ]
          ) +
          numberFmrV3_(
            request
              .Qty_Confirmed_Backorder
          );
      }

      if (
        status ===
        'RETURNED FOR REVIEW'
      ) {
        returnedByLine[lineId] =
          numberFmrV3_(
            returnedByLine[lineId]
          ) +
          backorderOutstandingReturnedFmrV3_(
            request
          );
      }
    }
  );

  const lineIssues = [];
  const linesByFmr = {};

  lines.forEach(
    function (
      line
    ) {
      const state =
        lineStateFmrV3_(
          line
        );

      const lineId =
        normalizeFmrV3_(
          line.FMR_Line_ID
        );

      const fmrId =
        normalizeFmrV3_(
          line.FMR_ID
        );

      if (
        !linesByFmr[fmrId]
      ) {
        linesByFmr[fmrId] = [];
      }

      linesByFmr[fmrId].push(
        line
      );

      const issues = [];

      if (
        !approximatelyEqualFmrV3_(
          state.confirmed,
          state.available +
          state.bagged +
          state.issued
        )
      ) {
        issues.push(
          'CONFIRMED_PHYSICAL_SPLIT'
        );
      }

      if (
        !approximatelyEqualFmrV3_(
          state.requested,
          state.confirmed +
          state.notYetLocated
        )
      ) {
        issues.push(
          'REQUESTED_LOCATION_SPLIT'
        );
      }

      if (
        !approximatelyEqualFmrV3_(
          state.remaining,
          state.requested -
          state.issued
        )
      ) {
        issues.push(
          'REMAINING_CALCULATION'
        );
      }

      if (
        state.pendingBackorder +
        state.confirmedBackorder >
        state.notYetLocated +
        0.000001
      ) {
        issues.push(
          'BACKORDER_EXCEEDS_UNLOCATED'
        );
      }

      if (
        state.remaining <= 0 &&
        (
          state.pendingBackorder > 0 ||
          state.confirmedBackorder > 0
        )
      ) {
        issues.push(
          'COMPLETED_WITH_BACKORDER'
        );
      }

      if (
        !approximatelyEqualFmrV3_(
          state.bagged,
          activeBagTotalsByLine[
            lineId
          ] || 0
        )
      ) {
        issues.push(
          'ACTIVE_BAG_TOTAL'
        );
      }

      if (
        !approximatelyEqualFmrV3_(
          state.pendingBackorder,
          pendingByLine[
            lineId
          ] || 0
        )
      ) {
        issues.push(
          'PENDING_BACKORDER_REQUEST_TOTAL'
        );
      }

      if (
        !approximatelyEqualFmrV3_(
          state.confirmedBackorder,
          confirmedByLine[
            lineId
          ] || 0
        )
      ) {
        issues.push(
          'CONFIRMED_BACKORDER_REQUEST_TOTAL'
        );
      }

      if (
        numberFmrV3_(
          returnedByLine[
            lineId
          ]
        ) > 0 &&
        fieldNewBackorderQuantityFmrV3_(
          state
        ) <= 0
      ) {
        issues.push(
          'STALE_RETURNED_REVIEW'
        );
      }

      if (
        issues.length
      ) {
        lineIssues.push({
          fmrNumber:
            normalizeFmrV3_(
              line.FMR_Number
            ),

          fmrLineId:
            lineId,

          commodityCode:
            normalizeFmrV3_(
              line.Commodity_Code
            ),

          issues:
            issues,

          state:
            state,

          activeBagTotal:
            numberFmrV3_(
              activeBagTotalsByLine[
                lineId
              ]
            ),

          operationalPending:
            numberFmrV3_(
              pendingByLine[
                lineId
              ]
            ),

          operationalConfirmed:
            numberFmrV3_(
              confirmedByLine[
                lineId
              ]
            ),

          returnedOutstanding:
            numberFmrV3_(
              returnedByLine[
                lineId
              ]
            )
        });
      }
    }
  );

  const headerIssues = [];

  headers.forEach(
    function (
      header
    ) {
      const fmrId =
        normalizeFmrV3_(
          header.FMR_ID
        );

      const fmrLines =
        linesByFmr[fmrId] ||
        [];

      const total =
        function (
          fieldName
        ) {
          return fmrLines.reduce(
            function (
              sum,
              line
            ) {
              return (
                sum +
                numberFmrV3_(
                  line[
                    fieldName
                  ]
                )
              );
            },
            0
          );
        };

      const comparisons = [
        [
          'TOTAL_LINES',
          header.Total_Lines,
          fmrLines.length
        ],
        [
          'REQUESTED',
          header.Qty_Requested,
          total(
            'Qty_Requested'
          )
        ],
        [
          'CONFIRMED_LOCATED',
          header
            .Qty_Confirmed_Located,
          total(
            'Qty_Confirmed_Located'
          )
        ],
        [
          'ACTIVE_BAGGED',
          header
            .Qty_Active_Bagged,
          total(
            'Qty_Active_Bagged'
          )
        ],
        [
          'AVAILABLE',
          header.Qty_Available,
          total(
            'Qty_Available'
          )
        ],
        [
          'ISSUED',
          header.Qty_Issued,
          total(
            'Qty_Issued'
          )
        ],
        [
          'PENDING_BACKORDER',
          header
            .Qty_Pending_Backorder,
          total(
            'Qty_Pending_Backorder'
          )
        ],
        [
          'CONFIRMED_BACKORDER',
          header
            .Qty_Confirmed_Backorder,
          total(
            'Qty_Confirmed_Backorder'
          )
        ],
        [
          'REMAINING',
          header
            .Qty_Remaining_Requirement,
          total(
            'Qty_Remaining_Requirement'
          )
        ]
      ];

      const mismatches =
        comparisons.filter(
          function (
            comparison
          ) {
            return (
              !approximatelyEqualFmrV3_(
                comparison[1],
                comparison[2]
              )
            );
          }
        ).map(
          function (
            comparison
          ) {
            return {
              field:
                comparison[0],

              headerValue:
                numberFmrV3_(
                  comparison[1]
                ),

              lineTotal:
                numberFmrV3_(
                  comparison[2]
                )
            };
          }
        );

      if (
        mismatches.length
      ) {
        headerIssues.push({
          fmrNumber:
            normalizeFmrV3_(
              header.FMR_Number
            ),

          mismatches:
            mismatches
        });
      }
    }
  );

  const guardTests = {
    locatableIncludesAuditedConfirmedFulfillment:
      approximatelyEqualFmrV3_(
        fieldLocatableQuantityFmrV3_({
          notYetLocated: 5,
          remaining: 5,
          pendingBackorder: 1,
          confirmedBackorder: 2
        }),
        4
      ),

    newBackorderExcludesConfirmedCommitment:
      approximatelyEqualFmrV3_(
        fieldNewBackorderQuantityFmrV3_({
          notYetLocated: 5,
          remaining: 5,
          pendingBackorder: 1,
          confirmedBackorder: 2
        }),
        2
      ),

    reservableIncludesAvailable:
      approximatelyEqualFmrV3_(
        fieldReservableQuantityFmrV3_({
          available: 2,
          notYetLocated: 5,
          remaining: 7,
          pendingBackorder: 1,
          confirmedBackorder: 2
        }),
        6
      )
  };

  const guardPassed =
    Object.keys(
      guardTests
    ).every(
      function (
        key
      ) {
        return Boolean(
          guardTests[key]
        );
      }
    );

  const output = {
    passed:
      lineIssues.length === 0 &&
      headerIssues.length === 0 &&
      bagIndexIssues.length === 0 &&
      guardPassed,

    readOnly: true,

    elapsedMs:
      Date.now() -
      started,

    version:
      FMR_V3.VERSION,

    linesScanned:
      lines.length,

    headersScanned:
      headers.length,

    backordersScanned:
      backorders.length,

    activeBagItems:
      Object.keys(
        activeBagTotalsByLine
      ).length,

    lineIssueCount:
      lineIssues.length,

    headerIssueCount:
      headerIssues.length,

    bagIndexIssueCount:
      bagIndexIssues.length,

    guardPassed:
      guardPassed,

    guardTests:
      guardTests,

    lineIssues:
      lineIssues.slice(
        0,
        50
      ),

    headerIssues:
      headerIssues.slice(
        0,
        50
      ),

    bagIndexIssues:
      bagIndexIssues.slice(
        0,
        50
      )
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  return output;
}

function runFmrV3DataIntegrityDiagnostic() {
  const output =
    inspectFmrV3DataIntegrity();

  if (
    !output.passed
  ) {
    throw new Error(
      'FMR v3 data-integrity diagnostic failed.'
    );
  }

  return output;
}

function repairBackorderStateIntegrityFmrV3() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const user =
      assertOwnerFmrV3_(
        normalizeEmailFmrV3_(
          Session
            .getEffectiveUser()
            .getEmail()
        )
      );

    const lines =
      getUsedRowsFmrV3_(
        FMR_V3.SHEETS.LINES
      ).filter(
        function (
          line
        ) {
          return yesFmrV3_(
            line.Active
          );
        }
      );

    const backorders =
      getUsedRowsFmrV3_(
        FMR_V3.SHEETS
          .BACKORDERS
      );

    const requestsByLine = {};

    backorders.forEach(
      function (
        request
      ) {
        const lineId =
          normalizeFmrV3_(
            request.FMR_Line_ID
          );

        if (
          !requestsByLine[
            lineId
          ]
        ) {
          requestsByLine[
            lineId
          ] = [];
        }

        requestsByLine[
          lineId
        ].push(
          request
        );
      }
    );

    let repairedLines = 0;
    let clearedCommitments = 0;
    let resolvedReturns = 0;
    const touchedFmrs = {};

    lines.forEach(
      function (
        line
      ) {
        const state =
          lineStateFmrV3_(
            line
          );

        const requests =
          requestsByLine[
            normalizeFmrV3_(
              line.FMR_Line_ID
            )
          ] || [];

        const correlationId =
          uuidFmrV3_(
            'CORR'
          );

        let lineStateChanged =
          false;

        let requestChanged =
          false;

        if (
          state.remaining <= 0 &&
          (
            state.pendingBackorder > 0 ||
            state.confirmedBackorder > 0
          )
        ) {
          const previousPending =
            state.pendingBackorder;

          const previousConfirmed =
            state.confirmedBackorder;

          requests.forEach(
            function (
              request
            ) {
              const pending =
                numberFmrV3_(
                  request.Qty_Pending
                );

              const confirmed =
                numberFmrV3_(
                  request
                    .Qty_Confirmed_Backorder
                );

              const outstanding =
                pending +
                confirmed;

              if (
                outstanding <= 0
              ) {
                return;
              }

              const now =
                nowFmrV3_();

              updateRowObjectFmrV3_(
                FMR_V3.SHEETS
                  .BACKORDERS,
                request._rowNumber,
                {
                  Qty_Pending:
                    0,

                  Qty_Confirmed_Backorder:
                    0,

                  Status:
                    'Fulfilled After Field Completion',

                  Active:
                    FMR_V3.NO,

                  Updated_At:
                    now
                }
              );

              transitionBackorderStatusFmrV3_(
                request,
                line,
                'Fulfilled After Field Completion',
                false,
                now
              );

              appendTransactionFmrV3_(
                line,
                'BACKORDER_CLEARED_BY_FULFILLMENT',
                outstanding,
                user,
                {
                  correlationId:
                    correlationId,

                  backorderRequestId:
                    request
                      .Backorder_Request_ID,

                  performedByName:
                    user.name,

                  notes:
                    'Alpha.6 migration reconciled a completed line with outstanding backorder state.'
                }
              );

              appendAuditFmrV3_(
                'BACKORDER',
                request
                  .Backorder_Request_ID,
                'BACKORDER_CLEARED_BY_FULFILLMENT',
                user,
                correlationId,
                {
                  sourceInterface:
                    'MIGRATION',

                  payload: {
                    previousStatus:
                      request.Status,

                    previousPending:
                      pending,

                    previousConfirmed:
                      confirmed,

                    nextStatus:
                      'Fulfilled After Field Completion'
                  }
                }
              );

              clearedCommitments +=
                outstanding;

              requestChanged =
                true;
            }
          );

          state.pendingBackorder =
            0;

          state.confirmedBackorder =
            0;

          lineStateChanged =
            true;

          appendAuditFmrV3_(
            'FMR_LINE',
            line.FMR_Line_ID,
            'BACKORDER_STATE_REPAIRED',
            user,
            correlationId,
            {
              sourceInterface:
                'MIGRATION',

              payload: {
                previousPending:
                  previousPending,

                previousConfirmed:
                  previousConfirmed,

                nextPending:
                  0,

                nextConfirmed:
                  0
              }
            }
          );
        }

        if (
          state.notYetLocated <= 0
        ) {
          requests.filter(
            function (
              request
            ) {
              return (
                yesFmrV3_(
                  request.Active
                ) &&
                normalizeUpperFmrV3_(
                  request.Status
                ) ===
                  'RETURNED FOR REVIEW'
              );
            }
          ).forEach(
            function (
              request
            ) {
              const outstanding =
                backorderOutstandingReturnedFmrV3_(
                  request
                );

              if (
                outstanding <= 0
              ) {
                return;
              }

              const now =
                nowFmrV3_();

              updateRowObjectFmrV3_(
                FMR_V3.SHEETS
                  .BACKORDERS,
                request._rowNumber,
                {
                  Qty_Pending:
                    0,

                  Status:
                    'Resolved by Field',

                  Active:
                    FMR_V3.NO,

                  Updated_At:
                    now
                }
              );

              transitionBackorderStatusFmrV3_(
                request,
                line,
                'Resolved by Field',
                false,
                now
              );

              appendTransactionFmrV3_(
                line,
                'BACKORDER_RETURN_RESOLVED',
                outstanding,
                user,
                {
                  correlationId:
                    correlationId,

                  backorderRequestId:
                    request
                      .Backorder_Request_ID,

                  performedByName:
                    user.name,

                  notes:
                    'Alpha.6 migration closed a stale returned review after the material was fully located.'
                }
              );

              appendAuditFmrV3_(
                'BACKORDER',
                request
                  .Backorder_Request_ID,
                'BACKORDER_RETURN_RESOLVED_BY_MIGRATION',
                user,
                correlationId,
                {
                  sourceInterface:
                    'MIGRATION',

                  payload: {
                    previousStatus:
                      request.Status,

                    resolvedQuantity:
                      outstanding,

                    nextStatus:
                      'Resolved by Field'
                  }
                }
              );

              resolvedReturns +=
                outstanding;

              requestChanged =
                true;
            }
          );
        }

        if (
          lineStateChanged
        ) {
          updateLineStateFmrV3_(
            line,
            state,
            user
          );

          repairedLines +=
            1;
        }

        if (
          lineStateChanged ||
          requestChanged
        ) {
          touchedFmrs[
            normalizeFmrV3_(
              line.FMR_ID
            )
          ] = {
            fmrId:
              line.FMR_ID,

            fmrNumber:
              line.FMR_Number
          };
        }
      }
    );

    Object.keys(
      touchedFmrs
    ).forEach(
      function (
        fmrId
      ) {
        const target =
          touchedFmrs[
            fmrId
          ];

        refreshHeaderFromIndexedLinesFmrV3_(
          target.fmrId,
          target.fmrNumber,
          user
        );
      }
    );

    SpreadsheetApp.flush();

    const integrity =
      inspectFmrV3DataIntegrity();

    const output = {
      passed:
        integrity.passed,

      migration:
        'ALPHA6_BACKORDER_STATE_INTEGRITY',

      performedBy:
        user.email,

      repairedLines:
        repairedLines,

      clearedCommitments:
        clearedCommitments,

      resolvedReturns:
        resolvedReturns,

      touchedFmrs:
        Object.keys(
          touchedFmrs
        ).length,

      postIntegrity:
        integrity
    };

    console.log(
      JSON.stringify(
        output,
        null,
        2
      )
    );

    if (
      !output.passed
    ) {
      throw new Error(
        'Alpha.6 backorder-state migration completed, but the post-migration integrity diagnostic still failed.'
      );
    }

    return output;
  } finally {
    lock.releaseLock();
  }
}
