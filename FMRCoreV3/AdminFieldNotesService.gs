const FMR_V3_ADMIN_FIELD_NOTES =
  Object.freeze({
    MAX_NOTES_PER_LINE:
      20,

    FIELD_TRANSACTION_TYPES:
      Object.freeze([
        'CONFIRM_AVAILABLE',
        'BAG',
        'DIRECT_ISSUE',
        'ISSUE_FROM_AVAILABLE',
        'ISSUE_FROM_BAG'
      ]),

    ISSUE_TRANSACTION_TYPES:
      Object.freeze([
        'DIRECT_ISSUE',
        'ISSUE_FROM_AVAILABLE',
        'ISSUE_FROM_BAG'
      ])
  });

function adminFieldNoteActionLabelFmrV3_(
  transactionType
) {
  const type =
    normalizeUpperFmrV3_(
      transactionType
    );

  const labels = {
    CONFIRM_AVAILABLE:
      'Confirm Available',

    BAG:
      'Bag & Tag',

    DIRECT_ISSUE:
      'Locate & Issue',

    ISSUE_FROM_AVAILABLE:
      'Issue Available',

    ISSUE_FROM_BAG:
      'Issue From Bag'
  };

  return (
    labels[
      type
    ] ||
    normalizeFmrV3_(
      transactionType
    )
  );
}

function adminFieldNoteSortValueFmrV3_(
  value
) {
  if (!value) {
    return 0;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(
          value
        );

  return Number.isNaN(
    date.getTime()
  )
    ? 0
    : date.getTime();
}

/**
 * Returns the text shown in Admin > FMR Detail > Field Notes.
 *
 * PERFORMANCE RULE:
 * - Uses only fields already present on the Material_Transactions row.
 * - Does NOT query Audit_Log.
 * - Does NOT issue an additional SpreadsheetApp read.
 * - Preserves an explicitly entered field note when one exists.
 * - For historical/future issue transactions with blank Notes, derives the
 *   issuance event text from Quantity, UOM and Issued_To_Name.
 *
 * This allows an ISSUE_* transaction to participate in the existing
 * newest-first note ordering even when its legacy Notes cell is blank.
 */
function adminFieldTransactionDisplayNoteFmrV3_(
  transaction,
  transactionType
) {
  const record =
    transaction ||
    {};

  const explicitNote =
    normalizeFmrV3_(
      record.Notes
    );

  if (explicitNote) {
    return explicitNote;
  }

  const type =
    normalizeUpperFmrV3_(
      transactionType ||
      record.Transaction_Type
    );

  if (
    !FMR_V3_ADMIN_FIELD_NOTES
      .ISSUE_TRANSACTION_TYPES
      .includes(
        type
      )
  ) {
    return '';
  }

  const issuedTo =
    normalizeFmrV3_(
      record.Issued_To_Name
    );

  if (!issuedTo) {
    return '';
  }

  const quantity =
    numberFmrV3_(
      record.Quantity
    );

  const uom =
    normalizeFmrV3_(
      record.UOM
    );

  const quantityLabel =
    [
      quantity > 0
        ? String(
            quantity
          )
        : '',
      uom
    ]
      .filter(
        Boolean
      )
      .join(
        ' '
      );

  const verb =
    type ===
      'DIRECT_ISSUE'
      ? 'located and issued to'
      : 'issued to';

  return (
    (
      quantityLabel
        ? quantityLabel +
          ' '
        : ''
    ) +
    verb +
    ' ' +
    issuedTo +
    '.'
  );
}

function adminFieldTransactionNotesByLineFmrV3_(
  fmrNumber
) {
  const normalizedFmr =
    normalizeUpperFmrV3_(
      fmrNumber
    );

  const result = {};

  if (!normalizedFmr) {
    return result;
  }

  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS
        .TRANSACTIONS,
      4,
      normalizedFmr
    );

  const transactions =
    readRowsObjectsFmrV3_(
      FMR_V3.SHEETS
        .TRANSACTIONS,
      rows
    );

  transactions.forEach(
    function (
      transaction
    ) {
      const type =
        normalizeUpperFmrV3_(
          transaction
            .Transaction_Type
        );

      const lineId =
        normalizeFmrV3_(
          transaction
            .FMR_Line_ID
        );

      if (
        !lineId ||
        normalizeUpperFmrV3_(
          transaction
            .FMR_Number
        ) !==
          normalizedFmr ||
        !FMR_V3_ADMIN_FIELD_NOTES
          .FIELD_TRANSACTION_TYPES
          .includes(
            type
          )
      ) {
        return;
      }

      const notes =
        adminFieldTransactionDisplayNoteFmrV3_(
          transaction,
          type
        );

      if (!notes) {
        return;
      }

      if (!result[lineId]) {
        result[
          lineId
        ] = [];
      }

      result[
        lineId
      ].push({
        noteId:
          normalizeFmrV3_(
            transaction
              .Transaction_ID
          ),

        source:
          'FIELD_TRANSACTION',

        action:
          type,

        actionLabel:
          adminFieldNoteActionLabelFmrV3_(
            type
          ),

        quantity:
          numberFmrV3_(
            transaction
              .Quantity
          ),

        uom:
          normalizeFmrV3_(
            transaction
              .UOM
          ),

        performedBy:
          normalizeFmrV3_(
            transaction
              .Performed_By_Name
          ),

        issuedTo:
          normalizeFmrV3_(
            transaction
              .Issued_To_Name
          ),

        storageLocation:
          normalizeFmrV3_(
            transaction
              .Storage_Location
          ),

        timestamp:
          formatDateTimeFmrV3_(
            transaction
              .Timestamp
          ),

        sortValue:
          adminFieldNoteSortValueFmrV3_(
            transaction
              .Timestamp
          ),

        notes:
          notes
      });
    }
  );

  return result;
}

function adminFieldBackorderNotesByLineFmrV3_(
  fmrNumber
) {
  const normalizedFmr =
    normalizeUpperFmrV3_(
      fmrNumber
    );

  const result = {};

  if (!normalizedFmr) {
    return result;
  }

  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS
        .BACKORDERS,
      4,
      normalizedFmr
    );

  const requests =
    readRowsObjectsFmrV3_(
      FMR_V3.SHEETS
        .BACKORDERS,
      rows
    );

  requests.forEach(
    function (
      request
    ) {
      const notes =
        normalizeFmrV3_(
          request
            .Field_Notes
        );

      const lineId =
        normalizeFmrV3_(
          request
            .FMR_Line_ID
        );

      if (
        !lineId ||
        !notes ||
        normalizeUpperFmrV3_(
          request
            .FMR_Number
        ) !==
          normalizedFmr
      ) {
        return;
      }

      if (!result[lineId]) {
        result[
          lineId
        ] = [];
      }

      result[
        lineId
      ].push({
        noteId:
          normalizeFmrV3_(
            request
              .Backorder_Request_ID
          ),

        source:
          'BACKORDER_REQUEST',

        action:
          'BACKORDER_REQUESTED',

        actionLabel:
          'Backorder Request',

        quantity:
          numberFmrV3_(
            request
              .Qty_Requested_Backorder
          ),

        uom:
          '',

        performedBy:
          normalizeFmrV3_(
            request
              .Reported_By_Name
          ),

        issuedTo:
          '',

        storageLocation:
          '',

        timestamp:
          formatDateTimeFmrV3_(
            request
              .Reported_At
          ),

        sortValue:
          adminFieldNoteSortValueFmrV3_(
            request
              .Reported_At
          ),

        notes:
          notes
      });
    }
  );

  return result;
}

function mergeAdminFieldNotesForLineFmrV3_(
  transactionNotes,
  backorderNotes
) {
  const notes =
    []
      .concat(
        transactionNotes ||
        []
      )
      .concat(
        backorderNotes ||
        []
      )
      .sort(
        function (
          left,
          right
        ) {
          return (
            numberFmrV3_(
              right.sortValue
            ) -
            numberFmrV3_(
              left.sortValue
            )
          );
        }
      );

  const totalCount =
    notes.length;

  return {
    fieldNoteCount:
      totalCount,

    fieldNotesTruncated:
      totalCount >
      FMR_V3_ADMIN_FIELD_NOTES
        .MAX_NOTES_PER_LINE,

    fieldNotes:
      notes
        .slice(
          0,
          FMR_V3_ADMIN_FIELD_NOTES
            .MAX_NOTES_PER_LINE
        )
        .map(
          function (
            note
          ) {
            return {
              noteId:
                note.noteId,

              source:
                note.source,

              action:
                note.action,

              actionLabel:
                note.actionLabel,

              quantity:
                note.quantity,

              uom:
                note.uom,

              performedBy:
                note.performedBy,

              issuedTo:
                note.issuedTo,

              storageLocation:
                note.storageLocation,

              timestamp:
                note.timestamp,

              notes:
                note.notes
            };
          }
        )
  };
}

function getAdminFmrDetailWithFieldNotesFmrV3_(
  userEmail,
  fmrNumber
) {
  const user =
    assertBackorderAdminFmrV3_(
      userEmail
    );

  const normalizedFmr =
    normalizeFmrV3_(
      fmrNumber
    );

  if (!normalizedFmr) {
    throw new Error(
      'FMR number is required.'
    );
  }

  const search =
    searchPublishedFmrV3_(
      user.email,
      normalizedFmr,
      'FMR'
    );

  if (
    !search.cards ||
    search.cards.length !==
      1
  ) {
    throw new Error(
      (
        'Published FMR not found: ' +
        normalizedFmr
      )
    );
  }

  const card =
    search.cards[0];

  const transactionNotesByLine =
    adminFieldTransactionNotesByLineFmrV3_(
      card.fmrNumber
    );

  const backorderNotesByLine =
    adminFieldBackorderNotesByLineFmrV3_(
      card.fmrNumber
    );

  card.materials =
    (
      card.materials ||
      []
    ).map(
      function (
        material
      ) {
        const lineId =
          normalizeFmrV3_(
            material
              .fmrLineId
          );

        return Object.assign(
          {},
          material,
          mergeAdminFieldNotesForLineFmrV3_(
            transactionNotesByLine[
              lineId
            ] ||
            [],
            backorderNotesByLine[
              lineId
            ] ||
            []
          )
        );
      }
    );

  return {
    generatedAt:
      formatDateTimeFmrV3_(
        nowFmrV3_()
      ),

    user:
      user,

    card:
      card,

    fieldNotePolicy: {
      sourceOfTruth:
        'MATERIAL_TRANSACTIONS_AND_BACKORDER_REQUESTS',

      loadPolicy:
        'ADMIN_FMR_DETAIL_ONLY',

      blankIssueTransactionNotePolicy:
        'DERIVE_FROM_ALREADY_LOADED_TRANSACTION_METADATA',

      additionalSpreadsheetReadsForDerivedIssueNotes:
        0,

      maximumNotesPerLine:
        FMR_V3_ADMIN_FIELD_NOTES
          .MAX_NOTES_PER_LINE,

      newestFirst:
        true,

      fieldTransactionTypes:
        FMR_V3_ADMIN_FIELD_NOTES
          .FIELD_TRANSACTION_TYPES
    }
  };
}

function getFmrV3AdminFmrDetail(
  databaseId,
  userEmail,
  fmrNumber
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  return getAdminFmrDetailWithFieldNotesFmrV3_(
    userEmail,
    fmrNumber
  );
}
