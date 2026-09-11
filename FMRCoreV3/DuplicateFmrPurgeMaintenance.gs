const DUP_FMR_PURGE_V3 = Object.freeze({
  // Put the DUPLICATE FMR numbers here — never put the surviving/canonical FMR.
  TARGET_FMR_NUMBERS: Object.freeze([
    // 562,
    // 571,
  ]),

  REASON: 'Confirmed duplicate publication of ISO(s) under another surviving FMR.',

  // Start with BLOCK_IF_PRESENT. After reviewing PREVIEW, change to
  // ARCHIVE_AND_REMOVE only if the duplicate FMR's field transactions are
  // themselves invalid and should disappear from the live ledger.
  TRANSACTION_POLICY: 'BLOCK_IF_PRESENT', // BLOCK_IF_PRESENT | ARCHIVE_AND_REMOVE

  // Strong protection: every active ISO on a target FMR must also exist on an
  // active FMR that is NOT in TARGET_FMR_NUMBERS.
  REQUIRE_ALL_ISOS_DUPLICATED: true,

  // APPLY is blocked until you intentionally change this exact value.
  APPLY_CONFIRMATION: 'CHANGE_ME',
  REQUIRED_APPLY_CONFIRMATION: 'PURGE_CONFIRMED_DUPLICATE_FMRS',

  ARCHIVE_SHEET: 'Duplicate_FMR_Purge_Archive',
  LOG_SHEET: 'Duplicate_FMR_Purge_Log',
});

/**
 * STEP 1 — RUN THIS FIRST.
 * Makes zero changes.
 */
function previewDuplicateFmrPurgeV3() {
  setFmrV3DatabaseContext_(FMR_V3.DEFAULT_DATABASE_ID);
  const owner = dupFmrAssertOwner_();
  const plan = dupFmrBuildPlan_(owner);
  const out = dupFmrPublicPlan_(plan);
  console.log(JSON.stringify(out, null, 2));
  return out;
}

/**
 * STEP 2 — ONLY RUN AFTER REVIEWING PREVIEW.
 * Requires APPLY_CONFIRMATION to equal PURGE_CONFIRMED_DUPLICATE_FMRS.
 */
function applyDuplicateFmrPurgeV3() {
  setFmrV3DatabaseContext_(FMR_V3.DEFAULT_DATABASE_ID);
  const owner = dupFmrAssertOwner_();

  if (DUP_FMR_PURGE_V3.APPLY_CONFIRMATION !== DUP_FMR_PURGE_V3.REQUIRED_APPLY_CONFIRMATION) {
    throw new Error(
      'APPLY blocked. Set APPLY_CONFIRMATION to "' +
      DUP_FMR_PURGE_V3.REQUIRED_APPLY_CONFIRMATION +
      '" only after reviewing previewDuplicateFmrPurgeV3().'
    );
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  const runId = uuidFmrV3_('DUPPURGE');

  try {
    // Rebuild under lock so APPLY never uses a stale preview.
    const plan = dupFmrBuildPlan_(owner);

    if (!plan.canApply) {
      throw new Error('APPLY blocked:\n- ' + plan.blockedReasons.join('\n- '));
    }

    // Existing production backup system. A failed backup should throw and stop.
    const backup = createDatabaseBackupFmrV3_(
      owner.email,
      'RECOVERY',
      'Pre-purge backup for ' + runId + '. Duplicate FMRs: ' + plan.targetFmrNumbers.join(', ')
    );

    const backupId = normalizeFmrV3_(
      (backup && (backup.backupId || backup.Backup_ID || backup.id)) || ''
    );

    const archiveSheet = dupFmrEnsureArchiveSheet_();
    const logSheet = dupFmrEnsureLogSheet_();
    const performedAt = nowFmrV3_();
    const dashboardBefore = dupFmrDashboardSnapshot_();

    const archiveRows = [];
    plan.items.forEach(function (item) {
      dupFmrCollectArchiveRows_(archiveRows, runId, item, owner, performedAt);
    });
    dupFmrAppendArchiveRows_(archiveSheet, archiveRows);

    const results = plan.items.map(function (item) {
      return dupFmrApplyOne_(item, owner, runId, backupId);
    });

    SpreadsheetApp.flush();

    const verification = dupFmrVerify_(plan.targetFmrNumbers);
    const dashboardAfter = dupFmrDashboardSnapshot_();

    if (!verification.passed) {
      throw new Error(
        'Post-purge verification FAILED. Stop and use the pre-purge backup if needed. ' +
        JSON.stringify(verification)
      );
    }

    dupFmrAppendLog_(
      logSheet,
      runId,
      plan,
      results,
      backupId,
      owner,
      performedAt,
      dashboardBefore,
      dashboardAfter
    );

    const out = {
      success: true,
      runId: runId,
      backupId: backupId,
      owner: owner.email,
      targetFmrNumbers: plan.targetFmrNumbers,
      transactionPolicy: DUP_FMR_PURGE_V3.TRANSACTION_POLICY,
      archivedRows: archiveRows.length,
      dashboardBefore: dashboardBefore,
      dashboardAfter: dashboardAfter,
      results: results,
      verification: verification,
    };

    console.log(JSON.stringify(out, null, 2));
    return out;
  } finally {
    lock.releaseLock();
  }
}

/**
 * STEP 3 — optional post-run verification.
 */
function verifyDuplicateFmrPurgeV3() {
  setFmrV3DatabaseContext_(FMR_V3.DEFAULT_DATABASE_ID);
  dupFmrAssertOwner_();
  const out = dupFmrVerify_(dupFmrTargets_());
  console.log(JSON.stringify(out, null, 2));
  return out;
}

/* ========================================================================== */
/* PLAN / SAFETY                                                              */
/* ========================================================================== */

function dupFmrAssertOwner_() {
  const email = normalizeEmailFmrV3_(
    Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail()
  );
  if (!email) throw new Error('Unable to resolve the effective user email.');
  return assertOwnerFmrV3_(email);
}

function dupFmrTargets_() {
  const targets = Array.from(new Set(
    (DUP_FMR_PURGE_V3.TARGET_FMR_NUMBERS || [])
      .map(normalizeFmrV3_)
      .filter(Boolean)
  ));
  if (!targets.length) throw new Error('TARGET_FMR_NUMBERS is empty.');
  return targets;
}

function dupFmrBuildPlan_(owner) {
  const targets = dupFmrTargets_();
  const targetSet = new Set(targets);

  const headers = getUsedRowsFmrV3_(FMR_V3.SHEETS.HEADERS);
  const lines = getUsedRowsFmrV3_(FMR_V3.SHEETS.LINES);
  const transactions = getUsedRowsFmrV3_(FMR_V3.SHEETS.TRANSACTIONS);
  const bagHeaders = getUsedRowsFmrV3_(FMR_V3.SHEETS.BAG_HEADERS);
  const bagItems = getUsedRowsFmrV3_(FMR_V3.SHEETS.BAG_ITEMS);
  const backorders = getUsedRowsFmrV3_(FMR_V3.SHEETS.BACKORDERS);
  const searchIndex = getUsedRowsFmrV3_(FMR_V3.SHEETS.SEARCH_INDEX);
  const operationalIndex = getUsedRowsFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX);

  // Surviving active FMRs by ISO. Target FMRs are excluded intentionally.
  const survivingByIso = {};
  lines.forEach(function (line) {
    const fmrNumber = normalizeFmrV3_(line.FMR_Number);
    if (targetSet.has(fmrNumber) || !yesFmrV3_(line.Active)) return;
    const isoKey = normalizeUpperFmrV3_(line.ISO_Key);
    if (!isoKey) return;
    if (!survivingByIso[isoKey]) survivingByIso[isoKey] = new Set();
    survivingByIso[isoKey].add(fmrNumber);
  });

  const blockedReasons = [];
  const items = [];

  targets.forEach(function (fmrNumber) {
    const matchingHeaders = headers.filter(function (h) {
      return normalizeFmrV3_(h.FMR_Number) === fmrNumber;
    });
    const activeHeaders = matchingHeaders.filter(function (h) {
      return yesFmrV3_(h.Active);
    });

    if (matchingHeaders.length !== 1) {
      blockedReasons.push('FMR ' + fmrNumber + ' has ' + matchingHeaders.length + ' header rows; expected exactly 1.');
    }
    if (activeHeaders.length !== 1) {
      blockedReasons.push('FMR ' + fmrNumber + ' has ' + activeHeaders.length + ' active header rows; expected exactly 1.');
    }

    const header = matchingHeaders[0] || {};
    const fmrId = normalizeFmrV3_(header.FMR_ID);

    const fmrLines = lines.filter(function (line) {
      return normalizeFmrV3_(line.FMR_Number) === fmrNumber ||
        (fmrId && normalizeFmrV3_(line.FMR_ID) === fmrId);
    });

    const lineIds = new Set(fmrLines.map(function (line) {
      return normalizeFmrV3_(line.FMR_Line_ID);
    }).filter(Boolean));

    const isoKeys = Array.from(new Set(
      fmrLines
        .filter(function (line) { return yesFmrV3_(line.Active); })
        .map(function (line) { return normalizeUpperFmrV3_(line.ISO_Key); })
        .filter(Boolean)
    )).sort();

    const duplicateIsoMatches = isoKeys.map(function (isoKey) {
      return {
        isoKey: isoKey,
        survivingFmrNumbers: survivingByIso[isoKey]
          ? Array.from(survivingByIso[isoKey]).sort()
          : [],
      };
    });

    const allIsosDuplicated = isoKeys.length > 0 && duplicateIsoMatches.every(function (x) {
      return x.survivingFmrNumbers.length > 0;
    });

    if (!isoKeys.length) {
      blockedReasons.push('FMR ' + fmrNumber + ' has no active ISO_Key values to prove a surviving copy exists.');
    }

    if (DUP_FMR_PURGE_V3.REQUIRE_ALL_ISOS_DUPLICATED && !allIsosDuplicated) {
      const missing = duplicateIsoMatches
        .filter(function (x) { return !x.survivingFmrNumbers.length; })
        .map(function (x) { return x.isoKey; });
      blockedReasons.push(
        'FMR ' + fmrNumber + ' is not safe for whole-FMR purge. No surviving active FMR exists for: ' + missing.join(', ')
      );
    }

    const fmrTransactions = transactions.filter(function (t) {
      return normalizeFmrV3_(t.FMR_Number) === fmrNumber ||
        (fmrId && normalizeFmrV3_(t.FMR_ID) === fmrId) ||
        lineIds.has(normalizeFmrV3_(t.FMR_Line_ID));
    });

    if (
      fmrTransactions.length &&
      normalizeUpperFmrV3_(DUP_FMR_PURGE_V3.TRANSACTION_POLICY) !== 'ARCHIVE_AND_REMOVE'
    ) {
      blockedReasons.push(
        'FMR ' + fmrNumber + ' has ' + fmrTransactions.length +
        ' Material_Transactions row(s). Review them first; then use ARCHIVE_AND_REMOVE only if those actions are truly invalid duplicate activity.'
      );
    }

    const fmrBagHeaders = bagHeaders.filter(function (b) {
      return normalizeFmrV3_(b.FMR_Number) === fmrNumber ||
        (fmrId && normalizeFmrV3_(b.FMR_ID) === fmrId);
    });
    const bagIds = new Set(fmrBagHeaders.map(function (b) {
      return normalizeFmrV3_(b.Bag_Tag_ID);
    }).filter(Boolean));

    const fmrBagItems = bagItems.filter(function (i) {
      return lineIds.has(normalizeFmrV3_(i.FMR_Line_ID)) ||
        bagIds.has(normalizeFmrV3_(i.Bag_Tag_ID));
    });

    const fmrBackorders = backorders.filter(function (r) {
      return normalizeFmrV3_(r.FMR_Number) === fmrNumber ||
        (fmrId && normalizeFmrV3_(r.FMR_ID) === fmrId) ||
        lineIds.has(normalizeFmrV3_(r.FMR_Line_ID));
    });
    const backorderIds = new Set(fmrBackorders.map(function (r) {
      return normalizeFmrV3_(r.Backorder_Request_ID);
    }).filter(Boolean));

    const relatedIds = new Set(
      [fmrId]
        .concat(Array.from(lineIds))
        .concat(Array.from(bagIds))
        .concat(Array.from(backorderIds))
        .filter(Boolean)
    );

    const fmrSearchIndex = searchIndex.filter(function (e) {
      return (fmrId && normalizeFmrV3_(e.FMR_ID) === fmrId) ||
        normalizeFmrV3_(e.FMR_Number) === fmrNumber ||
        lineIds.has(normalizeFmrV3_(e.FMR_Line_ID));
    });

    const fmrOperationalIndex = operationalIndex.filter(function (e) {
      return relatedIds.has(normalizeFmrV3_(e.Entity_ID)) ||
        relatedIds.has(normalizeFmrV3_(e.Parent_ID));
    });

    items.push({
      fmrNumber: fmrNumber,
      fmrId: fmrId,
      header: header,
      lines: fmrLines,
      transactions: fmrTransactions,
      bagHeaders: fmrBagHeaders,
      bagItems: fmrBagItems,
      backorders: fmrBackorders,
      searchIndex: fmrSearchIndex,
      operationalIndex: fmrOperationalIndex,
      isoKeys: isoKeys,
      duplicateIsoMatches: duplicateIsoMatches,
      allIsosDuplicated: allIsosDuplicated,
      transactionSummary: dupFmrTransactionSummary_(fmrTransactions),
      kpiImpact: dupFmrKpiImpact_(header, fmrLines),
    });
  });

  return {
    owner: owner.email,
    targetFmrNumbers: targets,
    canApply: blockedReasons.length === 0,
    blockedReasons: blockedReasons,
    items: items,
  };
}

function dupFmrPublicPlan_(plan) {
  return {
    mode: 'PREVIEW_ONLY',
    coreVersion: FMR_V3.VERSION,
    databaseId: FMR_V3.DEFAULT_DATABASE_ID,
    owner: plan.owner,
    transactionPolicy: DUP_FMR_PURGE_V3.TRANSACTION_POLICY,
    targetFmrNumbers: plan.targetFmrNumbers,
    canApply: plan.canApply,
    blockedReasons: plan.blockedReasons,
    fmrs: plan.items.map(function (item) {
      return {
        fmrNumber: item.fmrNumber,
        fmrId: item.fmrId,
        active: yesFmrV3_(item.header.Active),
        currentStatus: normalizeFmrV3_(item.header.Current_Status),
        isoKeys: item.isoKeys,
        duplicateIsoMatches: item.duplicateIsoMatches,
        allIsosDuplicated: item.allIsosDuplicated,
        counts: dupFmrCounts_(item),
        transactionSummary: item.transactionSummary,
        kpiImpact: item.kpiImpact,
      };
    }),
  };
}

function dupFmrCounts_(item) {
  return {
    headers: item.header && item.header._rowNumber ? 1 : 0,
    lines: item.lines.length,
    transactions: item.transactions.length,
    bagHeaders: item.bagHeaders.length,
    bagItems: item.bagItems.length,
    backorders: item.backorders.length,
    searchIndex: item.searchIndex.length,
    operationalIndex: item.operationalIndex.length,
  };
}

function dupFmrTransactionSummary_(rows) {
  const out = {};
  rows.forEach(function (r) {
    const type = normalizeUpperFmrV3_(r.Transaction_Type) || 'UNKNOWN';
    if (!out[type]) out[type] = {count: 0, quantity: 0};
    out[type].count += 1;
    out[type].quantity += numberFmrV3_(r.Quantity);
  });
  return out;
}

function dupFmrKpiImpact_(header, lines) {
  return {
    publishedFmrs: yesFmrV3_(header.Active) ? 1 : 0,
    materialLines: lines.filter(function (l) { return yesFmrV3_(l.Active); }).length,
    requestedQty: numberFmrV3_(header.Qty_Requested),
    locatedQty: numberFmrV3_(header.Qty_Confirmed_Located),
    baggedQty: numberFmrV3_(header.Qty_Active_Bagged),
    availableQty: numberFmrV3_(header.Qty_Available),
    issuedQty: numberFmrV3_(header.Qty_Issued),
    pendingBackorderQty: numberFmrV3_(header.Qty_Pending_Backorder),
    confirmedBackorderQty: numberFmrV3_(header.Qty_Confirmed_Backorder),
    remainingQty: numberFmrV3_(header.Qty_Remaining_Requirement),
  };
}

/* ========================================================================== */
/* APPLY                                                                       */
/* ========================================================================== */

function dupFmrApplyOne_(item, owner, runId, backupId) {
  const now = nowFmrV3_();
  const note = '[DUPLICATE FMR PURGE ' + runId + '] ' + DUP_FMR_PURGE_V3.REASON;

  // Deactivate indexes; do not delete rows because row positions are indexed.
  item.searchIndex.forEach(function (e) {
    updateRowObjectFmrV3_(FMR_V3.SHEETS.SEARCH_INDEX, e._rowNumber, {
      Active: FMR_V3.NO,
      Updated_At: now,
    });
    const key = normalizeUpperFmrV3_(e.Search_Key);
    if (key) {
      try { invalidateIndexKeyFmrV3_(FMR_V3.SHEETS.SEARCH_INDEX, key); } catch (ignored) {}
    }
  });

  item.operationalIndex.forEach(function (e) {
    updateRowObjectFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX, e._rowNumber, {
      Active: FMR_V3.NO,
      Updated_At: now,
    });
    const key = normalizeUpperFmrV3_(e.Index_Key);
    if (key) {
      try { invalidateIndexKeyFmrV3_(FMR_V3.SHEETS.OPERATIONAL_INDEX, key); } catch (ignored) {}
    }
  });

  if (normalizeUpperFmrV3_(DUP_FMR_PURGE_V3.TRANSACTION_POLICY) === 'ARCHIVE_AND_REMOVE') {
    dupFmrClearRows_(FMR_V3.SHEETS.TRANSACTIONS, item.transactions);
  }

  // Remove duplicate bag/backorder operational records after archive.
  dupFmrClearRows_(FMR_V3.SHEETS.BAG_ITEMS, item.bagItems);
  dupFmrClearRows_(FMR_V3.SHEETS.BAG_HEADERS, item.bagHeaders);
  dupFmrClearRows_(FMR_V3.SHEETS.BACKORDERS, item.backorders);

  // Inactive line tombstones. Keep identity/ISO/material fields; zero quantities.
  item.lines.forEach(function (line) {
    updateRowObjectFmrV3_(FMR_V3.SHEETS.LINES, line._rowNumber, {
      Qty_Requested: 0,
      Qty_Confirmed_Located: 0,
      Qty_Active_Bagged: 0,
      Qty_Available: 0,
      Qty_Issued: 0,
      Qty_Pending_Backorder: 0,
      Qty_Confirmed_Backorder: 0,
      Qty_Not_Yet_Located: 0,
      Qty_Remaining_Requirement: 0,
      Line_Status: 'Cancelled',
      Active: FMR_V3.NO,
      Updated_By: owner.email,
      Updated_At: now,
      Notes: dupFmrAppendNote_(line.Notes, note),
    });
  });

  // Header quantities MUST be zeroed because Dashboard quantity KPIs SUM the
  // header quantity columns rather than filtering those sums by Active.
  updateRowObjectFmrV3_(FMR_V3.SHEETS.HEADERS, item.header._rowNumber, {
    Current_Status: 'Cancelled',
    Total_Lines: 0,
    Qty_Requested: 0,
    Qty_Confirmed_Located: 0,
    Qty_Active_Bagged: 0,
    Qty_Available: 0,
    Qty_Issued: 0,
    Qty_Pending_Backorder: 0,
    Qty_Confirmed_Backorder: 0,
    Qty_Remaining_Requirement: 0,
    Fulfillment_Pct: 0,
    Active: FMR_V3.NO,
    Updated_By: owner.email,
    Updated_At: now,
    Last_Activity_At: now,
    Notes: dupFmrAppendNote_(
      item.header.Notes,
      note + (backupId ? ' Backup_ID=' + backupId : '')
    ),
  });

  // Preserve immutable audit history and add the maintenance action.
  appendAuditFmrV3_(
    'FMR',
    item.fmrId || item.fmrNumber,
    'DUPLICATE_FMR_PURGED',
    owner,
    runId,
    {
      sourceInterface: 'OWNER_MAINTENANCE',
      notes: DUP_FMR_PURGE_V3.REASON,
      payload: {
        fmrNumber: item.fmrNumber,
        backupId: backupId,
        transactionPolicy: DUP_FMR_PURGE_V3.TRANSACTION_POLICY,
        counts: dupFmrCounts_(item),
      },
    }
  );

  return {
    fmrNumber: item.fmrNumber,
    fmrId: item.fmrId,
    status: 'PURGED_FROM_OPERATIONAL_DATA',
    affected: dupFmrCounts_(item),
  };
}

function dupFmrClearRows_(sheetName, records) {
  const rows = Array.from(new Set(
    (records || [])
      .map(function (r) { return numberFmrV3_(r._rowNumber); })
      .filter(function (r) { return r >= 2; })
  )).sort(function (a, b) { return a - b; });

  if (!rows.length) return;

  const groups = [];
  rows.forEach(function (row) {
    const current = groups.length ? groups[groups.length - 1] : null;
    if (current && row === current.end + 1) current.end = row;
    else groups.push({start: row, end: row});
  });

  const sheet = sheetFmrV3_(sheetName);
  const width = headerMapFmrV3_(sheetName).headers.length;
  groups.forEach(function (g) {
    sheet.getRange(g.start, 1, g.end - g.start + 1, width).clearContent();
  });
}

function dupFmrAppendNote_(existing, addition) {
  const a = normalizeFmrV3_(existing);
  const b = normalizeFmrV3_(addition);
  if (!a) return b;
  if (!b) return a;
  return a + '\n' + b;
}

/* ========================================================================== */
/* ARCHIVE / LOG                                                               */
/* ========================================================================== */

function dupFmrEnsureArchiveSheet_() {
  return dupFmrEnsureSheet_(DUP_FMR_PURGE_V3.ARCHIVE_SHEET, [
    'Archive_ID', 'Purge_Run_ID', 'FMR_Number', 'FMR_ID', 'Source_Sheet',
    'Original_Row_Number', 'Record_JSON', 'Archived_By', 'Archived_At',
  ]);
}

function dupFmrEnsureLogSheet_() {
  return dupFmrEnsureSheet_(DUP_FMR_PURGE_V3.LOG_SHEET, [
    'Run_ID', 'FMR_Number', 'FMR_ID', 'Status', 'Reason', 'Backup_ID',
    'Header_Count', 'Line_Count', 'Transaction_Count', 'Bag_Header_Count',
    'Bag_Item_Count', 'Backorder_Count', 'Search_Index_Count',
    'Operational_Index_Count', 'Performed_By', 'Performed_At',
    'Dashboard_Before_JSON', 'Dashboard_After_JSON', 'Details_JSON',
  ]);
}

function dupFmrEnsureSheet_(sheetName, headers) {
  const ss = fmrV3Database_();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }
  const current = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  headers.forEach(function (h, i) {
    if (current[i] && current[i] !== h) {
      throw new Error(sheetName + ' header mismatch at column ' + (i + 1));
    }
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

function dupFmrCollectArchiveRows_(out, runId, item, owner, archivedAt) {
  const sources = [
    [FMR_V3.SHEETS.HEADERS, item.header && item.header._rowNumber ? [item.header] : []],
    [FMR_V3.SHEETS.LINES, item.lines],
    [FMR_V3.SHEETS.TRANSACTIONS, item.transactions],
    [FMR_V3.SHEETS.BAG_HEADERS, item.bagHeaders],
    [FMR_V3.SHEETS.BAG_ITEMS, item.bagItems],
    [FMR_V3.SHEETS.BACKORDERS, item.backorders],
    [FMR_V3.SHEETS.SEARCH_INDEX, item.searchIndex],
    [FMR_V3.SHEETS.OPERATIONAL_INDEX, item.operationalIndex],
  ];

  sources.forEach(function (source) {
    source[1].forEach(function (record) {
      const copy = Object.assign({}, record);
      delete copy._rowNumber;
      out.push([
        uuidFmrV3_('ARCH'), runId, item.fmrNumber, item.fmrId, source[0],
        record._rowNumber, JSON.stringify(copy), owner.email, archivedAt,
      ]);
    });
  });
}

function dupFmrEnsureGridCapacity_(sheet, lastNeededRow, lastNeededColumn) {
  if (sheet.getMaxRows() < lastNeededRow) {
    sheet.insertRowsAfter(
      sheet.getMaxRows(),
      Math.max(lastNeededRow - sheet.getMaxRows(), 100)
    );
  }
  if (sheet.getMaxColumns() < lastNeededColumn) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      lastNeededColumn - sheet.getMaxColumns()
    );
  }
}

function dupFmrAppendArchiveRows_(sheet, rows) {
  if (!rows.length) return;
  const start = Math.max(2, sheet.getLastRow() + 1);
  dupFmrEnsureGridCapacity_(sheet, start + rows.length - 1, 9);
  sheet.getRange(start, 1, rows.length, 9).setValues(rows);
}

function dupFmrAppendLog_(sheet, runId, plan, results, backupId, owner, performedAt, before, after) {
  const rows = results.map(function (result) {
    const item = plan.items.find(function (x) { return x.fmrNumber === result.fmrNumber; });
    const c = dupFmrCounts_(item);
    return [
      runId, item.fmrNumber, item.fmrId, result.status, DUP_FMR_PURGE_V3.REASON,
      backupId, c.headers, c.lines, c.transactions, c.bagHeaders, c.bagItems,
      c.backorders, c.searchIndex, c.operationalIndex, owner.email, performedAt,
      JSON.stringify(before), JSON.stringify(after),
      JSON.stringify({
        isoMatches: item.duplicateIsoMatches,
        transactionSummary: item.transactionSummary,
        kpiImpact: item.kpiImpact,
        transactionPolicy: DUP_FMR_PURGE_V3.TRANSACTION_POLICY,
      }),
    ];
  });
  if (!rows.length) return;
  const start = Math.max(2, sheet.getLastRow() + 1);
  dupFmrEnsureGridCapacity_(sheet, start + rows.length - 1, 19);
  sheet.getRange(start, 1, rows.length, 19).setValues(rows);
}

/* ========================================================================== */
/* VERIFICATION                                                                */
/* ========================================================================== */

function dupFmrDashboardSnapshot_() {
  const sheet = sheetFmrV3_(FMR_V3.SHEETS.DASHBOARD);
  return {
    topKpis: sheet.getRange('A5:G5').getDisplayValues()[0],
    materialKpis: sheet.getRange('A9:G9').getDisplayValues()[0],
  };
}

function dupFmrVerify_(targetNumbers) {
  SpreadsheetApp.flush();
  const targets = new Set((targetNumbers || []).map(normalizeFmrV3_).filter(Boolean));

  const headers = getUsedRowsFmrV3_(FMR_V3.SHEETS.HEADERS).filter(function (r) {
    return targets.has(normalizeFmrV3_(r.FMR_Number));
  });
  const lines = getUsedRowsFmrV3_(FMR_V3.SHEETS.LINES).filter(function (r) {
    return targets.has(normalizeFmrV3_(r.FMR_Number));
  });
  const lineIds = new Set(lines.map(function (r) { return normalizeFmrV3_(r.FMR_Line_ID); }).filter(Boolean));
  const fmrIds = new Set(headers.map(function (r) { return normalizeFmrV3_(r.FMR_ID); }).filter(Boolean));

  const transactions = getUsedRowsFmrV3_(FMR_V3.SHEETS.TRANSACTIONS).filter(function (r) {
    return targets.has(normalizeFmrV3_(r.FMR_Number)) ||
      fmrIds.has(normalizeFmrV3_(r.FMR_ID)) ||
      lineIds.has(normalizeFmrV3_(r.FMR_Line_ID));
  });
  const bagHeaders = getUsedRowsFmrV3_(FMR_V3.SHEETS.BAG_HEADERS).filter(function (r) {
    return targets.has(normalizeFmrV3_(r.FMR_Number)) || fmrIds.has(normalizeFmrV3_(r.FMR_ID));
  });
  const bagIds = new Set(bagHeaders.map(function (r) { return normalizeFmrV3_(r.Bag_Tag_ID); }).filter(Boolean));
  const bagItems = getUsedRowsFmrV3_(FMR_V3.SHEETS.BAG_ITEMS).filter(function (r) {
    return lineIds.has(normalizeFmrV3_(r.FMR_Line_ID)) || bagIds.has(normalizeFmrV3_(r.Bag_Tag_ID));
  });
  const backorders = getUsedRowsFmrV3_(FMR_V3.SHEETS.BACKORDERS).filter(function (r) {
    return targets.has(normalizeFmrV3_(r.FMR_Number)) ||
      fmrIds.has(normalizeFmrV3_(r.FMR_ID)) ||
      lineIds.has(normalizeFmrV3_(r.FMR_Line_ID));
  });

  const activeHeaders = headers.filter(function (r) { return yesFmrV3_(r.Active); });
  const activeLines = lines.filter(function (r) { return yesFmrV3_(r.Active); });

  const nonZeroHeaders = headers.filter(function (r) {
    return [
      r.Total_Lines, r.Qty_Requested, r.Qty_Confirmed_Located, r.Qty_Active_Bagged,
      r.Qty_Available, r.Qty_Issued, r.Qty_Pending_Backorder,
      r.Qty_Confirmed_Backorder, r.Qty_Remaining_Requirement, r.Fulfillment_Pct,
    ].some(function (x) { return numberFmrV3_(x) !== 0; });
  });

  const nonZeroLines = lines.filter(function (r) {
    return [
      r.Qty_Requested, r.Qty_Confirmed_Located, r.Qty_Active_Bagged,
      r.Qty_Available, r.Qty_Issued, r.Qty_Pending_Backorder,
      r.Qty_Confirmed_Backorder, r.Qty_Not_Yet_Located, r.Qty_Remaining_Requirement,
    ].some(function (x) { return numberFmrV3_(x) !== 0; });
  });

  const passed =
    activeHeaders.length === 0 &&
    activeLines.length === 0 &&
    nonZeroHeaders.length === 0 &&
    nonZeroLines.length === 0 &&
    bagHeaders.length === 0 &&
    bagItems.length === 0 &&
    backorders.length === 0 &&
    (
      normalizeUpperFmrV3_(DUP_FMR_PURGE_V3.TRANSACTION_POLICY) !== 'ARCHIVE_AND_REMOVE' ||
      transactions.length === 0
    );

  return {
    passed: passed,
    activeHeaderCount: activeHeaders.length,
    activeLineCount: activeLines.length,
    nonZeroHeaderCount: nonZeroHeaders.length,
    nonZeroLineCount: nonZeroLines.length,
    remainingTransactionCount: transactions.length,
    remainingBagHeaderCount: bagHeaders.length,
    remainingBagItemCount: bagItems.length,
    remainingBackorderCount: backorders.length,
    dashboard: dupFmrDashboardSnapshot_(),
  };
}
