function validateStagePayloadFmrV3_(payload, requireOfficialNumber) {
  const source = payload || {};
  const errors = [];
  const officialFmrNumber = normalizeUpperFmrV3_(source.officialFmrNumber);

  if (requireOfficialNumber && !officialFmrNumber) {
    errors.push('Official FMR Number is required before publication.');
  }

  if (!normalizeFmrV3_(source.iwpNumber)) {
    errors.push('IWP Number is required.');
  }

  const lines = Array.isArray(source.lines) ? source.lines : [];

  if (!lines.length) {
    errors.push('At least one material line is required.');
  }

  const normalizedLines = lines.map(function (line, index) {
    const value = line || {};
    const lineErrors = [];
    const isoNumber = normalizeUpperFmrV3_(value.isoNumber);
    const isoSheet = normalizeUpperFmrV3_(value.isoSheet);
    const quantity = numberFmrV3_(value.qtyRequested);
    const uom = normalizeUpperFmrV3_(value.uom);

    if (!isoNumber) lineErrors.push(`Line ${index + 1}: ISO Number is required.`);
    if (!isoSheet) lineErrors.push(`Line ${index + 1}: ISO Sheet is required.`);
    if (quantity <= 0) {
      lineErrors.push(`Line ${index + 1}: Quantity must be greater than zero.`);
    }
    if (!uom) lineErrors.push(`Line ${index + 1}: UOM is required.`);

    errors.push.apply(errors, lineErrors);

    return {
      lineNumber: index + 1,
      isoNumber: isoNumber,
      isoSheet: isoSheet,
      isoKey: isoNumber && isoSheet ? isoKeyFmrV3_(isoNumber, isoSheet) : '',
      commodityCode: normalizeFmrV3_(value.commodityCode),
      size: normalizeFmrV3_(value.size),
      description: normalizeFmrV3_(value.description),
      qtyRequested: quantity,
      uom: uom,
      storageLocation: normalizeFmrV3_(value.storageLocation),
      notes: normalizeFmrV3_(value.notes),
      validationErrors: lineErrors.join(' | ')
    };
  });

  return {
    valid: errors.length === 0,
    errors: errors,
    normalized: {
      stagingFmrId: normalizeFmrV3_(source.stagingFmrId),
      sourceFileId: normalizeFmrV3_(source.sourceFileId),
      sourceFileName: normalizeFmrV3_(source.sourceFileName),
      officialFmrNumber: officialFmrNumber,
      iwpNumber: normalizeUpperFmrV3_(source.iwpNumber),
      requestedBy: normalizeFmrV3_(source.requestedBy),
      dateRequired: source.dateRequired
        ? new Date(`${source.dateRequired}T12:00:00`)
        : '',
      priority: normalizeFmrV3_(source.priority),
      notes: normalizeFmrV3_(source.notes),
      lines: normalizedLines
    }
  };
}

function saveStagedFmrFmrV3_(userEmail, payload) {
  const owner = assertOwnerFmrV3_(userEmail);
  const validation = validateStagePayloadFmrV3_(payload, false);
  const normalized = validation.normalized;
  const stagingFmrId = normalized.stagingFmrId || uuidFmrV3_('STAGEFMR');
  const existingRows = findRowsByExactValueFmrV3_(
    FMR_V3.SHEETS.STAGING_HEADERS,
    1,
    stagingFmrId
  );
  const now = nowFmrV3_();

  const headerRecord = {
    Staging_FMR_ID: stagingFmrId,
    Source_File_ID: normalized.sourceFileId,
    Source_File_Name: normalized.sourceFileName,
    Official_FMR_Number: normalized.officialFmrNumber,
    IWP_Number: normalized.iwpNumber,
    Requested_By: normalized.requestedBy,
    Date_Required: normalized.dateRequired,
    Priority: normalized.priority,
    Notes: normalized.notes,
    Status: validation.valid ? 'DRAFT' : 'DRAFT_WITH_ERRORS',
    Created_By: owner.email,
    Created_At: now,
    Updated_At: now,
    Published_FMR_ID: '',
    Published_At: '',
    Validation_Errors: validation.errors.join(' | ')
  };

  let headerRow;

  if (existingRows.length) {
    const existing = readRowObjectFmrV3_(
      FMR_V3.SHEETS.STAGING_HEADERS,
      existingRows[0]
    );

    headerRow = existing._rowNumber;

    updateRowObjectFmrV3_(
      FMR_V3.SHEETS.STAGING_HEADERS,
      headerRow,
      Object.assign({}, headerRecord, {
        Created_By: existing.Created_By,
        Created_At: existing.Created_At
      })
    );

    findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS.STAGING_LINES,
      2,
      stagingFmrId
    ).forEach(function (rowNumber) {
      const row = readRowObjectFmrV3_(
        FMR_V3.SHEETS.STAGING_LINES,
        rowNumber
      );

      if (normalizeUpperFmrV3_(row.Status) !== 'PUBLISHED') {
        updateRowObjectFmrV3_(
          FMR_V3.SHEETS.STAGING_LINES,
          rowNumber,
          {Status: 'SUPERSEDED', Updated_At: now}
        );
      }
    });
  } else {
    headerRow = appendObjectFmrV3_(
      FMR_V3.SHEETS.STAGING_HEADERS,
      headerRecord
    );
  }

  const lineRecords = normalized.lines.map(function (line) {
    return {
      Staging_Line_ID: uuidFmrV3_('STAGELINE'),
      Staging_FMR_ID: stagingFmrId,
      Line_Number: line.lineNumber,
      ISO_Number: line.isoNumber,
      ISO_Sheet: line.isoSheet,
      ISO_Key: line.isoKey,
      Commodity_Code: line.commodityCode,
      Size: line.size,
      Material_Description: line.description,
      Qty_Requested: line.qtyRequested,
      UOM: line.uom,
      Storage_Location: line.storageLocation,
      Notes: line.notes,
      Status: line.validationErrors ? 'DRAFT_WITH_ERRORS' : 'DRAFT',
      Validation_Errors: line.validationErrors,
      Created_At: now,
      Updated_At: now,
      Published_Line_ID: ''
    };
  });

  appendObjectsFmrV3_(FMR_V3.SHEETS.STAGING_LINES, lineRecords);

  const correlationId = uuidFmrV3_('CORR');

  appendAuditFmrV3_(
    'STAGED_FMR',
    stagingFmrId,
    existingRows.length ? 'UPDATE_STAGING' : 'CREATE_STAGING',
    owner,
    correlationId,
    {
      sourceInterface: 'OWNER',
      payload: {
        officialFmrNumber: normalized.officialFmrNumber,
        iwpNumber: normalized.iwpNumber,
        lineCount: normalized.lines.length,
        validationErrors: validation.errors
      }
    }
  );

  return {
    success: true,
    stagingFmrId: stagingFmrId,
    stagingHeaderRow: headerRow,
    valid: validation.valid,
    validationErrors: validation.errors,
    lineCount: lineRecords.length
  };
}

function getStagedFmrFmrV3_(userEmail, stagingFmrId) {
  assertOwnerFmrV3_(userEmail);

  const headerRows = findRowsByExactValueFmrV3_(
    FMR_V3.SHEETS.STAGING_HEADERS,
    1,
    stagingFmrId
  );

  if (!headerRows.length) {
    throw new Error(`Staged FMR not found: ${stagingFmrId}`);
  }

  const header = readRowObjectFmrV3_(
    FMR_V3.SHEETS.STAGING_HEADERS,
    headerRows[0]
  );

  const lines = readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.STAGING_LINES,
    findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS.STAGING_LINES,
      2,
      stagingFmrId
    )
  ).filter(function (line) {
    return !['SUPERSEDED', 'VOIDED'].includes(
      normalizeUpperFmrV3_(line.Status)
    );
  });

  return {header: header, lines: lines};
}

function getOwnerStagingListFmrV3_(userEmail, maximumRows) {
  assertOwnerFmrV3_(userEmail);

  const limit = Math.max(
    1,
    Math.min(500, numberFmrV3_(maximumRows) || 100)
  );

  return getUsedRowsFmrV3_(FMR_V3.SHEETS.STAGING_HEADERS)
    .filter(function (row) {
      return !['PUBLISHED', 'VOIDED'].includes(
        normalizeUpperFmrV3_(row.Status)
      );
    })
    .sort(function (left, right) {
      return new Date(right.Updated_At || 0).getTime() -
        new Date(left.Updated_At || 0).getTime();
    })
    .slice(0, limit)
    .map(function (row) {
      return {
        stagingFmrId: normalizeFmrV3_(row.Staging_FMR_ID),
        officialFmrNumber: normalizeFmrV3_(row.Official_FMR_Number),
        iwpNumber: normalizeFmrV3_(row.IWP_Number),
        status: normalizeFmrV3_(row.Status),
        updatedAt: formatDateTimeFmrV3_(row.Updated_At),
        validationErrors: normalizeFmrV3_(row.Validation_Errors)
      };
    });
}

function publishStagedFmrFmrV3_(userEmail, stagingFmrId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  const appended = {};
  const stagingOriginals = {
    header: null,
    lines: []
  };

  try {
    const owner = assertOwnerFmrV3_(userEmail);
    const staged = getStagedFmrFmrV3_(userEmail, stagingFmrId);

    stagingOriginals.header = Object.assign({}, staged.header);
    stagingOriginals.lines = staged.lines.map(function (line) {
      return Object.assign({}, line);
    });

    const payload = {
      stagingFmrId: stagingFmrId,
      sourceFileId: staged.header.Source_File_ID,
      sourceFileName: staged.header.Source_File_Name,
      officialFmrNumber: staged.header.Official_FMR_Number,
      iwpNumber: staged.header.IWP_Number,
      requestedBy: staged.header.Requested_By,
      dateRequired: staged.header.Date_Required
        ? Utilities.formatDate(
            new Date(staged.header.Date_Required),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          )
        : '',
      priority: staged.header.Priority,
      notes: staged.header.Notes,
      lines: staged.lines.map(function (line) {
        return {
          isoNumber: line.ISO_Number,
          isoSheet: line.ISO_Sheet,
          commodityCode: line.Commodity_Code,
          size: line.Size,
          description: line.Material_Description,
          qtyRequested: line.Qty_Requested,
          uom: line.UOM,
          storageLocation: line.Storage_Location,
          notes: line.Notes
        };
      })
    };

    const validation = validateStagePayloadFmrV3_(payload, true);
    if (!validation.valid) throw new Error(validation.errors.join(' | '));

    const normalized = validation.normalized;
    const existing = lookupIndexEntriesFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX,
      fmrSearchKeyFmrV3_(normalized.officialFmrNumber)
    );

    if (existing.length) {
      throw new Error(`FMR Number already exists: ${normalized.officialFmrNumber}`);
    }

    const fmrId = uuidFmrV3_('FMR');
    const now = nowFmrV3_();

    const qtyRequested = normalized.lines.reduce(function (total, line) {
      return total + numberFmrV3_(line.qtyRequested);
    }, 0);

    const headerRecord = {
      FMR_ID: fmrId,
      FMR_Number: normalized.officialFmrNumber,
      IWP_Number: normalized.iwpNumber,
      Requested_By: normalized.requestedBy,
      Date_Required: normalized.dateRequired,
      Priority: normalized.priority,
      Current_Status: 'Published',
      Total_Lines: normalized.lines.length,
      Qty_Requested: qtyRequested,
      Qty_Confirmed_Located: 0,
      Qty_Active_Bagged: 0,
      Qty_Available: 0,
      Qty_Issued: 0,
      Qty_Pending_Backorder: 0,
      Qty_Confirmed_Backorder: 0,
      Qty_Remaining_Requirement: qtyRequested,
      Fulfillment_Pct: 0,
      Source_Staging_ID: stagingFmrId,
      Active: FMR_V3.YES,
      Created_By: owner.email,
      Created_At: now,
      Updated_By: owner.email,
      Updated_At: now,
      Last_Activity_At: now,
      Notes: normalized.notes
    };

    const headerRow = appendObjectFmrV3_(
      FMR_V3.SHEETS.HEADERS,
      headerRecord
    );
    appended[FMR_V3.SHEETS.HEADERS] = [headerRow];

    const lineRecords = normalized.lines.map(function (line, index) {
      return {
        FMR_Line_ID: uuidFmrV3_('FMRLINE'),
        FMR_ID: fmrId,
        FMR_Number: normalized.officialFmrNumber,
        Line_Number: index + 1,
        ISO_Number: line.isoNumber,
        ISO_Sheet: line.isoSheet,
        ISO_Key: line.isoKey,
        Commodity_Code: line.commodityCode,
        Size: line.size,
        Material_Description: line.description,
        Qty_Requested: line.qtyRequested,
        UOM: line.uom,
        Qty_Confirmed_Located: 0,
        Qty_Active_Bagged: 0,
        Qty_Available: 0,
        Qty_Issued: 0,
        Qty_Pending_Backorder: 0,
        Qty_Confirmed_Backorder: 0,
        Qty_Not_Yet_Located: line.qtyRequested,
        Qty_Remaining_Requirement: line.qtyRequested,
        Line_Status: 'Open',
        Storage_Location: line.storageLocation,
        Active: FMR_V3.YES,
        Source_Staging_Line_ID: staged.lines[index]
          ? staged.lines[index].Staging_Line_ID
          : '',
        Created_By: owner.email,
        Created_At: now,
        Updated_By: owner.email,
        Updated_At: now,
        Notes: line.notes
      };
    });

    const lineRows = appendObjectsFmrV3_(
      FMR_V3.SHEETS.LINES,
      lineRecords
    );
    appended[FMR_V3.SHEETS.LINES] = lineRows;

    const searchEntries = [];
    lineRecords.forEach(function (line, index) {
      searchEntries.push.apply(
        searchEntries,
        buildSearchEntriesForPublishedLineFmrV3_(
          headerRecord,
          headerRow,
          line,
          lineRows[index]
        )
      );
    });

    appended[FMR_V3.SHEETS.SEARCH_INDEX] =
      appendSearchIndexEntriesFmrV3_(searchEntries);

    updateRowObjectFmrV3_(
      FMR_V3.SHEETS.STAGING_HEADERS,
      staged.header._rowNumber,
      {
        Status: 'PUBLISHED',
        Updated_At: now,
        Published_FMR_ID: fmrId,
        Published_At: now,
        Validation_Errors: ''
      }
    );

    staged.lines.forEach(function (line, index) {
      updateRowObjectFmrV3_(
        FMR_V3.SHEETS.STAGING_LINES,
        line._rowNumber,
        {
          Status: 'PUBLISHED',
          Updated_At: now,
          Published_Line_ID: lineRecords[index].FMR_Line_ID,
          Validation_Errors: ''
        }
      );
    });

    const correlationId = uuidFmrV3_('CORR');
    appended[FMR_V3.SHEETS.AUDIT] = [
      appendAuditFmrV3_(
        'FMR',
        fmrId,
        'PUBLISH_FMR',
        owner,
        correlationId,
        {
          sourceInterface: 'OWNER',
          payload: {
            fmrNumber: normalized.officialFmrNumber,
            stagingFmrId: stagingFmrId,
            lineCount: lineRecords.length,
            qtyRequested: qtyRequested
          }
        }
      )
    ];

    SpreadsheetApp.flush();

    return {
      success: true,
      fmrId: fmrId,
      fmrNumber: normalized.officialFmrNumber,
      lineCount: lineRecords.length,
      qtyRequested: qtyRequested,
      message: `Published ${normalized.officialFmrNumber}.`
    };
  } catch (error) {
    Object.keys(appended).reverse().forEach(function (sheetName) {
      deleteAppendedRowsFmrV3_(sheetName, appended[sheetName]);
    });

    if (stagingOriginals.header) {
      updateRowObjectFmrV3_(
        FMR_V3.SHEETS.STAGING_HEADERS,
        stagingOriginals.header._rowNumber,
        stagingOriginals.header
      );
    }

    stagingOriginals.lines.forEach(function (line) {
      updateRowObjectFmrV3_(
        FMR_V3.SHEETS.STAGING_LINES,
        line._rowNumber,
        line
      );
    });

    throw error;
  } finally {
    lock.releaseLock();
  }
}

function renumberFmrFmrV3_(userEmail, fmrId, newFmrNumber, reason) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const owner = assertOwnerFmrV3_(userEmail);
    const normalizedFmrId = normalizeFmrV3_(fmrId);
    const newNumber = normalizeUpperFmrV3_(newFmrNumber);

    if (!normalizedFmrId || !newNumber) {
      throw new Error('FMR ID and new FMR Number are required.');
    }

    if (lookupIndexEntriesFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX,
      fmrSearchKeyFmrV3_(newNumber)
    ).length) {
      throw new Error(`FMR Number already exists: ${newNumber}`);
    }

    const indexRows = findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX,
      3,
      normalizedFmrId
    );

    const entries = readRowsObjectsFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX,
      indexRows
    ).filter(function (row) { return yesFmrV3_(row.Active); });

    if (!entries.length) throw new Error(`FMR not found: ${normalizedFmrId}`);

    const header = readRowObjectFmrV3_(
      FMR_V3.SHEETS.HEADERS,
      entries[0].Header_Row
    );

    const oldNumber = normalizeFmrV3_(header.FMR_Number);

    updateRowObjectFmrV3_(
      FMR_V3.SHEETS.HEADERS,
      entries[0].Header_Row,
      {
        FMR_Number: newNumber,
        Updated_By: owner.email,
        Updated_At: nowFmrV3_(),
        Last_Activity_At: nowFmrV3_()
      }
    );

    Array.from(new Set(entries.map(function (entry) {
      return numberFmrV3_(entry.Line_Row);
    }))).forEach(function (rowNumber) {
      updateRowObjectFmrV3_(
        FMR_V3.SHEETS.LINES,
        rowNumber,
        {
          FMR_Number: newNumber,
          Updated_By: owner.email,
          Updated_At: nowFmrV3_()
        }
      );
    });

    [
      [FMR_V3.SHEETS.TRANSACTIONS, 3],
      [FMR_V3.SHEETS.BAG_HEADERS, 3],
      [FMR_V3.SHEETS.BACKORDERS, 3]
    ].forEach(function (spec) {
      findRowsByExactValueFmrV3_(spec[0], spec[1], normalizedFmrId)
        .forEach(function (rowNumber) {
          updateRowObjectFmrV3_(spec[0], rowNumber, {
            FMR_Number: newNumber
          });
        });
    });

    entries.forEach(function (entry) {
      const patch = {
        FMR_Number: newNumber,
        Updated_At: nowFmrV3_()
      };

      if (normalizeUpperFmrV3_(entry.Search_Type) === 'FMR') {
        patch.Search_Key = fmrSearchKeyFmrV3_(newNumber);
      }

      updateRowObjectFmrV3_(
        FMR_V3.SHEETS.SEARCH_INDEX,
        entry._rowNumber,
        patch
      );
    });

    invalidateIndexKeyFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX,
      fmrSearchKeyFmrV3_(oldNumber)
    );

    invalidateIndexKeyFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX,
      fmrSearchKeyFmrV3_(newNumber)
    );

    const correlationId = uuidFmrV3_('CORR');

    appendAuditFmrV3_(
      'FMR',
      normalizedFmrId,
      'RENUMBER_FMR',
      owner,
      correlationId,
      {
        sourceInterface: 'OWNER',
        fieldName: 'FMR_Number',
        oldValue: oldNumber,
        newValue: newNumber,
        notes: normalizeFmrV3_(reason)
      }
    );

    SpreadsheetApp.flush();

    return {
      success: true,
      fmrId: normalizedFmrId,
      oldFmrNumber: oldNumber,
      newFmrNumber: newNumber
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Client-safe staged FMR representation used by the Owner web portal.
 */
function serializeStagedFmrForClientFmrV3_(staged) {
  const source = staged || {};
  const header = source.header || {};
  const dateRequired = header.Date_Required
    ? Utilities.formatDate(
        new Date(header.Date_Required),
        Session.getScriptTimeZone() || 'America/Indiana/Indianapolis',
        'yyyy-MM-dd'
      )
    : '';

  return {
    header: {
      stagingFmrId: normalizeFmrV3_(header.Staging_FMR_ID),
      sourceFileId: normalizeFmrV3_(header.Source_File_ID),
      sourceFileName: normalizeFmrV3_(header.Source_File_Name),
      officialFmrNumber: normalizeFmrV3_(header.Official_FMR_Number),
      iwpNumber: normalizeFmrV3_(header.IWP_Number),
      requestedBy: normalizeFmrV3_(header.Requested_By),
      dateRequired: dateRequired,
      priority: normalizeFmrV3_(header.Priority),
      notes: normalizeFmrV3_(header.Notes),
      status: normalizeFmrV3_(header.Status),
      validationErrors: normalizeFmrV3_(header.Validation_Errors)
    },
    lines: (source.lines || []).map(function (line) {
      return {
        stagingLineId: normalizeFmrV3_(line.Staging_Line_ID),
        isoNumber: normalizeFmrV3_(line.ISO_Number),
        isoSheet: normalizeFmrV3_(line.ISO_Sheet),
        commodityCode: normalizeFmrV3_(line.Commodity_Code),
        size: normalizeFmrV3_(line.Size),
        description: normalizeFmrV3_(line.Material_Description),
        qtyRequested: numberFmrV3_(line.Qty_Requested),
        uom: normalizeFmrV3_(line.UOM),
        storageLocation: normalizeFmrV3_(line.Storage_Location),
        notes: normalizeFmrV3_(line.Notes),
        status: normalizeFmrV3_(line.Status),
        validationErrors: normalizeFmrV3_(line.Validation_Errors)
      };
    })
  };
}

/**
 * Convenience owner service that resolves the permanent FMR_ID from the
 * current official FMR number before using the audited renumber operation.
 */
function renumberFmrByNumberFmrV3_(
  userEmail,
  currentFmrNumber,
  newFmrNumber,
  reason
) {
  assertOwnerFmrV3_(userEmail);

  const entries = lookupIndexEntriesFmrV3_(
    FMR_V3.SHEETS.SEARCH_INDEX,
    fmrSearchKeyFmrV3_(currentFmrNumber)
  );

  if (!entries.length) {
    throw new Error(
      `Published FMR not found: ${normalizeUpperFmrV3_(currentFmrNumber)}`
    );
  }

  const fmrIds = Array.from(new Set(
    entries.map(function (entry) {
      return normalizeFmrV3_(entry.FMR_ID);
    }).filter(Boolean)
  ));

  if (fmrIds.length !== 1) {
    throw new Error(
      'The current FMR number does not resolve to exactly one published FMR.'
    );
  }

  return renumberFmrFmrV3_(
    userEmail,
    fmrIds[0],
    newFmrNumber,
    reason
  );
}
