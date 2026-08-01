function parseCombinedIsoFmrV3_(value) {
  const input = normalizeUpperFmrV3_(value);
  let splitIndex = Math.max(
    input.lastIndexOf('|'),
    input.lastIndexOf('/')
  );

  if (splitIndex <= 0) {
    const match = input.match(
      /^(.*?)[\s]+(?:SHT|SHEET)[\s:#-]*([A-Z0-9._-]+)$/
    );

    if (match) {
      return {
        isoNumber: normalizeUpperFmrV3_(match[1]),
        isoSheet: normalizeUpperFmrV3_(match[2])
      };
    }

    throw new Error(
      'Combined ISO search must include a sheet, such as FG-70912_001|3.'
    );
  }

  const isoNumber = normalizeUpperFmrV3_(input.slice(0, splitIndex));
  const isoSheet = normalizeUpperFmrV3_(input.slice(splitIndex + 1));

  if (!isoNumber || !isoSheet) {
    throw new Error('Both ISO Number and ISO Sheet are required.');
  }

  return {isoNumber: isoNumber, isoSheet: isoSheet};
}

function normalizeSearchRequestFmrV3_(query, mode) {
  const raw = normalizeFmrV3_(query);
  if (!raw) {
    throw new Error('Enter an FMR number or a combined ISO and sheet.');
  }

  const normalizedMode = normalizeUpperFmrV3_(mode || 'AUTO');
  const upper = normalizeUpperFmrV3_(raw);

  if (normalizedMode === 'FMR' || upper.indexOf('FMR:') === 0) {
    return [fmrSearchKeyFmrV3_(upper.replace(/^FMR:/, ''))];
  }

  if (normalizedMode === 'ISO' || upper.indexOf('ISO:') === 0) {
    const parsed = parseCombinedIsoFmrV3_(upper.replace(/^ISO:/, ''));
    return [isoSearchKeyFmrV3_(parsed.isoNumber, parsed.isoSheet)];
  }

  const candidates = [fmrSearchKeyFmrV3_(upper)];

  try {
    const parsed = parseCombinedIsoFmrV3_(upper);
    candidates.push(isoSearchKeyFmrV3_(parsed.isoNumber, parsed.isoSheet));
  } catch (ignored) {}

  return Array.from(new Set(candidates));
}

function serializeHeaderTotalsFmrV3_(header) {
  return {
    requested: numberFmrV3_(header.Qty_Requested),
    located: numberFmrV3_(header.Qty_Confirmed_Located),
    bagged: numberFmrV3_(header.Qty_Active_Bagged),
    available: numberFmrV3_(header.Qty_Available),
    issued: numberFmrV3_(header.Qty_Issued),
    pendingBackorder: numberFmrV3_(header.Qty_Pending_Backorder),
    confirmedBackorder: numberFmrV3_(header.Qty_Confirmed_Backorder),
    remaining: numberFmrV3_(header.Qty_Remaining_Requirement),
    fulfillmentPct: numberFmrV3_(header.Fulfillment_Pct)
  };
}

function serializeLineForPortalFmrV3_(line, activeBags, returnedBackorders) {
  const requested = numberFmrV3_(line.Qty_Requested);
  const confirmed = numberFmrV3_(line.Qty_Confirmed_Located);
  const pending = numberFmrV3_(line.Qty_Pending_Backorder);
  const confirmedBackorder = numberFmrV3_(line.Qty_Confirmed_Backorder);

  return {
    fmrLineId: normalizeFmrV3_(line.FMR_Line_ID),
    lineNumber: numberFmrV3_(line.Line_Number),
    isoNumber: normalizeFmrV3_(line.ISO_Number),
    isoSheet: normalizeFmrV3_(line.ISO_Sheet),
    isoKey: normalizeFmrV3_(line.ISO_Key),
    commodityCode: normalizeFmrV3_(line.Commodity_Code),
    size: normalizeFmrV3_(line.Size),
    description: normalizeFmrV3_(line.Material_Description),
    uom: normalizeFmrV3_(line.UOM),
    qtyRequested: requested,
    qtyConfirmedLocated: confirmed,
    qtyActiveBagged: numberFmrV3_(line.Qty_Active_Bagged),
    qtyAvailable: numberFmrV3_(line.Qty_Available),
    qtyIssued: numberFmrV3_(line.Qty_Issued),
    qtyPendingBackorder: pending,
    qtyConfirmedBackorder: confirmedBackorder,
    qtyNotYetLocated: numberFmrV3_(line.Qty_Not_Yet_Located),
    qtyRemainingRequirement: numberFmrV3_(line.Qty_Remaining_Requirement),
    lineStatus: normalizeFmrV3_(line.Line_Status),
    storageLocation: normalizeFmrV3_(line.Storage_Location),
    actionLimits: {
      confirmAvailable: Math.max(0, numberFmrV3_(line.Qty_Not_Yet_Located)),
      bag: Math.max(
        0,
        numberFmrV3_(line.Qty_Available) +
        numberFmrV3_(line.Qty_Not_Yet_Located)
      ),
      directIssue: Math.max(0, numberFmrV3_(line.Qty_Not_Yet_Located)),
      issueAvailable: Math.max(0, numberFmrV3_(line.Qty_Available)),
      backorder: Math.max(
        0,
        requested - confirmed - pending - confirmedBackorder
      )
    },
    activeBags: activeBags || [],
    returnedBackorders: returnedBackorders || []
  };
}

function searchPublishedFmrV3_(userEmail, query, mode) {
  const user = assertSearchUserFmrV3_(userEmail);
  const keys = normalizeSearchRequestFmrV3_(query, mode);

  let entries = [];

  keys.some(function (key) {
    const found = lookupIndexEntriesFmrV3_(
      FMR_V3.SHEETS.SEARCH_INDEX,
      key
    );

    if (found.length) {
      entries = found;
      return true;
    }

    return false;
  });

  if (!entries.length) {
    return {
      generatedAt: formatDateTimeFmrV3_(nowFmrV3_()),
      user: user,
      query: normalizeFmrV3_(query),
      resultCount: 0,
      cards: []
    };
  }

  const lines = readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.LINES,
    entries.map(function (entry) { return entry.Line_Row; })
  ).filter(function (line) { return yesFmrV3_(line.Active); });

  const headers = readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.HEADERS,
    entries.map(function (entry) { return entry.Header_Row; })
  ).filter(function (header) { return yesFmrV3_(header.Active); });

  const headersById = {};
  headers.forEach(function (header) {
    headersById[normalizeFmrV3_(header.FMR_ID)] = header;
  });

  const lineIds = lines.map(function (line) {
    return normalizeFmrV3_(line.FMR_Line_ID);
  });

  const bagsByLine = getActiveBagsByLineIdsFmrV3_(lineIds);
  const returnedByLine = getReturnedBackordersByLineIdsFmrV3_(lineIds);
  const grouped = {};

  lines.forEach(function (line) {
    const fmrId = normalizeFmrV3_(line.FMR_ID);
    const header = headersById[fmrId];
    if (!header) return;

    if (!grouped[fmrId]) {
      grouped[fmrId] = {
        fmrId: fmrId,
        fmrNumber: normalizeFmrV3_(header.FMR_Number),
        iwpNumber: normalizeFmrV3_(header.IWP_Number),
        requestedBy: normalizeFmrV3_(header.Requested_By),
        dateRequired: formatDateTimeFmrV3_(header.Date_Required),
        priority: normalizeFmrV3_(header.Priority),
        status: normalizeFmrV3_(header.Current_Status),
        notes: normalizeFmrV3_(header.Notes),
        totals: serializeHeaderTotalsFmrV3_(header),
        materials: []
      };
    }

    const lineId = normalizeFmrV3_(line.FMR_Line_ID);
    grouped[fmrId].materials.push(
      serializeLineForPortalFmrV3_(
        line,
        bagsByLine[lineId] || [],
        returnedByLine[lineId] || []
      )
    );
  });

  const cards = Object.values(grouped).sort(function (a, b) {
    return a.fmrNumber.localeCompare(
      b.fmrNumber,
      undefined,
      {numeric: true, sensitivity: 'base'}
    );
  });

  return {
    generatedAt: formatDateTimeFmrV3_(nowFmrV3_()),
    user: user,
    query: normalizeFmrV3_(query),
    resultCount: cards.length,
    cards: cards
  };
}
