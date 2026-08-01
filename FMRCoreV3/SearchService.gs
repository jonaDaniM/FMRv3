function sheetFmrV3_(sheetName) {
  const sheet = fmrV3Database_().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Missing required sheet: ${sheetName}`);
  return sheet;
}

function expectedHeadersFmrV3_(sheetName) {
  const headers = FMR_V3_HEADERS[sheetName];
  if (!headers) throw new Error(`No header contract is defined for ${sheetName}.`);
  return headers.slice();
}

function headerMapFmrV3_(sheetName) {
  if (FMR_V3_HEADER_MAP_CACHE_[sheetName]) {
    return FMR_V3_HEADER_MAP_CACHE_[sheetName];
  }

  const expected = expectedHeadersFmrV3_(sheetName);
  const actual = sheetFmrV3_(sheetName)
    .getRange(1, 1, 1, expected.length)
    .getDisplayValues()[0]
    .map(normalizeFmrV3_);

  expected.forEach(function (header, index) {
    if (actual[index] !== header) {
      throw new Error(
        `${sheetName} header mismatch at column ${index + 1}. ` +
        `Expected "${header}", found "${actual[index]}".`
      );
    }
  });

  const indexByHeader = {};
  expected.forEach(function (header, index) {
    indexByHeader[header] = index;
  });

  const result = {headers: expected, indexByHeader: indexByHeader};
  FMR_V3_HEADER_MAP_CACHE_[sheetName] = result;
  return result;
}

function ensureAppendCapacityFmrV3_(sheet, requiredRows) {
  const requested = Math.max(1, numberFmrV3_(requiredRows));
  const needed = sheet.getLastRow() + requested;
  const maximum = sheet.getMaxRows();

  if (needed > maximum) {
    sheet.insertRowsAfter(maximum, Math.max(needed - maximum + 1000, requested));
  }
}

function appendObjectFmrV3_(sheetName, record) {
  return appendObjectsFmrV3_(sheetName, [record])[0];
}

function appendObjectsFmrV3_(sheetName, records) {
  const source = Array.isArray(records) ? records : [];
  if (!source.length) return [];

  const sheet = sheetFmrV3_(sheetName);
  const contract = headerMapFmrV3_(sheetName);
  ensureAppendCapacityFmrV3_(sheet, source.length);

  const startRow = Math.max(2, sheet.getLastRow() + 1);
  const values = source.map(function (record) {
    return contract.headers.map(function (header) {
      return record && Object.prototype.hasOwnProperty.call(record, header)
        ? record[header]
        : '';
    });
  });

  sheet.getRange(startRow, 1, values.length, contract.headers.length)
    .setValues(values);

  return values.map(function (_, index) {
    return startRow + index;
  });
}

function readRowObjectFmrV3_(sheetName, rowNumber) {
  const row = numberFmrV3_(rowNumber);
  if (row < 2) throw new Error(`Invalid row ${rowNumber} for ${sheetName}.`);

  const contract = headerMapFmrV3_(sheetName);
  const values = sheetFmrV3_(sheetName)
    .getRange(row, 1, 1, contract.headers.length)
    .getValues()[0];

  const record = {_rowNumber: row};
  contract.headers.forEach(function (header, index) {
    record[header] = values[index];
  });
  return record;
}

function readRowsObjectsFmrV3_(sheetName, rowNumbers) {
  const rows = Array.from(new Set(
    (rowNumbers || [])
      .map(numberFmrV3_)
      .filter(function (value) { return value >= 2; })
  )).sort(function (a, b) { return a - b; });

  if (!rows.length) return [];

  const groups = [];
  rows.forEach(function (row) {
    const current = groups.length ? groups[groups.length - 1] : null;
    if (current && row === current.end + 1) {
      current.end = row;
    } else {
      groups.push({start: row, end: row});
    }
  });

  const contract = headerMapFmrV3_(sheetName);
  const sheet = sheetFmrV3_(sheetName);
  const result = [];

  groups.forEach(function (group) {
    const count = group.end - group.start + 1;
    const values = sheet.getRange(
      group.start, 1, count, contract.headers.length
    ).getValues();

    values.forEach(function (rowValues, index) {
      const record = {_rowNumber: group.start + index};
      contract.headers.forEach(function (header, columnIndex) {
        record[header] = rowValues[columnIndex];
      });
      result.push(record);
    });
  });

  return result;
}

function updateRowObjectFmrV3_(sheetName, rowNumber, patch) {
  const record = readRowObjectFmrV3_(sheetName, rowNumber);
  const contract = headerMapFmrV3_(sheetName);

  Object.keys(patch || {}).forEach(function (field) {
    if (Object.prototype.hasOwnProperty.call(contract.indexByHeader, field)) {
      record[field] = patch[field];
    }
  });

  const values = contract.headers.map(function (header) {
    return record[header];
  });

  sheetFmrV3_(sheetName)
    .getRange(numberFmrV3_(rowNumber), 1, 1, values.length)
    .setValues([values]);

  return Object.assign({}, record, patch || {});
}

function findRowsByExactValueFmrV3_(sheetName, columnNumber, value) {
  const target = normalizeFmrV3_(value);
  if (!target) return [];

  const sheet = sheetFmrV3_(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet
    .getRange(2, numberFmrV3_(columnNumber), lastRow - 1, 1)
    .createTextFinder(target)
    .matchEntireCell(true)
    .findAll()
    .map(function (range) { return range.getRow(); });
}

function getUsedRowsFmrV3_(sheetName) {
  const sheet = sheetFmrV3_(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const contract = headerMapFmrV3_(sheetName);
  const values = sheet.getRange(
    2, 1, lastRow - 1, contract.headers.length
  ).getValues();

  return values.map(function (rowValues, index) {
    const record = {_rowNumber: index + 2};
    contract.headers.forEach(function (header, columnIndex) {
      record[header] = rowValues[columnIndex];
    });
    return record;
  }).filter(function (record) {
    return contract.headers.some(function (header) {
      return record[header] !== '' && record[header] !== null;
    });
  });
}

function deleteAppendedRowsFmrV3_(sheetName, rowNumbers) {
  const rows = Array.from(new Set(
    (rowNumbers || [])
      .map(numberFmrV3_)
      .filter(function (value) { return value >= 2; })
  )).sort(function (a, b) { return b - a; });

  const sheet = sheetFmrV3_(sheetName);
  rows.forEach(function (row) {
    if (row <= sheet.getLastRow()) sheet.deleteRow(row);
  });
}
