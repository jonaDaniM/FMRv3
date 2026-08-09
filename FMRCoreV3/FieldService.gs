function getFieldBootstrapFmrV3_(userEmail) {
  const user =
    assertSearchUserFmrV3_(
      userEmail
    );

  return {
    version:
      FMR_V3.VERSION,

    user:
      user,

    options: {
      backorderReasons:
        getListValuesFmrV3_(
          'BACKORDER_REASON'
        ),

      uoms:
        getListValuesFmrV3_(
          'UOM'
        ),

      storageLocations:
        configuredStorageLocationsFmrV3_()
    },

    metadataPolicy: {
      authenticatedPerformer:
        true,

      storageLocationMode:
        'FREE_TEXT_WITH_SUGGESTIONS',

      storageLocationRequiredFor: [
        FMR_V3.ACTIONS
          .CONFIRM_AVAILABLE,

        FMR_V3.ACTIONS.BAG
      ],

      storageLocationOptionalFor: [
        FMR_V3.ACTIONS
          .DIRECT_ISSUE
      ],

      storageLocationMaximumLength:
        FMR_V3_FIELD_METADATA
          .storageMaximumLength,

      notesMaximumLength:
        FMR_V3_FIELD_METADATA
          .notesMaximumLength
    }
  };
}
function lineStateFmrV3_(line) {
  return {
    requested: numberFmrV3_(line.Qty_Requested),
    confirmed: numberFmrV3_(line.Qty_Confirmed_Located),
    bagged: numberFmrV3_(line.Qty_Active_Bagged),
    available: numberFmrV3_(line.Qty_Available),
    issued: numberFmrV3_(line.Qty_Issued),
    pendingBackorder: numberFmrV3_(line.Qty_Pending_Backorder),
    confirmedBackorder: numberFmrV3_(line.Qty_Confirmed_Backorder),
    notYetLocated: numberFmrV3_(line.Qty_Not_Yet_Located),
    remaining: numberFmrV3_(line.Qty_Remaining_Requirement)
  };
}

function calculateLineStatusFmrV3_(state) {
  if (state.remaining <= 0 && state.requested > 0) return 'Issued';
  if (state.issued > 0) return 'Partially Issued';
  if (state.confirmedBackorder > 0) return 'Backordered';
  if (state.pendingBackorder > 0) return 'Pending Backorder';
  if (state.bagged >= state.requested && state.requested > 0) return 'Bagged';
  if (state.bagged > 0) return 'Partially Bagged';
  if (state.confirmed >= state.requested && state.requested > 0) return 'Located';
  if (state.confirmed > 0) return 'Partially Located';
  return 'Open';
}

function updateLineStateFmrV3_(line, state, user, extraPatch) {
  return updateRowObjectFmrV3_(
    FMR_V3.SHEETS.LINES,
    line._rowNumber,
    Object.assign({
      Qty_Confirmed_Located: Math.max(0, state.confirmed),
      Qty_Active_Bagged: Math.max(0, state.bagged),
      Qty_Available: Math.max(0, state.available),
      Qty_Issued: Math.max(0, state.issued),
      Qty_Pending_Backorder: Math.max(0, state.pendingBackorder),
      Qty_Confirmed_Backorder: Math.max(0, state.confirmedBackorder),
      Qty_Not_Yet_Located: Math.max(0, state.notYetLocated),
      Qty_Remaining_Requirement: Math.max(0, state.remaining),
      Line_Status: calculateLineStatusFmrV3_(state),
      Updated_By: user.email,
      Updated_At: nowFmrV3_()
    }, extraPatch || {})
  );
}

function appendTransactionFmrV3_(
  line,
  transactionType,
  quantity,
  user,
  details
) {
  const data = details || {};

  return appendObjectFmrV3_(FMR_V3.SHEETS.TRANSACTIONS, {
    Transaction_ID: uuidFmrV3_('TXN'),
    Correlation_ID: normalizeFmrV3_(data.correlationId),
    FMR_ID: line.FMR_ID,
    FMR_Number: line.FMR_Number,
    FMR_Line_ID: line.FMR_Line_ID,
    Transaction_Type: normalizeUpperFmrV3_(transactionType),
    Quantity: quantity,
    UOM: line.UOM,
    Authenticated_Email: user.email,
    Performed_By_Name: normalizeFmrV3_(data.performedByName || user.name),
    Issued_To_Name: normalizeFmrV3_(data.issuedToName),
    Source_Bag_Tag_ID: normalizeFmrV3_(data.sourceBagTagId),
    Target_Bag_Tag_ID: normalizeFmrV3_(data.targetBagTagId),
    Storage_Location: normalizeFmrV3_(data.storageLocation),
    Backorder_Request_ID: normalizeFmrV3_(data.backorderRequestId),
    Timestamp: nowFmrV3_(),
    Notes: normalizeFmrV3_(data.notes)
  });
}

function finishLineActionFmrV3_(
  user,
  line,
  state,
  action,
  correlationId,
  details,
  extraPatch
) {
  const actionDetails =
    details || {};

  const updatedLine =
    updateLineStateFmrV3_(
      line,
      state,
      user,
      extraPatch
    );

  refreshHeaderFromIndexedLinesFmrV3_(
    line.FMR_ID,
    line.FMR_Number,
    user
  );

  appendAuditFmrV3_(
    'FMR_LINE',
    line.FMR_Line_ID,
    action,
    user,
    correlationId,
    {
      sourceInterface:
        'FIELD',

      payload:
        actionDetails
    }
  );

  const rejectedResolution =
    resolveRejectedFieldNotificationsFmrV3_(
      line,
      numberFmrV3_(
        actionDetails
          .rejectedNoticeResolutionQuantity
      ),
      user,
      correlationId,
      action
    );

  syncFieldNotificationsForLineFmrV3_(
    line
  );

  SpreadsheetApp.flush();

  const activeBags =
    getActiveBagsByLineIdsFmrV3_(
      [
        line.FMR_Line_ID
      ]
    )[
      line.FMR_Line_ID
    ] || [];

  const returnedBackorders =
    getReturnedBackordersByLineIdsFmrV3_(
      [
        line.FMR_Line_ID
      ]
    )[
      line.FMR_Line_ID
    ] || [];

  const backorderNotices =
    getFieldBackorderNoticesByLineIdsFmrV3_(
      [
        line.FMR_Line_ID
      ]
    )[
      line.FMR_Line_ID
    ] || [];

  return {
    success:
      true,

    action:
      action,

    correlationId:
      correlationId,

    message:
      normalizeFmrV3_(
        actionDetails.message
      ) ||
      (
        action +
        ' completed.'
      ),

    rejectedNoticeResolution:
      rejectedResolution,

    line:
      serializeLineForPortalFmrV3_(
        updatedLine,
        activeBags,
        returnedBackorders,
        backorderNotices
      )
  };
}
function performFieldActionFmrV3_(
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
      assertFieldUserFmrV3_(
        userEmail
      );

    const rawPayload =
      request || {};

    const action =
      normalizeUpperFmrV3_(
        rawPayload.action
      );

    const line =
      getLineByIdFmrV3_(
        rawPayload.fmrLineId
      );

    if (
      !yesFmrV3_(
        line.Active
      )
    ) {
      throw new Error(
        'The selected FMR line is inactive.'
      );
    }

    const payload =
      normalizeFieldActionMetadataFmrV3_(
        user,
        action,
        rawPayload
      );

    switch (
      action
    ) {
      case FMR_V3.ACTIONS
        .CONFIRM_AVAILABLE:
        return confirmAvailableFmrV3_(
          user,
          line,
          payload
        );

      case FMR_V3.ACTIONS.BAG:
        return bagMaterialFmrV3_(
          user,
          line,
          payload
        );

      case FMR_V3.ACTIONS
        .DIRECT_ISSUE:
        return directIssueFmrV3_(
          user,
          line,
          payload
        );

      case FMR_V3.ACTIONS
        .ISSUE_FROM_AVAILABLE:
        return issueAvailableFmrV3_(
          user,
          line,
          payload
        );

      case FMR_V3.ACTIONS
        .ISSUE_FROM_BAG:
        return issueFromBagFmrV3_(
          user,
          line,
          payload
        );

      case FMR_V3.ACTIONS
        .BACKORDER_REQUESTED:
        return submitBackorderFmrV3_(
          user,
          line,
          payload
        );

      default:
        throw new Error(
          'Unsupported Field action: ' +
          action
        );
    }
  } finally {
    lock.releaseLock();
  }
}




function confirmAvailableFmrV3_(
  user,
  line,
  request
) {
  const quantity =
    positiveNumberFmrV3_(
      request.quantity,
      'Confirmed quantity'
    );

  const state =
    lineStateFmrV3_(
      line
    );

  const maximum =
    fieldLocatableQuantityFmrV3_(
      state
    );

  if (
    quantity >
    maximum
  ) {
    throw new Error(
      'Only ' +
      maximum +
      ' can be newly confirmed while pending backorders remain locked.'
    );
  }

  const correlationId =
    uuidFmrV3_(
      'CORR'
    );

  const transitionPlan =
    planLocationBackorderTransitionsFmrV3_(
      line,
      state,
      quantity
    );

  state.confirmed +=
    quantity;

  state.available +=
    quantity;

  state.notYetLocated -=
    quantity;

  applyLocationBackorderTransitionsFmrV3_(
    line,
    state,
    transitionPlan,
    user,
    correlationId,
    'CONFIRM_AVAILABLE'
  );

  appendTransactionFmrV3_(
    line,
    'CONFIRM_AVAILABLE',
    quantity,
    user,
    {
      correlationId:
        correlationId,

      performedByName:
        request.performedByName,

      storageLocation:
        request.storageLocation,

      notes:
        request.notes
    }
  );

  return finishLineActionFmrV3_(
    user,
    line,
    state,
    'CONFIRM_AVAILABLE',
    correlationId,
    {
      quantity:
        quantity,

      rejectedNoticeResolutionQuantity:
        quantity,

      confirmedBackorderFulfilled:
        transitionPlan
          .confirmedConsumed,

      returnedReviewResolved:
        transitionPlan
          .returnedResolved,

      message:
        quantity +
        ' ' +
        line.UOM +
        ' confirmed available.'
    },
    {
      Storage_Location:
        normalizeFmrV3_(
          request
            .storageLocation ||
          line.Storage_Location
        )
    }
  );
}

function directIssueFmrV3_(
  user,
  line,
  request
) {
  const quantity =
    positiveNumberFmrV3_(
      request.quantity,
      'Issue quantity'
    );

  const issuedTo =
    normalizeFmrV3_(
      request.issuedToName
    );

  if (!issuedTo) {
    throw new Error(
      'Issued To is required.'
    );
  }

  const state =
    lineStateFmrV3_(
      line
    );

  const maximum =
    Math.min(
      fieldLocatableQuantityFmrV3_(
        state
      ),
      Math.max(
        0,
        state.remaining
      )
    );

  if (
    quantity >
    maximum
  ) {
    throw new Error(
      'Only ' +
      maximum +
      ' can be located and issued directly.'
    );
  }

  const correlationId =
    uuidFmrV3_(
      'CORR'
    );

  const transitionPlan =
    planLocationBackorderTransitionsFmrV3_(
      line,
      state,
      quantity
    );

  state.confirmed +=
    quantity;

  state.issued +=
    quantity;

  state.notYetLocated -=
    quantity;

  state.remaining -=
    quantity;

  applyLocationBackorderTransitionsFmrV3_(
    line,
    state,
    transitionPlan,
    user,
    correlationId,
    'DIRECT_ISSUE'
  );

  appendTransactionFmrV3_(
    line,
    'DIRECT_ISSUE',
    quantity,
    user,
    {
      correlationId:
        correlationId,

      issuedToName:
        issuedTo,

      performedByName:
        request.performedByName,

      storageLocation:
        request.storageLocation,

      notes:
        request.notes
    }
  );

  return finishLineActionFmrV3_(
    user,
    line,
    state,
    'DIRECT_ISSUE',
    correlationId,
    {
      quantity:
        quantity,

      rejectedNoticeResolutionQuantity:
        quantity,

      issuedTo:
        issuedTo,

      confirmedBackorderFulfilled:
        transitionPlan
          .confirmedConsumed,

      returnedReviewResolved:
        transitionPlan
          .returnedResolved,

      message:
        quantity +
        ' ' +
        line.UOM +
        ' located and issued to ' +
        issuedTo +
        '.'
    }
  );
}

function issueAvailableFmrV3_(
  user,
  line,
  request
) {
  const quantity =
    positiveNumberFmrV3_(
      request.quantity,
      'Issue quantity'
    );

  const issuedTo =
    normalizeFmrV3_(
      request.issuedToName
    );

  if (!issuedTo) {
    throw new Error(
      'Issued To is required.'
    );
  }

  const state =
    lineStateFmrV3_(
      line
    );

  const maximum =
    Math.min(
      Math.max(
        0,
        state.available
      ),
      Math.max(
        0,
        state.remaining
      )
    );

  if (
    quantity >
    maximum
  ) {
    throw new Error(
      'Only ' +
      maximum +
      ' is available within the remaining requirement.'
    );
  }

  state.available -=
    quantity;

  state.issued +=
    quantity;

  state.remaining -=
    quantity;

  const correlationId =
    uuidFmrV3_(
      'CORR'
    );

  appendTransactionFmrV3_(
    line,
    'ISSUE_FROM_AVAILABLE',
    quantity,
    user,
    {
      correlationId:
        correlationId,

      issuedToName:
        issuedTo,

      performedByName:
        request.performedByName,

      notes:
        request.notes
    }
  );

  return finishLineActionFmrV3_(
    user,
    line,
    state,
    'ISSUE_FROM_AVAILABLE',
    correlationId,
    {
      quantity:
        quantity,

      issuedTo:
        issuedTo,

      message:
        quantity +
        ' ' +
        line.UOM +
        ' issued to ' +
        issuedTo +
        '.'
    }
  );
}

function nextTagNumberFmrV3_() {
  const configuration = getConfigurationFmrV3_();
  const prefix = normalizeUpperFmrV3_(configuration.TAG_PREFIX) || 'BT';
  const year = normalizeFmrV3_(configuration.CURRENT_YEAR) ||
    String(nowFmrV3_().getFullYear());
  const sequence = Math.max(
    1,
    numberFmrV3_(configuration.NEXT_TAG_SEQUENCE) || 1
  );

  const tagNumber = `${prefix}-${year}-${String(sequence).padStart(5, '0')}`;
  const settingRows = findRowsByExactValueFmrV3_(
    FMR_V3.SHEETS.CONFIG,
    1,
    'NEXT_TAG_SEQUENCE'
  );

  if (!settingRows.length) {
    throw new Error('NEXT_TAG_SEQUENCE is missing from Configuration.');
  }

  updateRowObjectFmrV3_(
    FMR_V3.SHEETS.CONFIG,
    settingRows[0],
    {Value: sequence + 1}
  );

  invalidateConfigurationCacheFmrV3_();
  return tagNumber;
}





function bagMaterialFmrV3_(
  user,
  line,
  request
) {
  const quantity =
    positiveNumberFmrV3_(
      request.quantity,
      'Bag quantity'
    );

  const state =
    lineStateFmrV3_(
      line
    );

  const maximum =
    fieldReservableQuantityFmrV3_(
      state
    );

  if (
    quantity >
    maximum
  ) {
    throw new Error(
      'Only ' +
      maximum +
      ' can be reserved while pending backorders remain locked.'
    );
  }

  const storageLocation =
    normalizeFmrV3_(
      request.storageLocation ||
      line.Storage_Location
    );

  if (
    !storageLocation
  ) {
    throw new Error(
      'Storage Location is required.'
    );
  }

  const newlyLocated =
    Math.max(
      0,
      quantity -
      state.available
    );

  const correlationId =
    uuidFmrV3_(
      'CORR'
    );

  const transitionPlan =
    planLocationBackorderTransitionsFmrV3_(
      line,
      state,
      newlyLocated
    );

  state.confirmed +=
    newlyLocated;

  state.available +=
    newlyLocated;

  state.available -=
    quantity;

  state.bagged +=
    quantity;

  state.notYetLocated -=
    newlyLocated;

  if (
    newlyLocated > 0
  ) {
    appendTransactionFmrV3_(
      line,
      'CONFIRM_AVAILABLE',
      newlyLocated,
      user,
      {
        correlationId:
          correlationId,

        performedByName:
          request.performedByName,

        storageLocation:
          storageLocation,

        notes:
          'Located during Bag & Tag.'
      }
    );
  }

  const bagTagId =
    uuidFmrV3_(
      'BAG'
    );

  const tagNumber =
    nextTagNumberFmrV3_();

  const now =
    nowFmrV3_();

  const bagHeaderRow =
    appendObjectFmrV3_(
      FMR_V3.SHEETS
        .BAG_HEADERS,
      {
        Bag_Tag_ID:
          bagTagId,

        Tag_Number:
          tagNumber,

        FMR_ID:
          line.FMR_ID,

        FMR_Number:
          line.FMR_Number,

        ISO_Key:
          line.ISO_Key,

        Storage_Location:
          storageLocation,

        Bagged_By_Name:
          normalizeFmrV3_(
            request
              .performedByName ||
            user.name
          ),

        Authenticated_Email:
          user.email,

        Bagged_At:
          now,

        Status:
          'Active',

        Notes:
          normalizeFmrV3_(
            request.notes
          ),

        Updated_At:
          now
      }
    );

  const bagItemId =
    uuidFmrV3_(
      'BAGITEM'
    );

  const bagItemRow =
    appendObjectFmrV3_(
      FMR_V3.SHEETS
        .BAG_ITEMS,
      {
        Bag_Tag_Item_ID:
          bagItemId,

        Bag_Tag_ID:
          bagTagId,

        Tag_Number:
          tagNumber,

        FMR_Line_ID:
          line.FMR_Line_ID,

        Commodity_Code:
          line.Commodity_Code,

        Size:
          line.Size,

        Material_Description:
          line.Material_Description,

        Qty_Bagged:
          quantity,

        Qty_Issued_From_Bag:
          0,

        Qty_Remaining_In_Bag:
          quantity,

        UOM:
          line.UOM,

        Status:
          'Active',

        Created_At:
          now,

        Updated_At:
          now
      }
    );

  appendOperationalIndexEntriesFmrV3_([
    {
      Index_Key:
        operationalIndexKeyFmrV3_(
          'BAG',
          bagTagId
        ),

      Index_Type:
        'BAG',

      Entity_ID:
        bagTagId,

      Parent_ID:
        line.FMR_Line_ID,

      Row_Number:
        bagHeaderRow,

      Secondary_Row_Number:
        bagItemRow,

      Active:
        FMR_V3.YES,

      Updated_At:
        now
    },
    {
      Index_Key:
        operationalIndexKeyFmrV3_(
          'BAGLINE',
          line.FMR_Line_ID
        ),

      Index_Type:
        'BAGLINE',

      Entity_ID:
        bagItemId,

      Parent_ID:
        bagTagId,

      Row_Number:
        bagItemRow,

      Secondary_Row_Number:
        bagHeaderRow,

      Active:
        FMR_V3.YES,

      Updated_At:
        now
    },
    {
      Index_Key:
        operationalIndexKeyFmrV3_(
          'BAGSTATUS',
          'ACTIVE'
        ),

      Index_Type:
        'BAGSTATUS',

      Entity_ID:
        bagTagId,

      Parent_ID:
        line.FMR_Line_ID,

      Row_Number:
        bagHeaderRow,

      Secondary_Row_Number:
        bagItemRow,

      Active:
        FMR_V3.YES,

      Updated_At:
        now
    }
  ]);

  applyLocationBackorderTransitionsFmrV3_(
    line,
    state,
    transitionPlan,
    user,
    correlationId,
    'BAG'
  );

  appendTransactionFmrV3_(
    line,
    'BAG',
    quantity,
    user,
    {
      correlationId:
        correlationId,

      performedByName:
        request.performedByName,

      targetBagTagId:
        bagTagId,

      storageLocation:
        storageLocation,

      notes:
        request.notes
    }
  );

  return finishLineActionFmrV3_(
    user,
    line,
    state,
    'BAG',
    correlationId,
    {
      quantity:
        quantity,

      rejectedNoticeResolutionQuantity:
        newlyLocated,

      tagNumber:
        tagNumber,

      storageLocation:
        storageLocation,

      confirmedBackorderFulfilled:
        transitionPlan
          .confirmedConsumed,

      returnedReviewResolved:
        transitionPlan
          .returnedResolved,

      message:
        quantity +
        ' ' +
        line.UOM +
        ' reserved under ' +
        tagNumber +
        '.'
    },
    {
      Storage_Location:
        storageLocation
    }
  );
}






/**
 * Alpha 30.2 COMPLETE REPLACEMENT FUNCTION
 *
 * Replace the existing getActiveBagsByLineIdsFmrV3_ definition in
 * FMRCoreV3/FieldService.gs with this entire function.
 */
function getActiveBagsByLineIdsFmrV3_(
  lineIds
) {
  const result = {};

  const normalizedLineIds =
    normalizeBatchLookupValuesFmrV3_(
      lineIds
    );

  normalizedLineIds.forEach(
    function (
      lineId
    ) {
      result[
        lineId
      ] = [];
    }
  );

  if (
    !normalizedLineIds.length
  ) {
    return result;
  }

  /**
   * For one/few lines this retains the existing cached Operational_Index
   * lookup. For a multi-line FMR, Alpha 30.2 resolves every BAGLINE key in one
   * batched index pass.
   */
  const entriesByLine =
    lookupOperationalRowsForValuesFmrV3_(
      'BAGLINE',
      normalizedLineIds
    );

  const allEntries = [];

  normalizedLineIds.forEach(
    function (
      lineId
    ) {
      allEntries.push.apply(
        allEntries,
        entriesByLine[
          lineId
        ] ||
        []
      );
    }
  );

  if (
    !allEntries.length
  ) {
    return result;
  }

  const itemRows =
    Array.from(
      new Set(
        allEntries
          .map(
            function (
              entry
            ) {
              return numberFmrV3_(
                entry.Row_Number
              );
            }
          )
          .filter(
            function (
              row
            ) {
              return row >=
                2;
            }
          )
      )
    );

  const headerRows =
    Array.from(
      new Set(
        allEntries
          .map(
            function (
              entry
            ) {
              return numberFmrV3_(
                entry.Secondary_Row_Number
              );
            }
          )
          .filter(
            function (
              row
            ) {
              return row >=
                2;
            }
          )
      )
    );

  const items =
    readRowsObjectsFmrV3_(
      FMR_V3.SHEETS
        .BAG_ITEMS,
      itemRows
    );

  const headers =
    readRowsObjectsFmrV3_(
      FMR_V3.SHEETS
        .BAG_HEADERS,
      headerRows
    );

  const itemsByRow = {};

  items.forEach(
    function (
      item
    ) {
      itemsByRow[
        numberFmrV3_(
          item._rowNumber
        )
      ] =
        item;
    }
  );

  const headersByRow = {};

  headers.forEach(
    function (
      header
    ) {
      headersByRow[
        numberFmrV3_(
          header._rowNumber
        )
      ] =
        header;
    }
  );

  normalizedLineIds.forEach(
    function (
      lineId
    ) {
      result[
        lineId
      ] =
        (
          entriesByLine[
            lineId
          ] ||
          []
        )
          .map(
            function (
              entry
            ) {
              const item =
                itemsByRow[
                  numberFmrV3_(
                    entry.Row_Number
                  )
                ];

              const header =
                headersByRow[
                  numberFmrV3_(
                    entry.Secondary_Row_Number
                  )
                ];

              if (
                !item ||
                !header
              ) {
                return null;
              }

              /**
               * Defensive parity check: do not let a stale Operational_Index
               * row surface a bag item belonging to another FMR line.
               */
              if (
                normalizeFmrV3_(
                  item.FMR_Line_ID
                ) !==
                lineId
              ) {
                return null;
              }

              const remaining =
                numberFmrV3_(
                  item
                    .Qty_Remaining_In_Bag
                );

              if (
                remaining <=
                  0 ||
                ![
                  'ACTIVE',
                  'PARTIALLY ISSUED'
                ].includes(
                  normalizeUpperFmrV3_(
                    header.Status
                  )
                )
              ) {
                return null;
              }

              return {
                bagTagId:
                  normalizeFmrV3_(
                    header
                      .Bag_Tag_ID
                  ),

                bagTagItemId:
                  normalizeFmrV3_(
                    item
                      .Bag_Tag_Item_ID
                  ),

                tagNumber:
                  normalizeFmrV3_(
                    header
                      .Tag_Number
                  ),

                storageLocation:
                  normalizeFmrV3_(
                    header
                      .Storage_Location
                  ),

                qtyRemaining:
                  remaining,

                uom:
                  normalizeFmrV3_(
                    item.UOM
                  ),

                status:
                  normalizeFmrV3_(
                    header.Status
                  )
              };
            }
          )
          .filter(Boolean);
    }
  );

  return result;
}

function issueFromBagFmrV3_(
  user,
  line,
  request
) {
  const quantity =
    positiveNumberFmrV3_(
      request.quantity,
      'Issue quantity'
    );

  const issuedTo =
    normalizeFmrV3_(
      request.issuedToName
    );

  const bagTagId =
    normalizeFmrV3_(
      request.bagTagId
    );

  if (!issuedTo) {
    throw new Error(
      'Issued To is required.'
    );
  }

  if (!bagTagId) {
    throw new Error(
      'Bag Tag is required.'
    );
  }

  const entries =
    lookupOperationalRowsFmrV3_(
      'BAGLINE',
      line.FMR_Line_ID
    );

  const matchingEntry =
    entries.find(
      function (
        entry
      ) {
        return (
          normalizeFmrV3_(
            entry.Parent_ID
          ) ===
          bagTagId
        );
      }
    );

  if (
    !matchingEntry
  ) {
    throw new Error(
      'The selected bag is not active for this line.'
    );
  }

  const item =
    readRowObjectFmrV3_(
      FMR_V3.SHEETS
        .BAG_ITEMS,
      matchingEntry.Row_Number
    );

  const header =
    readRowObjectFmrV3_(
      FMR_V3.SHEETS
        .BAG_HEADERS,
      matchingEntry
        .Secondary_Row_Number
    );

  const state =
    lineStateFmrV3_(
      line
    );

  const remainingInBag =
    numberFmrV3_(
      item.Qty_Remaining_In_Bag
    );

  const maximum =
    Math.min(
      remainingInBag,
      Math.max(
        0,
        state.remaining
      )
    );

  if (
    quantity >
    maximum
  ) {
    throw new Error(
      'Only ' +
      maximum +
      ' remains issuable from ' +
      header.Tag_Number +
      '.'
    );
  }

  const itemRemaining =
    remainingInBag -
    quantity;

  updateRowObjectFmrV3_(
    FMR_V3.SHEETS
      .BAG_ITEMS,
    item._rowNumber,
    {
      Qty_Issued_From_Bag:
        numberFmrV3_(
          item
            .Qty_Issued_From_Bag
        ) +
        quantity,

      Qty_Remaining_In_Bag:
        itemRemaining,

      Status:
        itemRemaining > 0
          ? 'Partially Issued'
          : 'Issued',

      Updated_At:
        nowFmrV3_()
    }
  );

  updateRowObjectFmrV3_(
    FMR_V3.SHEETS
      .BAG_HEADERS,
    header._rowNumber,
    {
      Status:
        itemRemaining > 0
          ? 'Partially Issued'
          : 'Issued',

      Updated_At:
        nowFmrV3_()
    }
  );

  if (
    itemRemaining <= 0
  ) {
    updateRowObjectFmrV3_(
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX,
      matchingEntry._rowNumber,
      {
        Active:
          FMR_V3.NO,

        Updated_At:
          nowFmrV3_()
      }
    );

    invalidateIndexKeyFmrV3_(
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX,
      operationalIndexKeyFmrV3_(
        'BAGLINE',
        line.FMR_Line_ID
      )
    );

    deactivateExactIndexRowsFmrV3_(
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX,
      operationalIndexKeyFmrV3_(
        'BAGSTATUS',
        'ACTIVE'
      ),
      bagTagId
    );
  }

  state.bagged -=
    quantity;

  state.issued +=
    quantity;

  state.remaining -=
    quantity;

  const correlationId =
    uuidFmrV3_(
      'CORR'
    );

  appendTransactionFmrV3_(
    line,
    'ISSUE_FROM_BAG',
    quantity,
    user,
    {
      correlationId:
        correlationId,

      issuedToName:
        issuedTo,

      performedByName:
        request.performedByName,

      sourceBagTagId:
        bagTagId,

      storageLocation:
        header.Storage_Location,

      notes:
        request.notes
    }
  );

  return finishLineActionFmrV3_(
    user,
    line,
    state,
    'ISSUE_FROM_BAG',
    correlationId,
    {
      quantity:
        quantity,

      tagNumber:
        header.Tag_Number,

      issuedTo:
        issuedTo,

      message:
        quantity +
        ' ' +
        line.UOM +
        ' issued from ' +
        header.Tag_Number +
        ' to ' +
        issuedTo +
        '.'
    }
  );
}



function submitBackorderFmrV3_(
  user,
  line,
  request
) {
  const quantity =
    positiveNumberFmrV3_(
      request.quantity,
      'Backorder quantity'
    );

  const reason =
    normalizeFmrV3_(
      request.reason
    );

  if (!reason) {
    throw new Error(
      'Backorder reason is required.'
    );
  }

  const state =
    lineStateFmrV3_(
      line
    );

  const maximum =
    fieldNewBackorderQuantityFmrV3_(
      state
    );

  if (
    quantity >
    maximum
  ) {
    throw new Error(
      'Only ' +
      maximum +
      ' can be submitted as a new backorder without duplicating an existing commitment.'
    );
  }

  const requestId =
    uuidFmrV3_(
      'BACKORDER'
    );

  const correlationId =
    uuidFmrV3_(
      'CORR'
    );

  const resubmissionPlan =
    planReturnedBackorderResubmissionFmrV3_(
      line,
      quantity
    );

  applyReturnedBackorderResubmissionFmrV3_(
    line,
    resubmissionPlan,
    user,
    correlationId
  );

  const now =
    nowFmrV3_();

  const requestRow =
    appendObjectFmrV3_(
      FMR_V3.SHEETS
        .BACKORDERS,
      {
        Backorder_Request_ID:
          requestId,

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
          quantity,

        Qty_Confirmed_Backorder:
          0,

        Qty_Pending:
          quantity,

        Reason:
          reason,

        Field_Notes:
          normalizeFmrV3_(
            request.notes
          ),

        Reported_By_Email:
          user.email,

        Reported_By_Name:
          normalizeFmrV3_(
            request
              .performedByName ||
            user.name
          ),

        Reported_At:
          now,

        Status:
          'Pending Admin Review',

        Admin_Decision:
          '',

        Admin_Notes:
          '',

        Decided_By_Email:
          '',

        Decided_By_Name:
          '',

        Decided_At:
          '',

        Returned_Review_Reason:
          '',

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
          requestId
        ),

      Index_Type:
        'BACKORDER',

      Entity_ID:
        requestId,

      Parent_ID:
        line.FMR_Line_ID,

      Row_Number:
        requestRow,

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
          'Pending Admin Review'
        ),

      Index_Type:
        'BACKORDERSTATUS',

      Entity_ID:
        requestId,

      Parent_ID:
        line.FMR_Line_ID,

      Row_Number:
        requestRow,

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
        requestId,

      Parent_ID:
        line.FMR_Line_ID,

      Row_Number:
        requestRow,

      Secondary_Row_Number:
        line._rowNumber,

      Active:
        FMR_V3.YES,

      Updated_At:
        now
    }
  ]);

  upsertFieldNotificationFromBackorderFmrV3_(
    {
      _rowNumber:
        requestRow,

      Backorder_Request_ID:
        requestId,

      FMR_ID:
        line.FMR_ID,

      FMR_Number:
        line.FMR_Number,

      FMR_Line_ID:
        line.FMR_Line_ID,

      Qty_Requested_Backorder:
        quantity,

      Qty_Confirmed_Backorder:
        0,

      Qty_Pending:
        quantity,

      Reason:
        reason,

      Status:
        'Pending Admin Review',

      Active:
        FMR_V3.YES,

      Updated_At:
        now
    },
    line,
    {
      timestamp:
        now
    }
  );

  state.pendingBackorder +=
    quantity;

  appendTransactionFmrV3_(
    line,
    'BACKORDER_REQUESTED',
    quantity,
    user,
    {
      correlationId:
        correlationId,

      backorderRequestId:
        requestId,

      performedByName:
        request.performedByName,

      notes:
        reason +
        '. ' +
        normalizeFmrV3_(
          request.notes
        )
    }
  );

  return finishLineActionFmrV3_(
    user,
    line,
    state,
    'BACKORDER_REQUESTED',
    correlationId,
    {
      requestId:
        requestId,

      quantity:
        quantity,

      rejectedNoticeResolutionQuantity:
        quantity,

      reason:
        reason,

      resubmittedReturnedQuantity:
        resubmissionPlan
          .resubmittedQuantity,

      message:
        quantity +
        ' ' +
        line.UOM +
        ' submitted for Admin backorder review.'
    }
  );
}


function refreshHeaderFromIndexedLinesFmrV3_(fmrId, fmrNumber, user) {
  const entries = lookupIndexEntriesFmrV3_(
    FMR_V3.SHEETS.SEARCH_INDEX,
    fmrSearchKeyFmrV3_(fmrNumber)
  ).filter(function (entry) {
    return normalizeFmrV3_(entry.FMR_ID) === normalizeFmrV3_(fmrId);
  });

  if (!entries.length) {
    throw new Error(`No active index entries were found for ${fmrNumber}.`);
  }

  const lines = readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.LINES,
    entries.map(function (entry) { return entry.Line_Row; })
  ).filter(function (line) { return yesFmrV3_(line.Active); });

  const total = function (field) {
    return lines.reduce(function (sum, line) {
      return sum + numberFmrV3_(line[field]);
    }, 0);
  };

  const requested = total('Qty_Requested');
  const issued = total('Qty_Issued');
  const statuses = lines.map(function (line) {
    return normalizeUpperFmrV3_(line.Line_Status);
  });

  let status = 'Published';

  if (lines.length && statuses.every(function (value) {
    return value === 'ISSUED';
  })) {
    status = 'Issued';
  } else if (
    statuses.some(function (value) { return value === 'PARTIALLY ISSUED'; }) ||
    issued > 0
  ) {
    status = 'Partially Issued';
  } else if (statuses.some(function (value) {
    return value === 'BACKORDERED' || value === 'PENDING BACKORDER';
  })) {
    status = 'Sourcing';
  } else if (lines.length && lines.every(function (line) {
    return numberFmrV3_(line.Qty_Confirmed_Located) >=
      numberFmrV3_(line.Qty_Requested);
  })) {
    status = 'Located';
  } else if (total('Qty_Confirmed_Located') > 0) {
    status = 'Partially Located';
  }

  return updateRowObjectFmrV3_(
    FMR_V3.SHEETS.HEADERS,
    entries[0].Header_Row,
    {
      Current_Status: status,
      Total_Lines: lines.length,
      Qty_Requested: requested,
      Qty_Confirmed_Located: total('Qty_Confirmed_Located'),
      Qty_Active_Bagged: total('Qty_Active_Bagged'),
      Qty_Available: total('Qty_Available'),
      Qty_Issued: issued,
      Qty_Pending_Backorder: total('Qty_Pending_Backorder'),
      Qty_Confirmed_Backorder: total('Qty_Confirmed_Backorder'),
      Qty_Remaining_Requirement: Math.max(0, requested - issued),
      Fulfillment_Pct: requested > 0 ? issued / requested : 0,
      Updated_By: user.email,
      Updated_At: nowFmrV3_(),
      Last_Activity_At: nowFmrV3_()
    }
  );
}
