const FMR_V3_FIELD_METADATA =
  Object.freeze({
    storageListName:
      'STORAGE_LOCATION',

    initialStorageLocations:
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
      ])
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
          return normalizeUpperFmrV3_(
            value
          );
        }
      ).filter(Boolean)
    )
  ).sort();
}

function canonicalStorageLocationFmrV3_(
  value,
  required
) {
  const normalized =
    normalizeUpperFmrV3_(
      value
    );

  if (!normalized) {
    if (required) {
      throw new Error(
        'Choose a configured Storage Location.'
      );
    }

    return '';
  }

  const configured =
    configuredStorageLocationsFmrV3_();

  if (!configured.length) {
    throw new Error(
      'No active Storage Locations are configured. ' +
      'A System Owner must add STORAGE_LOCATION values to the Lists sheet.'
    );
  }

  const match =
    configured.find(
      function (
        location
      ) {
        return (
          normalizeUpperFmrV3_(
            location
          ) ===
          normalized
        );
      }
    );

  if (!match) {
    throw new Error(
      (
        'Storage Location "' +
        normalizeFmrV3_(
          value
        ) +
        '" is not configured. Choose one of: ' +
        configured.join(', ')
      )
    );
  }

  return match;
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
      500
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
      canonicalStorageLocationFmrV3_(
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
          normalizeUpperFmrV3_(
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
    .initialStorageLocations
    .forEach(
      function (
        location
      ) {
        const normalized =
          normalizeUpperFmrV3_(
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

  const correlationId =
    uuidFmrV3_(
      'CORR'
    );

  appendAuditFmrV3_(
    'SYSTEM',
    'FIELD_METADATA_LISTS',
    'FIELD_METADATA_LISTS_SEEDED',
    user,
    correlationId,
    {
      sourceInterface:
        'MIGRATION',

      payload: {
        inserted:
          inserted,

        configured:
          configuredStorageLocationsFmrV3_()
      }
    }
  );

  const diagnostic =
    inspectFmrV3FieldMetadataContract();

  const output = {
    passed:
      diagnostic.passed,

    migration:
      'ALPHA7_FIELD_METADATA_LISTS',

    performedBy:
      user.email,

    insertedCount:
      inserted.length,

    inserted:
      inserted,

    configuredStorageLocations:
      diagnostic.configuredStorageLocations,

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
      'Field metadata list migration did not pass its post-diagnostic.'
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

  const configured =
    configuredStorageLocationsFmrV3_();

  let invalidLocationRejected =
    false;

  try {
    canonicalStorageLocationFmrV3_(
      'V3-TESET-LAYDOWN',
      true
    );
  } catch (
    ignored
  ) {
    invalidLocationRejected =
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
          configured.length
            ? configured[0]
                .toLowerCase()
            : '',

        notes:
          '  Metadata   diagnostic  '
      }
    );

  const output = {
    passed:
      configured.length > 0 &&
      configured.every(
        function (
          location
        ) {
          return (
            location ===
            normalizeUpperFmrV3_(
              location
            )
          );
        }
      ) &&
      invalidLocationRejected &&
      normalizedPayload
        .performedByName ===
        normalizeFmrV3_(
          user.name ||
          user.email
        ) &&
      normalizedPayload
        .storageLocation ===
        configured[0] &&
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

    configuredStorageLocations:
      configured,

    invalidLocationRejected:
      invalidLocationRejected,

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
