/**
 * Complete Admin FMR register service.
 *
 * The register reads FMR header summaries only. Material lines remain on the
 * exact indexed search path and are loaded only when one FMR is opened.
 */

function getAdminFmrRegisterFmrV3_(userEmail, request) {
  const user = assertSearchUserFmrV3_(userEmail);
  const options = normalizeAdminRegisterRequestFmrV3_(request);

  const allActiveRows = getUsedRowsFmrV3_(FMR_V3.SHEETS.HEADERS)
    .filter(function (row) {
      return yesFmrV3_(row.Active);
    });

  let rows = allActiveRows.slice();
  const filterOptions = buildAdminRegisterFilterOptionsFmrV3_(allActiveRows);

  const indexedFmrIds = resolveAdminRegisterIndexedIdsFmrV3_(
    options.query,
    options.queryType
  );

  if (indexedFmrIds !== null) {
    rows = rows.filter(function (row) {
      return indexedFmrIds.has(normalizeFmrV3_(row.FMR_ID));
    });
  } else if (options.query) {
    const query = normalizeUpperFmrV3_(options.query);

    rows = rows.filter(function (row) {
      return [
        row.FMR_Number,
        row.IWP_Number,
        row.Requested_By,
        row.Priority,
        row.Current_Status,
        row.Notes
      ].some(function (value) {
        return normalizeUpperFmrV3_(value).indexOf(query) !== -1;
      });
    });
  }

  if (options.status !== 'ALL') {
    rows = rows.filter(function (row) {
      return normalizeUpperFmrV3_(row.Current_Status) === options.status;
    });
  }

  if (options.priority !== 'ALL') {
    rows = rows.filter(function (row) {
      return normalizeUpperFmrV3_(row.Priority) === options.priority;
    });
  }

  rows = rows.filter(function (row) {
    return matchesAdminRegisterExceptionFmrV3_(row, options.exceptionType);
  });

  rows.sort(function (left, right) {
    return compareAdminRegisterRowsFmrV3_(left, right, options);
  });

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / options.pageSize));
  const page = Math.min(options.page, totalPages);
  const startIndex = (page - 1) * options.pageSize;

  const pageRows = rows
    .slice(startIndex, startIndex + options.pageSize)
    .map(serializeAdminRegisterRowFmrV3_);

  return {
    generatedAt: formatDateTimeFmrV3_(nowFmrV3_()),
    user: user,
    request: {
      query: options.query,
      queryType: options.queryType,
      status: options.status,
      priority: options.priority,
      exceptionType: options.exceptionType,
      sortBy: options.sortBy,
      sortDirection: options.sortDirection
    },
    pagination: {
      page: page,
      pageSize: options.pageSize,
      totalRecords: totalRecords,
      totalPages: totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
      firstRecord: totalRecords ? startIndex + 1 : 0,
      lastRecord: Math.min(startIndex + options.pageSize, totalRecords)
    },
    filterOptions: filterOptions,
    records: pageRows
  };
}

function normalizeAdminRegisterRequestFmrV3_(request) {
  const source = request || {};
  const allowedQueryTypes = ['AUTO', 'FMR', 'ISO', 'IWP'];
  const allowedExceptions = [
    'ALL',
    'HAS_REMAINING',
    'NOT_FULLY_LOCATED',
    'HAS_AVAILABLE',
    'HAS_BAGGED',
    'PENDING_BACKORDER',
    'CONFIRMED_BACKORDER'
  ];
  const allowedSortFields = [
    'LAST_ACTIVITY',
    'DATE_REQUIRED',
    'FMR_NUMBER',
    'REMAINING',
    'FULFILLMENT',
    'REQUESTED'
  ];

  const queryType = normalizeUpperFmrV3_(source.queryType || 'AUTO');
  const exceptionType = normalizeUpperFmrV3_(source.exceptionType || 'ALL');
  const sortBy = normalizeUpperFmrV3_(source.sortBy || 'LAST_ACTIVITY');
  const sortDirection = normalizeUpperFmrV3_(source.sortDirection || 'DESC');

  return {
    query: normalizeFmrV3_(source.query),
    queryType: allowedQueryTypes.includes(queryType) ? queryType : 'AUTO',
    status: normalizeUpperFmrV3_(source.status || 'ALL') || 'ALL',
    priority: normalizeUpperFmrV3_(source.priority || 'ALL') || 'ALL',
    exceptionType: allowedExceptions.includes(exceptionType)
      ? exceptionType
      : 'ALL',
    sortBy: allowedSortFields.includes(sortBy) ? sortBy : 'LAST_ACTIVITY',
    sortDirection: sortDirection === 'ASC' ? 'ASC' : 'DESC',
    page: Math.max(1, Math.floor(numberFmrV3_(source.page) || 1)),
    pageSize: Math.max(
      10,
      Math.min(100, Math.floor(numberFmrV3_(source.pageSize) || 25))
    )
  };
}

function resolveAdminRegisterIndexedIdsFmrV3_(query, queryType) {
  const value = normalizeFmrV3_(query);

  if (!value || queryType === 'IWP') {
    return null;
  }

  if (queryType === 'FMR') {
    return fmrIdsFromSearchEntriesFmrV3_(
      lookupIndexEntriesFmrV3_(
        FMR_V3.SHEETS.SEARCH_INDEX,
        fmrSearchKeyFmrV3_(value)
      )
    );
  }

  if (queryType === 'ISO') {
    const parsed = parseCombinedIsoFmrV3_(value);

    return fmrIdsFromSearchEntriesFmrV3_(
      lookupIndexEntriesFmrV3_(
        FMR_V3.SHEETS.SEARCH_INDEX,
        isoSearchKeyFmrV3_(parsed.isoNumber, parsed.isoSheet)
      )
    );
  }

  const fmrEntries = lookupIndexEntriesFmrV3_(
    FMR_V3.SHEETS.SEARCH_INDEX,
    fmrSearchKeyFmrV3_(value)
  );

  if (fmrEntries.length) {
    return fmrIdsFromSearchEntriesFmrV3_(fmrEntries);
  }

  try {
    const parsed = parseCombinedIsoFmrV3_(value);
    const isoEntries = lookupIndexEntriesFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX,
      isoSearchKeyFmrV3_(parsed.isoNumber, parsed.isoSheet)
    );

    if (isoEntries.length) {
      return fmrIdsFromSearchEntriesFmrV3_(isoEntries);
    }
  } catch (ignored) {
    // AUTO mode falls back to a case-insensitive header contains search.
  }

  return null;
}

function fmrIdsFromSearchEntriesFmrV3_(entries) {
  return new Set(
    (entries || [])
      .filter(function (entry) {
        return yesFmrV3_(entry.Active);
      })
      .map(function (entry) {
        return normalizeFmrV3_(entry.FMR_ID);
      })
      .filter(Boolean)
  );
}

function matchesAdminRegisterExceptionFmrV3_(row, exceptionType) {
  switch (exceptionType) {
    case 'HAS_REMAINING':
      return numberFmrV3_(row.Qty_Remaining_Requirement) > 0;

    case 'NOT_FULLY_LOCATED':
      return numberFmrV3_(row.Qty_Confirmed_Located) <
        numberFmrV3_(row.Qty_Requested);

    case 'HAS_AVAILABLE':
      return numberFmrV3_(row.Qty_Available) > 0;

    case 'HAS_BAGGED':
      return numberFmrV3_(row.Qty_Active_Bagged) > 0;

    case 'PENDING_BACKORDER':
      return numberFmrV3_(row.Qty_Pending_Backorder) > 0;

    case 'CONFIRMED_BACKORDER':
      return numberFmrV3_(row.Qty_Confirmed_Backorder) > 0;

    default:
      return true;
  }
}

function compareAdminRegisterRowsFmrV3_(left, right, options) {
  let comparison = 0;

  switch (options.sortBy) {
    case 'DATE_REQUIRED':
      comparison = dateSortValueFmrV3_(left.Date_Required) -
        dateSortValueFmrV3_(right.Date_Required);
      break;

    case 'FMR_NUMBER':
      comparison = normalizeFmrV3_(left.FMR_Number).localeCompare(
        normalizeFmrV3_(right.FMR_Number),
        undefined,
        {numeric: true, sensitivity: 'base'}
      );
      break;

    case 'REMAINING':
      comparison = numberFmrV3_(left.Qty_Remaining_Requirement) -
        numberFmrV3_(right.Qty_Remaining_Requirement);
      break;

    case 'FULFILLMENT':
      comparison = numberFmrV3_(left.Fulfillment_Pct) -
        numberFmrV3_(right.Fulfillment_Pct);
      break;

    case 'REQUESTED':
      comparison = numberFmrV3_(left.Qty_Requested) -
        numberFmrV3_(right.Qty_Requested);
      break;

    default:
      comparison = dateSortValueFmrV3_(left.Last_Activity_At || left.Updated_At) -
        dateSortValueFmrV3_(right.Last_Activity_At || right.Updated_At);
      break;
  }

  if (comparison === 0) {
    comparison = normalizeFmrV3_(left.FMR_Number).localeCompare(
      normalizeFmrV3_(right.FMR_Number),
      undefined,
      {numeric: true, sensitivity: 'base'}
    );
  }

  return options.sortDirection === 'ASC' ? comparison : -comparison;
}

function dateSortValueFmrV3_(value) {
  if (!value) {
    return 0;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function buildAdminRegisterFilterOptionsFmrV3_(rows) {
  return {
    statuses: uniqueSortedAdminValuesFmrV3_(rows, 'Current_Status'),
    priorities: uniqueSortedAdminValuesFmrV3_(rows, 'Priority')
  };
}

function uniqueSortedAdminValuesFmrV3_(rows, fieldName) {
  return Array.from(
    new Set(
      (rows || [])
        .map(function (row) {
          return normalizeFmrV3_(row[fieldName]);
        })
        .filter(Boolean)
    )
  ).sort(function (left, right) {
    return left.localeCompare(right, undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  });
}

function serializeAdminRegisterRowFmrV3_(row) {
  return {
    fmrId: normalizeFmrV3_(row.FMR_ID),
    fmrNumber: normalizeFmrV3_(row.FMR_Number),
    iwpNumber: normalizeFmrV3_(row.IWP_Number),
    requestedBy: normalizeFmrV3_(row.Requested_By),
    dateRequired: formatDateOnlyAdminFmrV3_(row.Date_Required),
    priority: normalizeFmrV3_(row.Priority),
    status: normalizeFmrV3_(row.Current_Status),
    totalLines: numberFmrV3_(row.Total_Lines),
    requestedQty: numberFmrV3_(row.Qty_Requested),
    locatedQty: numberFmrV3_(row.Qty_Confirmed_Located),
    baggedQty: numberFmrV3_(row.Qty_Active_Bagged),
    availableQty: numberFmrV3_(row.Qty_Available),
    issuedQty: numberFmrV3_(row.Qty_Issued),
    pendingBackorderQty: numberFmrV3_(row.Qty_Pending_Backorder),
    confirmedBackorderQty: numberFmrV3_(row.Qty_Confirmed_Backorder),
    remainingQty: numberFmrV3_(row.Qty_Remaining_Requirement),
    fulfillmentPct: numberFmrV3_(row.Fulfillment_Pct),
    lastActivityAt: formatDateTimeFmrV3_(row.Last_Activity_At || row.Updated_At),
    notes: normalizeFmrV3_(row.Notes)
  };
}

function formatDateOnlyAdminFmrV3_(value) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return normalizeFmrV3_(value);
  }

  const configuration = getConfigurationFmrV3_();
  const timezone = normalizeFmrV3_(configuration.TIMEZONE) ||
    Session.getScriptTimeZone() ||
    'America/Indiana/Indianapolis';

  return Utilities.formatDate(date, timezone, 'yyyy-MM-dd');
}
