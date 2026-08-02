const FMR_V3_FIELD_NOTICE =
  Object.freeze({
    sheetName:
      'Field_Notifications',

    headers:
      Object.freeze([
        'Field_Notice_ID',
        'Source_Type',
        'Source_ID',
        'FMR_ID',
        'FMR_Number',
        'FMR_Line_ID',
        'Notice_Type',
        'Severity',
        'Qty_Original',
        'Qty_Remaining',
        'Qty_Pending',
        'Qty_Confirmed',
        'UOM',
        'Reason',
        'Message',
        'Action_Required',
        'Status',
        'Created_At',
        'Updated_At',
        'Resolved_At',
        'Active'
      ]),

    activeStatus:
      'Active',

    resolvedStatus:
      'Resolved',

    types:
      Object.freeze({
        PENDING:
          'PENDING_ADMIN_REVIEW',

        PARTIAL:
          'PARTIALLY_CONFIRMED',

        CONFIRMED:
          'CONFIRMED',

        RETURNED:
          'RETURNED_FOR_REVIEW',

        REJECTED:
          'REJECTED'
      }),

    severities:
      Object.freeze({
        INFO:
          'INFO',

        SUCCESS:
          'SUCCESS',

        WARNING:
          'WARNING',

        ERROR:
          'ERROR'
      })
  });

function fieldNoticeSpreadsheetFmrV3_() {
  return fmrV3Database_();
}

function ensureFieldNoticeSheetFmrV3_() {
  const spreadsheet =
    fieldNoticeSpreadsheetFmrV3_();

  let sheet =
    spreadsheet.getSheetByName(
      FMR_V3_FIELD_NOTICE
        .sheetName
    );

  if (!sheet) {
    sheet =
      spreadsheet.insertSheet(
        FMR_V3_FIELD_NOTICE
          .sheetName
      );

    sheet
      .getRange(
        1,
        1,
        1,
        FMR_V3_FIELD_NOTICE
          .headers
          .length
      )
      .setValues([
        Array.from(
          FMR_V3_FIELD_NOTICE
            .headers
        )
      ]);

    sheet.setFrozenRows(
      1
    );

    sheet.autoResizeColumns(
      1,
      FMR_V3_FIELD_NOTICE
        .headers
        .length
    );

    return sheet;
  }

  const currentHeaders =
    sheet
      .getRange(
        1,
        1,
        1,
        FMR_V3_FIELD_NOTICE
          .headers
          .length
      )
      .getValues()[0]
      .map(
        function (
          value
        ) {
          return normalizeFmrV3_(
            value
          );
        }
      );

  const expectedHeaders =
    Array.from(
      FMR_V3_FIELD_NOTICE
        .headers
    );

  const hasAnyHeader =
    currentHeaders.some(Boolean);

  if (!hasAnyHeader) {
    sheet
      .getRange(
        1,
        1,
        1,
        expectedHeaders.length
      )
      .setValues([
        expectedHeaders
      ]);

    sheet.setFrozenRows(
      1
    );

    return sheet;
  }

  if (
    JSON.stringify(
      currentHeaders
    ) !==
    JSON.stringify(
      expectedHeaders
    )
  ) {
    throw new Error(
      (
        FMR_V3_FIELD_NOTICE
          .sheetName +
        ' headers do not match the alpha.9 schema.'
      )
    );
  }

  return sheet;
}

function fieldNoticeRowsFmrV3_() {
  const sheet =
    ensureFieldNoticeSheetFmrV3_();

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow < 2
  ) {
    return [];
  }

  const headers =
    Array.from(
      FMR_V3_FIELD_NOTICE
        .headers
    );

  return sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      headers.length
    )
    .getValues()
    .map(
      function (
        values,
        index
      ) {
        const record = {
          _rowNumber:
            index + 2
        };

        headers.forEach(
          function (
            header,
            column
          ) {
            record[
              header
            ] =
              values[
                column
              ];
          }
        );

        return record;
      }
    );
}

function fieldNoticeRowValuesFmrV3_(
  record
) {
  return Array.from(
    FMR_V3_FIELD_NOTICE
      .headers
  ).map(
    function (
      header
    ) {
      return (
        record[
          header
        ] ===
          undefined ||
        record[
          header
        ] ===
          null
      )
        ? ''
        : record[
            header
          ];
    }
  );
}

function appendFieldNoticeFmrV3_(
  record
) {
  const sheet =
    ensureFieldNoticeSheetFmrV3_();

  const row =
    Math.max(
      2,
      sheet.getLastRow() +
      1
    );

  sheet
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
        record
      )
    ]);

  return row;
}

function updateFieldNoticeFmrV3_(
  rowNumber,
  patch
) {
  const sheet =
    ensureFieldNoticeSheetFmrV3_();

  const row =
    Number(
      rowNumber
    );

  if (
    !Number.isInteger(
      row
    ) ||
    row < 2
  ) {
    throw new Error(
      'A valid Field notification row is required.'
    );
  }

  const headers =
    Array.from(
      FMR_V3_FIELD_NOTICE
        .headers
    );

  const values =
    sheet
      .getRange(
        row,
        1,
        1,
        headers.length
      )
      .getValues()[0];

  const record = {};

  headers.forEach(
    function (
      header,
      column
    ) {
      record[
        header
      ] =
        values[
          column
        ];
    }
  );

  Object.assign(
    record,
    patch || {}
  );

  sheet
    .getRange(
      row,
      1,
      1,
      headers.length
    )
    .setValues([
      fieldNoticeRowValuesFmrV3_(
        record
      )
    ]);

  return Object.assign(
    {
      _rowNumber:
        row
    },
    record
  );
}

function fieldNoticeBySourceFmrV3_(
  sourceId
) {
  const normalized =
    normalizeFmrV3_(
      sourceId
    );

  if (!normalized) {
    return null;
  }

  return (
    fieldNoticeRowsFmrV3_()
      .find(
        function (
          notice
        ) {
          return (
            normalizeFmrV3_(
              notice.Source_ID
            ) ===
            normalized
          );
        }
      ) ||
    null
  );
}

function activeFieldNoticesForLineFmrV3_(
  lineId
) {
  const normalizedLineId =
    normalizeFmrV3_(
      lineId
    );

  return fieldNoticeRowsFmrV3_()
    .filter(
      function (
        notice
      ) {
        return (
          normalizeFmrV3_(
            notice.FMR_Line_ID
          ) ===
            normalizedLineId &&
          yesFmrV3_(
            notice.Active
          ) &&
          normalizeUpperFmrV3_(
            notice.Status
          ) ===
            'ACTIVE'
        );
      }
    )
    .sort(
      function (
        left,
        right
      ) {
        return (
          new Date(
            left.Created_At ||
            0
          ).getTime() -
          new Date(
            right.Created_At ||
            0
          ).getTime()
        );
      }
    );
}

function fieldNoticeDescriptorFromBackorderFmrV3_(
  request,
  line,
  options
) {
  const settings =
    options || {};

  const status =
    normalizeUpperFmrV3_(
      settings.noticeTypeOverride ||
      request.Status
    );

  const requested =
    numberFmrV3_(
      request
        .Qty_Requested_Backorder
    );

  const pending =
    numberFmrV3_(
      request.Qty_Pending
    );

  const confirmed =
    numberFmrV3_(
      request
        .Qty_Confirmed_Backorder
    );

  const uom =
    normalizeFmrV3_(
      line.UOM
    );

  const quantityOverride =
    settings.quantityOverride ===
      undefined ||
    settings.quantityOverride ===
      null
      ? null
      : Math.max(
          0,
          numberFmrV3_(
            settings.quantityOverride
          )
        );

  let type = '';
  let severity =
    FMR_V3_FIELD_NOTICE
      .severities
      .INFO;

  let quantityRemaining = 0;
  let quantityPending =
    pending;
  let quantityConfirmed =
    confirmed;

  let actionRequired =
    false;

  let reason =
    normalizeFmrV3_(
      settings.reasonOverride ||
      request
        .Returned_Review_Reason ||
      request.Admin_Notes ||
      request.Reason
    );

  let message = '';

  if (
    status ===
    'PENDING ADMIN REVIEW'
  ) {
    type =
      FMR_V3_FIELD_NOTICE
        .types
        .PENDING;

    quantityRemaining =
      pending;

    message =
      (
        formatQuantityFieldNoticeFmrV3_(
          pending
        ) +
        ' ' +
        uom +
        ' awaiting Admin review.'
      );
  } else if (
    status ===
    'PARTIALLY CONFIRMED'
  ) {
    type =
      FMR_V3_FIELD_NOTICE
        .types
        .PARTIAL;

    quantityRemaining =
      pending;

    message =
      (
        formatQuantityFieldNoticeFmrV3_(
          confirmed
        ) +
        ' ' +
        uom +
        ' confirmed · ' +
        formatQuantityFieldNoticeFmrV3_(
          pending
        ) +
        ' ' +
        uom +
        ' still awaiting Admin review.'
      );
  } else if (
    status ===
    'CONFIRMED'
  ) {
    type =
      FMR_V3_FIELD_NOTICE
        .types
        .CONFIRMED;

    severity =
      FMR_V3_FIELD_NOTICE
        .severities
        .SUCCESS;

    quantityRemaining =
      confirmed;

    quantityPending =
      0;

    message =
      (
        formatQuantityFieldNoticeFmrV3_(
          confirmed
        ) +
        ' ' +
        uom +
        ' confirmed on backorder.'
      );
  } else if (
    status ===
    'RETURNED FOR REVIEW'
  ) {
    type =
      FMR_V3_FIELD_NOTICE
        .types
        .RETURNED;

    severity =
      FMR_V3_FIELD_NOTICE
        .severities
        .WARNING;

    quantityRemaining =
      quantityOverride ===
        null
        ? backorderOutstandingReturnedFmrV3_(
            request
          )
        : quantityOverride;

    quantityPending =
      quantityRemaining;

    quantityConfirmed =
      0;

    actionRequired =
      true;

    message =
      (
        'Admin returned ' +
        formatQuantityFieldNoticeFmrV3_(
          quantityRemaining
        ) +
        ' ' +
        uom +
        ' for Field review.'
      );
  } else if (
    status ===
    'REJECTED'
  ) {
    type =
      FMR_V3_FIELD_NOTICE
        .types
        .REJECTED;

    severity =
      FMR_V3_FIELD_NOTICE
        .severities
        .ERROR;

    quantityRemaining =
      quantityOverride ===
        null
        ? Math.max(
            requested,
            pending
          )
        : quantityOverride;

    quantityPending =
      0;

    quantityConfirmed =
      0;

    actionRequired =
      true;

    message =
      (
        'Backorder rejected — ' +
        formatQuantityFieldNoticeFmrV3_(
          quantityRemaining
        ) +
        ' ' +
        uom +
        ' remains unresolved.'
      );
  } else {
    return null;
  }

  if (
    quantityRemaining <= 0
  ) {
    return null;
  }

  return {
    sourceId:
      normalizeFmrV3_(
        settings.sourceId ||
        request
          .Backorder_Request_ID
      ),

    type:
      type,

    severity:
      severity,

    quantityOriginal:
      quantityOverride ===
        null
        ? Math.max(
            requested,
            quantityRemaining
          )
        : quantityOverride,

    quantityRemaining:
      quantityRemaining,

    quantityPending:
      quantityPending,

    quantityConfirmed:
      quantityConfirmed,

    uom:
      uom,

    reason:
      reason,

    message:
      normalizeFmrV3_(
        settings.messageOverride ||
        message
      ),

    actionRequired:
      actionRequired
  };
}

function formatQuantityFieldNoticeFmrV3_(
  value
) {
  const number =
    numberFmrV3_(
      value
    );

  return Number.isInteger(
    number
  )
    ? String(
        number
      )
    : String(
        Math.round(
          number * 1000
        ) /
        1000
      );
}

function resolveFieldNoticeBySourceFmrV3_(
  sourceId,
  timestamp
) {
  const existing =
    fieldNoticeBySourceFmrV3_(
      sourceId
    );

  if (!existing) {
    return null;
  }

  const now =
    timestamp ||
    nowFmrV3_();

  return updateFieldNoticeFmrV3_(
    existing._rowNumber,
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

function upsertFieldNotificationFromBackorderFmrV3_(
  request,
  line,
  options
) {
  const settings =
    options || {};

  const sourceId =
    normalizeFmrV3_(
      settings.sourceId ||
      request
        .Backorder_Request_ID
    );

  if (!sourceId) {
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
    fieldNoticeBySourceFmrV3_(
      sourceId
    );

  const now =
    settings.timestamp ||
    nowFmrV3_();

  if (!descriptor) {
    if (
      existing &&
      yesFmrV3_(
        existing.Active
      )
    ) {
      return resolveFieldNoticeBySourceFmrV3_(
        sourceId,
        now
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
      descriptor
        .quantityOriginal,

    Qty_Remaining:
      descriptor
        .quantityRemaining,

    Qty_Pending:
      descriptor
        .quantityPending,

    Qty_Confirmed:
      descriptor
        .quantityConfirmed,

    UOM:
      descriptor.uom,

    Reason:
      descriptor.reason,

    Message:
      descriptor.message,

    Action_Required:
      descriptor
        .actionRequired
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

  if (existing) {
    return updateFieldNoticeFmrV3_(
      existing._rowNumber,
      record
    );
  }

  const created = Object.assign(
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

function createRejectedRemainderFieldNotificationFmrV3_(
  request,
  line,
  quantity,
  reason,
  correlationId,
  timestamp
) {
  const sourceId =
    (
      normalizeFmrV3_(
        request
          .Backorder_Request_ID
      ) +
      ':REJECTED:' +
      normalizeFmrV3_(
        correlationId
      )
    );

  return upsertFieldNotificationFromBackorderFmrV3_(
    Object.assign(
      {},
      request,
      {
        Status:
          'Rejected'
      }
    ),
    line,
    {
      sourceId:
        sourceId,

      quantityOverride:
        quantity,

      reasonOverride:
        reason,

      timestamp:
        timestamp
    }
  );
}

function syncFieldNotificationsForLineFmrV3_(
  line
) {
  const lineId =
    normalizeFmrV3_(
      line.FMR_Line_ID
    );

  const requests =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .BACKORDERS
    ).filter(
      function (
        request
      ) {
        return (
          normalizeFmrV3_(
            request.FMR_Line_ID
          ) ===
          lineId
        );
      }
    );

  requests.forEach(
    function (
      request
    ) {
      const status =
        normalizeUpperFmrV3_(
          request.Status
        );

      if (
        status ===
        'REJECTED'
      ) {
        /**
         * Rejected notices have their own
         * quantity lifecycle. They are created
         * during the Admin decision or migration
         * and reduced only by recorded Field work.
         */
        return;
      }

      upsertFieldNotificationFromBackorderFmrV3_(
        request,
        line
      );
    }
  );
}

function resolveRejectedFieldNotificationsFmrV3_(
  line,
  quantity,
  user,
  correlationId,
  sourceAction
) {
  let remainingToResolve =
    Math.max(
      0,
      numberFmrV3_(
        quantity
      )
    );

  if (
    remainingToResolve <= 0
  ) {
    return {
      resolvedQuantity:
        0,

      fullyResolvedNotices:
        0
    };
  }

  const notices =
    activeFieldNoticesForLineFmrV3_(
      line.FMR_Line_ID
    ).filter(
      function (
        notice
      ) {
        return (
          normalizeUpperFmrV3_(
            notice.Notice_Type
          ) ===
          FMR_V3_FIELD_NOTICE
            .types
            .REJECTED
        );
      }
    );

  let resolvedQuantity = 0;
  let fullyResolvedNotices = 0;

  notices.forEach(
    function (
      notice
    ) {
      if (
        remainingToResolve <= 0
      ) {
        return;
      }

      const current =
        numberFmrV3_(
          notice.Qty_Remaining
        );

      if (
        current <= 0
      ) {
        return;
      }

      const applied =
        Math.min(
          current,
          remainingToResolve
        );

      const next =
        current -
        applied;

      const now =
        nowFmrV3_();

      updateFieldNoticeFmrV3_(
        notice._rowNumber,
        {
          Qty_Remaining:
            next,

          Message:
            next > 0
              ? (
                  'Backorder rejected — ' +
                  formatQuantityFieldNoticeFmrV3_(
                    next
                  ) +
                  ' ' +
                  normalizeFmrV3_(
                    notice.UOM
                  ) +
                  ' remains unresolved.'
                )
              : (
                  'Rejected backorder quantity resolved by Field.'
                ),

          Status:
            next > 0
              ? FMR_V3_FIELD_NOTICE
                  .activeStatus
              : FMR_V3_FIELD_NOTICE
                  .resolvedStatus,

          Resolved_At:
            next > 0
              ? ''
              : now,

          Updated_At:
            now,

          Active:
            next > 0
              ? FMR_V3.YES
              : FMR_V3.NO
        }
      );

      appendAuditFmrV3_(
        'FIELD_NOTICE',
        notice
          .Field_Notice_ID,
        next > 0
          ? 'FIELD_REJECTION_NOTICE_REDUCED'
          : 'FIELD_REJECTION_NOTICE_RESOLVED',
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
              applied,

            quantityBefore:
              current,

            quantityAfter:
              next,

            sourceBackorderId:
              notice.Source_ID
          }
        }
      );

      resolvedQuantity +=
        applied;

      remainingToResolve -=
        applied;

      if (
        next <= 0
      ) {
        fullyResolvedNotices +=
          1;
      }
    }
  );

  return {
    resolvedQuantity:
      resolvedQuantity,

    fullyResolvedNotices:
      fullyResolvedNotices
  };
}

function serializeFieldNoticeFmrV3_(
  notice
) {
  return {
    noticeId:
      normalizeFmrV3_(
        notice
          .Field_Notice_ID
      ),

    sourceType:
      normalizeUpperFmrV3_(
        notice.Source_Type
      ),

    sourceId:
      normalizeFmrV3_(
        notice.Source_ID
      ),

    type:
      normalizeUpperFmrV3_(
        notice.Notice_Type
      ),

    severity:
      normalizeUpperFmrV3_(
        notice.Severity
      ),

    quantity:
      numberFmrV3_(
        notice.Qty_Remaining
      ),

    quantityOriginal:
      numberFmrV3_(
        notice.Qty_Original
      ),

    quantityPending:
      numberFmrV3_(
        notice.Qty_Pending
      ),

    quantityConfirmed:
      numberFmrV3_(
        notice.Qty_Confirmed
      ),

    uom:
      normalizeFmrV3_(
        notice.UOM
      ),

    reason:
      normalizeFmrV3_(
        notice.Reason
      ),

    message:
      normalizeFmrV3_(
        notice.Message
      ),

    actionRequired:
      yesFmrV3_(
        notice
          .Action_Required
      ),

    sticky:
      yesFmrV3_(
        notice
          .Action_Required
      ),

    updatedAt:
      formatDateTimeFmrV3_(
        notice.Updated_At
      )
  };
}

function getFieldBackorderNoticesByLineIdsFmrV3_(
  lineIds
) {
  const result = {};

  const normalizedIds =
    Array.from(
      new Set(
        (
          lineIds ||
          []
        ).map(
          function (
            lineId
          ) {
            return normalizeFmrV3_(
              lineId
            );
          }
        ).filter(Boolean)
      )
    );

  normalizedIds.forEach(
    function (
      lineId
    ) {
      result[
        lineId
      ] = [];
    }
  );

  if (
    !normalizedIds.length
  ) {
    return result;
  }

  const lineSet = {};

  normalizedIds.forEach(
    function (
      lineId
    ) {
      lineSet[
        lineId
      ] = true;
    }
  );

  fieldNoticeRowsFmrV3_()
    .filter(
      function (
        notice
      ) {
        return (
          lineSet[
            normalizeFmrV3_(
              notice.FMR_Line_ID
            )
          ] &&
          yesFmrV3_(
            notice.Active
          ) &&
          numberFmrV3_(
            notice.Qty_Remaining
          ) > 0
        );
      }
    )
    .forEach(
      function (
        notice
      ) {
        const lineId =
          normalizeFmrV3_(
            notice.FMR_Line_ID
          );

        result[
          lineId
        ].push(
          serializeFieldNoticeFmrV3_(
            notice
          )
        );
      }
    );

  Object.keys(
    result
  ).forEach(
    function (
      lineId
    ) {
      result[
        lineId
      ].sort(
        function (
          left,
          right
        ) {
          const actionDifference =
            Number(
              right.actionRequired
            ) -
            Number(
              left.actionRequired
            );

          if (
            actionDifference !== 0
          ) {
            return actionDifference;
          }

          const severityOrder = {
            ERROR: 4,
            WARNING: 3,
            SUCCESS: 2,
            INFO: 1
          };

          return (
            numberFmrV3_(
              severityOrder[
                right.severity
              ]
            ) -
            numberFmrV3_(
              severityOrder[
                left.severity
              ]
            )
          );
        }
      );
    }
  );

  return result;
}

function migrateFmrV3FieldNotifications() {
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

    ensureFieldNoticeSheetFmrV3_();

    const lines =
      getUsedRowsFmrV3_(
        FMR_V3.SHEETS.LINES
      );

    const linesById = {};

    lines.forEach(
      function (
        line
      ) {
        linesById[
          normalizeFmrV3_(
            line.FMR_Line_ID
          )
        ] = line;
      }
    );

    let processed = 0;
    let activeNotices = 0;

    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .BACKORDERS
    ).forEach(
      function (
        request
      ) {
        const line =
          linesById[
            normalizeFmrV3_(
              request.FMR_Line_ID
            )
          ];

        if (!line) {
          return;
        }

        const status =
          normalizeUpperFmrV3_(
            request.Status
          );

        const options = {};

        let notice;

        if (
          status ===
          'REJECTED'
        ) {
          const existingRejected =
            fieldNoticeBySourceFmrV3_(
              request
                .Backorder_Request_ID
            );

          if (existingRejected) {
            notice =
              existingRejected;
          } else {
            options.quantityOverride =
              Math.max(
                numberFmrV3_(
                  request
                    .Qty_Requested_Backorder
                ),
                0
              );

            notice =
              upsertFieldNotificationFromBackorderFmrV3_(
                request,
                line,
                options
              );
          }
        } else {
          notice =
            upsertFieldNotificationFromBackorderFmrV3_(
              request,
              line,
              options
            );
        }

        processed +=
          1;

        if (
          notice &&
          yesFmrV3_(
            notice.Active
          )
        ) {
          activeNotices +=
            1;
        }
      }
    );

    SpreadsheetApp.flush();

    const diagnostic =
      inspectFmrV3FieldNotificationContract();

    const output = {
      passed:
        diagnostic.passed,

      migration:
        'ALPHA9_FIELD_BACKORDER_NOTICES',

      performedBy:
        user.email,

      processedBackorders:
        processed,

      activeNotices:
        activeNotices,

      postDiagnostic:
        diagnostic
    };

    console.log(
      JSON.stringify(
        output,
        null,
        2
      )
    );

    if (!output.passed) {
      throw new Error(
        'Field notification migration did not pass its post-diagnostic.'
      );
    }

    return output;
  } finally {
    lock.releaseLock();
  }
}

function noticeSnapshotForFmrFmrV3_(
  fmrNumber,
  userEmail
) {
  const result =
    searchPublishedFmrV3_(
      userEmail,
      fmrNumber,
      'FMR'
    );

  if (
    result.resultCount !== 1 ||
    !result.cards ||
    result.cards.length !== 1
  ) {
    throw new Error(
      'Expected one published FMR: ' +
      fmrNumber
    );
  }

  const materials =
    result.cards[0]
      .materials ||
    [];

  if (
    materials.length !== 1
  ) {
    throw new Error(
      fmrNumber +
      ' must contain one line for the alpha.9 notice diagnostic.'
    );
  }

  return {
    fmrNumber:
      fmrNumber,

    lineId:
      materials[0]
        .fmrLineId,

    notices:
      materials[0]
        .backorderNotices ||
      []
  };
}

function inspectFmrV3FieldNotificationContract() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const started =
    Date.now();

  const email =
    normalizeEmailFmrV3_(
      Session
        .getEffectiveUser()
        .getEmail()
    );

  const snapshots = {
    confirm:
      noticeSnapshotForFmrFmrV3_(
        'V3-ADMIN-CONFIRM-0003',
        email
      ),

    reject:
      noticeSnapshotForFmrFmrV3_(
        'V3-ADMIN-REJECT-0004',
        email
      ),

    returned:
      noticeSnapshotForFmrFmrV3_(
        'V3-ADMIN-RETURN-0005',
        email
      ),

    split:
      noticeSnapshotForFmrFmrV3_(
        'V3-ADMIN-SPLIT-0006',
        email
      )
  };

  const findType =
    function (
      snapshot,
      type
    ) {
      return (
        snapshot.notices.find(
          function (
            notice
          ) {
            return (
              normalizeUpperFmrV3_(
                notice.type
              ) ===
              normalizeUpperFmrV3_(
                type
              )
            );
          }
        ) ||
        null
      );
    };

  const confirmed =
    findType(
      snapshots.confirm,
      'CONFIRMED'
    );

  const rejected =
    findType(
      snapshots.reject,
      'REJECTED'
    );

  const returned =
    findType(
      snapshots.returned,
      'RETURNED_FOR_REVIEW'
    );

  const splitConfirmed =
    findType(
      snapshots.split,
      'CONFIRMED'
    );

  const splitReturned =
    findType(
      snapshots.split,
      'RETURNED_FOR_REVIEW'
    );

  const activeRows =
    fieldNoticeRowsFmrV3_()
      .filter(
        function (
          notice
        ) {
          return yesFmrV3_(
            notice.Active
          );
        }
      );

  const sourceCounts = {};

  activeRows.forEach(
    function (
      notice
    ) {
      const sourceId =
        normalizeFmrV3_(
          notice.Source_ID
        );

      sourceCounts[
        sourceId
      ] =
        numberFmrV3_(
          sourceCounts[
            sourceId
          ]
        ) +
        1;
    }
  );

  const duplicateSources =
    Object.keys(
      sourceCounts
    ).filter(
      function (
        sourceId
      ) {
        return (
          sourceCounts[
            sourceId
          ] > 1
        );
      }
    );

  const output = {
    passed:
      Boolean(
        confirmed
      ) &&
      numberFmrV3_(
        confirmed.quantity
      ) === 2 &&
      Boolean(
        rejected
      ) &&
      numberFmrV3_(
        rejected.quantity
      ) === 2 &&
      rejected.actionRequired ===
        true &&
      Boolean(
        returned
      ) &&
      numberFmrV3_(
        returned.quantity
      ) === 2 &&
      returned.actionRequired ===
        true &&
      Boolean(
        splitConfirmed
      ) &&
      numberFmrV3_(
        splitConfirmed.quantity
      ) === 1 &&
      Boolean(
        splitReturned
      ) &&
      numberFmrV3_(
        splitReturned.quantity
      ) === 1 &&
      splitReturned.actionRequired ===
        true &&
      duplicateSources.length === 0,

    readOnly:
      true,

    elapsedMs:
      Date.now() -
      started,

    version:
      FMR_V3.VERSION,

    sheetName:
      FMR_V3_FIELD_NOTICE
        .sheetName,

    activeNoticeCount:
      activeRows.length,

    duplicateSourceCount:
      duplicateSources.length,

    duplicateSources:
      duplicateSources,

    fixtures:
      snapshots
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

function runFmrV3FieldNotificationDiagnostic() {
  const output =
    inspectFmrV3FieldNotificationContract();

  if (!output.passed) {
    throw new Error(
      'FMR v3 Field notification diagnostic failed.'
    );
  }

  return output;
}

const FMR_V3_SPRINT3B_REFRESH_FIXTURE =
  Object.freeze({
    fmrNumber:
      'V3-ADMIN-REFRESH-0007',

    stagingFmrId:
      'STAGEFMR-V3-ADMIN-REFRESH-0007',

    iwpNumber:
      'V3-IWP-ADMIN-REFRESH-0007',

    isoNumber:
      'V3-ISO-ADMIN-REFRESH-0007',

    commodityCode:
      'V3-ADMIN-COMM-007',

    description:
      'V3 ADMIN DETAIL REFRESH ACCEPTANCE VALVE',

    requested:
      4,

    backorder:
      1,

    uom:
      'EA'
  });

function createSprint3BAdminRefreshFixtureFmrV3() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const email =
    normalizeEmailFmrV3_(
      Session
        .getEffectiveUser()
        .getEmail()
    );

  const owner =
    assertOwnerFmrV3_(
      email
    );

  let search =
    searchPublishedFmrV3_(
      email,
      FMR_V3_SPRINT3B_REFRESH_FIXTURE
        .fmrNumber,
      'FMR'
    );

  let created =
    false;

  if (
    search.resultCount === 0
  ) {
    const staged =
      saveStagedFmrFmrV3_(
        email,
        {
          stagingFmrId:
            FMR_V3_SPRINT3B_REFRESH_FIXTURE
              .stagingFmrId,

          sourceFileId:
            '',

          sourceFileName:
            'Generated Sprint 3B Admin detail refresh fixture',

          officialFmrNumber:
            FMR_V3_SPRINT3B_REFRESH_FIXTURE
              .fmrNumber,

          iwpNumber:
            FMR_V3_SPRINT3B_REFRESH_FIXTURE
              .iwpNumber,

          requestedBy:
            'Sprint 3B Acceptance',

          dateRequired:
            '2026-08-25',

          priority:
            'Normal',

          notes:
            'Sprint 3B synchronized Admin detail acceptance.',

          lines: [
            {
              isoNumber:
                FMR_V3_SPRINT3B_REFRESH_FIXTURE
                  .isoNumber,

              isoSheet:
                '1',

              commodityCode:
                FMR_V3_SPRINT3B_REFRESH_FIXTURE
                  .commodityCode,

              size:
                '4',

              description:
                FMR_V3_SPRINT3B_REFRESH_FIXTURE
                  .description,

              qtyRequested:
                FMR_V3_SPRINT3B_REFRESH_FIXTURE
                  .requested,

              uom:
                FMR_V3_SPRINT3B_REFRESH_FIXTURE
                  .uom,

              storageLocation:
                '',

              notes:
                'Single-line Sprint 3B Admin refresh fixture.'
            }
          ]
        }
      );

    if (!staged.valid) {
      throw new Error(
        (
          'Sprint 3B refresh fixture failed staging validation: ' +
          (
            staged.validationErrors ||
            []
          ).join(
            ' | '
          )
        )
      );
    }

    publishStagedFmrFmrV3_(
      email,
      FMR_V3_SPRINT3B_REFRESH_FIXTURE
        .stagingFmrId
    );

    SpreadsheetApp.flush();

    created =
      true;

    search =
      searchPublishedFmrV3_(
        email,
        FMR_V3_SPRINT3B_REFRESH_FIXTURE
          .fmrNumber,
        'FMR'
      );
  }

  if (
    search.resultCount !== 1 ||
    !search.cards ||
    search.cards.length !== 1 ||
    !search.cards[0].materials ||
    search.cards[0].materials.length !== 1
  ) {
    throw new Error(
      'Sprint 3B refresh fixture could not be loaded.'
    );
  }

  const material =
    search.cards[0]
      .materials[0];

  const existingBackorders =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .BACKORDERS
    ).filter(
      function (
        request
      ) {
        return (
          normalizeUpperFmrV3_(
            request.FMR_Number
          ) ===
          FMR_V3_SPRINT3B_REFRESH_FIXTURE
            .fmrNumber
        );
      }
    );

  if (
    existingBackorders.some(
      function (
        request
      ) {
        return (
          normalizeUpperFmrV3_(
            request.Status
          ) !==
          'PENDING ADMIN REVIEW'
        );
      }
    )
  ) {
    throw new Error(
      'The Sprint 3B refresh fixture has already been decided. Preserve it and create a new numbered fixture for another test.'
    );
  }

  if (
    existingBackorders.length === 0
  ) {
    performFieldActionFmrV3_(
      email,
      {
        action:
          FMR_V3.ACTIONS
            .BACKORDER_REQUESTED,

        fmrLineId:
          material.fmrLineId,

        quantity:
          FMR_V3_SPRINT3B_REFRESH_FIXTURE
            .backorder,

        reason:
          'Not found in laydown yard',

        performedByName:
          owner.name,

        notes:
          'Sprint 3B Admin detail refresh acceptance.'
      }
    );

    SpreadsheetApp.flush();
  }

  const queue =
    getBackorderQueueFmrV3_(
      email
    );

  const request =
    (
      queue.requests ||
      []
    ).find(
      function (
        item
      ) {
        return (
          normalizeUpperFmrV3_(
            item.fmrNumber
          ) ===
          FMR_V3_SPRINT3B_REFRESH_FIXTURE
            .fmrNumber
        );
      }
    );

  if (!request) {
    throw new Error(
      'The Sprint 3B refresh fixture is not awaiting Admin review.'
    );
  }

  const integrity =
    inspectFmrV3DataIntegrity();

  const output = {
    passed:
      integrity.passed &&
      numberFmrV3_(
        request.qtyPending
      ) === 1,

    destructive:
      true,

    created:
      created,

    version:
      FMR_V3.VERSION,

    fmrNumber:
      FMR_V3_SPRINT3B_REFRESH_FIXTURE
        .fmrNumber,

    fmrLineId:
      material.fmrLineId,

    requestId:
      request.requestId,

    pendingQuantity:
      request.qtyPending,

    integrityPassed:
      integrity.passed
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!output.passed) {
    throw new Error(
      'Sprint 3B Admin refresh fixture creation failed.'
    );
  }

  return output;
}

function verifySprint3BAdminRefreshConfirmedFmrV3() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const email =
    normalizeEmailFmrV3_(
      Session
        .getEffectiveUser()
        .getEmail()
    );

  const search =
    searchPublishedFmrV3_(
      email,
      FMR_V3_SPRINT3B_REFRESH_FIXTURE
        .fmrNumber,
      'FMR'
    );

  if (
    search.resultCount !== 1 ||
    !search.cards ||
    search.cards.length !== 1 ||
    !search.cards[0].materials ||
    search.cards[0].materials.length !== 1
  ) {
    throw new Error(
      'Sprint 3B refresh fixture could not be loaded.'
    );
  }

  const material =
    search.cards[0]
      .materials[0];

  const backorders =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .BACKORDERS
    ).filter(
      function (
        request
      ) {
        return (
          normalizeUpperFmrV3_(
            request.FMR_Number
          ) ===
          FMR_V3_SPRINT3B_REFRESH_FIXTURE
            .fmrNumber
        );
      }
    );

  const queue =
    getBackorderQueueFmrV3_(
      email
    );

  const queueCount =
    (
      queue.requests ||
      []
    ).filter(
      function (
        request
      ) {
        return (
          normalizeUpperFmrV3_(
            request.fmrNumber
          ) ===
          FMR_V3_SPRINT3B_REFRESH_FIXTURE
            .fmrNumber
        );
      }
    ).length;

  const notice =
    (
      material.backorderNotices ||
      []
    ).find(
      function (
        item
      ) {
        return (
          normalizeUpperFmrV3_(
            item.type
          ) ===
          'CONFIRMED'
        );
      }
    );

  const integrity =
    inspectFmrV3DataIntegrity();

  const output = {
    passed:
      backorders.length === 1 &&
      normalizeUpperFmrV3_(
        backorders[0].Status
      ) ===
        'CONFIRMED' &&
      numberFmrV3_(
        backorders[0]
          .Qty_Confirmed_Backorder
      ) === 1 &&
      numberFmrV3_(
        backorders[0]
          .Qty_Pending
      ) === 0 &&
      numberFmrV3_(
        material.qtyPendingBackorder
      ) === 0 &&
      numberFmrV3_(
        material.qtyConfirmedBackorder
      ) === 1 &&
      queueCount === 0 &&
      Boolean(
        notice
      ) &&
      numberFmrV3_(
        notice.quantity
      ) === 1 &&
      integrity.passed,

    readOnly:
      true,

    version:
      FMR_V3.VERSION,

    fmrNumber:
      FMR_V3_SPRINT3B_REFRESH_FIXTURE
        .fmrNumber,

    pendingBackorder:
      material.qtyPendingBackorder,

    confirmedBackorder:
      material.qtyConfirmedBackorder,

    queueCount:
      queueCount,

    confirmedNotice:
      notice || null,

    integrityPassed:
      integrity.passed
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!output.passed) {
    throw new Error(
      'Sprint 3B Admin detail refresh confirmation failed.'
    );
  }

  return output;
}

