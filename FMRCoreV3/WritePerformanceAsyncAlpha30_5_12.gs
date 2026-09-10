const FMR_V3_WRITE_PERF_ASYNC_ALPHA30_5_12 =
  Object.freeze({
    MAX_CLIENT_EVENT_JSON_LENGTH:
      35000,

    MAX_DURATION_MS:
      600000,

    ALLOWED_OPERATIONS:
      [
        'FIELD_ACTION',
        'ADMIN_BACKORDER_DECISION'
      ]
  });


function clampWritePerformanceDurationAlpha30_5_12FmrV3_(
  value
) {
  return Math.max(
    0,
    Math.min(
      FMR_V3_WRITE_PERF_ASYNC_ALPHA30_5_12
        .MAX_DURATION_MS,
      numberFmrV3_(
        value
      )
    )
  );
}


function buildWritePerformanceEnvelopeAlpha30_5_12FmrV3_(
  details
) {
  const source =
    details || {};

  const operation =
    normalizeUpperFmrV3_(
      source.operation
    );

  if (
    !FMR_V3_WRITE_PERF_ASYNC_ALPHA30_5_12
      .ALLOWED_OPERATIONS
      .includes(
        operation
      )
  ) {
    return null;
  }

  const totalMs =
    clampWritePerformanceDurationAlpha30_5_12FmrV3_(
      source.totalMs
    );

  const thresholdMs =
    writePerformanceThresholdAlpha30_5_11FmrV3_(
      operation
    );

  if (
    totalMs <
    thresholdMs
  ) {
    return null;
  }

  const capture =
    source.capture ||
    {};

  const fieldFinish =
    capture.fieldFinish ||
    {};

  const fieldTotal =
    capture.fieldActionTotal ||
    {};

  const adminTotal =
    capture.adminBackorderTotal ||
    {};

  const finishTimings =
    fieldFinish.timings ||
    {};

  /**
   * This derived value gives us visibility into the portion of a Field action
   * that occurs before the shared finishLineActionFmrV3_() routine.
   *
   * Example from the first 30.5.11 production-style test:
   * lockedExecutionMs 11,929 - totalFinishMs 7,192 ~= 4,737 ms.
   */
  const preFinishMs =
    operation ===
      'FIELD_ACTION'
      ? Math.max(
          0,
          clampWritePerformanceDurationAlpha30_5_12FmrV3_(
            fieldTotal.lockedExecutionMs
          ) -
          clampWritePerformanceDurationAlpha30_5_12FmrV3_(
            finishTimings.totalFinishMs
          )
        )
      : 0;

  return {
    schemaVersion:
      'ALPHA30_5_12',

    operation:
      operation,

    action:
      normalizeUpperFmrV3_(
        source.action
      ),

    outcome:
      normalizeUpperFmrV3_(
        source.outcome ||
        'SUCCESS'
      ),

    fmrNumber:
      normalizeFmrV3_(
        source.fmrNumber ||
        fieldFinish.fmrNumber
      ),

    fmrLineId:
      normalizeFmrV3_(
        source.fmrLineId ||
        fieldFinish.fmrLineId
      ),

    backorderRequestId:
      normalizeFmrV3_(
        source.backorderRequestId ||
        adminTotal.requestId
      ),

    correlationId:
      normalizeFmrV3_(
        source.correlationId ||
        fieldFinish.correlationId
      ),

    totalMs:
      totalMs,

    lockWaitMs:
      clampWritePerformanceDurationAlpha30_5_12FmrV3_(
        source.lockWaitMs
      ),

    lockedExecutionMs:
      clampWritePerformanceDurationAlpha30_5_12FmrV3_(
        source.lockedExecutionMs
      ),

    error:
      normalizeFmrV3_(
        source.error
      ),

    capture:
      Object.assign(
        {},
        capture,
        {
          derivedAlpha30_5_12: {
            preFinishMs:
              preFinishMs
          }
        }
      )
  };
}


function attachWritePerformanceEnvelopeAlpha30_5_12FmrV3_(
  businessResult,
  envelope
) {
  if (
    !envelope
  ) {
    return businessResult;
  }

  if (
    !businessResult ||
    typeof businessResult !==
      'object' ||
    Array.isArray(
      businessResult
    )
  ) {
    return {
      result:
        businessResult,

      writePerformanceEvent:
        envelope
    };
  }

  return Object.assign(
    {},
    businessResult,
    {
      writePerformanceEvent:
        envelope
    }
  );
}


/**
 * Sanitize the client-carried diagnostic envelope before persisting it.
 *
 * The caller's authenticated Google email always wins. The client cannot
 * choose which user is attributed to the event.
 */
function sanitizeWritePerformanceEnvelopeAlpha30_5_12FmrV3_(
  userEmail,
  event
) {
  const user =
    assertSearchUserFmrV3_(
      userEmail
    );

  const source =
    event || {};

  let serialized = '';

  try {
    serialized =
      JSON.stringify(
        source
      );
  } catch (
    error
  ) {
    throw new Error(
      'Write performance payload is not serializable.'
    );
  }

  if (
    serialized.length >
    FMR_V3_WRITE_PERF_ASYNC_ALPHA30_5_12
      .MAX_CLIENT_EVENT_JSON_LENGTH
  ) {
    throw new Error(
      'Write performance payload exceeds the diagnostic size limit.'
    );
  }

  const operation =
    normalizeUpperFmrV3_(
      source.operation
    );

  if (
    !FMR_V3_WRITE_PERF_ASYNC_ALPHA30_5_12
      .ALLOWED_OPERATIONS
      .includes(
        operation
      )
  ) {
    throw new Error(
      'Unsupported write performance operation.'
    );
  }

  const totalMs =
    clampWritePerformanceDurationAlpha30_5_12FmrV3_(
      source.totalMs
    );

  const capture =
    (
      source.capture &&
      typeof source.capture ===
        'object' &&
      !Array.isArray(
        source.capture
      )
    )
      ? source.capture
      : {};

  return {
    operation:
      operation,

    action:
      normalizeUpperFmrV3_(
        source.action
      ),

    outcome:
      normalizeUpperFmrV3_(
        source.outcome ||
        'SUCCESS'
      ),

    userEmail:
      user.email,

    fmrNumber:
      normalizeFmrV3_(
        source.fmrNumber
      ),

    fmrLineId:
      normalizeFmrV3_(
        source.fmrLineId
      ),

    backorderRequestId:
      normalizeFmrV3_(
        source.backorderRequestId
      ),

    correlationId:
      normalizeFmrV3_(
        source.correlationId
      ),

    totalMs:
      totalMs,

    lockWaitMs:
      clampWritePerformanceDurationAlpha30_5_12FmrV3_(
        source.lockWaitMs
      ),

    lockedExecutionMs:
      clampWritePerformanceDurationAlpha30_5_12FmrV3_(
        source.lockedExecutionMs
      ),

    error:
      normalizeFmrV3_(
        source.error
      ),

    capture:
      capture
  };
}


/**
 * Public Core entry point used by the Bound project's fire-and-forget adapter.
 *
 * This is diagnostic only. It never participates in material-state writes.
 */
function recordFmrV3WritePerformanceEvent(
  databaseId,
  userEmail,
  event
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  const sanitized =
    sanitizeWritePerformanceEnvelopeAlpha30_5_12FmrV3_(
      userEmail,
      event
    );

  return recordSlowWritePerformanceAlpha30_5_11FmrV3_(
    sanitized
  );
}
