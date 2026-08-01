/**
 * Indexed Active Bag & Tag queue for the Admin operational rail.
 *
 * Each result represents one active Bag Tag item. The service reads only
 * Operational_Index entries and the referenced Bag Tag rows.
 */
function getAdminActiveBagQueueFmrV3_(userEmail, request) {
  const user = assertSearchUserFmrV3_(userEmail);
  const options = normalizeAdminActiveBagRequestFmrV3_(request);

  const entries = lookupOperationalRowsFmrV3_(
    'BAGSTATUS',
    'ACTIVE'
  );

  const headers = readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.BAG_HEADERS,
    entries.map(function (entry) {
      return entry.Row_Number;
    })
  );

  const items = readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.BAG_ITEMS,
    entries.map(function (entry) {
      return entry.Secondary_Row_Number;
    })
  );

  const headersByRow = {};
  const itemsByRow = {};

  headers.forEach(function (header) {
    headersByRow[header._rowNumber] = header;
  });

  items.forEach(function (item) {
    itemsByRow[item._rowNumber] = item;
  });

  const seen = {};
  let records = [];

  entries.forEach(function (entry) {
    const header = headersByRow[
      numberFmrV3_(entry.Row_Number)
    ];

    const item = itemsByRow[
      numberFmrV3_(entry.Secondary_Row_Number)
    ];

    if (!header || !item) {
      return;
    }

    const bagTagId = normalizeFmrV3_(
      header.Bag_Tag_ID
    );

    const bagTagItemId = normalizeFmrV3_(
      item.Bag_Tag_Item_ID
    );

    const compositeKey =
      bagTagId + '|' + bagTagItemId;

    if (
      !bagTagId ||
      !bagTagItemId ||
      seen[compositeKey]
    ) {
      return;
    }

    seen[compositeKey] = true;

    const headerStatus = normalizeUpperFmrV3_(
      header.Status
    );

    const quantityRemaining = numberFmrV3_(
      item.Qty_Remaining_In_Bag
    );

    if (
      quantityRemaining <= 0 ||
      !['ACTIVE', 'PARTIALLY ISSUED'].includes(
        headerStatus
      )
    ) {
      return;
    }

    const readiness =
      headerStatus === 'PARTIALLY ISSUED'
        ? 'PARTIALLY_ISSUED'
        : 'READY_FOR_FIELD';

    records.push({
      bagTagId: bagTagId,
      bagTagItemId: bagTagItemId,
      tagNumber: normalizeFmrV3_(
        header.Tag_Number
      ),
      fmrId: normalizeFmrV3_(
        header.FMR_ID
      ),
      fmrNumber: normalizeFmrV3_(
        header.FMR_Number
      ),
      fmrLineId: normalizeFmrV3_(
        item.FMR_Line_ID
      ),
      isoKey: normalizeFmrV3_(
        header.ISO_Key
      ),
      commodityCode: normalizeFmrV3_(
        item.Commodity_Code
      ),
      size: normalizeFmrV3_(
        item.Size
      ),
      materialDescription: normalizeFmrV3_(
        item.Material_Description
      ),
      storageLocation: normalizeFmrV3_(
        header.Storage_Location
      ),
      qtyBagged: numberFmrV3_(
        item.Qty_Bagged
      ),
      qtyIssued: numberFmrV3_(
        item.Qty_Issued_From_Bag
      ),
      qtyRemaining: quantityRemaining,
      uom: normalizeFmrV3_(
        item.UOM
      ),
      status: normalizeFmrV3_(
        header.Status
      ),
      readiness: readiness,
      readinessLabel:
        readiness === 'READY_FOR_FIELD'
          ? 'Ready for Field'
          : 'Partially Issued',
      baggedBy: normalizeFmrV3_(
        header.Bagged_By_Name
      ),
      baggedAt: formatDateTimeFmrV3_(
        header.Bagged_At
      ),
      notes: normalizeFmrV3_(
        header.Notes
      ),
      _sortTime:
        adminActiveBagDateValueFmrV3_(
          header.Bagged_At
        )
    });
  });

  const allActiveRecords = records.slice();

  if (options.query) {
    const query = normalizeUpperFmrV3_(
      options.query
    );

    records = records.filter(function (record) {
      return [
        record.tagNumber,
        record.fmrNumber,
        record.isoKey,
        record.commodityCode,
        record.materialDescription,
        record.storageLocation
      ].some(function (value) {
        return normalizeUpperFmrV3_(value)
          .indexOf(query) !== -1;
      });
    });
  }

  if (options.readiness !== 'ALL') {
    records = records.filter(function (record) {
      return record.readiness ===
        options.readiness;
    });
  }

  records.sort(function (left, right) {
    let comparison =
      left._sortTime - right._sortTime;

    if (comparison === 0) {
      comparison =
        left.tagNumber.localeCompare(
          right.tagNumber,
          undefined,
          {
            numeric: true,
            sensitivity: 'base'
          }
        );
    }

    return options.sortOrder === 'NEWEST_FIRST'
      ? -comparison
      : comparison;
  });

  const totalRecords = records.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / options.pageSize)
  );

  const page = Math.min(
    options.page,
    totalPages
  );

  const startIndex =
    (page - 1) * options.pageSize;

  const pageRecords = records
    .slice(
      startIndex,
      startIndex + options.pageSize
    )
    .map(function (record) {
      const serialized = Object.assign(
        {},
        record
      );

      delete serialized._sortTime;
      return serialized;
    });

  const activeTagIds = {};

  allActiveRecords.forEach(function (record) {
    activeTagIds[record.bagTagId] = true;
  });

  return {
    generatedAt: formatDateTimeFmrV3_(
      nowFmrV3_()
    ),
    user: user,
    request: {
      query: options.query,
      readiness: options.readiness,
      sortOrder: options.sortOrder
    },
    summary: {
      indexedEntries: entries.length,
      activeTags: Object.keys(
        activeTagIds
      ).length,
      activeItems: allActiveRecords.length,
      matchingItems: totalRecords
    },
    pagination: {
      page: page,
      pageSize: options.pageSize,
      totalRecords: totalRecords,
      totalPages: totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
      firstRecord:
        totalRecords ? startIndex + 1 : 0,
      lastRecord: Math.min(
        startIndex + options.pageSize,
        totalRecords
      )
    },
    records: pageRecords
  };
}

function normalizeAdminActiveBagRequestFmrV3_(
  request
) {
  const source = request || {};

  const readiness = normalizeUpperFmrV3_(
    source.readiness || 'ALL'
  );

  const sortOrder = normalizeUpperFmrV3_(
    source.sortOrder || 'OLDEST_FIRST'
  );

  const allowedReadiness = [
    'ALL',
    'READY_FOR_FIELD',
    'PARTIALLY_ISSUED'
  ];

  return {
    query: normalizeFmrV3_(source.query),
    readiness:
      allowedReadiness.includes(readiness)
        ? readiness
        : 'ALL',
    sortOrder:
      sortOrder === 'NEWEST_FIRST'
        ? 'NEWEST_FIRST'
        : 'OLDEST_FIRST',
    page: Math.max(
      1,
      Math.floor(
        numberFmrV3_(source.page) || 1
      )
    ),
    pageSize: Math.max(
      5,
      Math.min(
        50,
        Math.floor(
          numberFmrV3_(
            source.pageSize
          ) || 10
        )
      )
    )
  };
}

function adminActiveBagDateValueFmrV3_(
  value
) {
  if (!value) {
    return 0;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return Number.isNaN(date.getTime())
    ? 0
    : date.getTime();
}