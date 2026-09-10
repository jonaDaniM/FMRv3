const FMR_V3_WRITE_PERF_ALPHA30_5_11 =
  Object.freeze({
    SHEET_NAME:
      'Performance_Events',

    FIELD_SLOW_MS:
      10000,

    ADMIN_BACKORDER_SLOW_MS:
      5000,

    MAX_DETAILS_JSON_LENGTH:
      30000,

    HEADERS: [
      'Event_ID',
      'Recorded_At',
      'Core_Version',
      'Operation',
      'Action',
      'Outcome',
      'User_Email',
      'FMR_Number',
      'FMR_Line_ID',
      'Backorder_Request_ID',
      'Correlation_ID',
      'Total_Ms',
      'Lock_Wait_Ms',
      'Locked_Execution_Ms',
      'Header_Refresh_Ms',
      'Header_Line_Read_Ms',
      'Header_Write_Ms',
      'Line_Write_Ms',
      'Notification_Sync_Ms',
      'Flush_Ms',
      'Active_Bag_Read_Ms',
      'Returned_Backorder_Read_Ms',
      'Backorder_Notice_Read_Ms',
      'Details_JSON'
    ]
  });


let FMR_V3_WRITE_PERF_CAPTURE_ALPHA30_5_11_ =
  null;


function resetWritePerformanceCaptureAlpha30_5_11FmrV3_() {
  FMR_V3_WRITE_PERF_CAPTURE_ALPHA30_5_11_ = {
    fieldActionTotal:
      null,

    fieldFinish:
      null,

    adminBackorderTotal:
      null,

    headerRefresh:
      null
  };

  return FMR_V3_WRITE_PERF_CAPTURE_ALPHA30_5_11_;
}


function currentWritePerformanceCaptureAlpha30_5_11FmrV3_() {
  if (
    !FMR_V3_WRITE_PERF_CAPTURE_ALPHA30_5_11_
  ) {
    resetWritePerformanceCaptureAlpha30_5_11FmrV3_();
  }

  return FMR_V3_WRITE_PERF_CAPTURE_ALPHA30_5_11_;
}


function captureFieldActionTotalAlpha30_5_11FmrV3_(
  details
) {
  currentWritePerformanceCaptureAlpha30_5_11FmrV3_()
    .fieldActionTotal =
    Object.assign(
      {},
      details || {}
    );
}


function captureFieldFinishAlpha30_5_11FmrV3_(
  details
) {
  currentWritePerformanceCaptureAlpha30_5_11FmrV3_()
    .fieldFinish =
    Object.assign(
      {},
      details || {}
    );
}


function captureAdminBackorderTotalAlpha30_5_11FmrV3_(
  details
) {
  currentWritePerformanceCaptureAlpha30_5_11FmrV3_()
    .adminBackorderTotal =
    Object.assign(
      {},
      details || {}
    );
}


function captureHeaderRefreshAlpha30_5_11FmrV3_(
  details
) {
  currentWritePerformanceCaptureAlpha30_5_11FmrV3_()
    .headerRefresh =
    Object.assign(
      {},
      details || {}
    );
}


/**
 * Known-record writer.
 *
 * Use ONLY when the caller already loaded the complete authoritative record
 * while holding the same global ScriptLock that protects the subsequent write.
 *
 * Alpha 30.5.11 uses this for the Backorder_Requests row in Admin decisions.
 */
function updateKnownRowObjectAlpha30_5_11FmrV3_(
  sheetName,
  knownRecord,
  patch
) {
  const rowNumber =
    numberFmrV3_(
      knownRecord &&
      knownRecord._rowNumber
    );

  if (
    rowNumber <
    2
  ) {
    throw new Error(
      'A valid locked source row is required for optimized row update.'
    );
  }

  const contract =
    headerMapFmrV3_(
      sheetName
    );

  const updated =
    Object.assign(
      {},
      knownRecord,
      patch || {}
    );

  const values =
    contract.headers.map(
      function (
        header
      ) {
        return Object
          .prototype
          .hasOwnProperty
          .call(
            updated,
            header
          )
          ? updated[
              header
            ]
          : '';
      }
    );

  sheetFmrV3_(
    sheetName
  )
    .getRange(
      rowNumber,
      1,
      1,
      values.length
    )
    .setValues(
      [
        values
      ]
    );

  return updated;
}


function ensureWritePerformanceSheetAlpha30_5_11FmrV3_() {
  const database =
    fmrV3Database_();

  const sheetName =
    FMR_V3_WRITE_PERF_ALPHA30_5_11
      .SHEET_NAME;

  let sheet =
    database.getSheetByName(
      sheetName
    );

  if (
    !sheet
  ) {
    try {
      sheet =
        database.insertSheet(
          sheetName
        );
    } catch (
      error
    ) {
      /**
       * Another execution may have created it at the same time.
       */
      sheet =
        database.getSheetByName(
          sheetName
        );

      if (
        !sheet
      ) {
        throw error;
      }
    }
  }

  const headers =
    FMR_V3_WRITE_PERF_ALPHA30_5_11
      .HEADERS;

  if (
    sheet.getLastRow() ===
    0
  ) {
    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .setValues(
        [
          headers
        ]
      );

    try {
      sheet.setFrozenRows(
        1
      );
    } catch (
      ignored
    ) {}
  } else {
    const actual =
      sheet
        .getRange(
          1,
          1,
          1,
          headers.length
        )
        .getDisplayValues()[0]
        .map(
          normalizeFmrV3_
        );

    const mismatch =
      headers.some(
        function (
          header,
          index
        ) {
          return (
            actual[
              index
            ] !==
            header
          );
        }
      );

    if (
      mismatch
    ) {
      throw new Error(
        'Performance_Events header mismatch. Telemetry write skipped.'
      );
    }
  }

  return sheet;
}


function writePerformanceThresholdAlpha30_5_11FmrV3_(
  operation
) {
  return (
    normalizeUpperFmrV3_(
      operation
    ) ===
    'ADMIN_BACKORDER_DECISION'
  )
    ? FMR_V3_WRITE_PERF_ALPHA30_5_11
        .ADMIN_BACKORDER_SLOW_MS
    : FMR_V3_WRITE_PERF_ALPHA30_5_11
        .FIELD_SLOW_MS;
}


/**
 * Best-effort persistent slow-event logger.
 *
 * IMPORTANT:
 * Every caller must invoke this only after the business service has returned /
 * thrown and released its write lock.
 */
function recordSlowWritePerformanceAlpha30_5_11FmrV3_(
  details
) {
  try {
    const source =
      details || {};

    const totalMs =
      Math.max(
        0,
        numberFmrV3_(
          source.totalMs
        )
      );

    const thresholdMs =
      writePerformanceThresholdAlpha30_5_11FmrV3_(
        source.operation
      );

    if (
      totalMs <
      thresholdMs
    ) {
      return {
        recorded:
          false,

        reason:
          'BELOW_THRESHOLD',

        totalMs:
          totalMs,

        thresholdMs:
          thresholdMs
      };
    }

    const sheet =
      ensureWritePerformanceSheetAlpha30_5_11FmrV3_();

    const capture =
      source.capture ||
      {};

    const fieldFinish =
      capture.fieldFinish ||
      {};

    const finishTimings =
      fieldFinish.timings ||
      {};

    const headerRefresh =
      capture.headerRefresh ||
      {};

    let detailsJson =
      JSON.stringify(
        {
          capture:
            capture,

          error:
            normalizeFmrV3_(
              source.error
            )
        }
      );

    if (
      detailsJson.length >
      FMR_V3_WRITE_PERF_ALPHA30_5_11
        .MAX_DETAILS_JSON_LENGTH
    ) {
      detailsJson =
        detailsJson.slice(
          0,
          FMR_V3_WRITE_PERF_ALPHA30_5_11
            .MAX_DETAILS_JSON_LENGTH
        );
    }

    sheet.appendRow([
      uuidFmrV3_(
        'PERF'
      ),

      nowFmrV3_(),

      FMR_V3.VERSION,

      normalizeUpperFmrV3_(
        source.operation
      ),

      normalizeUpperFmrV3_(
        source.action
      ),

      normalizeUpperFmrV3_(
        source.outcome ||
        'SUCCESS'
      ),

      normalizeEmailFmrV3_(
        source.userEmail
      ),

      normalizeFmrV3_(
        source.fmrNumber ||
        fieldFinish.fmrNumber
      ),

      normalizeFmrV3_(
        source.fmrLineId ||
        fieldFinish.fmrLineId
      ),

      normalizeFmrV3_(
        source.backorderRequestId
      ),

      normalizeFmrV3_(
        source.correlationId ||
        fieldFinish.correlationId
      ),

      totalMs,

      numberFmrV3_(
        source.lockWaitMs
      ),

      numberFmrV3_(
        source.lockedExecutionMs
      ),

      numberFmrV3_(
        headerRefresh.totalMs
      ),

      numberFmrV3_(
        headerRefresh.lineReadMs
      ),

      numberFmrV3_(
        headerRefresh.headerWriteMs
      ),

      numberFmrV3_(
        finishTimings.lineWriteMs
      ),

      numberFmrV3_(
        finishTimings.notificationSyncMs
      ),

      numberFmrV3_(
        finishTimings.flushMs
      ),

      numberFmrV3_(
        finishTimings.activeBagReadMs
      ),

      numberFmrV3_(
        finishTimings.returnedBackorderReadMs
      ),

      numberFmrV3_(
        finishTimings.backorderNoticeReadMs
      ),

      detailsJson
    ]);

    return {
      recorded:
        true,

      totalMs:
        totalMs,

      thresholdMs:
        thresholdMs
    };
  } catch (
    error
  ) {
    /**
     * Telemetry is non-authoritative and MUST NEVER fail a completed business
     * transaction.
     */
    console.warn(
      'FMR_V3_WRITE_PERF_ALPHA30_5_11 ' +
      JSON.stringify({
        event:
          'PERSISTENCE_BYPASS',

        message:
          normalizeFmrV3_(
            error &&
            error.message
          )
      })
    );

    return {
      recorded:
        false,

      reason:
        'PERSISTENCE_BYPASS'
    };
  }
}


/**
 * Wrap the existing Field transaction so the persistent telemetry write occurs
 * only after performFieldActionFmrV3_() has released its ScriptLock.
 */
function runTrackedFieldActionAlpha30_5_11FmrV3_(
  userEmail,
  request
) {
  resetWritePerformanceCaptureAlpha30_5_11FmrV3_();

  const startedAt =
    Date.now();

  let outcome =
    'SUCCESS';

  let errorMessage =
    '';

  try {
    return performFieldActionFmrV3_(
      userEmail,
      request || {}
    );
  } catch (
    error
  ) {
    outcome =
      'ERROR';

    errorMessage =
      normalizeFmrV3_(
        error &&
        error.message
      );

    throw error;
  } finally {
    const capture =
      currentWritePerformanceCaptureAlpha30_5_11FmrV3_();

    const actionTotal =
      capture.fieldActionTotal ||
      {};

    const fieldFinish =
      capture.fieldFinish ||
      {};

    recordSlowWritePerformanceAlpha30_5_11FmrV3_({
      operation:
        'FIELD_ACTION',

      action:
        normalizeUpperFmrV3_(
          (
            request &&
            request.action
          ) ||
          actionTotal.action
        ),

      outcome:
        outcome,

      userEmail:
        userEmail,

      fmrNumber:
        fieldFinish.fmrNumber,

      fmrLineId:
        normalizeFmrV3_(
          (
            request &&
            request.fmrLineId
          ) ||
          actionTotal.fmrLineId
        ),

      correlationId:
        fieldFinish.correlationId,

      totalMs:
        numberFmrV3_(
          actionTotal.totalMs
        ) ||
        (
          Date.now() -
          startedAt
        ),

      lockWaitMs:
        actionTotal.lockWaitMs,

      lockedExecutionMs:
        actionTotal.lockedExecutionMs,

      error:
        errorMessage,

      capture:
        capture
    });
  }
}


/**
 * Wrap the existing Admin Backorder decision.
 *
 * The original reviewBackorderFmrV3_() still owns the lock and all business
 * decisions. This wrapper only persists the captured timing after that function
 * releases the lock.
 */
function runTrackedAdminBackorderDecisionAlpha30_5_11FmrV3_(
  userEmail,
  request
) {
  resetWritePerformanceCaptureAlpha30_5_11FmrV3_();

  const startedAt =
    Date.now();

  let outcome =
    'SUCCESS';

  let errorMessage =
    '';

  try {
    return reviewBackorderFmrV3_(
      userEmail,
      request || {}
    );
  } catch (
    error
  ) {
    outcome =
      'ERROR';

    errorMessage =
      normalizeFmrV3_(
        error &&
        error.message
      );

    throw error;
  } finally {
    const capture =
      currentWritePerformanceCaptureAlpha30_5_11FmrV3_();

    const adminTotal =
      capture.adminBackorderTotal ||
      {};

    recordSlowWritePerformanceAlpha30_5_11FmrV3_({
      operation:
        'ADMIN_BACKORDER_DECISION',

      action:
        normalizeUpperFmrV3_(
          (
            request &&
            request.decision
          ) ||
          adminTotal.action
        ),

      outcome:
        outcome,

      userEmail:
        userEmail,

      backorderRequestId:
        normalizeFmrV3_(
          (
            request &&
            request.requestId
          ) ||
          adminTotal.requestId
        ),

      totalMs:
        numberFmrV3_(
          adminTotal.totalMs
        ) ||
        (
          Date.now() -
          startedAt
        ),

      lockWaitMs:
        adminTotal.lockWaitMs,

      lockedExecutionMs:
        adminTotal.lockedExecutionMs,

      error:
        errorMessage,

      capture:
        capture
    });
  }
}


/**
 * Optional Owner setup/read helpers.
 *
 * These are exported (no trailing underscore) so the Bound adapter can call
 * them through the FMRCoreV3 library.
 */
function installFmrV3WritePerformanceTelemetry(
  databaseId,
  userEmail
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  assertOwnerFmrV3_(
    userEmail
  );

  const sheet =
    ensureWritePerformanceSheetAlpha30_5_11FmrV3_();

  return {
    success:
      true,

    sheetName:
      sheet.getName(),

    fieldSlowThresholdMs:
      FMR_V3_WRITE_PERF_ALPHA30_5_11
        .FIELD_SLOW_MS,

    adminBackorderSlowThresholdMs:
      FMR_V3_WRITE_PERF_ALPHA30_5_11
        .ADMIN_BACKORDER_SLOW_MS
  };
}


function getFmrV3RecentWritePerformanceEvents(
  databaseId,
  userEmail,
  maximumRows
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  assertOwnerFmrV3_(
    userEmail
  );

  const sheet =
    fmrV3Database_()
      .getSheetByName(
        FMR_V3_WRITE_PERF_ALPHA30_5_11
          .SHEET_NAME
      );

  if (
    !sheet ||
    sheet.getLastRow() <
      2
  ) {
    return {
      success:
        true,

      count:
        0,

      events:
        []
    };
  }

  const headers =
    FMR_V3_WRITE_PERF_ALPHA30_5_11
      .HEADERS;

  const count =
    Math.max(
      1,
      Math.min(
        250,
        Math.floor(
          numberFmrV3_(
            maximumRows
          ) ||
          100
        ),
        sheet.getLastRow() -
          1
      )
    );

  const startRow =
    sheet.getLastRow() -
    count +
    1;

  const values =
    sheet
      .getRange(
        startRow,
        1,
        count,
        headers.length
      )
      .getValues();

  const events =
    values
      .map(
        function (
          row
        ) {
          const event = {};

          headers.forEach(
            function (
              header,
              index
            ) {
              event[
                header
              ] =
                row[
                  index
                ];
            }
          );

          return event;
        }
      )
      .reverse();

  return {
    success:
      true,

    count:
      events.length,

    events:
      events
  };
}
