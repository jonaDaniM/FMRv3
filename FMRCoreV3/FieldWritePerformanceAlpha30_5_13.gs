const FMR_V3_ALPHA30_5_13_FIELD_WRITE =
  Object.freeze({
    LIGHTWEIGHT_RESPONSE_ACTIONS:
      Object.freeze([
        'CONFIRM_AVAILABLE',
        'BACKORDER_REQUESTED'
      ]),

    /**
     * submitBackorderFmrV3_ already creates/updates the new Backorder's Field
     * notification before calling finishLineActionFmrV3_().
     *
     * Therefore running a full line-wide Backorder notification resync in the
     * same request is redundant for BACKORDER_REQUESTED.
     */
    SKIP_FULL_NOTIFICATION_SYNC_ACTIONS:
      Object.freeze([
        'BACKORDER_REQUESTED'
      ]),

    USE_SINGLE_PASS_NOTIFICATION_SYNC:
      true
  });


function captureFieldDispatchAlpha30_5_13FmrV3_(
  details
) {
  const capture =
    currentWritePerformanceCaptureAlpha30_5_11FmrV3_();

  capture.fieldDispatch =
    Object.assign(
      {},
      details || {}
    );
}


function usesLightweightFieldResponseAlpha30_5_13FmrV3_(
  action
) {
  return FMR_V3_ALPHA30_5_13_FIELD_WRITE
    .LIGHTWEIGHT_RESPONSE_ACTIONS
    .includes(
      normalizeUpperFmrV3_(
        action
      )
    );
}


function skipFullFieldNotificationSyncAlpha30_5_13FmrV3_(
  action
) {
  return FMR_V3_ALPHA30_5_13_FIELD_WRITE
    .SKIP_FULL_NOTIFICATION_SYNC_ACTIONS
    .includes(
      normalizeUpperFmrV3_(
        action
      )
    );
}


/**
 * Update a Field_Notifications row from a record already loaded by the caller.
 *
 * Unlike updateFieldNoticeFmrV3_(), this helper does not re-read the same row
 * before writing it.
 *
 * Use only when `knownNotice` was read inside the same serialized Field action
 * or same single-pass notification synchronization operation.
 */
function updateKnownFieldNoticeAlpha30_5_13FmrV3_(
  knownNotice,
  patch
) {
  const row =
    Number(
      knownNotice &&
      knownNotice._rowNumber
    );

  if (
    !Number.isInteger(
      row
    ) ||
    row < 2
  ) {
    throw new Error(
      'A valid known Field notification row is required.'
    );
  }

  const updated =
    Object.assign(
      {},
      knownNotice,
      patch || {},
      {
        _rowNumber:
          row
      }
    );

  ensureFieldNoticeSheetFmrV3_()
    .getRange(
      row,
      1,
      1,
      FMR_V3_FIELD_NOTICE
        .headers
        .length
    )
    .setValues([
      fieldNoticeRowValuesFmrV3_(
        updated
      )
    ]);

  return updated;
}


/**
 * Same business behavior as upsertFieldNotificationFromBackorderFmrV3_(), but
 * optionally consumes a Field notice already loaded by the caller.
 *
 * When `knownExistingProvided` is false this falls back to the production
 * Alpha 30.5.12 function unchanged.
 */
function upsertFieldNotificationWithKnownExistingAlpha30_5_13FmrV3_(
  request,
  line,
  options,
  knownExisting,
  knownExistingProvided
) {
  if (
    !knownExistingProvided
  ) {
    return upsertFieldNotificationFromBackorderFmrV3_(
      request,
      line,
      options
    );
  }

  const settings =
    options || {};

  const sourceId =
    normalizeFmrV3_(
      settings.sourceId ||
      request.Backorder_Request_ID
    );

  if (
    !sourceId
  ) {
    throw new Error(
      'Field notification source ID is required.'
    );
  }

  const descriptor =
    fieldNoticeDescriptorFromBackorderFmrV3_(
      request,
      line,
      settings
    );

  const existing =
    knownExisting ||
    null;

  const now =
    settings.timestamp ||
    nowFmrV3_();

  if (
    !descriptor
  ) {
    if (
      existing &&
      yesFmrV3_(
        existing.Active
      )
    ) {
      return updateKnownFieldNoticeAlpha30_5_13FmrV3_(
        existing,
        {
          Qty_Remaining:
            0,

          Qty_Pending:
            0,

          Status:
            FMR_V3_FIELD_NOTICE
              .resolvedStatus,

          Resolved_At:
            now,

          Updated_At:
            now,

          Active:
            FMR_V3.NO
        }
      );
    }

    return existing;
  }

  if (
    existing &&
    !yesFmrV3_(
      existing.Active
    ) &&
    descriptor.type ===
      FMR_V3_FIELD_NOTICE
        .types
        .REJECTED &&
    !settings.forceReactivate
  ) {
    return existing;
  }

  const record = {
    Source_Type:
      'BACKORDER',

    Source_ID:
      sourceId,

    FMR_ID:
      normalizeFmrV3_(
        line.FMR_ID
      ),

    FMR_Number:
      normalizeFmrV3_(
        line.FMR_Number
      ),

    FMR_Line_ID:
      normalizeFmrV3_(
        line.FMR_Line_ID
      ),

    Notice_Type:
      descriptor.type,

    Severity:
      descriptor.severity,

    Qty_Original:
      descriptor.quantityOriginal,

    Qty_Remaining:
      descriptor.quantityRemaining,

    Qty_Pending:
      descriptor.quantityPending,

    Qty_Confirmed:
      descriptor.quantityConfirmed,

    UOM:
      descriptor.uom,

    Reason:
      descriptor.reason,

    Message:
      descriptor.message,

    Action_Required:
      descriptor.actionRequired
        ? FMR_V3.YES
        : FMR_V3.NO,

    Status:
      FMR_V3_FIELD_NOTICE
        .activeStatus,

    Updated_At:
      now,

    Resolved_At:
      '',

    Active:
      FMR_V3.YES
  };

  if (
    existing
  ) {
    return updateKnownFieldNoticeAlpha30_5_13FmrV3_(
      existing,
      record
    );
  }

  const created =
    Object.assign(
      {
        Field_Notice_ID:
          uuidFmrV3_(
            'NOTICE'
          ),

        Created_At:
          now
      },
      record
    );

  const rowNumber =
    appendFieldNoticeFmrV3_(
      created
    );

  return Object.assign(
    {
      _rowNumber:
        rowNumber
    },
    created
  );
}
