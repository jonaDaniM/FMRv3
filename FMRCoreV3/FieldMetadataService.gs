const FMR_V3_FIELD_METADATA =
  Object.freeze({
    storageListName:
      'STORAGE_LOCATION',

    initialStorageSuggestions:
      Object.freeze([
        'V3-TEST-LAYDOWN'
      ]),

    storageActions:
      Object.freeze([
        'CONFIRM_AVAILABLE',
        'BAG',
        'DIRECT_ISSUE'
      ]),

    requiredStorageActions:
      Object.freeze([
        'CONFIRM_AVAILABLE',
        'BAG'
      ]),

    storageMaximumLength:
      100,

    notesMaximumLength:
      500
  });

function configuredStorageLocationsFmrV3_() {
  return Array.from(
    new Set(
      getListValuesFmrV3_(
        FMR_V3_FIELD_METADATA
          .storageListName
      ).map(
        function (
          value
        ) {
          return normalizeStorageLocationFmrV3_(
            value
          );
        }
      ).filter(Boolean)
    )
  ).sort();
}

function normalizeStorageLocationFmrV3_(
  value
) {
  return normalizeUpperFmrV3_(
    value
  )
    .replace(
      /\s+/g,
      ' '
    )
    .slice(
      0,
      FMR_V3_FIELD_METADATA
        .storageMaximumLength
    );
}

function validateStorageLocationFmrV3_(
  value,
  required
) {
  const normalized =
    normalizeStorageLocationFmrV3_(
      value
    );

  if (
    required &&
    !normalized
  ) {
    throw new Error(
      'Storage Location is required.'
    );
  }

  return normalized;
}

function normalizeFieldNotesFmrV3_(
  value
) {
  return normalizeFmrV3_(
    value
  )
    .replace(
      /\s+/g,
      ' '
    )
    .slice(
      0,
      FMR_V3_FIELD_METADATA
        .notesMaximumLength
    );
}

function normalizeFieldActionMetadataFmrV3_(
  user,
  action,
  request
) {
  const payload =
    Object.assign(
      {},
      request || {}
    );

  const normalizedAction =
    normalizeUpperFmrV3_(
      action
    );

  payload.performedByName =
    normalizeFmrV3_(
      user.name ||
      user.email
    );

  payload.issuedToName =
    normalizeFmrV3_(
      payload.issuedToName
    );

  payload.reason =
    normalizeFmrV3_(
      payload.reason
    );

  payload.notes =
    normalizeFieldNotesFmrV3_(
      payload.notes
    );

  if (
    FMR_V3_FIELD_METADATA
      .storageActions
      .includes(
        normalizedAction
      )
  ) {
    payload.storageLocation =
      validateStorageLocationFmrV3_(
        payload.storageLocation,
        FMR_V3_FIELD_METADATA
          .requiredStorageActions
          .includes(
            normalizedAction
          )
      );
  } else {
    payload.storageLocation =
      '';
  }

  return payload;
}

function seedFmrV3FieldMetadataLists() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const user =
    assertOwnerFmrV3_(
      normalizeEmailFmrV3_(
        Session
          .getEffectiveUser()
          .getEmail()
      )
    );

  const rows =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.LISTS
    );

  const existing = {};

  rows.forEach(
    function (
      row
    ) {
      if (
        normalizeUpperFmrV3_(
          row.List_Name
        ) ===
        FMR_V3_FIELD_METADATA
          .storageListName &&
        yesFmrV3_(
          row.Active
        )
      ) {
        existing[
          normalizeStorageLocationFmrV3_(
            row.Value
          )
        ] = true;
      }
    }
  );

  let nextSortOrder =
    rows.reduce(
      function (
        maximum,
        row
      ) {
        if (
          normalizeUpperFmrV3_(
            row.List_Name
          ) !==
          FMR_V3_FIELD_METADATA
            .storageListName
        ) {
          return maximum;
        }

        return Math.max(
          maximum,
          numberFmrV3_(
            row.Sort_Order
          )
        );
      },
      0
    ) +
    1;

  const inserted = [];

  FMR_V3_FIELD_METADATA
    .initialStorageSuggestions
    .forEach(
      function (
        location
      ) {
        const normalized =
          normalizeStorageLocationFmrV3_(
            location
          );

        if (
          existing[
            normalized
          ]
        ) {
          return;
        }

        appendObjectFmrV3_(
          FMR_V3.SHEETS.LISTS,
          {
            List_Name:
              FMR_V3_FIELD_METADATA
                .storageListName,

            Value:
              normalized,

            Sort_Order:
              nextSortOrder,

            Active:
              FMR_V3.YES
          }
        );

        inserted.push(
          normalized
        );

        existing[
          normalized
        ] = true;

        nextSortOrder +=
          1;
      }
    );

  SpreadsheetApp.flush();

  appendAuditFmrV3_(
    'SYSTEM',
    'FIELD_METADATA_LISTS',
    'FIELD_METADATA_LISTS_SEEDED',
    user,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'MIGRATION',

      payload: {
        inserted:
          inserted,

        configuredSuggestions:
          configuredStorageLocationsFmrV3_(),

        storageLocationMode:
          'FREE_TEXT_WITH_SUGGESTIONS'
      }
    }
  );

  const diagnostic =
    inspectFmrV3FieldMetadataContract();

  const output = {
    passed:
      diagnostic.passed,

    migration:
      'ALPHA7_FIELD_METADATA_SUGGESTIONS',

    performedBy:
      user.email,

    insertedCount:
      inserted.length,

    inserted:
      inserted,

    configuredStorageSuggestions:
      diagnostic.configuredStorageSuggestions,

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
      'Field metadata suggestion migration did not pass its post-diagnostic.'
    );
  }

  return output;
}

function inspectFmrV3FieldMetadataContract() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const started =
    Date.now();

  const user =
    assertSearchUserFmrV3_(
      normalizeEmailFmrV3_(
        Session
          .getEffectiveUser()
          .getEmail()
      )
    );

  const suggestions =
    configuredStorageLocationsFmrV3_();

  const newLocation =
    validateStorageLocationFmrV3_(
      '  north   warehouse  -  rack b14  ',
      true
    );

  const misspelledLocation =
    validateStorageLocationFmrV3_(
      'v3-teset-laydown',
      true
    );

  let emptyRequiredRejected =
    false;

  try {
    validateStorageLocationFmrV3_(
      '',
      true
    );
  } catch (
    ignored
  ) {
    emptyRequiredRejected =
      true;
  }

  const normalizedPayload =
    normalizeFieldActionMetadataFmrV3_(
      user,
      FMR_V3.ACTIONS.BAG,
      {
        performedByName:
          'Jonathan Muratall',

        storageLocation:
          ' north warehouse - row 4 ',

        notes:
          '  Metadata   diagnostic  '
      }
    );

  const output = {
    passed:
      suggestions.length > 0 &&
      newLocation ===
        'NORTH WAREHOUSE - RACK B14' &&
      misspelledLocation ===
        'V3-TESET-LAYDOWN' &&
      emptyRequiredRejected &&
      normalizedPayload
        .performedByName ===
        normalizeFmrV3_(
          user.name ||
          user.email
        ) &&
      normalizedPayload
        .storageLocation ===
        'NORTH WAREHOUSE - ROW 4' &&
      normalizedPayload
        .notes ===
        'Metadata diagnostic',

    readOnly:
      true,

    elapsedMs:
      Date.now() -
      started,

    version:
      FMR_V3.VERSION,

    authenticatedEmail:
      user.email,

    authenticatedPerformer:
      normalizeFmrV3_(
        user.name ||
        user.email
      ),

    storageLocationMode:
      'FREE_TEXT_WITH_SUGGESTIONS',

    configuredStorageSuggestions:
      suggestions,

    acceptsNewLocation:
      newLocation,

    preservesUnrecognizedText:
      misspelledLocation,

    emptyRequiredRejected:
      emptyRequiredRejected,

    normalizedPayload:
      normalizedPayload
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

function runFmrV3FieldMetadataDiagnostic() {
  const output =
    inspectFmrV3FieldMetadataContract();

  if (!output.passed) {
    throw new Error(
      'FMR v3 Field metadata diagnostic failed.'
    );
  }

  return output;
}
