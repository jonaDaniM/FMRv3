function getBackorderQueueFmrV3_(
  userEmail
) {
  const user =
    assertSearchUserFmrV3_(
      userEmail
    );

  const statuses = [
    'Pending Admin Review',
    'Partially Confirmed'
  ];

  let entries = [];

  statuses.forEach(
    function (
      status
    ) {
      entries =
        entries.concat(
          lookupOperationalRowsFmrV3_(
            'BACKORDERSTATUS',
            status
          )
        );
    }
  );

  const requests =
    readRowsObjectsFmrV3_(
      FMR_V3.SHEETS
        .BACKORDERS,
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
          )
        )
      )
    ).filter(
      function (
        request
      ) {
        return (
          yesFmrV3_(
            request.Active
          ) &&
          numberFmrV3_(
            request.Qty_Pending
          ) > 0 &&
          statuses
            .map(
              normalizeUpperFmrV3_
            )
            .includes(
              normalizeUpperFmrV3_(
                request.Status
              )
            )
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
    ).map(
      function (
        request
      ) {
        return {
          requestId:
            normalizeFmrV3_(
              request
                .Backorder_Request_ID
            ),

          fmrNumber:
            normalizeFmrV3_(
              request.FMR_Number
            ),

          fmrLineId:
            normalizeFmrV3_(
              request.FMR_Line_ID
            ),

          isoKey:
            normalizeFmrV3_(
              request.ISO_Key
            ),

          commodityCode:
            normalizeFmrV3_(
              request.Commodity_Code
            ),

          qtyRequested:
            numberFmrV3_(
              request
                .Qty_Requested_Backorder
            ),

          qtyConfirmed:
            numberFmrV3_(
              request
                .Qty_Confirmed_Backorder
            ),

          qtyPending:
            numberFmrV3_(
              request.Qty_Pending
            ),

          reason:
            normalizeFmrV3_(
              request.Reason
            ),

          fieldNotes:
            normalizeFmrV3_(
              request.Field_Notes
            ),

          reportedBy:
            normalizeFmrV3_(
              request.Reported_By_Name
            ),

          reportedAt:
            formatDateTimeFmrV3_(
              request.Reported_At
            ),

          status:
            normalizeFmrV3_(
              request.Status
            )
        };
      }
    );

  return {
    generatedAt:
      formatDateTimeFmrV3_(
        nowFmrV3_()
      ),

    user:
      user,

    canReview:
      user.canAdminBackorder,

    count:
      requests.length,

    requests:
      requests
  };
}

function reviewBackorderFmrV3_(
  userEmail,
  request
) {
  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const user =
      assertBackorderAdminFmrV3_(
        userEmail
      );

    const payload =
      request || {};

    const requestId =
      normalizeFmrV3_(
        payload.requestId
      );

    const decision =
      normalizeUpperFmrV3_(
        payload.decision
      );

    if (!requestId) {
      throw new Error(
        'Backorder Request ID is required.'
      );
    }

    if (
      !Object
        .values(
          FMR_V3
            .BACKORDER_DECISIONS
        )
        .includes(
          decision
        )
    ) {
      throw new Error(
        'Unsupported backorder decision: ' +
        decision
      );
    }

    const indexEntries =
      lookupOperationalRowsFmrV3_(
        'BACKORDER',
        requestId
      );

    if (
      !indexEntries.length
    ) {
      throw new Error(
        'Backorder request not found: ' +
        requestId
      );
    }

    const indexEntry =
      indexEntries[0];

    const backorder =
      readRowObjectFmrV3_(
        FMR_V3.SHEETS
          .BACKORDERS,
        indexEntry.Row_Number
      );

    const pending =
      numberFmrV3_(
        backorder.Qty_Pending
      );

    if (
      pending <= 0 ||
      ![
        'PENDING ADMIN REVIEW',
        'PARTIALLY CONFIRMED'
      ].includes(
        normalizeUpperFmrV3_(
          backorder.Status
        )
      )
    ) {
      throw new Error(
        'The backorder request is no longer actionable.'
      );
    }

    const line =
      getLineByIdFmrV3_(
        backorder.FMR_Line_ID
      );

    const state =
      lineStateFmrV3_(
        line
      );

    const now =
      nowFmrV3_();

    const correlationId =
      uuidFmrV3_(
        'CORR'
      );

    const existingConfirmed =
      numberFmrV3_(
        backorder
          .Qty_Confirmed_Backorder
      );

    let nextStatus;
    let confirmedQuantity = 0;
    let requestPendingAfter =
      pending;
    let transactionType;
    let keepOperational = true;
    let splitReturnedQuantity = 0;
    let splitReturnedRequestId = '';
    let transactionRequestId =
      requestId;

    if (
      decision ===
      FMR_V3
        .BACKORDER_DECISIONS
        .CONFIRM
    ) {
      confirmedQuantity =
        positiveNumberFmrV3_(
          payload.quantity,
          'Confirmed quantity'
        );

      const maximumConfirmable =
        Math.min(
          pending,
          Math.max(
            0,
            numberFmrV3_(
              state.pendingBackorder
            )
          ),
          Math.max(
            0,
            numberFmrV3_(
              state.notYetLocated
            ) -
            numberFmrV3_(
              state.confirmedBackorder
            )
          )
        );

      if (
        confirmedQuantity >
        maximumConfirmable
      ) {
        throw new Error(
          'Only ' +
          maximumConfirmable +
          ' can be confirmed without exceeding the unresolved requirement.'
        );
      }

      requestPendingAfter =
        pending -
        confirmedQuantity;

      state.pendingBackorder -=
        confirmedQuantity;

      state.confirmedBackorder +=
        confirmedQuantity;

      nextStatus =
        requestPendingAfter > 0
          ? 'Partially Confirmed'
          : 'Confirmed';

      transactionType =
        'BACKORDER_CONFIRMED';

      keepOperational =
        true;
    } else if (
      decision ===
      FMR_V3
        .BACKORDER_DECISIONS
        .REJECT
    ) {
      state.pendingBackorder -=
        pending;

      requestPendingAfter =
        0;

      nextStatus =
        existingConfirmed > 0
          ? 'Confirmed'
          : 'Rejected';

      transactionType =
        'BACKORDER_REJECTED';

      keepOperational =
        existingConfirmed > 0;
    } else {
      state.pendingBackorder -=
        pending;

      if (
        existingConfirmed > 0
      ) {
        /**
         * Preserve the confirmed portion on the
         * original request and split the returned
         * remainder into a separately indexed
         * operational request.
         */
        requestPendingAfter =
          0;

        nextStatus =
          'Confirmed';

        keepOperational =
          true;

        splitReturnedQuantity =
          pending;
      } else {
        requestPendingAfter =
          pending;

        nextStatus =
          'Returned for Review';

        keepOperational =
          true;
      }

      transactionType =
        'BACKORDER_RETURNED';
    }

    updateRowObjectFmrV3_(
      FMR_V3.SHEETS
        .BACKORDERS,
      backorder._rowNumber,
      {
        Qty_Confirmed_Backorder:
          existingConfirmed +
          confirmedQuantity,

        Qty_Pending:
          requestPendingAfter,

        Status:
          nextStatus,

        Admin_Decision:
          decision,

        Admin_Notes:
          normalizeFmrV3_(
            payload.notes
          ),

        Decided_By_Email:
          user.email,

        Decided_By_Name:
          user.name,

        Decided_At:
          now,

        Returned_Review_Reason:
          (
            decision ===
              FMR_V3
                .BACKORDER_DECISIONS
                .RETURN &&
            splitReturnedQuantity <= 0
          )
            ? normalizeFmrV3_(
                payload.notes
              )
            : '',

        Active:
          keepOperational
            ? FMR_V3.YES
            : FMR_V3.NO,

        Updated_At:
          now
      }
    );

    transitionBackorderStatusFmrV3_(
      backorder,
      line,
      nextStatus,
      keepOperational,
      now
    );

    if (
      splitReturnedQuantity > 0
    ) {
      splitReturnedRequestId =
        uuidFmrV3_(
          'BACKORDER'
        );

      const splitRow =
        appendObjectFmrV3_(
          FMR_V3.SHEETS
            .BACKORDERS,
          {
            Backorder_Request_ID:
              splitReturnedRequestId,

            Correlation_ID:
              correlationId,

            FMR_ID:
              line.FMR_ID,

            FMR_Number:
              line.FMR_Number,

            FMR_Line_ID:
              line.FMR_Line_ID,

            ISO_Key:
              line.ISO_Key,

            Commodity_Code:
              line.Commodity_Code,

            Qty_Requested_Backorder:
              splitReturnedQuantity,

            Qty_Confirmed_Backorder:
              0,

            Qty_Pending:
              splitReturnedQuantity,

            Reason:
              backorder.Reason,

            Field_Notes:
              backorder.Field_Notes,

            Reported_By_Email:
              backorder.Reported_By_Email,

            Reported_By_Name:
              backorder.Reported_By_Name,

            Reported_At:
              backorder.Reported_At,

            Status:
              'Returned for Review',

            Admin_Decision:
              decision,

            Admin_Notes:
              normalizeFmrV3_(
                payload.notes
              ),

            Decided_By_Email:
              user.email,

            Decided_By_Name:
              user.name,

            Decided_At:
              now,

            Returned_Review_Reason:
              normalizeFmrV3_(
                payload.notes
              ),

            Active:
              FMR_V3.YES,

            Updated_At:
              now
          }
        );

      appendOperationalIndexEntriesFmrV3_([
        {
          Index_Key:
            operationalIndexKeyFmrV3_(
              'BACKORDER',
              splitReturnedRequestId
            ),

          Index_Type:
            'BACKORDER',

          Entity_ID:
            splitReturnedRequestId,

          Parent_ID:
            line.FMR_Line_ID,

          Row_Number:
            splitRow,

          Secondary_Row_Number:
            line._rowNumber,

          Active:
            FMR_V3.YES,

          Updated_At:
            now
        },
        {
          Index_Key:
            operationalIndexKeyFmrV3_(
              'BACKORDERSTATUS',
              'Returned for Review'
            ),

          Index_Type:
            'BACKORDERSTATUS',

          Entity_ID:
            splitReturnedRequestId,

          Parent_ID:
            line.FMR_Line_ID,

          Row_Number:
            splitRow,

          Secondary_Row_Number:
            line._rowNumber,

          Active:
            FMR_V3.YES,

          Updated_At:
            now
        },
        {
          Index_Key:
            operationalIndexKeyFmrV3_(
              'BACKORDERLINE',
              line.FMR_Line_ID
            ),

          Index_Type:
            'BACKORDERLINE',

          Entity_ID:
            splitReturnedRequestId,

          Parent_ID:
            line.FMR_Line_ID,

          Row_Number:
            splitRow,

          Secondary_Row_Number:
            line._rowNumber,

          Active:
            FMR_V3.YES,

          Updated_At:
            now
        }
      ]);

      transactionRequestId =
        splitReturnedRequestId;

      appendAuditFmrV3_(
        'BACKORDER',
        splitReturnedRequestId,
        'BACKORDER_RETURN_SPLIT_CREATED',
        user,
        correlationId,
        {
          sourceInterface:
            'ADMIN',

          payload: {
            parentRequestId:
              requestId,

            returnedQuantity:
              splitReturnedQuantity,

            reason:
              normalizeFmrV3_(
                payload.notes
              )
          }
        }
      );
    }

    updateLineStateFmrV3_(
      line,
      state,
      user
    );

    refreshHeaderFromIndexedLinesFmrV3_(
      line.FMR_ID,
      line.FMR_Number,
      user
    );

    appendTransactionFmrV3_(
      line,
      transactionType,
      confirmedQuantity ||
      pending,
      user,
      {
        correlationId:
          correlationId,

        backorderRequestId:
          transactionRequestId,

        performedByName:
          user.name,

        notes:
          normalizeFmrV3_(
            payload.notes
          )
      }
    );

    appendAuditFmrV3_(
      'BACKORDER',
      requestId,
      'BACKORDER_' +
        decision,
      user,
      correlationId,
      {
        sourceInterface:
          'ADMIN',

        payload: {
          previousStatus:
            backorder.Status,

          nextStatus:
            nextStatus,

          confirmedQuantity:
            confirmedQuantity,

          requestPendingAfter:
            requestPendingAfter,

          linePendingAfter:
            state.pendingBackorder,

          lineConfirmedAfter:
            state.confirmedBackorder,

          operational:
            keepOperational,

          splitReturnedRequestId:
            splitReturnedRequestId,

          splitReturnedQuantity:
            splitReturnedQuantity,

          notes:
            normalizeFmrV3_(
              payload.notes
            )
        }
      }
    );

    SpreadsheetApp.flush();

    return {
      success:
        true,

      requestId:
        requestId,

      decision:
        decision,

      status:
        nextStatus,

      qtyConfirmed:
        confirmedQuantity,

      qtyPending:
        requestPendingAfter,

      operational:
        keepOperational,

      splitReturnedRequestId:
        splitReturnedRequestId,

      splitReturnedQuantity:
        splitReturnedQuantity
    };
  } finally {
    lock.releaseLock();
  }
}

function getReturnedBackordersByLineIdsFmrV3_(
  lineIds
) {
  const result = {};

  (
    lineIds || []
  ).forEach(
    function (
      lineId
    ) {
      const normalizedLineId =
        normalizeFmrV3_(
          lineId
        );

      result[
        normalizedLineId
      ] = [];

      const entries =
        lookupOperationalRowsFmrV3_(
          'BACKORDERLINE',
          normalizedLineId
        );

      if (
        !entries.length
      ) {
        return;
      }

      result[
        normalizedLineId
      ] =
        readRowsObjectsFmrV3_(
          FMR_V3.SHEETS
            .BACKORDERS,
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
              )
            )
          )
        ).filter(
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
        ).map(
          function (
            request
          ) {
            return {
              requestId:
                normalizeFmrV3_(
                  request
                    .Backorder_Request_ID
                ),

              quantity:
                backorderOutstandingReturnedFmrV3_(
                  request
                ),

              reason:
                normalizeFmrV3_(
                  request
                    .Returned_Review_Reason ||
                  request.Admin_Notes
                ),

              updatedAt:
                formatDateTimeFmrV3_(
                  request.Updated_At
                )
            };
          }
        );
    }
  );

  return result;
}
