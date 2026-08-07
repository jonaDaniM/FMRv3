/**
 * FMR Operations v3 — Alpha 29
 * Owner-only transaction correction / reversal service.
 *
 * Governing rules:
 *  - Original Material_Transactions rows are immutable.
 *  - Reversal acts on a logical Correlation_ID group when available.
 *  - A written reason, exact confirmation and automatic pre-change backup
 *    are required.
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
  return ownerCorrectionRowsFmrV3_().some(function(row){
    return normalizeFmrV3_(row.Target_Group_ID) === target &&
      normalizeUpperFmrV3_(row.Status) === 'APPLIED';
  });
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

function ownerCorrectionTransactionsForLinesFmrV3_(lineIds) {
  const rows = [];
  (lineIds||[]).forEach(function(lineId){
    rows.push.apply(rows,findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS.TRANSACTIONS,5,lineId
    ));
  });
  return readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.TRANSACTIONS,
    Array.from(new Set(rows))
  ).sort(function(a,b){
    return new Date(a.Timestamp||0).getTime() - new Date(b.Timestamp||0).getTime();
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

function ownerCorrectionBackorderHistoryFmrV3_(lineIds) {
  const rows = [];
  (lineIds||[]).forEach(function(lineId){
    rows.push.apply(rows,findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS.BACKORDERS,5,lineId
    ));
  });
  return readRowsObjectsFmrV3_(
    FMR_V3.SHEETS.BACKORDERS,Array.from(new Set(rows))
  ).map(function(r){
    return {
      requestId:normalizeFmrV3_(r.Backorder_Request_ID),
      fmrNumber:normalizeFmrV3_(r.FMR_Number),
      fmrLineId:normalizeFmrV3_(r.FMR_Line_ID),
      commodityCode:normalizeFmrV3_(r.Commodity_Code),
      qtyRequested:numberFmrV3_(r.Qty_Requested_Backorder),
      qtyConfirmed:numberFmrV3_(r.Qty_Confirmed_Backorder),
      qtyPending:numberFmrV3_(r.Qty_Pending),
      reason:normalizeFmrV3_(r.Reason),
      status:normalizeFmrV3_(r.Status),
      adminDecision:normalizeFmrV3_(r.Admin_Decision),
      adminNotes:normalizeFmrV3_(r.Admin_Notes),
      active:yesFmrV3_(r.Active),
      reportedAt:formatDateTimeFmrV3_(r.Reported_At),
      updatedAt:formatDateTimeFmrV3_(r.Updated_At)
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

function ownerCorrectionBuildGroupsFmrV3_(transactions) {
  const byGroup = {};
  (transactions||[]).forEach(function(t){
    const id = ownerCorrectionGroupIdFmrV3_(t);
    if (!byGroup[id]) byGroup[id] = {groupId:id,correlationId:normalizeFmrV3_(t.Correlation_ID),
      fmrId:normalizeFmrV3_(t.FMR_ID),fmrNumber:normalizeFmrV3_(t.FMR_Number),
      timestamp:t.Timestamp,transactions:[]};
    byGroup[id].transactions.push(t);
    if (new Date(t.Timestamp||0).getTime() < new Date(byGroup[id].timestamp||0).getTime()) {
      byGroup[id].timestamp = t.Timestamp;
    }
  });

  return Object.keys(byGroup).map(function(id){
    const g = byGroup[id];
    const txns = g.transactions.map(ownerCorrectionSerializeTransactionFmrV3_);
    const unsupported = txns.filter(function(t){ return !t.supportedForReversal; });
    const already = ownerCorrectionAppliedForGroupFmrV3_(id);
    return {
      groupId:id, correlationId:g.correlationId, fmrId:g.fmrId, fmrNumber:g.fmrNumber,
      timestamp:formatDateTimeFmrV3_(g.timestamp),
      transactionCount:txns.length,
      transactionTypes:Array.from(new Set(txns.map(function(t){return t.type;}))),
      transactions:txns,
      alreadyReversed:already,
      canPreviewReversal:!already && unsupported.length===0,
      blockingReason:already
        ? 'This transaction group already has an applied Owner correction.'
        : (unsupported.length
          ? 'Unsupported transaction type(s): ' + unsupported.map(function(t){return t.type;}).join(', ')
          : '')
    };
  }).sort(function(a,b){
    return new Date(b.timestamp||0).getTime() - new Date(a.timestamp||0).getTime();
  });
}

function searchOwnerLedgerFmrV3_(userEmail, query, mode) {
  const owner = assertOwnerFmrV3_(userEmail);
  ensureOwnerCorrectionSheetFmrV3_();
  const lines = ownerCorrectionSearchLinesFmrV3_(query,mode);
  if (!lines.length) {
    return {generatedAt:formatDateTimeFmrV3_(nowFmrV3_()),
      owner:{email:owner.email,name:owner.name},query:normalizeFmrV3_(query),
      resultCount:0,fmrNumbers:[],lines:[],groups:[],bags:[],backorders:[]};
  }
  const ids = lines.map(function(line){return normalizeFmrV3_(line.FMR_Line_ID);});
  const txns = ownerCorrectionTransactionsForLinesFmrV3_(ids);
  return {
    generatedAt:formatDateTimeFmrV3_(nowFmrV3_()),
    owner:{email:owner.email,name:owner.name},
    query:normalizeFmrV3_(query),
    resultCount:lines.length,
    fmrNumbers:Array.from(new Set(lines.map(function(l){return normalizeFmrV3_(l.FMR_Number);}))),
    lines:lines.map(function(line){
      return {
        fmrLineId:normalizeFmrV3_(line.FMR_Line_ID),
        fmrNumber:normalizeFmrV3_(line.FMR_Number),
        lineNumber:numberFmrV3_(line.Line_Number),
        isoNumber:normalizeFmrV3_(line.ISO_Number),
        isoSheet:normalizeFmrV3_(line.ISO_Sheet),
        commodityCode:normalizeFmrV3_(line.Commodity_Code),
        size:normalizeFmrV3_(line.Size),
        materialDescription:normalizeFmrV3_(line.Material_Description),
        uom:normalizeFmrV3_(line.UOM),
        status:normalizeFmrV3_(line.Line_Status),
        state:lineStateFmrV3_(line)
      };
    }),
    groups:ownerCorrectionBuildGroupsFmrV3_(txns),
    bags:ownerCorrectionBagHistoryFmrV3_(ids),
    backorders:ownerCorrectionBackorderHistoryFmrV3_(ids)
  };
}

function ownerCorrectionTransactionsByGroupFmrV3_(groupId) {
  const target = normalizeFmrV3_(groupId);
  if (!target) throw new Error('Transaction group ID is required.');
  const all = getUsedRowsFmrV3_(FMR_V3.SHEETS.TRANSACTIONS);
  let matches = all.filter(function(t){return normalizeFmrV3_(t.Correlation_ID)===target;});
  if (!matches.length) matches = all.filter(function(t){return normalizeFmrV3_(t.Transaction_ID)===target;});
  if (!matches.length) throw new Error('Transaction group not found: ' + target);
  return matches.sort(function(a,b){
    return new Date(a.Timestamp||0).getTime() - new Date(b.Timestamp||0).getTime();
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
  if (ownerCorrectionAppliedForGroupFmrV3_(groupId)) {
    throw new Error('This transaction group already has an applied Owner correction.');
  }

  const transactions = ownerCorrectionTransactionsByGroupFmrV3_(groupId);
  const unsupported = transactions.filter(function(t){
    return !ownerCorrectionSupportedFmrV3_(t.Transaction_Type);
  });
  if (unsupported.length) {
    throw new Error('Unsupported transaction type(s): ' +
      unsupported.map(function(t){return normalizeUpperFmrV3_(t.Transaction_Type);}).join(', '));
  }

  const fmrIds = Array.from(new Set(transactions.map(function(t){return normalizeFmrV3_(t.FMR_ID);})));
  if (fmrIds.length!==1) throw new Error('A correction group must belong to exactly one FMR.');

  const linesById = {};
  const before = {};
  transactions.forEach(function(t){
    const lineId = normalizeFmrV3_(t.FMR_Line_ID);
    if (!linesById[lineId]) {
      linesById[lineId] = getLineByIdFmrV3_(lineId);
      before[lineId] = lineStateFmrV3_(linesById[lineId]);
    }
  });

  const working = {};
  Object.keys(before).forEach(function(id){working[id]=Object.assign({},before[id]);});
  const operations = [];

  transactions.slice().reverse().forEach(function(t){
    const type = normalizeUpperFmrV3_(t.Transaction_Type);
    const qty = numberFmrV3_(t.Quantity);
    const lineId = normalizeFmrV3_(t.FMR_Line_ID);
    const state = working[lineId];
    if (qty<=0) throw new Error('Cannot reverse non-positive transaction ' + t.Transaction_ID);

    const op = {
      transactionId:normalizeFmrV3_(t.Transaction_ID),type:type,quantity:qty,
      lineId:lineId,sourceBagTagId:normalizeFmrV3_(t.Source_Bag_Tag_ID),
      targetBagTagId:normalizeFmrV3_(t.Target_Bag_Tag_ID),
      backorderRequestId:normalizeFmrV3_(t.Backorder_Request_ID)
    };

    switch(type) {
      case 'ISSUE_FROM_AVAILABLE':
        if (state.issued<qty) throw new Error('Issued quantity is too low to reverse ' + t.Transaction_ID);
        state.issued-=qty; state.available+=qty; state.remaining+=qty; break;

      case 'DIRECT_ISSUE':
        if (state.issued<qty || state.confirmed<qty) throw new Error('Current line state cannot reverse ' + t.Transaction_ID);
        state.issued-=qty; state.confirmed-=qty; state.notYetLocated+=qty; state.remaining+=qty; break;

      case 'CONFIRM_AVAILABLE':
        if (state.available<qty || state.confirmed<qty) {
          throw new Error('Located material has downstream use. Reverse later Bag/Issue activity first.');
        }
        state.available-=qty; state.confirmed-=qty; state.notYetLocated+=qty; break;

      case 'BAG': {
        const bag = ownerCorrectionBagRowsFmrV3_(t.Target_Bag_Tag_ID,lineId);
        if (numberFmrV3_(bag.item.Qty_Issued_From_Bag)>0) {
          throw new Error('Bag ' + bag.header.Tag_Number +
            ' has issued material. Reverse ISSUE_FROM_BAG activity first.');
        }
        if (numberFmrV3_(bag.item.Qty_Remaining_In_Bag)<qty || state.bagged<qty) {
          throw new Error('Bag state cannot exactly reverse the Bag & Tag transaction.');
        }
        state.bagged-=qty; state.available+=qty;
        op.bagTagId=normalizeFmrV3_(bag.header.Bag_Tag_ID);
        break;
      }

      case 'ISSUE_FROM_BAG': {
        const bag = ownerCorrectionBagRowsFmrV3_(t.Source_Bag_Tag_ID,lineId);
        if (state.issued<qty || numberFmrV3_(bag.item.Qty_Issued_From_Bag)<qty) {
          throw new Error('Bag issue state cannot exactly reverse the selected issue.');
        }
        state.issued-=qty; state.bagged+=qty; state.remaining+=qty;
        op.bagTagId=normalizeFmrV3_(bag.header.Bag_Tag_ID);
        break;
      }

      case 'BACKORDER_REQUESTED': {
        const req = ownerCorrectionBackorderRowFmrV3_(t.Backorder_Request_ID);
        if (numberFmrV3_(req.Qty_Pending)<qty || state.pendingBackorder<qty) {
          throw new Error('Backorder has downstream Admin activity. Reverse that later group first.');
        }
        state.pendingBackorder-=qty;
        break;
      }

      case 'BACKORDER_CONFIRMED': {
        const req = ownerCorrectionBackorderRowFmrV3_(t.Backorder_Request_ID);
        if (numberFmrV3_(req.Qty_Confirmed_Backorder)<qty || state.confirmedBackorder<qty) {
          throw new Error('Confirmed backorder was fulfilled/changed. Reverse later fulfillment first.');
        }
        state.confirmedBackorder-=qty; state.pendingBackorder+=qty; break;
      }

      case 'BACKORDER_REJECTED':
        ownerCorrectionBackorderRowFmrV3_(t.Backorder_Request_ID);
        state.pendingBackorder+=qty; break;

      case 'BACKORDER_RETURNED':
        ownerCorrectionBackorderRowFmrV3_(t.Backorder_Request_ID);
        state.pendingBackorder+=qty; break;

      case 'BACKORDER_FULFILLED':
        ownerCorrectionBackorderRowFmrV3_(t.Backorder_Request_ID);
        state.confirmedBackorder+=qty; break;

      case 'BACKORDER_RETURN_RESOLVED':
        ownerCorrectionBackorderRowFmrV3_(t.Backorder_Request_ID);
        break;

      default:
        throw new Error('Unsupported reversal transaction type: ' + type);
    }

    op.stateAfter = Object.assign({},state);
    operations.push(op);
  });

  /* Validate final states, not intermediate correlation snapshots. */
  Object.keys(working).forEach(function(id){ownerValidateCorrectionStateFmrV3_(working[id]);});

  return {
    groupId:normalizeFmrV3_(groupId),
    fmrId:normalizeFmrV3_(transactions[0].FMR_ID),
    fmrNumber:normalizeFmrV3_(transactions[0].FMR_Number),
    transactionIds:transactions.map(function(t){return normalizeFmrV3_(t.Transaction_ID);}),
    operations:operations,
    linePreviews:Object.keys(working).map(function(id){
      return {fmrLineId:id,before:before[id],after:working[id]};
    }),
    requiredConfirmation:'REVERSE ' + normalizeFmrV3_(groupId)
  };
}

function previewOwnerCorrectionFmrV3_(userEmail, request) {
  const owner = assertOwnerFmrV3_(userEmail);
  ensureOwnerCorrectionSheetFmrV3_();
  const payload=request||{};
  const reason=normalizeFmrV3_(payload.reason);
  if (reason.length<5) throw new Error('A correction reason of at least 5 characters is required.');
  const plan=ownerCorrectionPlanFmrV3_(payload.groupId);
  return {
    generatedAt:formatDateTimeFmrV3_(nowFmrV3_()),
    owner:{email:owner.email,name:owner.name},
    reason:reason,plan:plan,canApply:true,
    requiredConfirmation:plan.requiredConfirmation,
    backupPolicy:'AUTOMATIC_PRE_APPLY_BACKUP',
    immutabilityPolicy:'ORIGINAL_TRANSACTIONS_ARE_NEVER_DELETED_OR_EDITED'
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

function applyOwnerCorrectionFmrV3_(userEmail, request) {
  const lock=LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const owner=assertOwnerFmrV3_(userEmail);
    assertWriteEnabledFmrV3_('Owner transaction correction');
    ensureOwnerCorrectionSheetFmrV3_();

    const payload=request||{};
    const reason=normalizeFmrV3_(payload.reason);
    if (reason.length<5) throw new Error('A correction reason of at least 5 characters is required.');
    const plan=ownerCorrectionPlanFmrV3_(payload.groupId);
    if (normalizeUpperFmrV3_(payload.confirmation)!==normalizeUpperFmrV3_(plan.requiredConfirmation)) {
      throw new Error('Confirmation must exactly match "' + plan.requiredConfirmation + '".');
    }

    const correctionId=uuidFmrV3_('CORRECTION');
    const previewedAt=nowFmrV3_();
    const before={
      groupId:plan.groupId,
      lineStates:plan.linePreviews.map(function(p){return {fmrLineId:p.fmrLineId,state:p.before};}),
      transactionIds:plan.transactionIds
    };

    const backup=createDatabaseBackupFmrV3_(
      owner.email,'OWNER_CORRECTION',
      'Pre-correction backup for ' + correctionId + ' / ' + plan.fmrNumber + '. Reason: ' + reason
    );
    const backupId=normalizeFmrV3_(backup && (backup.backupId || backup.Backup_ID));

    const txns=ownerCorrectionTransactionsByGroupFmrV3_(plan.groupId);
    const operationsByTxn={};
    plan.operations.forEach(function(op){operationsByTxn[op.transactionId]=op;});

    const linesById={};
    const finalStates={};
    plan.linePreviews.forEach(function(p){
      linesById[p.fmrLineId]=getLineByIdFmrV3_(p.fmrLineId);
      finalStates[p.fmrLineId]=Object.assign({},p.after);
    });

    const reversalRows=[];
    try {
      txns.slice().reverse().forEach(function(t){
        const id=normalizeFmrV3_(t.Transaction_ID);
        const op=operationsByTxn[id];
        if (!op) throw new Error('Missing reversal plan for transaction ' + id);
        const line=linesById[op.lineId];

        ownerApplyBagInverseFmrV3_(line,t);
        ownerApplyBackorderInverseFmrV3_(line,t);

        reversalRows.push(appendTransactionFmrV3_(
          line,'REVERSAL_' + normalizeUpperFmrV3_(t.Transaction_Type),
          numberFmrV3_(t.Quantity),owner,{
            correlationId:correctionId,
            performedByName:owner.name,
            issuedToName:t.Issued_To_Name,
            sourceBagTagId:t.Source_Bag_Tag_ID,
            targetBagTagId:t.Target_Bag_Tag_ID,
            storageLocation:t.Storage_Location,
            backorderRequestId:t.Backorder_Request_ID,
            notes:'Owner correction ' + correctionId + ' reversed ' + id + '. Reason: ' + reason
          }
        ));
      });

      Object.keys(linesById).forEach(function(lineId){
        const line=linesById[lineId];
        const state=finalStates[lineId];
        ownerValidateCorrectionStateFmrV3_(state);
        updateLineStateFmrV3_(line,state,owner);
        refreshHeaderFromIndexedLinesFmrV3_(line.FMR_ID,line.FMR_Number,owner);
        syncFieldNotificationsForLineFmrV3_(getLineByIdFmrV3_(lineId));
      });

      SpreadsheetApp.flush();
      const reversalIds=readRowsObjectsFmrV3_(
        FMR_V3.SHEETS.TRANSACTIONS,reversalRows
      ).map(function(r){return normalizeFmrV3_(r.Transaction_ID);});

      const after={
        lineStates:Object.keys(linesById).map(function(lineId){
          return {fmrLineId:lineId,state:lineStateFmrV3_(getLineByIdFmrV3_(lineId))};
        }),
        reversalTransactionIds:reversalIds
      };

      historicalAppendFmrV3_(
        FMR_V3_OWNER_CORRECTIONS.SHEET,FMR_V3_OWNER_CORRECTIONS.HEADERS,{
          Correction_ID:correctionId,Target_Group_ID:plan.groupId,
          FMR_ID:plan.fmrId,FMR_Number:plan.fmrNumber,
          FMR_Line_IDs:plan.linePreviews.map(function(p){return p.fmrLineId;}).join(','),
          Correction_Type:'REVERSE_TRANSACTION_GROUP',Reason:reason,Status:'APPLIED',
          Previewed_By:owner.email,Previewed_At:previewedAt,
          Applied_By:owner.email,Applied_At:nowFmrV3_(),Backup_ID:backupId,
          Before_JSON:JSON.stringify(before),After_JSON:JSON.stringify(after),
          Transaction_IDs:plan.transactionIds.join(','),
          Reversal_Transaction_IDs:reversalIds.join(','),Error_Message:'',Notes:''
        }
      );

      appendAuditFmrV3_('OWNER_CORRECTION',correctionId,'TRANSACTION_GROUP_REVERSED',
        owner,correctionId,{sourceInterface:'OWNER',payload:{
          targetGroupId:plan.groupId,fmrNumber:plan.fmrNumber,reason:reason,
          transactionIds:plan.transactionIds,reversalTransactionIds:reversalIds,
          backupId:backupId
        }});

      SpreadsheetApp.flush();
      return {success:true,correctionId:correctionId,targetGroupId:plan.groupId,
        fmrNumber:plan.fmrNumber,backupId:backupId,reversalTransactionIds:reversalIds,after:after};
    } catch (error) {
      const message=error && error.message ? error.message : String(error);
      historicalAppendFmrV3_(
        FMR_V3_OWNER_CORRECTIONS.SHEET,FMR_V3_OWNER_CORRECTIONS.HEADERS,{
          Correction_ID:correctionId,Target_Group_ID:plan.groupId,
          FMR_ID:plan.fmrId,FMR_Number:plan.fmrNumber,
          FMR_Line_IDs:plan.linePreviews.map(function(p){return p.fmrLineId;}).join(','),
          Correction_Type:'REVERSE_TRANSACTION_GROUP',Reason:reason,Status:'FAILED',
          Previewed_By:owner.email,Previewed_At:previewedAt,
          Applied_By:owner.email,Applied_At:nowFmrV3_(),Backup_ID:backupId,
          Before_JSON:JSON.stringify(before),After_JSON:'',
          Transaction_IDs:plan.transactionIds.join(','),
          Reversal_Transaction_IDs:'',Error_Message:message,
          Notes:'Automatic backup exists. Inspect database before retrying.'
        }
      );
      throw new Error('Owner correction failed after backup ' + backupId +
        '. Inspect the correction record before retrying. ' + message);
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
