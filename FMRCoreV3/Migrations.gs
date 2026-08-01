function backfillActiveBagStatusIndexFmrV3() {
  setFmrV3DatabaseContext_(FMR_V3.DEFAULT_DATABASE_ID);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const effectiveEmail = normalizeEmailFmrV3_(
      Session.getEffectiveUser().getEmail()
    );

    const user = assertOwnerFmrV3_(effectiveEmail);
    const activeStatuses = ['ACTIVE', 'PARTIALLY ISSUED'];

    const headers = getUsedRowsFmrV3_(
      FMR_V3.SHEETS.BAG_HEADERS
    );

    const items = getUsedRowsFmrV3_(
      FMR_V3.SHEETS.BAG_ITEMS
    );

    const headersByBagId = {};

    headers.forEach(function (header) {
      const bagTagId = normalizeFmrV3_(
        header.Bag_Tag_ID
      );

      if (bagTagId) {
        headersByBagId[bagTagId] = header;
      }
    });

    const candidatesByKey = {};
    let orphanedItems = 0;
    let inactiveItems = 0;

    items.forEach(function (item) {
      const bagTagId = normalizeFmrV3_(
        item.Bag_Tag_ID
      );

      const lineId = normalizeFmrV3_(
        item.FMR_Line_ID
      );

      const header = headersByBagId[bagTagId];
      const remaining = numberFmrV3_(
        item.Qty_Remaining_In_Bag
      );

      if (!bagTagId || !lineId || !header) {
        orphanedItems += 1;
        return;
      }

      if (
        remaining <= 0 ||
        !activeStatuses.includes(
          normalizeUpperFmrV3_(header.Status)
        )
      ) {
        inactiveItems += 1;
        return;
      }

      const compositeKey =
        bagTagId + '|' + item._rowNumber;

      candidatesByKey[compositeKey] = {
        Index_Key: operationalIndexKeyFmrV3_(
          'BAGSTATUS',
          'ACTIVE'
        ),
        Index_Type: 'BAGSTATUS',
        Entity_ID: bagTagId,
        Parent_ID: lineId,
        Row_Number: header._rowNumber,
        Secondary_Row_Number: item._rowNumber,
        Active: FMR_V3.YES,
        Updated_At: nowFmrV3_()
      };
    });

    const existingEntries =
      lookupOperationalRowsFmrV3_(
        'BAGSTATUS',
        'ACTIVE'
      );

    const retainedKeys = {};
    let deactivatedEntries = 0;

    existingEntries.forEach(function (entry) {
      const compositeKey =
        normalizeFmrV3_(entry.Entity_ID) +
        '|' +
        numberFmrV3_(entry.Secondary_Row_Number);

      const isExpected =
        Object.prototype.hasOwnProperty.call(
          candidatesByKey,
          compositeKey
        );

      const isDuplicate =
        Object.prototype.hasOwnProperty.call(
          retainedKeys,
          compositeKey
        );

      if (!isExpected || isDuplicate) {
        updateRowObjectFmrV3_(
          FMR_V3.SHEETS.OPERATIONAL_INDEX,
          entry._rowNumber,
          {
            Active: FMR_V3.NO,
            Updated_At: nowFmrV3_()
          }
        );

        deactivatedEntries += 1;
        return;
      }

      retainedKeys[compositeKey] = true;
    });

    const entriesToInsert = Object.keys(
      candidatesByKey
    ).filter(function (compositeKey) {
      return !retainedKeys[compositeKey];
    }).map(function (compositeKey) {
      return candidatesByKey[compositeKey];
    });

    appendOperationalIndexEntriesFmrV3_(
      entriesToInsert
    );

    SpreadsheetApp.flush();

    invalidateIndexKeyFmrV3_(
      FMR_V3.SHEETS.OPERATIONAL_INDEX,
      operationalIndexKeyFmrV3_(
        'BAGSTATUS',
        'ACTIVE'
      )
    );

    const verifiedEntries =
      lookupOperationalRowsFmrV3_(
        'BAGSTATUS',
        'ACTIVE'
      );

    const verifiedKeys = {};

    verifiedEntries.forEach(function (entry) {
      const compositeKey =
        normalizeFmrV3_(entry.Entity_ID) +
        '|' +
        numberFmrV3_(entry.Secondary_Row_Number);

      verifiedKeys[compositeKey] = true;
    });

    const expectedKeys = Object.keys(
      candidatesByKey
    );

    const passed =
      verifiedEntries.length === expectedKeys.length &&
      expectedKeys.every(function (compositeKey) {
        return Boolean(verifiedKeys[compositeKey]);
      });

    const output = {
      passed: passed,
      migration: 'BAGSTATUS_ACTIVE_BACKFILL',
      performedBy: user.email,
      bagHeadersScanned: headers.length,
      bagItemsScanned: items.length,
      eligibleActiveItems: expectedKeys.length,
      existingEntriesBefore: existingEntries.length,
      retainedEntries: Object.keys(
        retainedKeys
      ).length,
      insertedEntries: entriesToInsert.length,
      deactivatedEntries: deactivatedEntries,
      activeEntriesAfter: verifiedEntries.length,
      orphanedItems: orphanedItems,
      inactiveItems: inactiveItems
    };

    console.log(
      JSON.stringify(output, null, 2)
    );

    if (!output.passed) {
      throw new Error(
        'Active Bag Tag status-index backfill verification failed.'
      );
    }

    return output;
  } finally {
    lock.releaseLock();
  }
}