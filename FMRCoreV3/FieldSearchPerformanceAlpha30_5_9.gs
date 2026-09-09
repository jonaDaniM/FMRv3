function resolveFieldOperationalEntriesAlpha30_5_9FmrV3_(
  lineIds
) {
  const normalizedLineIds =
    normalizeBatchLookupValuesFmrV3_(
      lineIds
    );

  const result = {
    bagEntriesByLine: {},
    backorderEntriesByLine: {},
    requestedKeyCount: 0,
    lineCount:
      normalizedLineIds.length
  };

  normalizedLineIds.forEach(
    function (
      lineId
    ) {
      result
        .bagEntriesByLine[
          lineId
        ] = [];

      result
        .backorderEntriesByLine[
          lineId
        ] = [];
    }
  );

  if (
    !normalizedLineIds.length
  ) {
    return result;
  }

  const bagKeyByLine = {};
  const backorderKeyByLine = {};
  const exactKeys = [];

  normalizedLineIds.forEach(
    function (
      lineId
    ) {
      const bagKey =
        operationalIndexKeyFmrV3_(
          'BAGLINE',
          lineId
        );

      const backorderKey =
        operationalIndexKeyFmrV3_(
          'BACKORDERLINE',
          lineId
        );

      bagKeyByLine[
        lineId
      ] =
        normalizeUpperFmrV3_(
          bagKey
        );

      backorderKeyByLine[
        lineId
      ] =
        normalizeUpperFmrV3_(
          backorderKey
        );

      exactKeys.push(
        bagKey,
        backorderKey
      );
    }
  );

  const recordsByKey =
    lookupIndexEntriesForKeysFmrV3_(
      FMR_V3.SHEETS
        .OPERATIONAL_INDEX,
      exactKeys
    );

  result.requestedKeyCount =
    exactKeys.length;

  normalizedLineIds.forEach(
    function (
      lineId
    ) {
      result
        .bagEntriesByLine[
          lineId
        ] =
        recordsByKey[
          bagKeyByLine[
            lineId
          ]
        ] || [];

      result
        .backorderEntriesByLine[
          lineId
        ] =
        recordsByKey[
          backorderKeyByLine[
            lineId
          ]
        ] || [];
    }
  );

  return result;
}


/**
 * Multi-line Field notice reader.
 *
 * One line:
 *   preserves the existing exact TextFinder path.
 *
 * Two or more lines:
 *   reads ONLY the FMR_Line_ID column once, finds matching row numbers in
 *   memory, then reads only the matching notice rows in bounded windows.
 */
function fieldNoticeRowsByLineIdsAlpha30_5_9FmrV3_(
  lineIds
) {
  const normalizedIds =
    normalizeBatchLookupValuesFmrV3_(
      lineIds
    );

  if (
    !normalizedIds.length
  ) {
    return [];
  }

  if (
    normalizedIds.length ===
    1
  ) {
    return fieldNoticeRowsByLineFmrV3_(
      normalizedIds[0]
    );
  }

  const sheet =
    ensureFieldNoticeSheetFmrV3_();

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow <
    2
  ) {
    return [];
  }

  const headers =
    Array.from(
      FMR_V3_FIELD_NOTICE
        .headers
    );

  const lineColumn =
    headers.indexOf(
      'FMR_Line_ID'
    ) +
    1;

  if (
    lineColumn <=
    0
  ) {
    throw new Error(
      'Field_Notifications FMR_Line_ID column is unavailable.'
    );
  }

  const targetSet =
    new Set(
      normalizedIds.map(
        function (
          lineId
        ) {
          return normalizeUpperFmrV3_(
            lineId
          );
        }
      )
    );

  const lineValues =
    sheet
      .getRange(
        2,
        lineColumn,
        lastRow - 1,
        1
      )
      .getDisplayValues();

  const matchingRows = [];

  lineValues.forEach(
    function (
      row,
      index
    ) {
      if (
        targetSet.has(
          normalizeUpperFmrV3_(
            row[0]
          )
        )
      ) {
        matchingRows.push(
          index + 2
        );
      }
    }
  );

  if (
    !matchingRows.length
  ) {
    return [];
  }

  const requested =
    new Set(
      matchingRows
    );

  const groups = [];

  matchingRows.forEach(
    function (
      row
    ) {
      const current =
        groups.length
          ? groups[
              groups.length - 1
            ]
          : null;

      if (
        current &&
        row <=
          current.end +
          5
      ) {
        current.end =
          row;
      } else {
        groups.push({
          start: row,
          end: row
        });
      }
    }
  );

  const result = [];

  function appendWindow_(
    startRow,
    count
  ) {
    const values =
      sheet
        .getRange(
          startRow,
          1,
          count,
          headers.length
        )
        .getValues();

    values.forEach(
      function (
        rowValues,
        offset
      ) {
        const rowNumber =
          startRow +
          offset;

        if (
          !requested.has(
            rowNumber
          )
        ) {
          return;
        }

        const record = {
          _rowNumber:
            rowNumber
        };

        headers.forEach(
          function (
            header,
            column
          ) {
            record[
              header
            ] =
              rowValues[
                column
              ];
          }
        );

        result.push(
          record
        );
      }
    );
  }

  if (
    groups.length >
    20
  ) {
    /**
     * Defensive fallback for extremely fragmented matches.
     * This is still equivalent to the previous implementation's one full
     * table read, so it cannot be worse in service-call count.
     */
    appendWindow_(
      2,
      lastRow - 1
    );
  } else {
    groups.forEach(
      function (
        group
      ) {
        appendWindow_(
          group.start,
          group.end -
            group.start +
            1
        );
      }
    );
  }

  return result.sort(
    function (
      left,
      right
    ) {
      return (
        numberFmrV3_(
          left._rowNumber
        ) -
        numberFmrV3_(
          right._rowNumber
        )
      );
    }
  );
}
