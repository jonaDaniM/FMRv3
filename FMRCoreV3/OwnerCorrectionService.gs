/**
 * FMR Operations v3 — Alpha 30
 * Owner-only transaction correction / reversal service.
 *
 * Governing rules:
 *  - Original Material_Transactions rows are immutable.
 *  - Reversal acts on a logical Correlation_ID group when available.
 *  - A written reason, four-digit verification code and automatic
 *    pre-change backup are required.
 *  - Compensating REVERSAL_* transactions are appended.
 *  - FMR line/header state, Bag & Tag state, Backorders and Field notices are
 *    reconciled after a successful correction.
 */
const FMR_V3_OWNER_CORRECTIONS = Object.freeze({
  SHEET:'Owner_Corrections',
  HEADERS:Object.freeze([
    'Correction_ID','Target_Group_ID','FMR_ID','FMR_Number','FMR_Line_IDs',
    'Correction_Type','Reason','Status','Previewed_By','Previewed_At',
    'Applied_By','Applied_At','Backup_ID','Before_JSON','After_JSON',
    'Transaction_IDs','Reversal_Transaction_IDs','Error_Message','Notes'
  ]),
  SUPPORTED:Object.freeze([
    'CONFIRM_AVAILABLE','DIRECT_ISSUE','ISSUE_FROM_AVAILABLE','BAG',
    'ISSUE_FROM_BAG','BACKORDER_REQUESTED','BACKORDER_CONFIRMED',
    'BACKORDER_REJECTED','BACKORDER_RETURNED','BACKORDER_FULFILLED',
    'BACKORDER_RETURN_RESOLVED'
  ])
});

function ownerCorrectionAppliedGroupSetFmrV3_() {
  const applied = new Set();

  ownerCorrectionRowsFmrV3_().forEach(function (row) {
    if (normalizeUpperFmrV3_(row.Status) !== 'APPLIED') return;

    const groupId = normalizeFmrV3_(row.Target_Group_ID);
    if (groupId) applied.add(groupId);
  });

  return applied;
}

function ensureOwnerCorrectionSheetFmrV3_() {
  return ensureHistoricalMigrationSheetFmrV3_(
    FMR_V3_OWNER_CORRECTIONS.SHEET,
    FMR_V3_OWNER_CORRECTIONS.HEADERS
  );
}

function ownerCorrectionRowsFmrV3_() {
  return historicalReadRowsFmrV3_(
    FMR_V3_OWNER_CORRECTIONS.SHEET,
    FMR_V3_OWNER_CORRECTIONS.HEADERS
  );
}

function ownerCorrectionAppliedForGroupFmrV3_(groupId) {
  const target = normalizeFmrV3_(groupId);
  if (!target) return false;

  const sheet = ensureOwnerCorrectionSheetFmrV3_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const groupColumn =
    FMR_V3_OWNER_CORRECTIONS.HEADERS.indexOf('Target_Group_ID') + 1;

  const matches = sheet
    .getRange(2, groupColumn, lastRow - 1, 1)
    .createTextFinder(target)
    .matchEntireCell(true)
    .findAll();

  if (!matches.length) return false;

  const headers =
    Array.from(
      FMR_V3_OWNER_CORRECTIONS.HEADERS
    );

  return matches.some(function (range) {
    const values =
      sheet
        .getRange(
          range.getRow(),
          1,
          1,
          headers.length
        )
        .getValues()[0];

    const record = {};

    headers.forEach(function (header, index) {
      record[header] = values[index];
    });

    return (
      normalizeFmrV3_(record.Target_Group_ID) === target &&
      normalizeUpperFmrV3_(record.Status) === 'APPLIED'
    );
  });
}



function ownerCorrectionConfirmationCodeFmrV3_(groupId) {
  const target = normalizeFmrV3_(groupId);

  if (!target) {
    throw new Error('Transaction group ID is required.');
  }

  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    target
  );

  const first =
    (Number(digest[0]) + 256) % 256;

  const second =
    (Number(digest[1]) + 256) % 256;

  /**
   * Four-digit deterministic attention code.
   *
   * This is intentionally NOT the authorization boundary. Owner permission,
   * written reason, dependency validation, ScriptLock, automatic backup and
   * append-only reversal history remain the actual safeguards.
   */
  const code =
    ((first * 256) + second) % 10000;

  return String(code).padStart(4, '0');
}

function ownerCorrectionRowsForFmrNumbersFmrV3_(
  sheetName,
  fmrNumberColumn,
  fmrNumbers
) {
  const rows = [];

  Array.from(
    new Set(
      (fmrNumbers || [])
        .map(normalizeFmrV3_)
        .filter(Boolean)
    )
  ).forEach(function (fmrNumber) {
    rows.push.apply(
      rows,
      findRowsByExactValueFmrV3_(
        sheetName,
        fmrNumberColumn,
        fmrNumber
      )
    );
  });

  return readRowsObjectsFmrV3_(
    sheetName,
    Array.from(new Set(rows))
  );
}

function ownerCorrectionSearchLinesFmrV3_(query, mode) {
  const keys = normalizeSearchRequestFmrV3_(query, mode);
  let entries = [];
  keys.some(function(key){
    const found = lookupIndexEntriesFmrV3_(FMR_V3.SHEETS.SEARCH_INDEX,key);
    if (found.length) { entries = found; return true; }
    return false;
  });
  const rows = Array.from(new Set(entries.map(function(e){
    return numberFmrV3_(e.Line_Row);
  }).filter(function(row){ return row > 1; })));
  return readRowsObjectsFmrV3_(FMR_V3.SHEETS.LINES,rows)
    .filter(function(line){ return yesFmrV3_(line.Active); });
}


function ownerCorrectionTransactionsForLinesFmrV3_(lines) {
  const sourceLines = Array.isArray(lines) ? lines : [];
  if (!sourceLines.length) return [];

  const lineIds = new Set(
    sourceLines
      .map(function (line) {
        return normalizeFmrV3_(line.FMR_Line_ID);
      })
      .filter(Boolean)
  );

  const fmrNumbers = sourceLines
    .map(function (line) {
      return normalizeFmrV3_(line.FMR_Number);
    })
    .filter(Boolean);

  return ownerCorrectionRowsForFmrNumbersFmrV3_(
    FMR_V3.SHEETS.TRANSACTIONS,
    4,
    fmrNumbers
  )
    .filter(function (transaction) {
      return lineIds.has(
        normalizeFmrV3_(transaction.FMR_Line_ID)
      );
    })
    .sort(function (left, right) {
      return (
        new Date(left.Timestamp || 0).getTime() -
        new Date(right.Timestamp || 0).getTime()
      );
    });
}


function ownerCorrectionBagHistoryFmrV3_(lineIds) {
  const itemRows = [];
  (lineIds||[]).forEach(function(lineId){
    itemRows.push.apply(itemRows,findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS.BAG_ITEMS,4,lineId
    ));
  });
  const items = readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.BAG_ITEMS,Array.from(new Set(itemRows))
  );
  const headerRows = [];
  items.forEach(function(item){
    headerRows.push.apply(headerRows,findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS.BAG_HEADERS,1,item.Bag_Tag_ID
    ));
  });
  const headers = readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.BAG_HEADERS,Array.from(new Set(headerRows))
  );
  const byId = {};
  headers.forEach(function(h){ byId[normalizeFmrV3_(h.Bag_Tag_ID)] = h; });
  return items.map(function(item){
    const h = byId[normalizeFmrV3_(item.Bag_Tag_ID)] || {};
    return {
      bagTagId:normalizeFmrV3_(item.Bag_Tag_ID),
      bagTagItemId:normalizeFmrV3_(item.Bag_Tag_Item_ID),
      tagNumber:normalizeFmrV3_(item.Tag_Number || h.Tag_Number),
      fmrNumber:normalizeFmrV3_(h.FMR_Number),
      fmrLineId:normalizeFmrV3_(item.FMR_Line_ID),
      isoKey:normalizeFmrV3_(h.ISO_Key),
      commodityCode:normalizeFmrV3_(item.Commodity_Code),
      size:normalizeFmrV3_(item.Size),
      materialDescription:normalizeFmrV3_(item.Material_Description),
      qtyBagged:numberFmrV3_(item.Qty_Bagged),
      qtyIssued:numberFmrV3_(item.Qty_Issued_From_Bag),
      qtyRemaining:numberFmrV3_(item.Qty_Remaining_In_Bag),
      uom:normalizeFmrV3_(item.UOM),
      status:normalizeFmrV3_(item.Status || h.Status),
      storageLocation:normalizeFmrV3_(h.Storage_Location),
      baggedBy:normalizeFmrV3_(h.Bagged_By_Name),
      baggedAt:formatDateTimeFmrV3_(h.Bagged_At)
    };
  });
}

function ownerCorrectionBackorderHistoryFmrV3_(lines) {
  const sourceLines = Array.isArray(lines) ? lines : [];
  if (!sourceLines.length) return [];

  const lineIds = new Set(
    sourceLines
      .map(function (line) {
        return normalizeFmrV3_(line.FMR_Line_ID);
      })
      .filter(Boolean)
  );

  const fmrNumbers = sourceLines
    .map(function (line) {
      return normalizeFmrV3_(line.FMR_Number);
    })
    .filter(Boolean);

  return ownerCorrectionRowsForFmrNumbersFmrV3_(
    FMR_V3.SHEETS.BACKORDERS,
    4,
    fmrNumbers
  )
    .filter(function (request) {
      return lineIds.has(
        normalizeFmrV3_(request.FMR_Line_ID)
      );
    })
    .map(function (request) {
      return {
        requestId: normalizeFmrV3_(request.Backorder_Request_ID),
        fmrNumber: normalizeFmrV3_(request.FMR_Number),
        fmrLineId: normalizeFmrV3_(request.FMR_Line_ID),
        commodityCode: normalizeFmrV3_(request.Commodity_Code),
        qtyRequested: numberFmrV3_(request.Qty_Requested_Backorder),
        qtyConfirmed: numberFmrV3_(request.Qty_Confirmed_Backorder),
        qtyPending: numberFmrV3_(request.Qty_Pending),
        reason: normalizeFmrV3_(request.Reason),
        status: normalizeFmrV3_(request.Status),
        adminDecision: normalizeFmrV3_(request.Admin_Decision),
        adminNotes: normalizeFmrV3_(request.Admin_Notes),
        active: yesFmrV3_(request.Active),
        reportedAt: formatDateTimeFmrV3_(request.Reported_At),
        updatedAt: formatDateTimeFmrV3_(request.Updated_At)
      };
    });
}
   
function ownerCorrectionGroupIdFmrV3_(transaction) {
  return normalizeFmrV3_(transaction.Correlation_ID) ||
    normalizeFmrV3_(transaction.Transaction_ID);
}

function ownerCorrectionSupportedFmrV3_(type) {
  const value = normalizeUpperFmrV3_(type);
  return !value.startsWith('REVERSAL_') &&
    FMR_V3_OWNER_CORRECTIONS.SUPPORTED.includes(value);
}

function ownerCorrectionSerializeTransactionFmrV3_(t) {
  return {
    transactionId:normalizeFmrV3_(t.Transaction_ID),
    correlationId:normalizeFmrV3_(t.Correlation_ID),
    groupId:ownerCorrectionGroupIdFmrV3_(t),
    fmrId:normalizeFmrV3_(t.FMR_ID),
    fmrNumber:normalizeFmrV3_(t.FMR_Number),
    fmrLineId:normalizeFmrV3_(t.FMR_Line_ID),
    type:normalizeUpperFmrV3_(t.Transaction_Type),
    quantity:numberFmrV3_(t.Quantity),
    uom:normalizeFmrV3_(t.UOM),
    authenticatedEmail:normalizeFmrV3_(t.Authenticated_Email),
    performedBy:normalizeFmrV3_(t.Performed_By_Name),
    issuedTo:normalizeFmrV3_(t.Issued_To_Name),
    sourceBagTagId:normalizeFmrV3_(t.Source_Bag_Tag_ID),
    targetBagTagId:normalizeFmrV3_(t.Target_Bag_Tag_ID),
    storageLocation:normalizeFmrV3_(t.Storage_Location),
    backorderRequestId:normalizeFmrV3_(t.Backorder_Request_ID),
    timestamp:formatDateTimeFmrV3_(t.Timestamp),
    notes:normalizeFmrV3_(t.Notes),
    supportedForReversal:ownerCorrectionSupportedFmrV3_(t.Transaction_Type)
  };
}

function ownerCorrectionBuildGroupsFmrV3_(
  transactions,
  serializedLinesById,
  appliedGroups
) {
  const byGroup = {};
  const applied = appliedGroups || new Set();

  (transactions || []).forEach(function (transaction) {
    const id = ownerCorrectionGroupIdFmrV3_(transaction);

    if (!byGroup[id]) {
      byGroup[id] = {
        groupId: id,
        correlationId: normalizeFmrV3_(transaction.Correlation_ID),
        fmrId: normalizeFmrV3_(transaction.FMR_ID),
        fmrNumber: normalizeFmrV3_(transaction.FMR_Number),
        timestamp: transaction.Timestamp,
        transactions: []
      };
    }

    byGroup[id].transactions.push(transaction);

    if (
      new Date(transaction.Timestamp || 0).getTime() <
      new Date(byGroup[id].timestamp || 0).getTime()
    ) {
      byGroup[id].timestamp = transaction.Timestamp;
    }
  });

  return Object.keys(byGroup)
    .map(function (id) {
      const group = byGroup[id];

      const txns = group.transactions.map(
        ownerCorrectionSerializeTransactionFmrV3_
      );

      const unsupported = txns.filter(function (transaction) {
        return !transaction.supportedForReversal;
      });

      const materials = Array.from(new Set(
        txns
          .map(function (transaction) {
            return normalizeFmrV3_(transaction.fmrLineId);
          })
          .filter(Boolean)
      ))
        .map(function (lineId) {
          return serializedLinesById[lineId] || null;
        })
        .filter(Boolean);

      const already = applied.has(id);

      return {
        groupId: id,
        groupReference: id.length > 8 ? id.slice(-8) : id,
        correlationId: group.correlationId,
        fmrId: group.fmrId,
        fmrNumber: group.fmrNumber,
        timestamp: formatDateTimeFmrV3_(group.timestamp),
        transactionCount: txns.length,
        transactionTypes: Array.from(new Set(
          txns.map(function (transaction) {
            return transaction.type;
          })
        )),
        transactions: txns,
        materials: materials,
        alreadyReversed: already,
        canPreviewReversal: !already && unsupported.length === 0,
        blockingReason: already
          ? 'This transaction group already has an applied Owner correction.'
          : (
              unsupported.length
                ? 'Unsupported transaction type(s): ' +
                  unsupported.map(function (transaction) {
                    return transaction.type;
                  }).join(', ')
                : ''
            )
      };
    })
    .sort(function (left, right) {
      return (
        new Date(right.timestamp || 0).getTime() -
        new Date(left.timestamp || 0).getTime()
      );
    });
}

function searchOwnerLedgerFmrV3_(userEmail, query, mode) {
  const started = Date.now();
  const owner = assertOwnerFmrV3_(userEmail);

  ensureOwnerCorrectionSheetFmrV3_();

  const timings = {};

  let phase = Date.now();
  const lines = ownerCorrectionSearchLinesFmrV3_(query, mode);
  timings.lineSearchMs = Date.now() - phase;

  if (!lines.length) {
    return {
      generatedAt: formatDateTimeFmrV3_(nowFmrV3_()),
      elapsedMs: Date.now() - started,
      timings: timings,
      owner: {email: owner.email, name: owner.name},
      query: normalizeFmrV3_(query),
      resultCount: 0,
      fmrNumbers: [],
      lines: [],
      groups: [],
      bags: [],
      backorders: []
    };
  }

  const lineIds = lines.map(function (line) {
    return normalizeFmrV3_(line.FMR_Line_ID);
  });

  phase = Date.now();
  const transactions =
    ownerCorrectionTransactionsForLinesFmrV3_(lines);
  timings.transactionReadMs = Date.now() - phase;

  phase = Date.now();
  const appliedGroups =
    ownerCorrectionAppliedGroupSetFmrV3_();
  timings.correctionHistoryReadMs = Date.now() - phase;

  const serializedLines =
    lines.map(ownerCorrectionSerializeLineFmrV3_);

  const linesById = {};
  serializedLines.forEach(function (line) {
    linesById[line.fmrLineId] = line;
  });

  phase = Date.now();
  const groups = ownerCorrectionBuildGroupsFmrV3_(
    transactions,
    linesById,
    appliedGroups
  );
  timings.groupBuildMs = Date.now() - phase;

  phase = Date.now();
  const bags =
    ownerCorrectionBagHistoryFmrV3_(lineIds);
  timings.bagHistoryMs = Date.now() - phase;

  phase = Date.now();
  const backorders =
    ownerCorrectionBackorderHistoryFmrV3_(lines);
  timings.backorderHistoryMs = Date.now() - phase;

  return {
    generatedAt: formatDateTimeFmrV3_(nowFmrV3_()),
    elapsedMs: Date.now() - started,
    timings: timings,
    owner: {email: owner.email, name: owner.name},
    query: normalizeFmrV3_(query),
    resultCount: lines.length,
    fmrNumbers: Array.from(new Set(
      lines.map(function (line) {
        return normalizeFmrV3_(line.FMR_Number);
      })
    )),
    lines: serializedLines,
    groups: groups,
    bags: bags,
    backorders: backorders
  };
}

function ownerCorrectionTransactionsByGroupFmrV3_(groupId) {
  const target = normalizeFmrV3_(groupId);

  if (!target) {
    throw new Error('Transaction group ID is required.');
  }

  let rows = findRowsByExactValueFmrV3_(
    FMR_V3.SHEETS.TRANSACTIONS,
    2,
    target
  );

  if (!rows.length) {
    rows = findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS.TRANSACTIONS,
      1,
      target
    );
  }

  if (!rows.length) {
    throw new Error(
      'Transaction group not found: ' +
      target
    );
  }

  return readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.TRANSACTIONS,
    rows
  ).sort(function (left, right) {
    return (
      new Date(left.Timestamp || 0).getTime() -
      new Date(right.Timestamp || 0).getTime()
    );
  });
}

function ownerCorrectionBagRowsFmrV3_(bagTagId, lineId) {
  const bagId = normalizeFmrV3_(bagTagId);
  const headerRows = findRowsByExactValueFmrV3_(FMR_V3.SHEETS.BAG_HEADERS,1,bagId);
  if (headerRows.length!==1) throw new Error('Bag & Tag header not found: ' + bagId);
  const header = readRowObjectFmrV3_(FMR_V3.SHEETS.BAG_HEADERS,headerRows[0]);
  const items = readRowsObjectsFmrV3_(FMR_V3.SHEETS.BAG_ITEMS,
    findRowsByExactValueFmrV3_(FMR_V3.SHEETS.BAG_ITEMS,2,bagId));
  const item = items.find(function(x){return normalizeFmrV3_(x.FMR_Line_ID)===normalizeFmrV3_(lineId);});
  if (!item) throw new Error('Bag & Tag item is not associated with the selected line.');
  return {header:header,item:item};
}

function ownerCorrectionBackorderRowFmrV3_(requestId) {
  const target = normalizeFmrV3_(requestId);
  const rows = findRowsByExactValueFmrV3_(FMR_V3.SHEETS.BACKORDERS,1,target);
  if (rows.length!==1) throw new Error('Backorder request not found: ' + target);
  return readRowObjectFmrV3_(FMR_V3.SHEETS.BACKORDERS,rows[0]);
}

function ownerEnsureOperationalIndexFmrV3_(type,value,entityId,parentId,rowNumber,secondaryRowNumber) {
  const key = operationalIndexKeyFmrV3_(type,value);
  const records = readRowsObjectsFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX,
    findRowsByExactValueFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX,1,key));
  const existing = records.find(function(r){
    return normalizeFmrV3_(r.Entity_ID)===normalizeFmrV3_(entityId);
  });
  if (existing) {
    updateRowObjectFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX,existing._rowNumber,{
      Parent_ID:parentId,Row_Number:rowNumber,Secondary_Row_Number:secondaryRowNumber,
      Active:FMR_V3.YES,Updated_At:nowFmrV3_()
    });
  } else {
    appendOperationalIndexEntriesFmrV3_([{
      Index_Key:key,Index_Type:normalizeUpperFmrV3_(type),Entity_ID:entityId,
      Parent_ID:parentId,Row_Number:rowNumber,Secondary_Row_Number:secondaryRowNumber,
      Active:FMR_V3.YES,Updated_At:nowFmrV3_()
    }]);
  }
  invalidateIndexKeyFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX,key);
}

function ownerEnsureBagIndexesFmrV3_(line,header,item) {
  ownerEnsureOperationalIndexFmrV3_('BAG',header.Bag_Tag_ID,header.Bag_Tag_ID,
    line.FMR_Line_ID,header._rowNumber,item._rowNumber);
  ownerEnsureOperationalIndexFmrV3_('BAGLINE',line.FMR_Line_ID,item.Bag_Tag_Item_ID,
    header.Bag_Tag_ID,item._rowNumber,header._rowNumber);
  ownerEnsureOperationalIndexFmrV3_('BAGSTATUS','ACTIVE',header.Bag_Tag_ID,
    line.FMR_Line_ID,header._rowNumber,item._rowNumber);
}

function ownerDeactivateBagIndexesFmrV3_(line,header,item) {
  deactivateExactIndexRowsFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX,
    operationalIndexKeyFmrV3_('BAG',header.Bag_Tag_ID),header.Bag_Tag_ID);
  deactivateExactIndexRowsFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX,
    operationalIndexKeyFmrV3_('BAGLINE',line.FMR_Line_ID),item.Bag_Tag_Item_ID);
  deactivateExactIndexRowsFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX,
    operationalIndexKeyFmrV3_('BAGSTATUS','ACTIVE'),header.Bag_Tag_ID);
}

function ownerEnsureBackorderIndexesFmrV3_(line,request,status) {
  const id = normalizeFmrV3_(request.Backorder_Request_ID);
  ownerEnsureOperationalIndexFmrV3_('BACKORDER',id,id,line.FMR_Line_ID,request._rowNumber,line._rowNumber);
  ownerEnsureOperationalIndexFmrV3_('BACKORDERLINE',line.FMR_Line_ID,id,line.FMR_Line_ID,request._rowNumber,line._rowNumber);
  ownerEnsureOperationalIndexFmrV3_('BACKORDERSTATUS',status,id,line.FMR_Line_ID,request._rowNumber,line._rowNumber);
}

function ownerValidateCorrectionStateFmrV3_(state) {
  const eps = 0.000001;
  ['requested','confirmed','bagged','available','issued','pendingBackorder',
   'confirmedBackorder','notYetLocated','remaining'].forEach(function(k){
    if (numberFmrV3_(state[k]) < -eps) throw new Error('Correction would make ' + k + ' negative.');
  });
  if (state.confirmed > state.requested + eps) throw new Error('Located quantity would exceed requested.');
  if (state.issued > state.requested + eps) throw new Error('Issued quantity would exceed requested.');
  if (state.available + state.bagged + state.issued > state.confirmed + eps) {
    throw new Error('Available + bagged + issued would exceed confirmed located quantity.');
  }
  if (state.pendingBackorder + state.confirmedBackorder > state.notYetLocated + eps) {
    throw new Error('Backorder quantities would exceed not-yet-located quantity.');
  }
  if (state.remaining > state.requested + eps) throw new Error('Remaining requirement would exceed requested.');
}

function ownerCorrectionPlanFmrV3_(groupId) {
  if (
    ownerCorrectionAppliedForGroupFmrV3_(
      groupId
    )
  ) {
    throw new Error(
      'This transaction group already has an applied Owner correction.'
    );
  }

  const transactions =
    ownerCorrectionTransactionsByGroupFmrV3_(
      groupId
    );

  const unsupported =
    transactions.filter(function (transaction) {
      return !ownerCorrectionSupportedFmrV3_(
        transaction.Transaction_Type
      );
    });

  if (unsupported.length) {
    throw new Error(
      'Unsupported transaction type(s): ' +
      unsupported
        .map(function (transaction) {
          return normalizeUpperFmrV3_(
            transaction.Transaction_Type
          );
        })
        .join(', ')
    );
  }

  const fmrIds =
    Array.from(
      new Set(
        transactions.map(function (transaction) {
          return normalizeFmrV3_(
            transaction.FMR_ID
          );
        })
      )
    );

  if (fmrIds.length !== 1) {
    throw new Error(
      'A correction group must belong to exactly one FMR.'
    );
  }

  const linesById = {};
  const before = {};

  transactions.forEach(function (transaction) {
    const lineId =
      normalizeFmrV3_(
        transaction.FMR_Line_ID
      );

    if (!lineId) {
      throw new Error(
        'Every transaction in a correction group must reference an FMR line.'
      );
    }

    if (!linesById[lineId]) {
      linesById[lineId] =
        getLineByIdFmrV3_(
          lineId
        );

      before[lineId] =
        lineStateFmrV3_(
          linesById[lineId]
        );
    }
  });

  const working = {};

  Object.keys(before).forEach(function (lineId) {
    working[lineId] =
      Object.assign(
        {},
        before[lineId]
      );
  });

  const operations = [];

  transactions
    .slice()
    .reverse()
    .forEach(function (transaction) {
      const type =
        normalizeUpperFmrV3_(
          transaction.Transaction_Type
        );

      const quantity =
        numberFmrV3_(
          transaction.Quantity
        );

      const lineId =
        normalizeFmrV3_(
          transaction.FMR_Line_ID
        );

      const state =
        working[lineId];

      if (quantity <= 0) {
        throw new Error(
          'Cannot reverse non-positive transaction ' +
          transaction.Transaction_ID
        );
      }

      if (!state) {
        throw new Error(
          'Correction state is unavailable for FMR line ' +
          lineId
        );
      }

      const operation = {
        transactionId:
          normalizeFmrV3_(
            transaction.Transaction_ID
          ),

        type:
          type,

        quantity:
          quantity,

        lineId:
          lineId,

        sourceBagTagId:
          normalizeFmrV3_(
            transaction.Source_Bag_Tag_ID
          ),

        targetBagTagId:
          normalizeFmrV3_(
            transaction.Target_Bag_Tag_ID
          ),

        backorderRequestId:
          normalizeFmrV3_(
            transaction.Backorder_Request_ID
          )
      };

      switch (type) {
        case 'ISSUE_FROM_AVAILABLE':
          if (
            state.issued <
            quantity
          ) {
            throw new Error(
              'Issued quantity is too low to reverse ' +
              transaction.Transaction_ID
            );
          }

          state.issued -= quantity;
          state.available += quantity;
          state.remaining += quantity;
          break;

        case 'DIRECT_ISSUE':
          if (
            state.issued <
              quantity ||
            state.confirmed <
              quantity
          ) {
            throw new Error(
              'Current line state cannot reverse ' +
              transaction.Transaction_ID
            );
          }

          state.issued -= quantity;
          state.confirmed -= quantity;
          state.notYetLocated += quantity;
          state.remaining += quantity;
          break;

        case 'CONFIRM_AVAILABLE':
          if (
            state.available <
              quantity ||
            state.confirmed <
              quantity
          ) {
            throw new Error(
              'Located material has downstream use. ' +
              'Reverse later Bag/Issue activity first.'
            );
          }

          state.available -= quantity;
          state.confirmed -= quantity;
          state.notYetLocated += quantity;
          break;

        case 'BAG': {
          const bag =
            ownerCorrectionBagRowsFmrV3_(
              transaction.Target_Bag_Tag_ID,
              lineId
            );

          if (
            numberFmrV3_(
              bag.item.Qty_Issued_From_Bag
            ) >
            0
          ) {
            throw new Error(
              'Bag ' +
              bag.header.Tag_Number +
              ' has issued material. ' +
              'Reverse ISSUE_FROM_BAG activity first.'
            );
          }

          if (
            numberFmrV3_(
              bag.item.Qty_Remaining_In_Bag
            ) <
              quantity ||
            state.bagged <
              quantity
          ) {
            throw new Error(
              'Bag state cannot exactly reverse the Bag & Tag transaction.'
            );
          }

          state.bagged -= quantity;
          state.available += quantity;

          operation.bagTagId =
            normalizeFmrV3_(
              bag.header.Bag_Tag_ID
            );

          break;
        }

        case 'ISSUE_FROM_BAG': {
          const bag =
            ownerCorrectionBagRowsFmrV3_(
              transaction.Source_Bag_Tag_ID,
              lineId
            );

          if (
            state.issued <
              quantity ||
            numberFmrV3_(
              bag.item.Qty_Issued_From_Bag
            ) <
              quantity
          ) {
            throw new Error(
              'Bag issue state cannot exactly reverse the selected issue.'
            );
          }

          state.issued -= quantity;
          state.bagged += quantity;
          state.remaining += quantity;

          operation.bagTagId =
            normalizeFmrV3_(
              bag.header.Bag_Tag_ID
            );

          break;
        }

        case 'BACKORDER_REQUESTED': {
          const request =
            ownerCorrectionBackorderRowFmrV3_(
              transaction.Backorder_Request_ID
            );

          if (
            numberFmrV3_(
              request.Qty_Pending
            ) <
              quantity ||
            state.pendingBackorder <
              quantity
          ) {
            throw new Error(
              'Backorder has downstream Admin activity. ' +
              'Reverse that later group first.'
            );
          }

          state.pendingBackorder -= quantity;
          break;
        }

        case 'BACKORDER_CONFIRMED': {
          const request =
            ownerCorrectionBackorderRowFmrV3_(
              transaction.Backorder_Request_ID
            );

          if (
            numberFmrV3_(
              request.Qty_Confirmed_Backorder
            ) <
              quantity ||
            state.confirmedBackorder <
              quantity
          ) {
            throw new Error(
              'Confirmed backorder was fulfilled/changed. ' +
              'Reverse later fulfillment first.'
            );
          }

          state.confirmedBackorder -= quantity;
          state.pendingBackorder += quantity;
          break;
        }

        case 'BACKORDER_REJECTED':
          ownerCorrectionBackorderRowFmrV3_(
            transaction.Backorder_Request_ID
          );

          state.pendingBackorder += quantity;
          break;

        case 'BACKORDER_RETURNED':
          ownerCorrectionBackorderRowFmrV3_(
            transaction.Backorder_Request_ID
          );

          state.pendingBackorder += quantity;
          break;

        case 'BACKORDER_FULFILLED':
          ownerCorrectionBackorderRowFmrV3_(
            transaction.Backorder_Request_ID
          );

          state.confirmedBackorder += quantity;
          break;

        case 'BACKORDER_RETURN_RESOLVED':
          ownerCorrectionBackorderRowFmrV3_(
            transaction.Backorder_Request_ID
          );
          break;

        default:
          throw new Error(
            'Unsupported reversal transaction type: ' +
            type
          );
      }

      operation.stateAfter =
        Object.assign(
          {},
          state
        );

      operations.push(
        operation
      );
    });

  /**
   * Validate the final state after the full correlation group is reversed.
   * Intermediate snapshots can temporarily violate invariants for grouped
   * transactions such as CONFIRM_AVAILABLE + BAG.
   */
  Object.keys(working).forEach(function (lineId) {
    ownerValidateCorrectionStateFmrV3_(
      working[lineId]
    );
  });

  const serializedLinesById = {};

  Object.keys(linesById).forEach(function (lineId) {
    serializedLinesById[lineId] =
      ownerCorrectionSerializeLineFmrV3_(
        linesById[lineId]
      );
  });

  const materialLineIds =
    Array.from(
      new Set(
        transactions
          .map(function (transaction) {
            return normalizeFmrV3_(
              transaction.FMR_Line_ID
            );
          })
          .filter(Boolean)
      )
    );

  const normalizedGroupId =
    normalizeFmrV3_(
      groupId
    );

  return {
    groupId:
      normalizedGroupId,

    groupReference:
      normalizedGroupId.length >
        8
        ? normalizedGroupId.slice(-8)
        : normalizedGroupId,

    fmrId:
      normalizeFmrV3_(
        transactions[0].FMR_ID
      ),

    fmrNumber:
      normalizeFmrV3_(
        transactions[0].FMR_Number
      ),

    transactionIds:
      transactions.map(function (transaction) {
        return normalizeFmrV3_(
          transaction.Transaction_ID
        );
      }),

    transactions:
      transactions.map(
        ownerCorrectionSerializeTransactionFmrV3_
      ),

    materials:
      materialLineIds
        .map(function (lineId) {
          return serializedLinesById[lineId] || null;
        })
        .filter(Boolean),

    operations:
      operations,

    linePreviews:
      Object.keys(working).map(function (lineId) {
        return {
          fmrLineId:
            lineId,

          before:
            before[lineId],

          after:
            working[lineId]
        };
      }),

    requiredConfirmation:
      ownerCorrectionConfirmationCodeFmrV3_(
        normalizedGroupId
      )
  };
}

function previewOwnerCorrectionFmrV3_(
  userEmail,
  request
) {
  const started =
    Date.now();

  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  ensureOwnerCorrectionSheetFmrV3_();

  const payload =
    request || {};

  const reason =
    normalizeFmrV3_(
      payload.reason
    );

  if (
    reason.length <
    5
  ) {
    throw new Error(
      'A correction reason of at least 5 characters is required.'
    );
  }

  const plan =
    ownerCorrectionPlanFmrV3_(
      payload.groupId
    );

  return {
    generatedAt:
      formatDateTimeFmrV3_(
        nowFmrV3_()
      ),

    elapsedMs:
      Date.now() -
      started,

    owner: {
      email:
        owner.email,

      name:
        owner.name
    },

    reason:
      reason,

    plan:
      plan,

    canApply:
      true,

    requiredConfirmation:
      plan.requiredConfirmation,

    backupPolicy:
      'AUTOMATIC_PRE_APPLY_BACKUP',

    immutabilityPolicy:
      'ORIGINAL_TRANSACTIONS_ARE_NEVER_DELETED_OR_EDITED'
  };
}

function ownerApplyBagInverseFmrV3_(line,t) {
  const type=normalizeUpperFmrV3_(t.Transaction_Type);
  const qty=numberFmrV3_(t.Quantity);
  const bagId=type==='BAG' ? t.Target_Bag_Tag_ID : t.Source_Bag_Tag_ID;
  if (!normalizeFmrV3_(bagId)) return;
  const bag=ownerCorrectionBagRowsFmrV3_(bagId,line.FMR_Line_ID);

  if (type==='BAG') {
    const nextBagged=Math.max(0,numberFmrV3_(bag.item.Qty_Bagged)-qty);
    const nextRemaining=Math.max(0,numberFmrV3_(bag.item.Qty_Remaining_In_Bag)-qty);
    const issued=numberFmrV3_(bag.item.Qty_Issued_From_Bag);
    const status=nextRemaining>0 ? (issued>0?'Partially Issued':'Active') : (issued>0?'Issued':'Reversed');
    updateRowObjectFmrV3_(FMR_V3.SHEETS.BAG_ITEMS,bag.item._rowNumber,{
      Qty_Bagged:nextBagged,Qty_Remaining_In_Bag:nextRemaining,Status:status,Updated_At:nowFmrV3_()
    });
    updateRowObjectFmrV3_(FMR_V3.SHEETS.BAG_HEADERS,bag.header._rowNumber,{
      Status:status,Updated_At:nowFmrV3_()
    });
    if (nextRemaining>0) ownerEnsureBagIndexesFmrV3_(line,bag.header,bag.item);
    else ownerDeactivateBagIndexesFmrV3_(line,bag.header,bag.item);
  }

  if (type==='ISSUE_FROM_BAG') {
    const nextIssued=Math.max(0,numberFmrV3_(bag.item.Qty_Issued_From_Bag)-qty);
    const nextRemaining=numberFmrV3_(bag.item.Qty_Remaining_In_Bag)+qty;
    const status=nextIssued>0?'Partially Issued':'Active';
    updateRowObjectFmrV3_(FMR_V3.SHEETS.BAG_ITEMS,bag.item._rowNumber,{
      Qty_Issued_From_Bag:nextIssued,Qty_Remaining_In_Bag:nextRemaining,
      Status:status,Updated_At:nowFmrV3_()
    });
    updateRowObjectFmrV3_(FMR_V3.SHEETS.BAG_HEADERS,bag.header._rowNumber,{
      Status:status,Updated_At:nowFmrV3_()
    });
    ownerEnsureBagIndexesFmrV3_(line,bag.header,bag.item);
  }
}

function ownerApplyBackorderInverseFmrV3_(line,t) {
  const type=normalizeUpperFmrV3_(t.Transaction_Type);
  if (!type.startsWith('BACKORDER_')) return;
  const requestId=normalizeFmrV3_(t.Backorder_Request_ID);
  if (!requestId) return;
  const req=ownerCorrectionBackorderRowFmrV3_(requestId);
  const qty=numberFmrV3_(t.Quantity);
  const oldStatus=normalizeFmrV3_(req.Status);
  const patch={Updated_At:nowFmrV3_()};
  let nextStatus=oldStatus;
  let active=true;

  switch(type) {
    case 'BACKORDER_REQUESTED': {
      const pending=Math.max(0,numberFmrV3_(req.Qty_Pending)-qty);
      const requested=Math.max(numberFmrV3_(req.Qty_Confirmed_Backorder),
        numberFmrV3_(req.Qty_Requested_Backorder)-qty);
      nextStatus=pending>0
        ? (numberFmrV3_(req.Qty_Confirmed_Backorder)>0?'Partially Confirmed':'Pending Admin Review')
        : (numberFmrV3_(req.Qty_Confirmed_Backorder)>0?'Confirmed':'Cancelled by Owner');
      active=pending>0 || numberFmrV3_(req.Qty_Confirmed_Backorder)>0;
      Object.assign(patch,{Qty_Pending:pending,Qty_Requested_Backorder:requested,
        Status:nextStatus,Active:active?FMR_V3.YES:FMR_V3.NO});
      break;
    }
    case 'BACKORDER_CONFIRMED': {
      const confirmed=Math.max(0,numberFmrV3_(req.Qty_Confirmed_Backorder)-qty);
      const pending=numberFmrV3_(req.Qty_Pending)+qty;
      nextStatus=confirmed>0?'Partially Confirmed':'Pending Admin Review';
      Object.assign(patch,{Qty_Confirmed_Backorder:confirmed,Qty_Pending:pending,
        Status:nextStatus,Active:FMR_V3.YES,Admin_Decision:'',
        Decided_By_Email:'',Decided_By_Name:'',Decided_At:''});
      break;
    }
    case 'BACKORDER_REJECTED': {
      const pending=numberFmrV3_(req.Qty_Pending)+qty;
      nextStatus=numberFmrV3_(req.Qty_Confirmed_Backorder)>0?'Partially Confirmed':'Pending Admin Review';
      Object.assign(patch,{Qty_Pending:pending,Status:nextStatus,Active:FMR_V3.YES,
        Admin_Decision:'',Admin_Notes:'',Decided_By_Email:'',Decided_By_Name:'',Decided_At:''});
      break;
    }
    case 'BACKORDER_RETURNED':
      nextStatus=numberFmrV3_(req.Qty_Confirmed_Backorder)>0?'Partially Confirmed':'Pending Admin Review';
      Object.assign(patch,{Status:nextStatus,Active:FMR_V3.YES,Admin_Decision:'',
        Admin_Notes:'',Decided_By_Email:'',Decided_By_Name:'',Decided_At:'',
        Returned_Review_Reason:''});
      break;
    case 'BACKORDER_FULFILLED':
      nextStatus=numberFmrV3_(req.Qty_Pending)>0?'Partially Confirmed':'Confirmed';
      Object.assign(patch,{
        Qty_Confirmed_Backorder:numberFmrV3_(req.Qty_Confirmed_Backorder)+qty,
        Status:nextStatus,Active:FMR_V3.YES
      });
      break;
    case 'BACKORDER_RETURN_RESOLVED':
      nextStatus='Returned for Review';
      Object.assign(patch,{
        Qty_Pending:numberFmrV3_(req.Qty_Pending)+qty,
        Status:nextStatus,Active:FMR_V3.YES
      });
      break;
    default:
      return;
  }

  updateRowObjectFmrV3_(FMR_V3.SHEETS.BACKORDERS,req._rowNumber,patch);

  if (normalizeUpperFmrV3_(oldStatus)!==normalizeUpperFmrV3_(nextStatus)) {
    deactivateExactIndexRowsFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX,
      operationalIndexKeyFmrV3_('BACKORDERSTATUS',oldStatus),req.Backorder_Request_ID);
  }

  if (active && patch.Active!==FMR_V3.NO) {
    ownerEnsureBackorderIndexesFmrV3_(line,Object.assign({},req,patch),nextStatus);
  } else {
    deactivateExactIndexRowsFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX,
      operationalIndexKeyFmrV3_('BACKORDERLINE',line.FMR_Line_ID),req.Backorder_Request_ID);
    deactivateExactIndexRowsFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX,
      operationalIndexKeyFmrV3_('BACKORDER',req.Backorder_Request_ID),req.Backorder_Request_ID);
  }
}

function applyOwnerCorrectionFmrV3_(
  userEmail,
  request
) {
  const started =
    Date.now();

  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const owner =
      assertOwnerFmrV3_(
        userEmail
      );

    assertWriteEnabledFmrV3_(
      'Owner transaction correction'
    );

    ensureOwnerCorrectionSheetFmrV3_();

    const payload =
      request || {};

    const reason =
      normalizeFmrV3_(
        payload.reason
      );

    if (
      reason.length <
      5
    ) {
      throw new Error(
        'A correction reason of at least 5 characters is required.'
      );
    }

    const plan =
      ownerCorrectionPlanFmrV3_(
        payload.groupId
      );

    if (
      normalizeUpperFmrV3_(
        payload.confirmation
      ) !==
      normalizeUpperFmrV3_(
        plan.requiredConfirmation
      )
    ) {
      throw new Error(
        'Verification code must exactly match "' +
        plan.requiredConfirmation +
        '".'
      );
    }

    const correctionId =
      uuidFmrV3_(
        'CORRECTION'
      );

    const previewedAt =
      nowFmrV3_();

    const before = {
      groupId:
        plan.groupId,

      lineStates:
        plan.linePreviews.map(function (preview) {
          return {
            fmrLineId:
              preview.fmrLineId,

            state:
              preview.before
          };
        }),

      transactionIds:
        plan.transactionIds
    };

    /**
     * Preserve the automatic pre-change backup. Reversal is exceptional Owner
     * maintenance, so correctness and recoverability take priority over the
     * additional latency of creating this backup.
     */
    const backup =
      createDatabaseBackupFmrV3_(
        owner.email,
        'OWNER_CORRECTION',
        (
          'Pre-correction backup for ' +
          correctionId +
          ' / ' +
          plan.fmrNumber +
          '. Reason: ' +
          reason
        )
      );

    const backupId =
      normalizeFmrV3_(
        backup &&
        (
          backup.backupId ||
          backup.Backup_ID
        )
      );

    const transactions =
      ownerCorrectionTransactionsByGroupFmrV3_(
        plan.groupId
      );

    const operationsByTransaction = {};

    plan.operations.forEach(function (operation) {
      operationsByTransaction[
        operation.transactionId
      ] =
        operation;
    });

    const linesById = {};
    const finalStates = {};

    plan.linePreviews.forEach(function (preview) {
      linesById[
        preview.fmrLineId
      ] =
        getLineByIdFmrV3_(
          preview.fmrLineId
        );

      finalStates[
        preview.fmrLineId
      ] =
        Object.assign(
          {},
          preview.after
        );
    });

    const reversalRows = [];

    try {
      transactions
        .slice()
        .reverse()
        .forEach(function (transaction) {
          const transactionId =
            normalizeFmrV3_(
              transaction.Transaction_ID
            );

          const operation =
            operationsByTransaction[
              transactionId
            ];

          if (!operation) {
            throw new Error(
              'Missing reversal plan for transaction ' +
              transactionId
            );
          }

          const line =
            linesById[
              operation.lineId
            ];

          if (!line) {
            throw new Error(
              'FMR line is unavailable for reversal transaction ' +
              transactionId
            );
          }

          ownerApplyBagInverseFmrV3_(
            line,
            transaction
          );

          ownerApplyBackorderInverseFmrV3_(
            line,
            transaction
          );

          reversalRows.push(
            appendTransactionFmrV3_(
              line,
              (
                'REVERSAL_' +
                normalizeUpperFmrV3_(
                  transaction.Transaction_Type
                )
              ),
              numberFmrV3_(
                transaction.Quantity
              ),
              owner,
              {
                correlationId:
                  correctionId,

                performedByName:
                  owner.name,

                issuedToName:
                  transaction.Issued_To_Name,

                sourceBagTagId:
                  transaction.Source_Bag_Tag_ID,

                targetBagTagId:
                  transaction.Target_Bag_Tag_ID,

                storageLocation:
                  transaction.Storage_Location,

                backorderRequestId:
                  transaction.Backorder_Request_ID,

                notes:
                  (
                    'Owner correction ' +
                    correctionId +
                    ' reversed ' +
                    transactionId +
                    '. Reason: ' +
                    reason
                  )
              }
            )
          );
        });

      const updatedLinesById = {};
      const headerRefreshByFmrId = {};

      Object.keys(linesById).forEach(function (lineId) {
        const line =
          linesById[lineId];

        const state =
          finalStates[lineId];

        ownerValidateCorrectionStateFmrV3_(
          state
        );

        const updatedLine =
          updateLineStateFmrV3_(
            line,
            state,
            owner
          );

        updatedLinesById[
          lineId
        ] =
          updatedLine;

        const fmrId =
          normalizeFmrV3_(
            line.FMR_ID
          );

        if (!headerRefreshByFmrId[fmrId]) {
          headerRefreshByFmrId[fmrId] = {
            fmrId:
              line.FMR_ID,

            fmrNumber:
              line.FMR_Number
          };
        }
      });

      /**
       * Refresh each FMR aggregate once after all affected lines are written.
       */
      Object.keys(
        headerRefreshByFmrId
      ).forEach(function (fmrId) {
        const target =
          headerRefreshByFmrId[
            fmrId
          ];

        refreshHeaderFromIndexedLinesFmrV3_(
          target.fmrId,
          target.fmrNumber,
          owner
        );
      });

      /**
       * Reuse the records returned by updateLineStateFmrV3_ instead of
       * immediately rereading the line merely to synchronize notifications.
       */
      Object.keys(
        updatedLinesById
      ).forEach(function (lineId) {
        syncFieldNotificationsForLineFmrV3_(
          updatedLinesById[
            lineId
          ]
        );
      });

      SpreadsheetApp.flush();

      const reversalIds =
        readRowsObjectsFmrV3_(
          FMR_V3.SHEETS.TRANSACTIONS,
          reversalRows
        ).map(function (row) {
          return normalizeFmrV3_(
            row.Transaction_ID
          );
        });

      const after = {
        lineStates:
          Object.keys(
            updatedLinesById
          ).map(function (lineId) {
            return {
              fmrLineId:
                lineId,

              state:
                lineStateFmrV3_(
                  updatedLinesById[
                    lineId
                  ]
                )
            };
          }),

        reversalTransactionIds:
          reversalIds
      };

      historicalAppendFmrV3_(
        FMR_V3_OWNER_CORRECTIONS.SHEET,
        FMR_V3_OWNER_CORRECTIONS.HEADERS,
        {
          Correction_ID:
            correctionId,

          Target_Group_ID:
            plan.groupId,

          FMR_ID:
            plan.fmrId,

          FMR_Number:
            plan.fmrNumber,

          FMR_Line_IDs:
            plan.linePreviews
              .map(function (preview) {
                return preview.fmrLineId;
              })
              .join(','),

          Correction_Type:
            'REVERSE_TRANSACTION_GROUP',

          Reason:
            reason,

          Status:
            'APPLIED',

          Previewed_By:
            owner.email,

          Previewed_At:
            previewedAt,

          Applied_By:
            owner.email,

          Applied_At:
            nowFmrV3_(),

          Backup_ID:
            backupId,

          Before_JSON:
            JSON.stringify(
              before
            ),

          After_JSON:
            JSON.stringify(
              after
            ),

          Transaction_IDs:
            plan.transactionIds.join(','),

          Reversal_Transaction_IDs:
            reversalIds.join(','),

          Error_Message:
            '',

          Notes:
            (
              'Alpha 30 Owner correction. ' +
              'Verification code ' +
              plan.requiredConfirmation +
              '. Apply duration ' +
              (
                Date.now() -
                started
              ) +
              ' ms.'
            )
        }
      );

      appendAuditFmrV3_(
        'OWNER_CORRECTION',
        correctionId,
        'TRANSACTION_GROUP_REVERSED',
        owner,
        correctionId,
        {
          sourceInterface:
            'OWNER',

          payload: {
            targetGroupId:
              plan.groupId,

            fmrNumber:
              plan.fmrNumber,

            reason:
              reason,

            transactionIds:
              plan.transactionIds,

            reversalTransactionIds:
              reversalIds,

            backupId:
              backupId,

            elapsedMs:
              Date.now() -
              started
          }
        }
      );

      SpreadsheetApp.flush();

      return {
        success:
          true,

        elapsedMs:
          Date.now() -
          started,

        correctionId:
          correctionId,

        targetGroupId:
          plan.groupId,

        fmrNumber:
          plan.fmrNumber,

        backupId:
          backupId,

        reversalTransactionIds:
          reversalIds,

        after:
          after
      };
    } catch (error) {
      const message =
        error &&
        error.message
          ? error.message
          : String(error);

      historicalAppendFmrV3_(
        FMR_V3_OWNER_CORRECTIONS.SHEET,
        FMR_V3_OWNER_CORRECTIONS.HEADERS,
        {
          Correction_ID:
            correctionId,

          Target_Group_ID:
            plan.groupId,

          FMR_ID:
            plan.fmrId,

          FMR_Number:
            plan.fmrNumber,

          FMR_Line_IDs:
            plan.linePreviews
              .map(function (preview) {
                return preview.fmrLineId;
              })
              .join(','),

          Correction_Type:
            'REVERSE_TRANSACTION_GROUP',

          Reason:
            reason,

          Status:
            'FAILED',

          Previewed_By:
            owner.email,

          Previewed_At:
            previewedAt,

          Applied_By:
            owner.email,

          Applied_At:
            nowFmrV3_(),

          Backup_ID:
            backupId,

          Before_JSON:
            JSON.stringify(
              before
            ),

          After_JSON:
            '',

          Transaction_IDs:
            plan.transactionIds.join(','),

          Reversal_Transaction_IDs:
            '',

          Error_Message:
            message,

          Notes:
            (
              'Automatic backup exists. ' +
              'Inspect database before retrying.'
            )
        }
      );

      throw new Error(
        (
          'Owner correction failed after backup ' +
          backupId +
          '. Inspect the correction record before retrying. ' +
          message
        )
      );
    }
  } finally {
    lock.releaseLock();
  }
}

function getOwnerCorrectionHistoryFmrV3_(userEmail, maximumRows) {
  const owner=assertOwnerFmrV3_(userEmail);
  ensureOwnerCorrectionSheetFmrV3_();
  const limit=Math.max(1,Math.min(200,Math.floor(numberFmrV3_(maximumRows)||50)));
  return {
    owner:{email:owner.email,name:owner.name},
    records:ownerCorrectionRowsFmrV3_().sort(function(a,b){
      return new Date(b.Applied_At||0).getTime()-new Date(a.Applied_At||0).getTime();
    }).slice(0,limit).map(function(r){
      return {
        correctionId:normalizeFmrV3_(r.Correction_ID),
        targetGroupId:normalizeFmrV3_(r.Target_Group_ID),
        fmrNumber:normalizeFmrV3_(r.FMR_Number),
        reason:normalizeFmrV3_(r.Reason),
        status:normalizeFmrV3_(r.Status),
        appliedBy:normalizeFmrV3_(r.Applied_By),
        appliedAt:formatDateTimeFmrV3_(r.Applied_At),
        backupId:normalizeFmrV3_(r.Backup_ID),
        error:normalizeFmrV3_(r.Error_Message)
      };
    })
  };
}

function ownerCorrectionSerializeLineFmrV3_(line) {
  return {
    fmrLineId: normalizeFmrV3_(line.FMR_Line_ID),
    fmrNumber: normalizeFmrV3_(line.FMR_Number),
    lineNumber: numberFmrV3_(line.Line_Number),
    isoNumber: normalizeFmrV3_(line.ISO_Number),
    isoSheet: normalizeFmrV3_(line.ISO_Sheet),
    commodityCode: normalizeFmrV3_(line.Commodity_Code),
    size: normalizeFmrV3_(line.Size),
    materialDescription: normalizeFmrV3_(line.Material_Description),
    uom: normalizeFmrV3_(line.UOM),
    status: normalizeFmrV3_(line.Line_Status),
    state: lineStateFmrV3_(line)
  };
}

/* Public library API */
function searchFmrV3OwnerLedger(databaseId,userEmail,query,mode) {
  setFmrV3DatabaseContext_(databaseId);
  return searchOwnerLedgerFmrV3_(userEmail,query,mode||'AUTO');
}
function previewFmrV3OwnerCorrection(databaseId,userEmail,request) {
  setFmrV3DatabaseContext_(databaseId);
  return previewOwnerCorrectionFmrV3_(userEmail,request||{});
}
function applyFmrV3OwnerCorrection(databaseId,userEmail,request) {
  setFmrV3DatabaseContext_(databaseId);
  return applyOwnerCorrectionFmrV3_(userEmail,request||{});
}
function getFmrV3OwnerCorrectionHistory(databaseId,userEmail,maximumRows) {
  setFmrV3DatabaseContext_(databaseId);
  return getOwnerCorrectionHistoryFmrV3_(userEmail,maximumRows);
}
