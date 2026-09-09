const FMR_V3_ALPHA30_5_8_PERFORMANCE =
  Object.freeze({
    ENABLE_LOGGING: true,
    USE_BATCHED_FIELD_SEARCH_READS: true,
    USE_KNOWN_LINE_WRITE: true,
    LOG_PREFIX: 'FMR_V3_PERF_ALPHA30_5_9'
  });


function logPerformanceAlpha30_5_8FmrV3_(
  eventName,
  details
) {
  if (
    !FMR_V3_ALPHA30_5_8_PERFORMANCE
      .ENABLE_LOGGING
  ) {
    return;
  }

  try {
    const payload =
      Object.assign(
        {
          marker:
            FMR_V3_ALPHA30_5_8_PERFORMANCE
              .LOG_PREFIX,

          event:
            normalizeUpperFmrV3_(
              eventName
            ),

          version:
            FMR_V3.VERSION,

          loggedAt:
            new Date()
              .toISOString()
        },
        details || {}
      );

    console.log(
      FMR_V3_ALPHA30_5_8_PERFORMANCE
        .LOG_PREFIX +
      ' ' +
      JSON.stringify(
        payload
      )
    );
  } catch (
    ignored
  ) {
    /**
     * Telemetry must never block an FMR operation.
     */
  }
}


/**
 * Field-only optimized line writer.
 *
 * Why it is safe in the current v3 architecture:
 * performFieldActionFmrV3_() resolves the authoritative line only after it
 * acquires the global ScriptLock. The existing updateLineStateFmrV3_()
 * immediately re-reads that same line again before writing it.
 *
 * This helper writes the already-authoritative locked line plus the exact
 * same state patch, eliminating one Spreadsheet read.
 *
 * IMPORTANT:
 * Keep this helper limited to the Field path while v3 uses global
 * ScriptLock serialization. Do not generalize it to unrelated writers
 * without reviewing their concurrency model.
 */
function updateKnownLineStateAlpha30_5_8FmrV3_(
  line,
  state,
  user,
  extraPatch
) {
  if (
    !FMR_V3_ALPHA30_5_8_PERFORMANCE
      .USE_KNOWN_LINE_WRITE
  ) {
    return updateLineStateFmrV3_(
      line,
      state,
      user,
      extraPatch
    );
  }

  const rowNumber =
    numberFmrV3_(
      line &&
      line._rowNumber
    );

  if (
    rowNumber <
    2
  ) {
    throw new Error(
      'Invalid FMR line row for Alpha 30.5.8 optimized write.'
    );
  }

  const contract =
    headerMapFmrV3_(
      FMR_V3.SHEETS.LINES
    );

  const patch =
    Object.assign(
      {
        Qty_Confirmed_Located:
          Math.max(
            0,
            state.confirmed
          ),

        Qty_Active_Bagged:
          Math.max(
            0,
            state.bagged
          ),

        Qty_Available:
          Math.max(
            0,
            state.available
          ),

        Qty_Issued:
          Math.max(
            0,
            state.issued
          ),

        Qty_Pending_Backorder:
          Math.max(
            0,
            state.pendingBackorder
          ),

        Qty_Confirmed_Backorder:
          Math.max(
            0,
            state.confirmedBackorder
          ),

        Qty_Not_Yet_Located:
          Math.max(
            0,
            state.notYetLocated
          ),

        Qty_Remaining_Requirement:
          Math.max(
            0,
            state.remaining
          ),

        Line_Status:
          calculateLineStatusFmrV3_(
            state
          ),

        Updated_By:
          user.email,

        Updated_At:
          nowFmrV3_()
      },
      extraPatch || {}
    );

  const updated =
    Object.assign(
      {},
      line,
      patch
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
    FMR_V3.SHEETS.LINES
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
