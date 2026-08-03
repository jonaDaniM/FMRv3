const FMR_V3_BULK_IMPORT =
  Object.freeze({
    sheets:
      Object.freeze({
        BATCHES:
          'Bulk_Import_Batches',

        ITEMS:
          'Bulk_Import_Items',

        LINES:
          'Bulk_Import_Lines',

        ISSUES:
          'Bulk_Import_Issues'
      }),

    status:
      Object.freeze({
        PARSING:
          'PARSING',

        REVIEW:
          'REVIEW',

        VALID:
          'VALID',

        WARNING:
          'WARNING',

        BLOCKED:
          'BLOCKED',

        STAGED:
          'STAGED',

        PARTIALLY_STAGED:
          'PARTIALLY_STAGED',

        SUPERSEDED:
          'SUPERSEDED',

        FAILED:
          'FAILED'
      }),

    severity:
      Object.freeze({
        ERROR:
          'ERROR',

        WARNING:
          'WARNING',

        INFO:
          'INFO'
      }),

    sourceTypes:
      Object.freeze({
        UPLOAD:
          'UPLOAD',

        GOOGLE_SHEET:
          'GOOGLE_SHEET'
      }),

    limits:
      Object.freeze({
        MAX_UPLOAD_BYTES:
          8 * 1024 * 1024,

        MAX_WORKSHEETS:
          100,

        MAX_LINES_PER_FMR:
          35,

        MAX_TOTAL_LINES:
          3500
      }),

    parserVersion:
      'ALPHA17_FRACTION_SIZE_V2',

    settings:
      Object.freeze({
        IMPORT_SOURCE_FOLDER_ID:
          Object.freeze({
            defaultValue:
              '',

            description:
              'Internal Google Drive folder used for uploaded bulk-import source files.',

            editable:
              false
          })
      }),

    issueCodes:
      Object.freeze({
        FORM_MARKER_MISSING:
          'FORM_MARKER_MISSING',

        MATERIAL_HEADER_MISSING:
          'MATERIAL_HEADER_MISSING',

        OFFICIAL_FMR_MISSING:
          'OFFICIAL_FMR_MISSING',

        IWP_MISSING:
          'IWP_MISSING',

        ISO_NUMBER_MISSING:
          'ISO_NUMBER_MISSING',

        ISO_SHEET_MISSING:
          'ISO_SHEET_MISSING',

        ISO_SHEET_SUFFIX_MISSING:
          'ISO_SHEET_SUFFIX_MISSING',

        SHT_SOURCE_IGNORED:
          'SHT_SOURCE_IGNORED',

        MATERIAL_LINES_MISSING:
          'MATERIAL_LINES_MISSING',

        LINE_LIMIT_EXCEEDED:
          'LINE_LIMIT_EXCEEDED',

        COMMODITY_MISSING:
          'COMMODITY_MISSING',

        SIZE_MISSING:
          'SIZE_MISSING',

        SIZE_DATE_COERCION_REPAIRED:
          'SIZE_DATE_COERCION_REPAIRED',

        DESCRIPTION_MISSING:
          'DESCRIPTION_MISSING',

        QUANTITY_INVALID:
          'QUANTITY_INVALID',

        DUPLICATE_IN_BATCH:
          'DUPLICATE_IN_BATCH',

        ALREADY_PUBLISHED:
          'ALREADY_PUBLISHED',

        ALREADY_STAGED:
          'ALREADY_STAGED',

        REQUESTED_BY_BLANK:
          'REQUESTED_BY_BLANK',

        DELIVER_TO_BLANK:
          'DELIVER_TO_BLANK',

        DATE_REQUIRED_BLANK:
          'DATE_REQUIRED_BLANK',

        DESTINATION_BLANK:
          'DESTINATION_BLANK',

        WAREHOUSE_BLANK:
          'WAREHOUSE_BLANK',

        CRAFT_BLANK:
          'CRAFT_BLANK',

        REVISION_BLANK:
          'REVISION_BLANK',

        HISTORICAL_ACTIVITY_IGNORED:
          'HISTORICAL_ACTIVITY_IGNORED'
      })
  });

function bulkImportSheetDefinitionsFmrV3_() {
  return [
    {
      name:
        FMR_V3_BULK_IMPORT
          .sheets
          .BATCHES,

      headers:
        FMR_V3_HEADERS[
          FMR_V3_BULK_IMPORT
            .sheets
            .BATCHES
        ]
    },
    {
      name:
        FMR_V3_BULK_IMPORT
          .sheets
          .ITEMS,

      headers:
        FMR_V3_HEADERS[
          FMR_V3_BULK_IMPORT
            .sheets
            .ITEMS
        ]
    },
    {
      name:
        FMR_V3_BULK_IMPORT
          .sheets
          .LINES,

      headers:
        FMR_V3_HEADERS[
          FMR_V3_BULK_IMPORT
            .sheets
            .LINES
        ]
    },
    {
      name:
        FMR_V3_BULK_IMPORT
          .sheets
          .ISSUES,

      headers:
        FMR_V3_HEADERS[
          FMR_V3_BULK_IMPORT
            .sheets
            .ISSUES
        ]
    }
  ];
}

function ensureBulkImportSheetFmrV3_(
  sheetName,
  headers
) {
  const spreadsheet =
    fmrV3Database_();

  let sheet =
    spreadsheet.getSheetByName(
      sheetName
    );

  if (!sheet) {
    sheet =
      spreadsheet.insertSheet(
        sheetName
      );
  }

  if (
    sheet.getMaxColumns() <
    headers.length
  ) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      headers.length -
      sheet.getMaxColumns()
    );
  }

  const current =
    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .getDisplayValues()[0]
      .map(
        function (
          value
        ) {
          return normalizeFmrV3_(
            value
          );
        }
      );

  headers.forEach(
    function (
      header,
      index
    ) {
      const existing =
        current[
          index
        ];

      if (
        existing &&
        existing !== header
      ) {
        throw new Error(
          (
            sheetName +
            ' header mismatch at column ' +
            (index + 1) +
            '. Expected "' +
            header +
            '", found "' +
            existing +
            '".'
          )
        );
      }

      if (!existing) {
        sheet
          .getRange(
            1,
            index + 1
          )
          .setValue(
            header
          );
      }
    }
  );

  sheet.setFrozenRows(
    1
  );

  FMR_V3_HEADER_MAP_CACHE_[
    sheetName
  ] = null;

  return {
    sheetName:
      sheetName,

    headerCount:
      headers.length
  };
}

function ensureBulkImportConfigurationFmrV3_() {
  const sheet =
    sheetFmrV3_(
      FMR_V3.SHEETS.CONFIG
    );

  const rows =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.CONFIG
    );

  const bySetting = {};

  rows.forEach(
    function (
      row
    ) {
      bySetting[
        normalizeUpperFmrV3_(
          row.Setting
        )
      ] = row;
    }
  );

  const inserted = [];

  Object.keys(
    FMR_V3_BULK_IMPORT
      .settings
  ).forEach(
    function (
      key
    ) {
      if (
        bySetting[
          key
        ]
      ) {
        return;
      }

      const definition =
        FMR_V3_BULK_IMPORT
          .settings[
            key
          ];

      sheet.appendRow([
        key,
        definition
          .defaultValue,
        definition
          .description,
        definition
          .editable
          ? FMR_V3.YES
          : FMR_V3.NO
      ]);

      inserted.push(
        key
      );
    }
  );

  invalidateConfigurationCacheFmrV3_();

  return {
    inserted:
      inserted
  };
}

function setBulkImportConfigurationValueFmrV3_(
  key,
  value
) {
  const normalizedKey =
    normalizeUpperFmrV3_(
      key
    );

  const row =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.CONFIG
    ).find(
      function (
        item
      ) {
        return (
          normalizeUpperFmrV3_(
            item.Setting
          ) ===
          normalizedKey
        );
      }
    );

  if (!row) {
    throw new Error(
      'Missing configuration setting: ' +
      normalizedKey
    );
  }

  sheetFmrV3_(
    FMR_V3.SHEETS.CONFIG
  )
    .getRange(
      row._rowNumber,
      2
    )
    .setValue(
      value
    );

  invalidateConfigurationCacheFmrV3_();

  return value;
}

function bulkImportDigestFmrV3_(
  value
) {
  const bytes =
    value instanceof Array
      ? value
      : Utilities.newBlob(
          normalizeFmrV3_(
            value
          )
        ).getBytes();

  return Utilities
    .base64EncodeWebSafe(
      Utilities.computeDigest(
        Utilities
          .DigestAlgorithm
          .SHA_256,
        bytes
      )
    )
    .replace(
      /=+$/g,
      ''
    );
}

function bulkImportFingerprintFmrV3_(
  value
) {
  return bulkImportDigestFmrV3_(
    value
  ).slice(
    0,
    24
  );
}

function normalizeBulkImportLabelFmrV3_(
  value
) {
  return normalizeUpperFmrV3_(
    value
  )
    .replace(
      /\s+/g,
      ' '
    )
    .replace(
      /\s*:\s*$/,
      ''
    )
    .trim();
}

function bulkImportCellLooksLikeKnownLabelFmrV3_(
  value
) {
  const normalized =
    normalizeUpperFmrV3_(
      value
    )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();

  return /^(DESTINATION|WAREHOUSE|REQUESTED BY|CRAFT|IWP|FMR NO\.?|DELIVER TO|DATE REQUIRED|LINE NO|SHT|REV)\s*:/.test(
    normalized
  );
}

function bulkImportExtractLabeledValueFmrV3_(
  displayValues,
  label
) {
  const target =
    normalizeBulkImportLabelFmrV3_(
      label
    );

  const escapedTarget =
    target.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

  const valuePattern =
    new RegExp(
      (
        '^\\s*' +
        escapedTarget +
        '\\s*:?\\s*(.*)$'
      ),
      'i'
    );

  for (
    let rowIndex = 0;
    rowIndex <
      Math.min(
        displayValues.length,
        12
      );
    rowIndex += 1
  ) {
    const row =
      displayValues[
        rowIndex
      ] ||
      [];

    for (
      let columnIndex = 0;
      columnIndex <
        row.length;
      columnIndex += 1
    ) {
      const raw =
        String(
          row[
            columnIndex
          ] == null
            ? ''
            : row[
                columnIndex
              ]
        )
          .replace(
            /\r/g,
            ''
          )
          .trim();

      if (!raw) {
        continue;
      }

      const flattened =
        raw
          .replace(
            /\s+/g,
            ' '
          )
          .trim();

      const match =
        flattened.match(
          valuePattern
        );

      if (!match) {
        continue;
      }

      const inlineValue =
        normalizeFmrV3_(
          match[1]
        );

      if (inlineValue) {
        return inlineValue;
      }

      for (
        let adjacentColumn =
          columnIndex + 1;
        adjacentColumn <
          row.length;
        adjacentColumn += 1
      ) {
        const adjacentValue =
          normalizeFmrV3_(
            row[
              adjacentColumn
            ]
          );

        if (!adjacentValue) {
          continue;
        }

        if (
          bulkImportCellLooksLikeKnownLabelFmrV3_(
            adjacentValue
          )
        ) {
          return '';
        }

        return adjacentValue;
      }

      return '';
    }
  }

  return '';
}

function bulkImportFindMaterialHeaderFmrV3_(
  displayValues
) {
  for (
    let rowIndex = 0;
    rowIndex <
      Math.min(
        displayValues.length,
        20
      );
    rowIndex += 1
  ) {
    const row =
      displayValues[
        rowIndex
      ] ||
      [];

    const byHeader = {};

    row.forEach(
      function (
        value,
        columnIndex
      ) {
        const normalized =
          normalizeBulkImportLabelFmrV3_(
            value
          );

        if (normalized) {
          byHeader[
            normalized
          ] =
            columnIndex;
        }
      }
    );

    if (
      byHeader[
        'COMMODITY CODE'
      ] !== undefined &&
      byHeader[
        'SIZE'
      ] !== undefined &&
      byHeader[
        'QUANTITY'
      ] !== undefined &&
      byHeader[
        'MATERIAL DESCRIPTION'
      ] !== undefined
    ) {
      return {
        rowIndex:
          rowIndex,

        commodityColumn:
          byHeader[
            'COMMODITY CODE'
          ],

        sizeColumn:
          byHeader[
            'SIZE'
          ],

        quantityColumn:
          byHeader[
            'QUANTITY'
          ],

        descriptionColumn:
          byHeader[
            'MATERIAL DESCRIPTION'
          ],

        issuedColumn:
          byHeader[
            'ISSUED'
          ],

        backorderedColumn:
          byHeader[
            'BACK ORDERED'
          ],

        actionColumn:
          byHeader[
            'ACTION TAKEN'
          ]
      };
    }
  }

  return null;
}

function inferBulkImportUomFmrV3_(
  description
) {
  const value =
    normalizeUpperFmrV3_(
      description
    );

  if (
    /^PIPE\b/.test(
      value
    ) &&
    !/^PIPET\b/.test(
      value
    )
  ) {
    return {
      uom:
        'LF',

      rule:
        'DESCRIPTION_STARTS_WITH_PIPE'
    };
  }

  return {
    uom:
      'EA',

    rule:
      'NON_PIPE_OR_PIPET'
  };
}

function splitBulkImportLineIdentityFmrV3_(
  value
) {
  const sourceLineNumber =
    normalizeUpperFmrV3_(
      value
    );

  const match =
    sourceLineNumber.match(
      /^(.*)-([0-9]{2})$/
    );

  if (
    !match ||
    !normalizeFmrV3_(
      match[1]
    )
  ) {
    return {
      valid:
        false,

      sourceLineNumber:
        sourceLineNumber,

      isoNumber:
        sourceLineNumber,

      isoSheet:
        ''
    };
  }

  return {
    valid:
      true,

    sourceLineNumber:
      sourceLineNumber,

    isoNumber:
      normalizeUpperFmrV3_(
        match[1]
      ),

    isoSheet:
      match[2]
  };
}

function isBulkImportDateObjectFmrV3_(
  value
) {
  return Boolean(
    value &&
    typeof value ===
      'object' &&
    typeof value.getTime ===
      'function' &&
    !Number.isNaN(
      value.getTime()
    )
  );
}

function parseBulkImportSerializedDateFmrV3_(
  value
) {
  const source =
    normalizeFmrV3_(
      value
    );

  if (!source) {
    return null;
  }

  const fullDatePattern =
    /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT[+-]\d{4}(?:\s+\(.+\))?$/i;

  const slashDatePattern =
    /^\d{1,2}\/\d{1,2}\/\d{4}$/;

  if (
    !fullDatePattern.test(
      source
    ) &&
    !slashDatePattern.test(
      source
    )
  ) {
    return null;
  }

  const parsed =
    new Date(
      source
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return parsed;
}

function normalizeBulkImportSizeFmrV3_(
  rawValue,
  displayValue,
  timezone
) {
  const displayed =
    normalizeFmrV3_(
      displayValue
    );

  const rawText =
    normalizeFmrV3_(
      rawValue
    );

  const activeTimezone =
    normalizeFmrV3_(
      timezone
    ) ||
    Session.getScriptTimeZone() ||
    'America/Indiana/Indianapolis';

  let dateValue =
    null;

  let repairRule =
    '';

  let sourceEvidence =
    displayed ||
    rawText;

  if (
    isBulkImportDateObjectFmrV3_(
      rawValue
    )
  ) {
    dateValue =
      rawValue;

    repairRule =
      'DATE_OBJECT_TO_DAY_MONTH_FRACTION';

    sourceEvidence =
      rawText ||
      displayed;
  } else {
    const rawDate =
      parseBulkImportSerializedDateFmrV3_(
        rawText
      );

    const displayedDate =
      parseBulkImportSerializedDateFmrV3_(
        displayed
      );

    if (rawDate) {
      dateValue =
        rawDate;

      repairRule =
        'SERIALIZED_RAW_DATE_TO_DAY_MONTH_FRACTION';

      sourceEvidence =
        rawText;
    } else if (
      displayedDate
    ) {
      dateValue =
        displayedDate;

      repairRule =
        'SERIALIZED_DISPLAY_DATE_TO_DAY_MONTH_FRACTION';

      sourceEvidence =
        displayed;
    }
  }

  if (dateValue) {
    const numerator =
      Utilities.formatDate(
        dateValue,
        activeTimezone,
        'd'
      );

    const denominator =
      Utilities.formatDate(
        dateValue,
        activeTimezone,
        'M'
      );

    return {
      value:
        numerator +
        '/' +
        denominator,

      repaired:
        true,

      sourceDisplay:
        sourceEvidence,

      rule:
        repairRule
    };
  }

  return {
    value:
      displayed ||
      rawText,

    repaired:
      false,

    sourceDisplay:
      sourceEvidence,

    rule:
      'SOURCE_TEXT'
  };
}

function normalizeBulkImportDateFmrV3_(
  value
) {
  const source =
    normalizeFmrV3_(
      value
    );

  if (!source) {
    return '';
  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      source
    )
  ) {
    return source;
  }

  const parsed =
    new Date(
      source
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return source;
  }

  const timezone =
    normalizeFmrV3_(
      getConfigurationFmrV3_()
        .TIMEZONE
    ) ||
    Session.getScriptTimeZone() ||
    'America/Indiana/Indianapolis';

  return Utilities.formatDate(
    parsed,
    timezone,
    'yyyy-MM-dd'
  );
}

function createBulkImportIssueObjectFmrV3_(
  severity,
  code,
  fieldName,
  lineNumber,
  message,
  sourceValue
) {
  return {
    severity:
      normalizeUpperFmrV3_(
        severity
      ),

    code:
      normalizeUpperFmrV3_(
        code
      ),

    fieldName:
      normalizeFmrV3_(
        fieldName
      ),

    lineNumber:
      numberFmrV3_(
        lineNumber
      ),

    message:
      normalizeFmrV3_(
        message
      ),

    sourceValue:
      normalizeFmrV3_(
        sourceValue
      )
  };
}

function bulkImportHasFormMarkerFmrV3_(
  displayValues
) {
  return displayValues
    .slice(
      0,
      8
    )
    .some(
      function (
        row
      ) {
        return (
          row || []
        ).some(
          function (
            value
          ) {
            return normalizeUpperFmrV3_(
              value
            ).includes(
              'FIELD MATERIAL REQUEST'
            );
          }
        );
      }
    );
}

function parseBulkImportWorksheetFmrV3_(
  sheet
) {
  const range =
    sheet.getDataRange();

  const displayValues =
    range.getDisplayValues();

  const rawValues =
    range.getValues();

  const sourceTimezone =
    normalizeFmrV3_(
      sheet
        .getParent()
        .getSpreadsheetTimeZone()
    ) ||
    Session.getScriptTimeZone() ||
    'America/Indiana/Indianapolis';

  const issues = [];

  if (
    !bulkImportHasFormMarkerFmrV3_(
      displayValues
    )
  ) {
    issues.push(
      createBulkImportIssueObjectFmrV3_(
        FMR_V3_BULK_IMPORT
          .severity
          .ERROR,
        FMR_V3_BULK_IMPORT
          .issueCodes
          .FORM_MARKER_MISSING,
        'Worksheet',
        0,
        'Worksheet does not contain the FMR form marker.',
        sheet.getName()
      )
    );
  }

  const header =
    bulkImportFindMaterialHeaderFmrV3_(
      displayValues
    );

  if (!header) {
    issues.push(
      createBulkImportIssueObjectFmrV3_(
        FMR_V3_BULK_IMPORT
          .severity
          .ERROR,
        FMR_V3_BULK_IMPORT
          .issueCodes
          .MATERIAL_HEADER_MISSING,
        'Material Table',
        0,
        'Commodity Code, Size, Quantity, and Material Description headers were not found.',
        ''
      )
    );
  }

  const sourceLineNumber =
    bulkImportExtractLabeledValueFmrV3_(
      displayValues,
      'LINE NO'
    );

  const sourceShtValue =
    bulkImportExtractLabeledValueFmrV3_(
      displayValues,
      'SHT'
    );

  const lineIdentity =
    splitBulkImportLineIdentityFmrV3_(
      sourceLineNumber
    );

  const sourceHeader = {
    destination:
      bulkImportExtractLabeledValueFmrV3_(
        displayValues,
        'DESTINATION'
      ),

    warehouse:
      bulkImportExtractLabeledValueFmrV3_(
        displayValues,
        'WAREHOUSE'
      ),

    requestedBy:
      bulkImportExtractLabeledValueFmrV3_(
        displayValues,
        'REQUESTED BY'
      ),

    craft:
      bulkImportExtractLabeledValueFmrV3_(
        displayValues,
        'CRAFT'
      ),

    iwpNumber:
      bulkImportExtractLabeledValueFmrV3_(
        displayValues,
        'IWP'
      ),

    officialFmrNumber:
      bulkImportExtractLabeledValueFmrV3_(
        displayValues,
        'FMR NO.'
      ),

    deliverTo:
      bulkImportExtractLabeledValueFmrV3_(
        displayValues,
        'DELIVER TO'
      ),

    dateRequired:
      normalizeBulkImportDateFmrV3_(
        bulkImportExtractLabeledValueFmrV3_(
          displayValues,
          'DATE REQUIRED'
        )
      ),

    sourceLineNumber:
      lineIdentity
        .sourceLineNumber,

    sourceShtValue:
      sourceShtValue,

    isoNumber:
      lineIdentity
        .isoNumber,

    isoSheet:
      lineIdentity
        .isoSheet,

    isoRevision:
      bulkImportExtractLabeledValueFmrV3_(
        displayValues,
        'REV'
      ),

    priority:
      ''
  };

  [
    {
      value:
        sourceHeader
          .officialFmrNumber,

      code:
        FMR_V3_BULK_IMPORT
          .issueCodes
          .OFFICIAL_FMR_MISSING,

      field:
        'Official FMR Number',

      message:
        'Official FMR Number is missing.'
    },
    {
      value:
        sourceHeader
          .iwpNumber,

      code:
        FMR_V3_BULK_IMPORT
          .issueCodes
          .IWP_MISSING,

      field:
        'IWP Number',

      message:
        'IWP Number is missing.'
    },
    {
      value:
        sourceHeader
          .isoNumber,

      code:
        FMR_V3_BULK_IMPORT
          .issueCodes
          .ISO_NUMBER_MISSING,

      field:
        'ISO Number',

      message:
        'ISO/Line Number is missing.'
    },
    {
      value:
        sourceHeader
          .isoSheet,

      code:
        FMR_V3_BULK_IMPORT
          .issueCodes
          .ISO_SHEET_SUFFIX_MISSING,

      field:
        'LINE NO',

      message:
        'LINE NO must end with a two-digit -## sheet suffix.'
    }
  ].forEach(
    function (
      definition
    ) {
      if (
        !normalizeFmrV3_(
          definition.value
        )
      ) {
        issues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .ERROR,
            definition.code,
            definition.field,
            0,
            definition.message,
            definition.value
          )
        );
      }
    }
  );

  [
    {
      value:
        sourceHeader
          .requestedBy,

      code:
        FMR_V3_BULK_IMPORT
          .issueCodes
          .REQUESTED_BY_BLANK,

      field:
        'Requested By'
    },
    {
      value:
        sourceHeader
          .deliverTo,

      code:
        FMR_V3_BULK_IMPORT
          .issueCodes
          .DELIVER_TO_BLANK,

      field:
        'Deliver To'
    },
    {
      value:
        sourceHeader
          .dateRequired,

      code:
        FMR_V3_BULK_IMPORT
          .issueCodes
          .DATE_REQUIRED_BLANK,

      field:
        'Date Required'
    },
    {
      value:
        sourceHeader
          .destination,

      code:
        FMR_V3_BULK_IMPORT
          .issueCodes
          .DESTINATION_BLANK,

      field:
        'Destination'
    },
    {
      value:
        sourceHeader
          .warehouse,

      code:
        FMR_V3_BULK_IMPORT
          .issueCodes
          .WAREHOUSE_BLANK,

      field:
        'Warehouse'
    },
    {
      value:
        sourceHeader
          .craft,

      code:
        FMR_V3_BULK_IMPORT
          .issueCodes
          .CRAFT_BLANK,

      field:
        'Craft'
    },
    {
      value:
        sourceHeader
          .isoRevision,

      code:
        FMR_V3_BULK_IMPORT
          .issueCodes
          .REVISION_BLANK,

      field:
        'Revision'
    }
  ].forEach(
    function (
      definition
    ) {
      if (
        !normalizeFmrV3_(
          definition.value
        )
      ) {
        issues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .WARNING,
            definition.code,
            definition.field,
            0,
            (
              definition.field +
              ' is blank and will remain blank.'
            ),
            ''
          )
        );
      }
    }
  );

  if (
    sourceHeader
      .sourceShtValue
  ) {
    issues.push(
      createBulkImportIssueObjectFmrV3_(
        FMR_V3_BULK_IMPORT
          .severity
          .WARNING,
        FMR_V3_BULK_IMPORT
          .issueCodes
          .SHT_SOURCE_IGNORED,
        'SHT',
        0,
        (
          'The source SHT field is not used. Operational sheet ' +
          'is derived from the final -## suffix in LINE NO.'
        ),
        sourceHeader
          .sourceShtValue
      )
    );
  }

  const lines = [];

  if (header) {
    for (
      let rowIndex =
        header.rowIndex + 1;
      rowIndex <
        displayValues.length;
      rowIndex += 1
    ) {
      const displayRow =
        displayValues[
          rowIndex
        ] ||
        [];

      const rawRow =
        rawValues[
          rowIndex
        ] ||
        [];

      if (
        displayRow.some(
          function (
            value
          ) {
            return (
              normalizeUpperFmrV3_(
                value
              ) ===
              'REASON REQUIRED'
            );
          }
        )
      ) {
        break;
      }

      const commodity =
        normalizeFmrV3_(
          displayRow[
            header
              .commodityColumn
          ]
        );

      const sizeNormalization =
        normalizeBulkImportSizeFmrV3_(
          rawRow[
            header
              .sizeColumn
          ],
          displayRow[
            header
              .sizeColumn
          ],
          sourceTimezone
        );

      const size =
        sizeNormalization
          .value;

      const description =
        normalizeFmrV3_(
          displayRow[
            header
              .descriptionColumn
          ]
        );

      const rawQuantity =
        rawRow[
          header
            .quantityColumn
        ];

      const displayQuantity =
        normalizeFmrV3_(
          displayRow[
            header
              .quantityColumn
          ]
        );

      if (
        !commodity &&
        !size &&
        !description &&
        !displayQuantity
      ) {
        continue;
      }

      const lineNumber =
        lines.length + 1;

      const quantity =
        numberFmrV3_(
          rawQuantity !== '' &&
          rawQuantity !== null
            ? rawQuantity
            : displayQuantity
        );

      const inferred =
        inferBulkImportUomFmrV3_(
          description
        );

      const lineIssues = [];

      if (
        sizeNormalization
          .repaired
      ) {
        lineIssues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .INFO,
            FMR_V3_BULK_IMPORT
              .issueCodes
              .SIZE_DATE_COERCION_REPAIRED,
            'Size',
            lineNumber,
            (
              'Google conversion changed a fractional Size into a date. ' +
              'The value was restored to "' +
              size +
              '".'
            ),
            sizeNormalization
              .sourceDisplay
          )
        );
      }

      if (!commodity) {
        lineIssues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .ERROR,
            FMR_V3_BULK_IMPORT
              .issueCodes
              .COMMODITY_MISSING,
            'Commodity Code',
            lineNumber,
            'Commodity Code is missing.',
            ''
          )
        );
      }

      if (!size) {
        lineIssues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .ERROR,
            FMR_V3_BULK_IMPORT
              .issueCodes
              .SIZE_MISSING,
            'Size',
            lineNumber,
            'Size is missing.',
            ''
          )
        );
      }

      if (!description) {
        lineIssues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .ERROR,
            FMR_V3_BULK_IMPORT
              .issueCodes
              .DESCRIPTION_MISSING,
            'Material Description',
            lineNumber,
            'Material Description is missing.',
            ''
          )
        );
      }

      if (
        quantity <= 0
      ) {
        lineIssues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .ERROR,
            FMR_V3_BULK_IMPORT
              .issueCodes
              .QUANTITY_INVALID,
            'Quantity',
            lineNumber,
            'Quantity must be greater than zero.',
            displayQuantity
          )
        );
      }

      const legacyIssued =
        header.issuedColumn ===
          undefined
          ? ''
          : normalizeFmrV3_(
              displayRow[
                header
                  .issuedColumn
              ]
            );

      const legacyBackordered =
        header.backorderedColumn ===
          undefined
          ? ''
          : normalizeFmrV3_(
              displayRow[
                header
                  .backorderedColumn
              ]
            );

      const legacyAction =
        header.actionColumn ===
          undefined
          ? ''
          : normalizeFmrV3_(
              displayRow[
                header
                  .actionColumn
              ]
            );

      if (
        legacyIssued ||
        legacyBackordered ||
        legacyAction
      ) {
        lineIssues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .WARNING,
            FMR_V3_BULK_IMPORT
              .issueCodes
              .HISTORICAL_ACTIVITY_IGNORED,
            'Historical Activity',
            lineNumber,
            'Historical Issued, Back Ordered, or Action Taken values will be preserved as source evidence only and will not create transactions.',
            [
              legacyIssued,
              legacyBackordered,
              legacyAction
            ].join(
              ' | '
            )
          )
        );
      }

      issues.push.apply(
        issues,
        lineIssues
      );

      lines.push({
        lineNumber:
          lineNumber,

        sourceRow:
          rowIndex + 1,

        commodityCode:
          commodity,

        size:
          size,

        qtyRequested:
          quantity,

        description:
          description,

        uom:
          inferred.uom,

        uomRule:
          inferred.rule,

        legacyIssued:
          legacyIssued,

        legacyBackordered:
          legacyBackordered,

        legacyAction:
          legacyAction,

        validationErrors:
          lineIssues
            .filter(
              function (
                issue
              ) {
                return (
                  issue.severity ===
                  FMR_V3_BULK_IMPORT
                    .severity
                    .ERROR
                );
              }
            )
            .map(
              function (
                issue
              ) {
                return issue.message;
              }
            )
            .join(
              ' | '
            )
      });
    }
  }

  if (
    lines.length === 0
  ) {
    issues.push(
      createBulkImportIssueObjectFmrV3_(
        FMR_V3_BULK_IMPORT
          .severity
          .ERROR,
        FMR_V3_BULK_IMPORT
          .issueCodes
          .MATERIAL_LINES_MISSING,
        'Material Lines',
        0,
        'No material lines were detected.',
        ''
      )
    );
  }

  if (
    lines.length >
    FMR_V3_BULK_IMPORT
      .limits
      .MAX_LINES_PER_FMR
  ) {
    issues.push(
      createBulkImportIssueObjectFmrV3_(
        FMR_V3_BULK_IMPORT
          .severity
          .ERROR,
        FMR_V3_BULK_IMPORT
          .issueCodes
          .LINE_LIMIT_EXCEEDED,
        'Material Lines',
        0,
        (
          lines.length +
          ' material lines exceed the configured maximum of ' +
          FMR_V3_BULK_IMPORT
            .limits
            .MAX_LINES_PER_FMR +
          '.'
        ),
        lines.length
      )
    );
  }

  const contentPayload = {
    worksheetName:
      sheet.getName(),

    sourceHeader:
      sourceHeader,

    lines:
      lines.map(
        function (
          line
        ) {
          return {
            commodityCode:
              line.commodityCode,

            size:
              line.size,

            qtyRequested:
              line.qtyRequested,

            description:
              line.description,

            uom:
              line.uom
          };
        }
      )
  };

  return {
    worksheetId:
      String(
        sheet.getSheetId()
      ),

    worksheetName:
      sheet.getName(),

    sourceHeader:
      sourceHeader,

    lines:
      lines,

    issues:
      issues,

    contentFingerprint:
      bulkImportFingerprintFmrV3_(
        JSON.stringify(
          contentPayload
        )
      )
  };
}

function ensureBulkImportSourceFolderFmrV3_(
  owner
) {
  const configuration =
    getConfigurationFmrV3_();

  const existingId =
    normalizeFmrV3_(
      configuration
        .IMPORT_SOURCE_FOLDER_ID
    );

  if (existingId) {
    try {
      return DriveApp.getFolderById(
        existingId
      );
    } catch (
      error
    ) {
      throw new Error(
        (
          'Configured bulk-import source folder is unavailable. ' +
          error.message
        )
      );
    }
  }

  const environment =
    runtimeEnvironmentFmrV3_(
      ''
    );

  const folder =
    DriveApp.createFolder(
      (
        environment
          .projectName +
        ' Bulk Import Sources - ' +
        environment
          .environmentName
      )
    );

  setBulkImportConfigurationValueFmrV3_(
    'IMPORT_SOURCE_FOLDER_ID',
    folder.getId()
  );

  appendAuditFmrV3_(
    'SYSTEM',
    'BULK_IMPORT_FOLDER',
    'BULK_IMPORT_SOURCE_FOLDER_CREATED',
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'OWNER',

      payload: {
        folderFingerprint:
          bulkImportFingerprintFmrV3_(
            folder.getId()
          )
      }
    }
  );

  return folder;
}

function parseGoogleSpreadsheetIdFmrV3_(
  value
) {
  const source =
    normalizeFmrV3_(
      value
    );

  if (!source) {
    throw new Error(
      'Google Sheet URL or ID is required.'
    );
  }

  const urlMatch =
    source.match(
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    );

  return urlMatch
    ? urlMatch[1]
    : source;
}

function existingPublishedFmrForImportFmrV3_(
  officialFmrNumber
) {
  const value =
    normalizeUpperFmrV3_(
      officialFmrNumber
    );

  if (!value) {
    return null;
  }

  const entries =
    lookupIndexEntriesFmrV3_(
      FMR_V3.SHEETS
        .SEARCH_INDEX,
      fmrSearchKeyFmrV3_(
        value
      )
    );

  if (!entries.length) {
    return null;
  }

  return {
    fmrId:
      normalizeFmrV3_(
        entries[0].FMR_ID
      ),

    fmrNumber:
      normalizeFmrV3_(
        entries[0]
          .FMR_Number
      )
  };
}

function existingStagedFmrForImportFmrV3_(
  officialFmrNumber
) {
  const value =
    normalizeUpperFmrV3_(
      officialFmrNumber
    );

  if (!value) {
    return null;
  }

  return (
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .STAGING_HEADERS
    ).find(
      function (
        row
      ) {
        return (
          normalizeUpperFmrV3_(
            row
              .Official_FMR_Number
          ) ===
            value &&
          ![
            'PUBLISHED',
            'VOIDED'
          ].includes(
            normalizeUpperFmrV3_(
              row.Status
            )
          )
        );
      }
    ) ||
    null
  );
}

function bulkImportStatusFromIssuesFmrV3_(
  issues
) {
  const source =
    issues || [];

  if (
    source.some(
      function (
        issue
      ) {
        return (
          issue.severity ===
          FMR_V3_BULK_IMPORT
            .severity
            .ERROR
        );
      }
    )
  ) {
    return FMR_V3_BULK_IMPORT
      .status
      .BLOCKED;
  }

  if (
    source.some(
      function (
        issue
      ) {
        return (
          issue.severity ===
          FMR_V3_BULK_IMPORT
            .severity
            .WARNING
        );
      }
    )
  ) {
    return FMR_V3_BULK_IMPORT
      .status
      .WARNING;
  }

  return FMR_V3_BULK_IMPORT
    .status
    .VALID;
}

function appendBulkImportIssuesFmrV3_(
  batchId,
  importItemId,
  worksheetName,
  issues
) {
  const now =
    nowFmrV3_();

  const records =
    (issues || []).map(
      function (
        issue
      ) {
        return {
          Import_Issue_ID:
            uuidFmrV3_(
              'IMPORTISSUE'
            ),

          Batch_ID:
            batchId,

          Import_Item_ID:
            importItemId,

          Worksheet_Name:
            worksheetName,

          Severity:
            issue.severity,

          Issue_Code:
            issue.code,

          Field_Name:
            issue.fieldName,

          Line_Number:
            issue.lineNumber,

          Message:
            issue.message,

          Source_Value:
            issue.sourceValue,

          Resolution_Value:
            '',

          Resolved:
            FMR_V3.NO,

          Resolved_By:
            '',

          Resolved_At:
            '',

          Created_At:
            now,

          Notes:
            ''
        };
      }
    );

  if (!records.length) {
    return [];
  }

  return appendObjectsFmrV3_(
    FMR_V3_BULK_IMPORT
      .sheets
      .ISSUES,
    records
  );
}

function persistBulkImportBatchFmrV3_(
  owner,
  source,
  spreadsheet
) {
  const batchId =
    uuidFmrV3_(
      'IMPORTBATCH'
    );

  const now =
    nowFmrV3_();

  const sheets =
    spreadsheet.getSheets();

  if (
    sheets.length >
    FMR_V3_BULK_IMPORT
      .limits
      .MAX_WORKSHEETS
  ) {
    throw new Error(
      (
        'Workbook contains ' +
        sheets.length +
        ' worksheets; maximum is ' +
        FMR_V3_BULK_IMPORT
          .limits
          .MAX_WORKSHEETS +
        '.'
      )
    );
  }

  const batchRow =
    appendObjectFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .BATCHES,
      {
        Batch_ID:
          batchId,

        Source_Type:
          source.sourceType,

        Source_File_ID:
          source.sourceFileId,

        Source_File_Name:
          source.sourceFileName,

        Source_Mime_Type:
          source.sourceMimeType,

        Source_Fingerprint:
          source.sourceFingerprint,

        Source_Modified_At:
          source.sourceModifiedAt,

        Converted_File_ID:
          source.convertedFileId,

        Worksheet_Count:
          sheets.length,

        Proposed_FMR_Count:
          0,

        Total_Line_Count:
          0,

        Valid_Item_Count:
          0,

        Warning_Item_Count:
          0,

        Error_Item_Count:
          0,

        Status:
          FMR_V3_BULK_IMPORT
            .status
            .PARSING,

        Created_By:
          owner.email,

        Created_At:
          now,

        Updated_At:
          now,

        Notes:
          normalizeFmrV3_(
            source.notes
          ),

        Active:
          FMR_V3.YES,

        Parser_Version:
          FMR_V3_BULK_IMPORT
            .parserVersion
      }
    );

  const parsedItems = [];
  let totalLineCount = 0;

  sheets.forEach(
    function (
      sheet
    ) {
      const parsed =
        parseBulkImportWorksheetFmrV3_(
          sheet
        );

      totalLineCount +=
        parsed.lines.length;

      if (
        totalLineCount >
        FMR_V3_BULK_IMPORT
          .limits
          .MAX_TOTAL_LINES
      ) {
        throw new Error(
          (
            'Workbook exceeds the batch maximum of ' +
            FMR_V3_BULK_IMPORT
              .limits
              .MAX_TOTAL_LINES +
            ' material lines.'
          )
        );
      }

      parsedItems.push(
        parsed
      );
    }
  );

  const fmrCounts = {};

  parsedItems.forEach(
    function (
      parsed
    ) {
      const number =
        normalizeUpperFmrV3_(
          parsed
            .sourceHeader
            .officialFmrNumber
        );

      if (number) {
        fmrCounts[
          number
        ] =
          numberFmrV3_(
            fmrCounts[
              number
            ]
          ) +
          1;
      }
    }
  );

  let validCount = 0;
  let warningCount = 0;
  let blockedCount = 0;

  parsedItems.forEach(
    function (
      parsed
    ) {
      const itemId =
        uuidFmrV3_(
          'IMPORTITEM'
        );

      const officialFmrNumber =
        normalizeUpperFmrV3_(
          parsed
            .sourceHeader
            .officialFmrNumber
        );

      if (
        officialFmrNumber &&
        fmrCounts[
          officialFmrNumber
        ] > 1
      ) {
        parsed.issues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .ERROR,
            FMR_V3_BULK_IMPORT
              .issueCodes
              .DUPLICATE_IN_BATCH,
            'Official FMR Number',
            0,
            (
              'Official FMR Number appears ' +
              fmrCounts[
                officialFmrNumber
              ] +
              ' times in this workbook.'
            ),
            officialFmrNumber
          )
        );
      }

      const published =
        existingPublishedFmrForImportFmrV3_(
          officialFmrNumber
        );

      if (published) {
        parsed.issues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .ERROR,
            FMR_V3_BULK_IMPORT
              .issueCodes
              .ALREADY_PUBLISHED,
            'Official FMR Number',
            0,
            (
              'FMR Number is already published: ' +
              officialFmrNumber
            ),
            officialFmrNumber
          )
        );
      }

      const staged =
        existingStagedFmrForImportFmrV3_(
          officialFmrNumber
        );

      if (staged) {
        parsed.issues.push(
          createBulkImportIssueObjectFmrV3_(
            FMR_V3_BULK_IMPORT
              .severity
              .WARNING,
            FMR_V3_BULK_IMPORT
              .issueCodes
              .ALREADY_STAGED,
            'Official FMR Number',
            0,
            (
              'FMR Number already exists in staging and will update ' +
              'that staged record when selected: ' +
              officialFmrNumber
            ),
            normalizeFmrV3_(
              staged.Staging_FMR_ID
            )
          )
        );
      }

      const status =
        bulkImportStatusFromIssuesFmrV3_(
          parsed.issues
        );

      if (
        status ===
        FMR_V3_BULK_IMPORT
          .status
          .VALID
      ) {
        validCount +=
          1;
      } else if (
        status ===
        FMR_V3_BULK_IMPORT
          .status
          .WARNING
      ) {
        warningCount +=
          1;
      } else {
        blockedCount +=
          1;
      }

      appendObjectFmrV3_(
        FMR_V3_BULK_IMPORT
          .sheets
          .ITEMS,
        {
          Import_Item_ID:
            itemId,

          Batch_ID:
            batchId,

          Worksheet_ID:
            parsed
              .worksheetId,

          Worksheet_Name:
            parsed
              .worksheetName,

          Official_FMR_Number:
            officialFmrNumber,

          IWP_Number:
            normalizeUpperFmrV3_(
              parsed
                .sourceHeader
                .iwpNumber
            ),

          Destination:
            parsed
              .sourceHeader
              .destination,

          Warehouse:
            parsed
              .sourceHeader
              .warehouse,

          Requested_By:
            parsed
              .sourceHeader
              .requestedBy,

          Craft:
            parsed
              .sourceHeader
              .craft,

          Deliver_To:
            parsed
              .sourceHeader
              .deliverTo,

          Date_Required:
            parsed
              .sourceHeader
              .dateRequired,

          ISO_Number:
            normalizeUpperFmrV3_(
              parsed
                .sourceHeader
                .isoNumber
            ),

          ISO_Sheet:
            normalizeUpperFmrV3_(
              parsed
                .sourceHeader
                .isoSheet
            ),

          ISO_Revision:
            normalizeUpperFmrV3_(
              parsed
                .sourceHeader
                .isoRevision
            ),

          Priority:
            parsed
              .sourceHeader
              .priority,

          Parsed_Line_Count:
            parsed
              .lines
              .length,

          Status:
            status,

          Staging_FMR_ID:
            staged
              ? normalizeFmrV3_(
                  staged.Staging_FMR_ID
                )
              : '',

          Existing_FMR_ID:
            published
              ? published.fmrId
              : '',

          Content_Fingerprint:
            parsed
              .contentFingerprint,

          Source_Header_JSON:
            JSON.stringify(
              parsed
                .sourceHeader
            ),

          Error_Count:
            parsed
              .issues
              .filter(
                function (
                  issue
                ) {
                  return (
                    issue.severity ===
                    FMR_V3_BULK_IMPORT
                      .severity
                      .ERROR
                  );
                }
              )
              .length,

          Warning_Count:
            parsed
              .issues
              .filter(
                function (
                  issue
                ) {
                  return (
                    issue.severity ===
                    FMR_V3_BULK_IMPORT
                      .severity
                      .WARNING
                  );
                }
              )
              .length,

          Selected:
            FMR_V3.NO,

          Created_At:
            now,

          Updated_At:
            now,

          Notes:
            ''
        }
      );

      const lineRecords =
        parsed.lines.map(
          function (
            line
          ) {
            return {
              Import_Line_ID:
                uuidFmrV3_(
                  'IMPORTLINE'
                ),

              Batch_ID:
                batchId,

              Import_Item_ID:
                itemId,

              Line_Number:
                line.lineNumber,

              Source_Row_Number:
                line.sourceRow,

              Commodity_Code:
                line.commodityCode,

              Size:
                line.size,

              Qty_Requested:
                line.qtyRequested,

              Material_Description:
                line.description,

              Inferred_UOM:
                line.uom,

              UOM_Rule:
                line.uomRule,

              Legacy_Issued:
                line.legacyIssued,

              Legacy_Backordered:
                line.legacyBackordered,

              Legacy_Action_Taken:
                line.legacyAction,

              Status:
                line.validationErrors
                  ? FMR_V3_BULK_IMPORT
                      .status
                      .BLOCKED
                  : FMR_V3_BULK_IMPORT
                      .status
                      .VALID,

              Validation_Errors:
                line.validationErrors,

              Created_At:
                now,

              Updated_At:
                now,

              Notes:
                ''
            };
          }
        );

      appendObjectsFmrV3_(
        FMR_V3_BULK_IMPORT
          .sheets
          .LINES,
        lineRecords
      );

      appendBulkImportIssuesFmrV3_(
        batchId,
        itemId,
        parsed
          .worksheetName,
        parsed
          .issues
      );
    }
  );

  const batchStatus =
    blockedCount > 0
      ? FMR_V3_BULK_IMPORT
          .status
          .REVIEW
      : warningCount > 0
        ? FMR_V3_BULK_IMPORT
            .status
            .WARNING
        : FMR_V3_BULK_IMPORT
            .status
            .VALID;

  updateRowObjectFmrV3_(
    FMR_V3_BULK_IMPORT
      .sheets
      .BATCHES,
    batchRow,
    {
      Proposed_FMR_Count:
        parsedItems.length,

      Total_Line_Count:
        totalLineCount,

      Valid_Item_Count:
        validCount,

      Warning_Item_Count:
        warningCount,

      Error_Item_Count:
        blockedCount,

      Status:
        batchStatus,

      Updated_At:
        nowFmrV3_()
    }
  );

  appendAuditFmrV3_(
    'BULK_IMPORT_BATCH',
    batchId,
    'BULK_IMPORT_PARSED',
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'OWNER',

      payload: {
        sourceType:
          source.sourceType,

        sourceFileName:
          source.sourceFileName,

        worksheetCount:
          sheets.length,

        proposedFmrCount:
          parsedItems.length,

        totalLineCount:
          totalLineCount,

        validCount:
          validCount,

        warningCount:
          warningCount,

        blockedCount:
          blockedCount
      }
    }
  );

  SpreadsheetApp.flush();

  return getBulkImportBatchFmrV3_(
    owner.email,
    batchId
  );
}

function openBulkImportSpreadsheetWithRetryFmrV3_(
  spreadsheetId
) {
  let lastError = null;

  for (
    let attempt = 0;
    attempt < 6;
    attempt += 1
  ) {
    try {
      const spreadsheet =
        SpreadsheetApp.openById(
          spreadsheetId
        );

      spreadsheet
        .getSheets();

      return spreadsheet;
    } catch (
      error
    ) {
      lastError =
        error;

      Utilities.sleep(
        500 *
        (
          attempt + 1
        )
      );
    }
  }

  throw new Error(
    (
      'Converted Google Sheet was not ready. ' +
      (
        lastError
          ? lastError.message
          : ''
      )
    ).trim()
  );
}

function supersedePriorBulkImportParserBatchesFmrV3_(
  sourceFingerprint,
  currentBatchId,
  owner
) {
  const fingerprint =
    normalizeFmrV3_(
      sourceFingerprint
    );

  const currentParserVersion =
    normalizeUpperFmrV3_(
      FMR_V3_BULK_IMPORT
        .parserVersion
    );

  const superseded = [];

  getUsedRowsFmrV3_(
    FMR_V3_BULK_IMPORT
      .sheets
      .BATCHES
  )
    .filter(
      function (
        row
      ) {
        return (
          normalizeFmrV3_(
            row
              .Source_Fingerprint
          ) ===
            fingerprint &&
          normalizeFmrV3_(
            row.Batch_ID
          ) !==
            normalizeFmrV3_(
              currentBatchId
            ) &&
          yesFmrV3_(
            row.Active
          ) &&
          normalizeUpperFmrV3_(
            row.Parser_Version
          ) !==
            currentParserVersion
        );
      }
    )
    .forEach(
      function (
        row
      ) {
        updateRowObjectFmrV3_(
          FMR_V3_BULK_IMPORT
            .sheets
            .BATCHES,
          row._rowNumber,
          {
            Status:
              FMR_V3_BULK_IMPORT
                .status
                .SUPERSEDED,

            Active:
              FMR_V3.NO,

            Updated_At:
              nowFmrV3_(),

            Notes:
              (
                normalizeFmrV3_(
                  row.Notes
                )
                  ? normalizeFmrV3_(
                      row.Notes
                    ) + ' | '
                  : ''
              ) +
              (
                'Superseded by parser ' +
                FMR_V3_BULK_IMPORT
                  .parserVersion +
                ' batch ' +
                currentBatchId
              )
          }
        );

        superseded.push(
          normalizeFmrV3_(
            row.Batch_ID
          )
        );
      }
    );

  if (
    superseded.length
  ) {
    appendAuditFmrV3_(
      'BULK_IMPORT_BATCH',
      currentBatchId,
      'BULK_IMPORT_PRIOR_PARSER_BATCHES_SUPERSEDED',
      owner,
      uuidFmrV3_(
        'CORR'
      ),
      {
        sourceInterface:
          'OWNER',

        payload: {
          parserVersion:
            FMR_V3_BULK_IMPORT
              .parserVersion,

          supersededBatchIds:
            superseded
        }
      }
    );
  }

  return superseded;
}

function beginBulkImportUploadFmrV3_(
  userEmail,
  payload
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  assertWriteEnabledFmrV3_(
    'Bulk import upload'
  );

  const source =
    payload || {};

  const fileName =
    normalizeFmrV3_(
      source.fileName
    );

  const mimeType =
    normalizeFmrV3_(
      source.mimeType
    ) ||
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const base64 =
    normalizeFmrV3_(
      source.base64
    );

  if (
    !fileName ||
    !base64
  ) {
    throw new Error(
      'File name and file content are required.'
    );
  }

  if (
    !/\.(xlsx|xls)$/i.test(
      fileName
    )
  ) {
    throw new Error(
      'Bulk import upload must be an Excel .xlsx or .xls file.'
    );
  }

  const bytes =
    Utilities.base64Decode(
      base64
    );

  if (
    bytes.length >
    FMR_V3_BULK_IMPORT
      .limits
      .MAX_UPLOAD_BYTES
  ) {
    throw new Error(
      (
        'Upload is ' +
        bytes.length +
        ' bytes; maximum is ' +
        FMR_V3_BULK_IMPORT
          .limits
          .MAX_UPLOAD_BYTES +
        ' bytes.'
      )
    );
  }

  const fingerprint =
    bulkImportDigestFmrV3_(
      bytes
    );

  const existing =
    getUsedRowsFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .BATCHES
    ).find(
      function (
        row
      ) {
        return (
          normalizeFmrV3_(
            row
              .Source_Fingerprint
          ) ===
            fingerprint &&
          normalizeUpperFmrV3_(
            row
              .Parser_Version
          ) ===
            normalizeUpperFmrV3_(
              FMR_V3_BULK_IMPORT
                .parserVersion
            ) &&
          yesFmrV3_(
            row.Active
          ) &&
          normalizeUpperFmrV3_(
            row.Status
          ) !==
            FMR_V3_BULK_IMPORT
              .status
              .FAILED
        );
      }
    );

  if (existing) {
    return getBulkImportBatchFmrV3_(
      owner.email,
      existing.Batch_ID
    );
  }

  const folder =
    ensureBulkImportSourceFolderFmrV3_(
      owner
    );

  const blob =
    Utilities.newBlob(
      bytes,
      mimeType,
      fileName
    );

  const originalFile =
    folder.createFile(
      blob
    );

  const convertedName =
    fileName.replace(
      /\.(xlsx|xls)$/i,
      ''
    );

  const converted =
    Drive.Files.create(
      {
        name:
          convertedName,

        mimeType:
          'application/vnd.google-apps.spreadsheet',

        parents: [
          folder.getId()
        ]
      },
      blob,
      {
        fields:
          'id,name,mimeType,modifiedTime'
      }
    );

  const spreadsheet =
    openBulkImportSpreadsheetWithRetryFmrV3_(
      converted.id
    );

  const batch =
    persistBulkImportBatchFmrV3_(
      owner,
      {
        sourceType:
          FMR_V3_BULK_IMPORT
            .sourceTypes
            .UPLOAD,

        sourceFileId:
          originalFile.getId(),

        sourceFileName:
          fileName,

        sourceMimeType:
          mimeType,

        sourceFingerprint:
          fingerprint,

        sourceModifiedAt:
          nowFmrV3_(),

        convertedFileId:
          converted.id,

        notes:
          normalizeFmrV3_(
            source.notes
          )
      },
      spreadsheet
    );

  supersedePriorBulkImportParserBatchesFmrV3_(
    fingerprint,
    batch.batchId,
    owner
  );

  return batch;
}

function beginBulkImportGoogleSheetFmrV3_(
  userEmail,
  sourceValue
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  assertWriteEnabledFmrV3_(
    'Bulk import Google Sheet'
  );

  const spreadsheetId =
    parseGoogleSpreadsheetIdFmrV3_(
      sourceValue
    );

  const spreadsheet =
    SpreadsheetApp.openById(
      spreadsheetId
    );

  const file =
    Drive.Files.get(
      spreadsheetId,
      {
        fields:
          'id,name,mimeType,modifiedTime'
      }
    );

  const fingerprint =
    bulkImportDigestFmrV3_(
      [
        file.id,
        file.modifiedTime,
        file.name
      ].join(
        '|'
      )
    );

  const existing =
    getUsedRowsFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .BATCHES
    ).find(
      function (
        row
      ) {
        return (
          normalizeFmrV3_(
            row
              .Source_Fingerprint
          ) ===
            fingerprint &&
          normalizeUpperFmrV3_(
            row
              .Parser_Version
          ) ===
            normalizeUpperFmrV3_(
              FMR_V3_BULK_IMPORT
                .parserVersion
            ) &&
          yesFmrV3_(
            row.Active
          ) &&
          normalizeUpperFmrV3_(
            row.Status
          ) !==
            FMR_V3_BULK_IMPORT
              .status
              .FAILED
        );
      }
    );

  if (existing) {
    return getBulkImportBatchFmrV3_(
      owner.email,
      existing.Batch_ID
    );
  }

  const batch =
    persistBulkImportBatchFmrV3_(
      owner,
      {
        sourceType:
          FMR_V3_BULK_IMPORT
            .sourceTypes
            .GOOGLE_SHEET,

        sourceFileId:
          spreadsheetId,

        sourceFileName:
          file.name,

        sourceMimeType:
          file.mimeType,

        sourceFingerprint:
          fingerprint,

        sourceModifiedAt:
          file.modifiedTime,

        convertedFileId:
          '',

        notes:
          ''
      },
      spreadsheet
    );

  supersedePriorBulkImportParserBatchesFmrV3_(
    fingerprint,
    batch.batchId,
    owner
  );

  return batch;
}

function bulkImportItemsForBatchFmrV3_(
  batchId
) {
  return getUsedRowsFmrV3_(
    FMR_V3_BULK_IMPORT
      .sheets
      .ITEMS
  )
    .filter(
      function (
        row
      ) {
        return (
          normalizeFmrV3_(
            row.Batch_ID
          ) ===
          normalizeFmrV3_(
            batchId
          )
        );
      }
    )
    .sort(
      function (
        left,
        right
      ) {
        return normalizeFmrV3_(
          left
            .Worksheet_Name
        ).localeCompare(
          normalizeFmrV3_(
            right
              .Worksheet_Name
          ),
          undefined,
          {
            numeric:
              true,

            sensitivity:
              'base'
          }
        );
      }
    );
}

function bulkImportLinesForItemFmrV3_(
  importItemId
) {
  return getUsedRowsFmrV3_(
    FMR_V3_BULK_IMPORT
      .sheets
      .LINES
  )
    .filter(
      function (
        row
      ) {
        return (
          normalizeFmrV3_(
            row.Import_Item_ID
          ) ===
          normalizeFmrV3_(
            importItemId
          )
        );
      }
    )
    .sort(
      function (
        left,
        right
      ) {
        return (
          numberFmrV3_(
            left.Line_Number
          ) -
          numberFmrV3_(
            right.Line_Number
          )
        );
      }
    );
}

function bulkImportIssuesForItemFmrV3_(
  importItemId
) {
  return getUsedRowsFmrV3_(
    FMR_V3_BULK_IMPORT
      .sheets
      .ISSUES
  )
    .filter(
      function (
        row
      ) {
        return (
          normalizeFmrV3_(
            row.Import_Item_ID
          ) ===
          normalizeFmrV3_(
            importItemId
          )
        );
      }
    )
    .sort(
      function (
        left,
        right
      ) {
        const severityOrder = {
          ERROR:
            0,

          WARNING:
            1,

          INFO:
            2
        };

        return (
          numberFmrV3_(
            severityOrder[
              normalizeUpperFmrV3_(
                left.Severity
              )
            ]
          ) -
          numberFmrV3_(
            severityOrder[
              normalizeUpperFmrV3_(
                right.Severity
              )
            ]
          )
        );
      }
    );
}

function serializeBulkImportIssueFmrV3_(
  row
) {
  return {
    issueId:
      normalizeFmrV3_(
        row.Import_Issue_ID
      ),

    severity:
      normalizeUpperFmrV3_(
        row.Severity
      ),

    code:
      normalizeUpperFmrV3_(
        row.Issue_Code
      ),

    fieldName:
      normalizeFmrV3_(
        row.Field_Name
      ),

    lineNumber:
      numberFmrV3_(
        row.Line_Number
      ),

    message:
      normalizeFmrV3_(
        row.Message
      ),

    sourceValue:
      normalizeFmrV3_(
        row.Source_Value
      ),

    resolutionValue:
      normalizeFmrV3_(
        row.Resolution_Value
      ),

    resolved:
      yesFmrV3_(
        row.Resolved
      )
  };
}

function serializeBulkImportLineFmrV3_(
  row
) {
  return {
    importLineId:
      normalizeFmrV3_(
        row.Import_Line_ID
      ),

    lineNumber:
      numberFmrV3_(
        row.Line_Number
      ),

    sourceRow:
      numberFmrV3_(
        row.Source_Row_Number
      ),

    commodityCode:
      normalizeFmrV3_(
        row.Commodity_Code
      ),

    size:
      normalizeFmrV3_(
        row.Size
      ),

    qtyRequested:
      numberFmrV3_(
        row.Qty_Requested
      ),

    description:
      normalizeFmrV3_(
        row
          .Material_Description
      ),

    uom:
      normalizeUpperFmrV3_(
        row.Inferred_UOM
      ),

    uomRule:
      normalizeUpperFmrV3_(
        row.UOM_Rule
      ),

    legacyIssued:
      normalizeFmrV3_(
        row.Legacy_Issued
      ),

    legacyBackordered:
      normalizeFmrV3_(
        row
          .Legacy_Backordered
      ),

    legacyAction:
      normalizeFmrV3_(
        row
          .Legacy_Action_Taken
      ),

    status:
      normalizeUpperFmrV3_(
        row.Status
      ),

    validationErrors:
      normalizeFmrV3_(
        row
          .Validation_Errors
      )
  };
}

function bulkImportSourceHeaderFromRowFmrV3_(
  row
) {
  try {
    return JSON.parse(
      normalizeFmrV3_(
        row
          .Source_Header_JSON
      ) ||
      '{}'
    );
  } catch (
    error
  ) {
    return {};
  }
}

function serializeBulkImportItemFmrV3_(
  row,
  includeLines
) {
  const itemId =
    normalizeFmrV3_(
      row.Import_Item_ID
    );

  const issues =
    bulkImportIssuesForItemFmrV3_(
      itemId
    ).map(
      serializeBulkImportIssueFmrV3_
    );

  const sourceHeader =
    bulkImportSourceHeaderFromRowFmrV3_(
      row
    );

  return {
    importItemId:
      itemId,

    batchId:
      normalizeFmrV3_(
        row.Batch_ID
      ),

    worksheetId:
      normalizeFmrV3_(
        row.Worksheet_ID
      ),

    worksheetName:
      normalizeFmrV3_(
        row.Worksheet_Name
      ),

    officialFmrNumber:
      normalizeFmrV3_(
        row
          .Official_FMR_Number
      ),

    iwpNumber:
      normalizeFmrV3_(
        row.IWP_Number
      ),

    destination:
      normalizeFmrV3_(
        row.Destination
      ),

    warehouse:
      normalizeFmrV3_(
        row.Warehouse
      ),

    requestedBy:
      normalizeFmrV3_(
        row.Requested_By
      ),

    craft:
      normalizeFmrV3_(
        row.Craft
      ),

    deliverTo:
      normalizeFmrV3_(
        row.Deliver_To
      ),

    dateRequired:
      normalizeFmrV3_(
        row.Date_Required
      ),

    sourceLineNumber:
      normalizeFmrV3_(
        sourceHeader
          .sourceLineNumber
      ) ||
      [
        normalizeFmrV3_(
          row.ISO_Number
        ),
        normalizeFmrV3_(
          row.ISO_Sheet
        )
      ]
        .filter(
          Boolean
        )
        .join(
          '-'
        ),

    sourceShtValue:
      normalizeFmrV3_(
        sourceHeader
          .sourceShtValue
      ),

    isoNumber:
      normalizeFmrV3_(
        row.ISO_Number
      ),

    isoSheet:
      normalizeFmrV3_(
        row.ISO_Sheet
      ),

    isoRevision:
      normalizeFmrV3_(
        row.ISO_Revision
      ),

    priority:
      normalizeFmrV3_(
        row.Priority
      ),

    parsedLineCount:
      numberFmrV3_(
        row.Parsed_Line_Count
      ),

    status:
      normalizeUpperFmrV3_(
        row.Status
      ),

    stagingFmrId:
      normalizeFmrV3_(
        row.Staging_FMR_ID
      ),

    existingFmrId:
      normalizeFmrV3_(
        row.Existing_FMR_ID
      ),

    contentFingerprint:
      normalizeFmrV3_(
        row
          .Content_Fingerprint
      ),

    errorCount:
      numberFmrV3_(
        row.Error_Count
      ),

    warningCount:
      numberFmrV3_(
        row.Warning_Count
      ),

    issues:
      issues,

    lines:
      includeLines
        ? bulkImportLinesForItemFmrV3_(
            itemId
          ).map(
            serializeBulkImportLineFmrV3_
          )
        : []
  };
}

function getBulkImportBatchFmrV3_(
  userEmail,
  batchId
) {
  assertOwnerFmrV3_(
    userEmail
  );

  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .BATCHES,
      1,
      normalizeFmrV3_(
        batchId
      )
    );

  if (
    rows.length !== 1
  ) {
    throw new Error(
      'Expected one bulk-import batch for ' +
      batchId +
      '.'
    );
  }

  const batch =
    readRowObjectFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .BATCHES,
      rows[0]
    );

  const items =
    bulkImportItemsForBatchFmrV3_(
      batchId
    ).map(
      function (
        item
      ) {
        return serializeBulkImportItemFmrV3_(
          item,
          false
        );
      }
    );

  return {
    batchId:
      normalizeFmrV3_(
        batch.Batch_ID
      ),

    sourceType:
      normalizeUpperFmrV3_(
        batch.Source_Type
      ),

    sourceFileName:
      normalizeFmrV3_(
        batch.Source_File_Name
      ),

    sourceFingerprint:
      normalizeFmrV3_(
        batch
          .Source_Fingerprint
      ).slice(
        0,
        24
      ),

    parserVersion:
      normalizeFmrV3_(
        batch.Parser_Version
      ) ||
      'LEGACY',

    worksheetCount:
      numberFmrV3_(
        batch.Worksheet_Count
      ),

    proposedFmrCount:
      numberFmrV3_(
        batch
          .Proposed_FMR_Count
      ),

    totalLineCount:
      numberFmrV3_(
        batch.Total_Line_Count
      ),

    validItemCount:
      numberFmrV3_(
        batch.Valid_Item_Count
      ),

    warningItemCount:
      numberFmrV3_(
        batch
          .Warning_Item_Count
      ),

    errorItemCount:
      numberFmrV3_(
        batch.Error_Item_Count
      ),

    status:
      normalizeUpperFmrV3_(
        batch.Status
      ),

    createdBy:
      normalizeEmailFmrV3_(
        batch.Created_By
      ),

    createdAt:
      formatDateTimeFmrV3_(
        batch.Created_At
      ),

    updatedAt:
      formatDateTimeFmrV3_(
        batch.Updated_At
      ),

    limits: {
      maxLinesPerFmr:
        FMR_V3_BULK_IMPORT
          .limits
          .MAX_LINES_PER_FMR,

      maxWorksheets:
        FMR_V3_BULK_IMPORT
          .limits
          .MAX_WORKSHEETS,

      maxUploadBytes:
        FMR_V3_BULK_IMPORT
          .limits
          .MAX_UPLOAD_BYTES
    },

    items:
      items
  };
}

function getBulkImportItemFmrV3_(
  userEmail,
  importItemId
) {
  assertOwnerFmrV3_(
    userEmail
  );

  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .ITEMS,
      1,
      normalizeFmrV3_(
        importItemId
      )
    );

  if (
    rows.length !== 1
  ) {
    throw new Error(
      'Expected one bulk-import item for ' +
      importItemId +
      '.'
    );
  }

  return serializeBulkImportItemFmrV3_(
    readRowObjectFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .ITEMS,
      rows[0]
    ),
    true
  );
}

function resolveBulkImportIssueCodeFmrV3_(
  itemId,
  issueCode,
  resolutionValue,
  owner
) {
  const now =
    nowFmrV3_();

  bulkImportIssuesForItemFmrV3_(
    itemId
  )
    .filter(
      function (
        issue
      ) {
        return (
          normalizeUpperFmrV3_(
            issue.Issue_Code
          ) ===
            normalizeUpperFmrV3_(
              issueCode
            ) &&
          !yesFmrV3_(
            issue.Resolved
          )
        );
      }
    )
    .forEach(
      function (
        issue
      ) {
        updateRowObjectFmrV3_(
          FMR_V3_BULK_IMPORT
            .sheets
            .ISSUES,
          issue._rowNumber,
          {
            Resolution_Value:
              normalizeFmrV3_(
                resolutionValue
              ),

            Resolved:
              FMR_V3.YES,

            Resolved_By:
              owner.email,

            Resolved_At:
              now
          }
        );
      }
    );
}

function recalculateBulkImportItemStatusFmrV3_(
  itemId
) {
  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .ITEMS,
      1,
      itemId
    );

  if (
    rows.length !== 1
  ) {
    throw new Error(
      'Bulk-import item not found: ' +
      itemId
    );
  }

  const unresolved =
    bulkImportIssuesForItemFmrV3_(
      itemId
    ).filter(
      function (
        issue
      ) {
        return !yesFmrV3_(
          issue.Resolved
        );
      }
    );

  const status =
    bulkImportStatusFromIssuesFmrV3_(
      unresolved.map(
        function (
          issue
        ) {
          return {
            severity:
              normalizeUpperFmrV3_(
                issue.Severity
              )
          };
        }
      )
    );

  updateRowObjectFmrV3_(
    FMR_V3_BULK_IMPORT
      .sheets
      .ITEMS,
    rows[0],
    {
      Status:
        status,

      Error_Count:
        unresolved.filter(
          function (
            issue
          ) {
            return (
              normalizeUpperFmrV3_(
                issue.Severity
              ) ===
              FMR_V3_BULK_IMPORT
                .severity
                .ERROR
            );
          }
        ).length,

      Warning_Count:
        unresolved.filter(
          function (
            issue
          ) {
            return (
              normalizeUpperFmrV3_(
                issue.Severity
              ) ===
              FMR_V3_BULK_IMPORT
                .severity
                .WARNING
            );
          }
        ).length,

      Updated_At:
        nowFmrV3_()
    }
  );

  return status;
}

function recalculateBulkImportBatchStatusFmrV3_(
  batchId
) {
  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .BATCHES,
      1,
      batchId
    );

  if (
    rows.length !== 1
  ) {
    throw new Error(
      'Bulk-import batch not found: ' +
      batchId
    );
  }

  const items =
    bulkImportItemsForBatchFmrV3_(
      batchId
    );

  const stagedCount =
    items.filter(
      function (
        item
      ) {
        return (
          normalizeUpperFmrV3_(
            item.Status
          ) ===
          FMR_V3_BULK_IMPORT
            .status
            .STAGED
        );
      }
    ).length;

  const validCount =
    items.filter(
      function (
        item
      ) {
        return (
          normalizeUpperFmrV3_(
            item.Status
          ) ===
          FMR_V3_BULK_IMPORT
            .status
            .VALID
        );
      }
    ).length;

  const warningCount =
    items.filter(
      function (
        item
      ) {
        return (
          normalizeUpperFmrV3_(
            item.Status
          ) ===
          FMR_V3_BULK_IMPORT
            .status
            .WARNING
        );
      }
    ).length;

  const blockedCount =
    items.filter(
      function (
        item
      ) {
        return (
          normalizeUpperFmrV3_(
            item.Status
          ) ===
          FMR_V3_BULK_IMPORT
            .status
            .BLOCKED
        );
      }
    ).length;

  const status =
    stagedCount ===
      items.length
      ? FMR_V3_BULK_IMPORT
          .status
          .STAGED
      : stagedCount > 0
        ? FMR_V3_BULK_IMPORT
            .status
            .PARTIALLY_STAGED
        : blockedCount > 0
          ? FMR_V3_BULK_IMPORT
              .status
              .REVIEW
          : warningCount > 0
            ? FMR_V3_BULK_IMPORT
                .status
                .WARNING
            : FMR_V3_BULK_IMPORT
                .status
                .VALID;

  updateRowObjectFmrV3_(
    FMR_V3_BULK_IMPORT
      .sheets
      .BATCHES,
    rows[0],
    {
      Valid_Item_Count:
        validCount,

      Warning_Item_Count:
        warningCount,

      Error_Item_Count:
        blockedCount,

      Status:
        status,

      Updated_At:
        nowFmrV3_()
    }
  );

  return status;
}

function updateBulkImportItemFmrV3_(
  userEmail,
  importItemId,
  payload
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  assertWriteEnabledFmrV3_(
    'Bulk import review'
  );

  const source =
    payload || {};

  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .ITEMS,
      1,
      importItemId
    );

  if (
    rows.length !== 1
  ) {
    throw new Error(
      'Bulk-import item not found: ' +
      importItemId
    );
  }

  const current =
    readRowObjectFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .ITEMS,
      rows[0]
    );

  if (
    normalizeUpperFmrV3_(
      current.Status
    ) ===
    FMR_V3_BULK_IMPORT
      .status
      .STAGED
  ) {
    throw new Error(
      'Staged bulk-import items cannot be edited.'
    );
  }

  const currentSourceHeader =
    bulkImportSourceHeaderFromRowFmrV3_(
      current
    );

  let reviewedLineIdentity =
    null;

  if (
    source.sourceLineNumber !==
      undefined
  ) {
    reviewedLineIdentity =
      splitBulkImportLineIdentityFmrV3_(
        source.sourceLineNumber
      );

    if (
      !reviewedLineIdentity
        .valid
    ) {
      throw new Error(
        'LINE NO must end with a two-digit -## sheet suffix.'
      );
    }

    currentSourceHeader
      .sourceLineNumber =
        reviewedLineIdentity
          .sourceLineNumber;

    currentSourceHeader
      .isoNumber =
        reviewedLineIdentity
          .isoNumber;

    currentSourceHeader
      .isoSheet =
        reviewedLineIdentity
          .isoSheet;
  }

  const patch = {
    Official_FMR_Number:
      source.officialFmrNumber ===
        undefined
        ? current
            .Official_FMR_Number
        : normalizeUpperFmrV3_(
            source
              .officialFmrNumber
          ),

    IWP_Number:
      source.iwpNumber ===
        undefined
        ? current.IWP_Number
        : normalizeUpperFmrV3_(
            source.iwpNumber
          ),

    Destination:
      source.destination ===
        undefined
        ? current.Destination
        : normalizeFmrV3_(
            source.destination
          ),

    Warehouse:
      source.warehouse ===
        undefined
        ? current.Warehouse
        : normalizeFmrV3_(
            source.warehouse
          ),

    Requested_By:
      source.requestedBy ===
        undefined
        ? current.Requested_By
        : normalizeFmrV3_(
            source.requestedBy
          ),

    Craft:
      source.craft ===
        undefined
        ? current.Craft
        : normalizeFmrV3_(
            source.craft
          ),

    Deliver_To:
      source.deliverTo ===
        undefined
        ? current.Deliver_To
        : normalizeFmrV3_(
            source.deliverTo
          ),

    Date_Required:
      source.dateRequired ===
        undefined
        ? current.Date_Required
        : normalizeFmrV3_(
            source.dateRequired
          ),

    ISO_Number:
      reviewedLineIdentity
        ? reviewedLineIdentity
            .isoNumber
        : source.isoNumber ===
            undefined
          ? current.ISO_Number
          : normalizeUpperFmrV3_(
              source.isoNumber
            ),

    ISO_Sheet:
      reviewedLineIdentity
        ? reviewedLineIdentity
            .isoSheet
        : source.isoSheet ===
            undefined
          ? current.ISO_Sheet
          : normalizeUpperFmrV3_(
              source.isoSheet
            ),

    ISO_Revision:
      source.isoRevision ===
        undefined
        ? current.ISO_Revision
        : normalizeUpperFmrV3_(
            source.isoRevision
          ),

    Priority:
      source.priority ===
        undefined
        ? current.Priority
        : normalizeFmrV3_(
            source.priority
          ),

    Source_Header_JSON:
      JSON.stringify(
        currentSourceHeader
      ),

    Updated_At:
      nowFmrV3_()
  };

  updateRowObjectFmrV3_(
    FMR_V3_BULK_IMPORT
      .sheets
      .ITEMS,
    rows[0],
    patch
  );

  const resolutionMap = [
    [
      'officialFmrNumber',
      FMR_V3_BULK_IMPORT
        .issueCodes
        .OFFICIAL_FMR_MISSING,
      patch
        .Official_FMR_Number
    ],
    [
      'iwpNumber',
      FMR_V3_BULK_IMPORT
        .issueCodes
        .IWP_MISSING,
      patch.IWP_Number
    ],
    [
      'sourceLineNumber',
      FMR_V3_BULK_IMPORT
        .issueCodes
        .ISO_NUMBER_MISSING,
      patch.ISO_Number
    ],
    [
      'sourceLineNumber',
      FMR_V3_BULK_IMPORT
        .issueCodes
        .ISO_SHEET_SUFFIX_MISSING,
      patch.ISO_Sheet
    ],
    [
      'isoNumber',
      FMR_V3_BULK_IMPORT
        .issueCodes
        .ISO_NUMBER_MISSING,
      patch.ISO_Number
    ],
    [
      'isoSheet',
      FMR_V3_BULK_IMPORT
        .issueCodes
        .ISO_SHEET_MISSING,
      patch.ISO_Sheet
    ],
    [
      'requestedBy',
      FMR_V3_BULK_IMPORT
        .issueCodes
        .REQUESTED_BY_BLANK,
      patch.Requested_By
    ],
    [
      'deliverTo',
      FMR_V3_BULK_IMPORT
        .issueCodes
        .DELIVER_TO_BLANK,
      patch.Deliver_To
    ],
    [
      'dateRequired',
      FMR_V3_BULK_IMPORT
        .issueCodes
        .DATE_REQUIRED_BLANK,
      patch.Date_Required
    ]
  ];

  resolutionMap.forEach(
    function (
      entry
    ) {
      if (
        source[
          entry[0]
        ] !== undefined &&
        normalizeFmrV3_(
          entry[2]
        )
      ) {
        resolveBulkImportIssueCodeFmrV3_(
          importItemId,
          entry[1],
          entry[2],
          owner
        );
      }
    }
  );

  recalculateBulkImportItemStatusFmrV3_(
    importItemId
  );

  recalculateBulkImportBatchStatusFmrV3_(
    current.Batch_ID
  );

  appendAuditFmrV3_(
    'BULK_IMPORT_ITEM',
    importItemId,
    'BULK_IMPORT_ITEM_UPDATED',
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'OWNER',

      payload: {
        worksheetName:
          current
            .Worksheet_Name,

        fields:
          Object.keys(
            source
          )
      }
    }
  );

  SpreadsheetApp.flush();

  return getBulkImportItemFmrV3_(
    owner.email,
    importItemId
  );
}

function applyBulkImportIsoSheetOverrideFmrV3_(
  userEmail,
  batchId,
  importItemIds,
  isoSheet,
  confirmation
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  assertWriteEnabledFmrV3_(
    'Bulk import ISO Sheet override'
  );

  const value =
    normalizeUpperFmrV3_(
      isoSheet
    );

  const ids =
    Array.isArray(
      importItemIds
    )
      ? importItemIds
          .map(
            normalizeFmrV3_
          )
          .filter(
            Boolean
          )
      : [];

  if (!value) {
    throw new Error(
      'ISO Sheet override value is required.'
    );
  }

  if (!ids.length) {
    throw new Error(
      'Select at least one FMR item.'
    );
  }

  const expected =
    'APPLY ' +
    value;

  if (
    normalizeUpperFmrV3_(
      confirmation
    ) !==
    expected
  ) {
    throw new Error(
      (
        'Confirmation must exactly match "' +
        expected +
        '".'
      )
    );
  }

  const batchItemIds = {};

  bulkImportItemsForBatchFmrV3_(
    batchId
  ).forEach(
    function (
      item
    ) {
      batchItemIds[
        normalizeFmrV3_(
          item.Import_Item_ID
        )
      ] =
        item;
    }
  );

  const updated = [];

  ids.forEach(
    function (
      itemId
    ) {
      const item =
        batchItemIds[
          itemId
        ];

      if (!item) {
        throw new Error(
          'Selected item does not belong to this batch: ' +
          itemId
        );
      }

      if (
        normalizeUpperFmrV3_(
          item.Status
        ) ===
        FMR_V3_BULK_IMPORT
          .status
          .STAGED
      ) {
        throw new Error(
          'Cannot override a staged item: ' +
          item
            .Official_FMR_Number
        );
      }

      updateRowObjectFmrV3_(
        FMR_V3_BULK_IMPORT
          .sheets
          .ITEMS,
        item._rowNumber,
        {
          ISO_Sheet:
            value,

          Updated_At:
            nowFmrV3_()
        }
      );

      resolveBulkImportIssueCodeFmrV3_(
        itemId,
        FMR_V3_BULK_IMPORT
          .issueCodes
          .ISO_SHEET_MISSING,
        value,
        owner
      );

      recalculateBulkImportItemStatusFmrV3_(
        itemId
      );

      updated.push(
        itemId
      );
    }
  );

  recalculateBulkImportBatchStatusFmrV3_(
    batchId
  );

  appendAuditFmrV3_(
    'BULK_IMPORT_BATCH',
    batchId,
    'BULK_IMPORT_ISO_SHEET_OVERRIDE',
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'OWNER',

      payload: {
        isoSheet:
          value,

        itemCount:
          updated.length,

        itemIds:
          updated
      }
    }
  );

  SpreadsheetApp.flush();

  return getBulkImportBatchFmrV3_(
    owner.email,
    batchId
  );
}

function bulkImportStagePayloadFmrV3_(
  item,
  lines,
  batch
) {
  return {
    stagingFmrId:
      normalizeFmrV3_(
        item.Staging_FMR_ID
      ),

    sourceFileId:
      batch.Source_File_ID,

    sourceFileName:
      batch.Source_File_Name,

    officialFmrNumber:
      item
        .Official_FMR_Number,

    iwpNumber:
      item.IWP_Number,

    requestedBy:
      item.Requested_By,

    dateRequired:
      item.Date_Required,

    priority:
      item.Priority,

    notes:
      '',

    lines:
      lines.map(
        function (
          line
        ) {
          return {
            isoNumber:
              item.ISO_Number,

            isoSheet:
              item.ISO_Sheet,

            commodityCode:
              line.Commodity_Code,

            size:
              line.Size,

            description:
              line
                .Material_Description,

            qtyRequested:
              line.Qty_Requested,

            uom:
              line.Inferred_UOM,

            storageLocation:
              '',

            notes:
              ''
          };
        }
      )
  };
}

function stageBulkImportItemsFmrV3_(
  userEmail,
  batchId,
  importItemIds
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  assertWriteEnabledFmrV3_(
    'Bulk import staging'
  );

  const ids =
    Array.isArray(
      importItemIds
    )
      ? importItemIds
          .map(
            normalizeFmrV3_
          )
          .filter(
            Boolean
          )
      : [];

  if (!ids.length) {
    throw new Error(
      'Select at least one FMR item to stage.'
    );
  }

  const batchRows =
    findRowsByExactValueFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .BATCHES,
      1,
      batchId
    );

  if (
    batchRows.length !== 1
  ) {
    throw new Error(
      'Bulk-import batch not found: ' +
      batchId
    );
  }

  const batch =
    readRowObjectFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .BATCHES,
      batchRows[0]
    );

  const itemsById = {};

  bulkImportItemsForBatchFmrV3_(
    batchId
  ).forEach(
    function (
      item
    ) {
      itemsById[
        normalizeFmrV3_(
          item.Import_Item_ID
        )
      ] =
        item;
    }
  );

  const staged = [];
  const failed = [];

  ids.forEach(
    function (
      itemId
    ) {
      const item =
        itemsById[
          itemId
        ];

      if (!item) {
        failed.push({
          importItemId:
            itemId,

          error:
            'Item does not belong to the selected batch.'
        });

        return;
      }

      const status =
        normalizeUpperFmrV3_(
          item.Status
        );

      if (
        status ===
        FMR_V3_BULK_IMPORT
          .status
          .STAGED
      ) {
        staged.push({
          importItemId:
            itemId,

          stagingFmrId:
            item.Staging_FMR_ID,

          reused:
            true
        });

        return;
      }

      if (
        status ===
        FMR_V3_BULK_IMPORT
          .status
          .BLOCKED
      ) {
        failed.push({
          importItemId:
            itemId,

          fmrNumber:
            item
              .Official_FMR_Number,

          error:
            'Item has unresolved blocking issues.'
        });

        return;
      }

      try {
        const lines =
          bulkImportLinesForItemFmrV3_(
            itemId
          );

        if (
          lines.length === 0 ||
          lines.length >
            FMR_V3_BULK_IMPORT
              .limits
              .MAX_LINES_PER_FMR
        ) {
          throw new Error(
            'Item line count is outside the permitted range.'
          );
        }

        const result =
          saveStagedFmrFmrV3_(
            owner.email,
            bulkImportStagePayloadFmrV3_(
              item,
              lines,
              batch
            )
          );

        if (!result.valid) {
          throw new Error(
            (
              result
                .validationErrors ||
              []
            ).join(
              ' | '
            )
          );
        }

        updateRowObjectFmrV3_(
          FMR_V3_BULK_IMPORT
            .sheets
            .ITEMS,
          item._rowNumber,
          {
            Status:
              FMR_V3_BULK_IMPORT
                .status
                .STAGED,

            Staging_FMR_ID:
              result
                .stagingFmrId,

            Updated_At:
              nowFmrV3_()
          }
        );

        staged.push({
          importItemId:
            itemId,

          fmrNumber:
            item
              .Official_FMR_Number,

          stagingFmrId:
            result
              .stagingFmrId,

          lineCount:
            result.lineCount,

          reused:
            false
        });
      } catch (
        error
      ) {
        failed.push({
          importItemId:
            itemId,

          fmrNumber:
            item
              .Official_FMR_Number,

          error:
            error.message
        });
      }
    }
  );

  recalculateBulkImportBatchStatusFmrV3_(
    batchId
  );

  appendAuditFmrV3_(
    'BULK_IMPORT_BATCH',
    batchId,
    'BULK_IMPORT_ITEMS_STAGED',
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'OWNER',

      payload: {
        requestedCount:
          ids.length,

        stagedCount:
          staged.length,

        failedCount:
          failed.length,

        staged:
          staged,

        failed:
          failed
      }
    }
  );

  SpreadsheetApp.flush();

  return {
    success:
      failed.length === 0,

    batchId:
      batchId,

    staged:
      staged,

    failed:
      failed,

    batch:
      getBulkImportBatchFmrV3_(
        owner.email,
        batchId
      )
  };
}

function getRecentBulkImportBatchesFmrV3_(
  userEmail,
  maximumRows
) {
  assertOwnerFmrV3_(
    userEmail
  );

  const limit =
    Math.max(
      1,
      Math.min(
        50,
        numberFmrV3_(
          maximumRows
        ) ||
        10
      )
    );

  return getUsedRowsFmrV3_(
    FMR_V3_BULK_IMPORT
      .sheets
      .BATCHES
  )
    .filter(
      function (
        row
      ) {
        return yesFmrV3_(
          row.Active
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
            right.Created_At ||
            0
          ).getTime() -
          new Date(
            left.Created_At ||
            0
          ).getTime()
        );
      }
    )
    .slice(
      0,
      limit
    )
    .map(
      function (
        row
      ) {
        return {
          batchId:
            normalizeFmrV3_(
              row.Batch_ID
            ),

          sourceFileName:
            normalizeFmrV3_(
              row
                .Source_File_Name
            ),

          sourceType:
            normalizeUpperFmrV3_(
              row.Source_Type
            ),

          parserVersion:
            normalizeFmrV3_(
              row.Parser_Version
            ) ||
            'LEGACY',

          proposedFmrCount:
            numberFmrV3_(
              row
                .Proposed_FMR_Count
            ),

          totalLineCount:
            numberFmrV3_(
              row.Total_Line_Count
            ),

          validItemCount:
            numberFmrV3_(
              row.Valid_Item_Count
            ),

          warningItemCount:
            numberFmrV3_(
              row
                .Warning_Item_Count
            ),

          errorItemCount:
            numberFmrV3_(
              row.Error_Item_Count
            ),

          status:
            normalizeUpperFmrV3_(
              row.Status
            ),

          createdAt:
            formatDateTimeFmrV3_(
              row.Created_At
            )
        };
      }
    );
}

function inspectFmrV3BulkImportContract() {
  const targetDatabaseId =
    normalizeFmrV3_(
      FMR_V3_DATABASE_ID_
    ) ||
    FMR_V3.DEFAULT_DATABASE_ID;

  setFmrV3DatabaseContext_(
    targetDatabaseId
  );

  const sheets =
    bulkImportSheetDefinitionsFmrV3_()
      .map(
        function (
          definition
        ) {
          let valid = false;
          let error = '';

          try {
            valid =
              Boolean(
                fmrV3Database_()
                  .getSheetByName(
                    definition.name
                  )
              ) &&
              Boolean(
                headerMapFmrV3_(
                  definition.name
                )
              );
          } catch (
            exception
          ) {
            error =
              exception.message;
          }

          return {
            sheetName:
              definition.name,

            valid:
              valid,

            error:
              error
          };
        }
      );

  const output = {
    passed:
      sheets.every(
        function (
          result
        ) {
          return result.valid;
        }
      ) &&
      FMR_V3_BULK_IMPORT
        .limits
        .MAX_LINES_PER_FMR ===
        35,

    readOnly:
      true,

    version:
      FMR_V3.VERSION,

    databaseFingerprint:
      databaseFingerprintFmrV3_(),

    parserVersion:
      FMR_V3_BULK_IMPORT
        .parserVersion,

    maxLinesPerFmr:
      FMR_V3_BULK_IMPORT
        .limits
        .MAX_LINES_PER_FMR,

    maxWorksheets:
      FMR_V3_BULK_IMPORT
        .limits
        .MAX_WORKSHEETS,

    maxUploadBytes:
      FMR_V3_BULK_IMPORT
        .limits
        .MAX_UPLOAD_BYTES,

    uomRules: {
      descriptionStartsWithPipe:
        'LF',

      pipet:
        'EA',

      allOtherDescriptions:
        'EA'
    },

    historicalActivityMode:
      'SOURCE_EVIDENCE_ONLY',

    autoFillMissingFields:
      false,

    operationalSheetSource:
      'LINE_NO_FINAL_TWO_DIGIT_SUFFIX',

    sourceShtFieldMode:
      'IGNORED_SOURCE_EVIDENCE',

    sizeDateCoercionMode:
      'DATE_OBJECT_OR_SERIALIZED_DATE_TO_DAY_MONTH_FRACTION',

    existingStagingMode:
      'EXPLICIT_UPDATE_IN_PLACE',

    sheets:
      sheets
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

function runFmrV3BulkImportContractDiagnostic() {
  const output =
    inspectFmrV3BulkImportContract();

  if (!output.passed) {
    throw new Error(
      'FMR v3 bulk-import contract failed.'
    );
  }

  return output;
}

function migrateFmrV3BulkImport() {
  const targetDatabaseId =
    normalizeFmrV3_(
      FMR_V3_DATABASE_ID_
    ) ||
    FMR_V3.DEFAULT_DATABASE_ID;

  setFmrV3DatabaseContext_(
    targetDatabaseId
  );

  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const sheets =
      bulkImportSheetDefinitionsFmrV3_()
        .map(
          function (
            definition
          ) {
            return ensureBulkImportSheetFmrV3_(
              definition.name,
              definition.headers
            );
          }
        );

    const configuration =
      ensureBulkImportConfigurationFmrV3_();

    SpreadsheetApp.flush();

    const diagnostic =
      inspectFmrV3BulkImportContract();

    const output = {
      passed:
        diagnostic.passed,

      migration:
        'ALPHA17_SERIALIZED_FRACTION_SIZE_NORMALIZATION',

      version:
        FMR_V3.VERSION,

      sheets:
        sheets,

      configuration:
        configuration,

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
        'Sprint 5A bulk-import migration failed.'
      );
    }

    return output;
  } finally {
    lock.releaseLock();
  }
}

function bulkImportOperationalSheetMatchesSourceFmrV3_(
  item
) {
  const sourceHeader =
    bulkImportSourceHeaderFromRowFmrV3_(
      item
    );

  const identity =
    splitBulkImportLineIdentityFmrV3_(
      sourceHeader
        .sourceLineNumber
    );

  const storedSheet =
    normalizeFmrV3_(
      item.ISO_Sheet
    );

  if (
    !identity.valid ||
    !storedSheet
  ) {
    return false;
  }

  return (
    numberFmrV3_(
      storedSheet
    ) ===
    numberFmrV3_(
      identity.isoSheet
    )
  );
}

function inspectFmrV3BulkImportBatch(
  batchId
) {
  const targetDatabaseId =
    normalizeFmrV3_(
      FMR_V3_DATABASE_ID_
    ) ||
    FMR_V3.DEFAULT_DATABASE_ID;

  setFmrV3DatabaseContext_(
    targetDatabaseId
  );

  const email =
    normalizeEmailFmrV3_(
      Session
        .getEffectiveUser()
        .getEmail()
    );

  let targetBatchId =
    normalizeFmrV3_(
      batchId
    );

  if (!targetBatchId) {
    const latest =
      getUsedRowsFmrV3_(
        FMR_V3_BULK_IMPORT
          .sheets
          .BATCHES
      )
        .filter(
          function (
            row
          ) {
            return yesFmrV3_(
              row.Active
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
                right.Created_At ||
                0
              ).getTime() -
              new Date(
                left.Created_At ||
                0
              ).getTime()
            );
          }
        )[0];

    if (!latest) {
      throw new Error(
        'No active bulk-import batch exists.'
      );
    }

    targetBatchId =
      normalizeFmrV3_(
        latest.Batch_ID
      );
  }

  const batch =
    getBulkImportBatchFmrV3_(
      email,
      targetBatchId
    );

  const items =
    bulkImportItemsForBatchFmrV3_(
      targetBatchId
    );

  const lines =
    getUsedRowsFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .LINES
    ).filter(
      function (
        row
      ) {
        return (
          normalizeFmrV3_(
            row.Batch_ID
          ) ===
          normalizeFmrV3_(
            targetBatchId
          )
        );
      }
    );

  const batchIssues =
    getUsedRowsFmrV3_(
      FMR_V3_BULK_IMPORT
        .sheets
        .ISSUES
    ).filter(
      function (
        row
      ) {
        return (
          normalizeFmrV3_(
            row.Batch_ID
          ) ===
          normalizeFmrV3_(
            targetBatchId
          )
        );
      }
    );

  const fractionRepairIssues =
    batchIssues.filter(
      function (
        row
      ) {
        return (
          normalizeUpperFmrV3_(
            row.Issue_Code
          ) ===
          FMR_V3_BULK_IMPORT
            .issueCodes
            .SIZE_DATE_COERCION_REPAIRED
        );
      }
    );

  const repairedItemIds = {};

  fractionRepairIssues.forEach(
    function (
      row
    ) {
      repairedItemIds[
        normalizeFmrV3_(
          row.Import_Item_ID
        )
      ] =
        true;
    }
  );

  const unrepairedDateLikeSizeCount =
    lines.filter(
      function (
        line
      ) {
        const value =
          normalizeFmrV3_(
            line.Size
          );

        return (
          /\b(?:GMT|STANDARD TIME|DAYLIGHT TIME)\b/i.test(
            value
          ) ||
          /^(?:MON|TUE|WED|THU|FRI|SAT|SUN)\s/i.test(
            value
          )
        );
      }
    ).length;

  const missingIsoSheetCount =
    items.filter(
      function (
        item
      ) {
        return (
          !normalizeFmrV3_(
            item.ISO_Sheet
          )
        );
      }
    ).length;

  const derivedSheetCount =
    items.filter(
      function (
        item
      ) {
        return bulkImportOperationalSheetMatchesSourceFmrV3_(
          item
        );
      }
    ).length;

  const populatedSourceShtCount =
    items.filter(
      function (
        item
      ) {
        const sourceHeader =
          bulkImportSourceHeaderFromRowFmrV3_(
            item
          );

        return Boolean(
          normalizeFmrV3_(
            sourceHeader
              .sourceShtValue
          )
        );
      }
    ).length;

  const output = {
    passed:
      batch.proposedFmrCount ===
        batch.worksheetCount &&
      items.length ===
        batch.proposedFmrCount &&
      batch.totalLineCount ===
        lines.length &&
      derivedSheetCount ===
        items.length &&
      unrepairedDateLikeSizeCount ===
        0 &&
      items.every(
        function (
          item
        ) {
          return (
            numberFmrV3_(
              item
                .Parsed_Line_Count
            ) >= 1 &&
            numberFmrV3_(
              item
                .Parsed_Line_Count
            ) <=
              FMR_V3_BULK_IMPORT
                .limits
                .MAX_LINES_PER_FMR &&
            Boolean(
              normalizeFmrV3_(
                item.ISO_Number
              )
            ) &&
            bulkImportOperationalSheetMatchesSourceFmrV3_(
              item
            )
          );
        }
      ),

    readOnly:
      true,

    version:
      FMR_V3.VERSION,

    batchId:
      batch.batchId,

    sourceFileName:
      batch.sourceFileName,

    parserVersion:
      batch.parserVersion,

    worksheetCount:
      batch.worksheetCount,

    proposedFmrCount:
      batch.proposedFmrCount,

    totalLineCount:
      batch.totalLineCount,

    inspectedItemCount:
      items.length,

    inspectedLineCount:
      lines.length,

    maxParsedLineCount:
      items.reduce(
        function (
          maximum,
          item
        ) {
          return Math.max(
            maximum,
            numberFmrV3_(
              item
                .Parsed_Line_Count
            )
          );
        },
        0
      ),

    missingIsoSheetCount:
      missingIsoSheetCount,

    derivedSheetCount:
      derivedSheetCount,

    populatedSourceShtCount:
      populatedSourceShtCount,

    operationalSheetSource:
      'LINE_NO_FINAL_TWO_DIGIT_SUFFIX',

    operationalSheetComparison:
      'NUMERIC_EQUIVALENCE_TO_PRESERVED_SUFFIX',

    fractionSizeRepairCount:
      fractionRepairIssues.length,

    fractionSizeRepairItemCount:
      Object.keys(
        repairedItemIds
      ).length,

    unrepairedDateLikeSizeCount:
      unrepairedDateLikeSizeCount,

    sizeDateCoercionMode:
      'DATE_OBJECT_OR_SERIALIZED_DATE_TO_DAY_MONTH_FRACTION',

    uomCounts: {
      EA:
        lines.filter(
          function (
            line
          ) {
            return (
              normalizeUpperFmrV3_(
                line.Inferred_UOM
              ) ===
              'EA'
            );
          }
        ).length,

      LF:
        lines.filter(
          function (
            line
          ) {
            return (
              normalizeUpperFmrV3_(
                line.Inferred_UOM
              ) ===
              'LF'
            );
          }
        ).length
    },

    historicalActivityLineCount:
      lines.filter(
        function (
          line
        ) {
          return Boolean(
            normalizeFmrV3_(
              line.Legacy_Issued
            ) ||
            normalizeFmrV3_(
              line
                .Legacy_Backordered
            ) ||
            normalizeFmrV3_(
              line
                .Legacy_Action_Taken
            )
          );
        }
      ).length,

    status:
      batch.status,

    validItemCount:
      batch.validItemCount,

    warningItemCount:
      batch.warningItemCount,

    blockedItemCount:
      batch.errorItemCount
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
      'Bulk-import batch inspection failed structural assertions.'
    );
  }

  return output;
}

