/**
 * FMR Operations v3 — Alpha 30.4
 * Historical Size reconciliation for the Alpha 30.3 date/fraction orientation defect.
 *
 * Problem being repaired:
 *   Excel / Google conversion can turn a fractional Size such as 3/4 into a
 *   Date object representing March 4. Alpha 30.3 reconstructed the Date as
 *   day/month (4/3) instead of month/day (3/4).
 *
 * A second conversion case exists for numeric whole-inch sizes stored in a
 * date-formatted Excel cell. A Size of 1 can arrive in Apps Script as the
 * Google serial-date calendar day 1899-12-31. Alpha 30.3 reconstructed that as
 * 31/12. This service recovers the underlying serial value (1).
 *
 * Safety rules:
 *   - Owner only.
 *   - Preview is read-only.
 *   - Apply requires write-enabled system state, an exact preview fingerprint,
 *     and the deterministic confirmation phrase returned by preview.
 *   - Apply takes a database backup before any data mutation.
 *   - Repairs are driven by existing SIZE_DATE_COERCION_REPAIRED issue evidence;
 *     there is no blind global find/replace.
 *   - Every candidate is traced through Bulk_Import_Lines ->
 *     Import_Staging_Lines -> FMR_Line_Items -> Bag_Tag_Items.
 *   - A layer is auto-repairable only when its current value is either the
 *     known Alpha 30.3 wrong value or the reconstructed correct value.
 *   - Unexpected divergence is held for manual review.
 *   - Original Bulk_Import_Issues rows are never rewritten; the repair has its
 *     own append-only Size_Reconciliation_Log plus Audit_Log summary.
 */

const FMR_V3_SIZE_RECONCILIATION = Object.freeze({
  VERSION: 'ALPHA30_4_SIZE_RECONCILIATION_V1',
  LOG_SHEET: 'Size_Reconciliation_Log',
  ISSUE_CODE: 'SIZE_DATE_COERCION_REPAIRED',
  MAX_PREVIEW_CANDIDATES: 250,
  MAX_SERIAL_SIZE: 120,
  LOG_HEADERS: Object.freeze([
    'Reconciliation_ID',
    'Candidate_ID',
    'Issue_ID',
    'Import_Item_ID',
    'Import_Line_ID',
    'FMR_Number',
    'FMR_Line_ID',
    'Line_Number',
    'Commodity_Code',
    'Material_Description',
    'Evidence_Source_Value',
    'Evidence_Rule',
    'Expected_Alpha30_3_Value',
    'Corrected_Size',
    'Bulk_Before',
    'Staging_Before',
    'Published_Before',
    'Bag_Before_JSON',
    'Patched_Layers',
    'Status',
    'Applied_By',
    'Applied_At',
    'Backup_ID',
    'Notes'
  ])
});

function ensureSizeReconciliationLogFmrV3_() {
  const spreadsheet = fmrV3Database_();
  const headers = Array.from(FMR_V3_SIZE_RECONCILIATION.LOG_HEADERS);
  let sheet = spreadsheet.getSheetByName(FMR_V3_SIZE_RECONCILIATION.LOG_SHEET);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(FMR_V3_SIZE_RECONCILIATION.LOG_SHEET);
  }

  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      headers.length - sheet.getMaxColumns()
    );
  }

  const current = sheet
    .getRange(1, 1, 1, headers.length)
    .getDisplayValues()[0]
    .map(normalizeFmrV3_);

  headers.forEach(function (header, index) {
    if (current[index] && current[index] !== header) {
      throw new Error(
        FMR_V3_SIZE_RECONCILIATION.LOG_SHEET +
        ' header mismatch at column ' +
        (index + 1) +
        '. Expected "' + header + '", found "' + current[index] + '".'
      );
    }

    if (!current[index]) {
      sheet.getRange(1, index + 1).setValue(header);
    }
  });

  sheet.setFrozenRows(1);
  return sheet;
}

function sizeReconciliationMonthNumberFmrV3_(monthName) {
  const months = {
    JAN: 1,
    FEB: 2,
    MAR: 3,
    APR: 4,
    MAY: 5,
    JUN: 6,
    JUL: 7,
    AUG: 8,
    SEP: 9,
    OCT: 10,
    NOV: 11,
    DEC: 12
  };

  return months[
    normalizeUpperFmrV3_(monthName).slice(0, 3)
  ] || 0;
}

function sizeReconciliationCalendarSerialFmrV3_(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (!y || !m || !d) return null;

  const serial = Math.round(
    (
      Date.UTC(y, m - 1, d) -
      Date.UTC(1899, 11, 30)
    ) / 86400000
  );

  if (
    serial < 1 ||
    serial > FMR_V3_SIZE_RECONCILIATION.MAX_SERIAL_SIZE
  ) {
    return null;
  }

  return serial;
}

function sizeReconciliationEvidenceFmrV3_(sourceValue) {
  const source = normalizeFmrV3_(sourceValue);

  if (!source) {
    return {
      repairable: false,
      sourceValue: source,
      reason: 'SIZE_REPAIR_EVIDENCE_BLANK'
    };
  }

  const named = source.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,|\s)+\s*(\d{4})\b/i
  );

  let year = 0;
  let month = 0;
  let day = 0;
  let sourceFormat = '';

  if (named) {
    month = sizeReconciliationMonthNumberFmrV3_(named[1]);
    day = Number(named[2]);
    year = Number(named[3]);
    sourceFormat = 'NAMED_DATE';
  } else {
    const slash = source.match(
      /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})(?:\s+.*)?$/
    );

    if (slash) {
      month = Number(slash[1]);
      day = Number(slash[2]);
      year = Number(slash[3]);
      sourceFormat = 'SLASH_DATE';
    } else {
      const iso = source.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/
      );

      if (iso) {
        year = Number(iso[1]);
        month = Number(iso[2]);
        day = Number(iso[3]);
        sourceFormat = 'ISO_DATE';
      }
    }
  }

  if (
    !year ||
    month < 1 || month > 12 ||
    day < 1 || day > 31
  ) {
    return {
      repairable: false,
      sourceValue: source,
      reason: 'SIZE_REPAIR_DATE_EVIDENCE_UNPARSEABLE'
    };
  }

  const alpha30Wrong = day + '/' + month;

  /**
   * Very early calendar dates represent numeric Excel/Google serial values,
   * not a month/day pipe fraction. The observed production case is a Size of
   * 1 stored in a date-formatted source cell and surfaced by Apps Script as
   * 1899-12-31. Google Sheets serial day 1 is 1899-12-31.
   */
  if (year <= 1904) {
    const serial = sizeReconciliationCalendarSerialFmrV3_(year, month, day);

    if (serial === null) {
      return {
        repairable: false,
        sourceValue: source,
        sourceFormat: sourceFormat,
        year: year,
        month: month,
        day: day,
        alpha30Wrong: alpha30Wrong,
        reason: 'EARLY_DATE_SERIAL_OUTSIDE_ALLOWED_SIZE_RANGE'
      };
    }

    return {
      repairable: true,
      sourceValue: source,
      sourceFormat: sourceFormat,
      year: year,
      month: month,
      day: day,
      alpha30Wrong: alpha30Wrong,
      corrected: String(serial),
      rule: 'EARLY_GOOGLE_DATE_SERIAL_TO_NUMERIC_SIZE'
    };
  }

  /**
   * Normal modern conversion case: 3/4 was interpreted as March 4, so the
   * correct reconstruction is month/day, not day/month.
   */
  if (year >= 2000) {
    return {
      repairable: true,
      sourceValue: source,
      sourceFormat: sourceFormat,
      year: year,
      month: month,
      day: day,
      alpha30Wrong: alpha30Wrong,
      corrected: month + '/' + day,
      rule: 'MODERN_DATE_TO_MONTH_DAY_FRACTION'
    };
  }

  return {
    repairable: false,
    sourceValue: source,
    sourceFormat: sourceFormat,
    year: year,
    month: month,
    day: day,
    alpha30Wrong: alpha30Wrong,
    reason: 'HISTORICAL_DATE_REQUIRES_SOURCE_REVIEW'
  };
}

function sizeReconciliationKeyFmrV3_(left, right) {
  return normalizeFmrV3_(left) + '|' + String(numberFmrV3_(right));
}

function sizeReconciliationIndexOneFmrV3_(rows, fieldName) {
  const index = {};

  (rows || []).forEach(function (row) {
    const key = normalizeFmrV3_(row[fieldName]);
    if (!key) return;

    if (!index[key]) index[key] = [];
    index[key].push(row);
  });

  return index;
}

function sizeReconciliationIndexTwoFmrV3_(rows, leftField, rightField) {
  const index = {};

  (rows || []).forEach(function (row) {
    const left = normalizeFmrV3_(row[leftField]);
    const right = numberFmrV3_(row[rightField]);
    if (!left || right <= 0) return;

    const key = sizeReconciliationKeyFmrV3_(left, right);
    if (!index[key]) index[key] = [];
    index[key].push(row);
  });

  return index;
}

function sizeReconciliationSingleMatchFmrV3_(index, key) {
  const matches = index[key] || [];
  return matches.length === 1 ? matches[0] : null;
}

function sizeReconciliationValueDispositionFmrV3_(current, evidence) {
  const value = normalizeFmrV3_(current);
  const corrected = normalizeFmrV3_(evidence.corrected);
  const wrong = normalizeFmrV3_(evidence.alpha30Wrong);

  if (value === corrected) {
    return {
      valid: true,
      patch: false,
      current: value,
      disposition: 'ALREADY_CORRECT'
    };
  }

  if (value === wrong) {
    return {
      valid: true,
      patch: true,
      current: value,
      disposition: 'ALPHA30_3_VALUE'
    };
  }

  return {
    valid: false,
    patch: false,
    current: value,
    disposition: 'UNEXPECTED_VALUE'
  };
}

function sizeReconciliationPatchFmrV3_(
  candidate,
  layer,
  sheetName,
  row,
  evidence
) {
  if (!row) return null;

  const disposition = sizeReconciliationValueDispositionFmrV3_(
    row.Size,
    evidence
  );

  if (!disposition.valid) {
    candidate.blockingReasons.push(
      layer + ' currently contains "' + disposition.current +
      '"; expected either Alpha 30.3 value "' + evidence.alpha30Wrong +
      '" or corrected value "' + evidence.corrected + '".'
    );
  }

  candidate.layers[layer] = {
    exists: true,
    rowNumber: numberFmrV3_(row._rowNumber),
    current: disposition.current,
    disposition: disposition.disposition
  };

  if (!disposition.patch) return null;

  return {
    candidateId: candidate.candidateId,
    fmrNumber: candidate.fmrNumber,
    fmrLineId: candidate.fmrLineId,
    layer: layer,
    sheetName: sheetName,
    rowNumber: numberFmrV3_(row._rowNumber),
    before: disposition.current,
    after: normalizeFmrV3_(evidence.corrected)
  };
}

function sizeReconciliationBuildPlanFmrV3_(userEmail) {
  const owner = assertOwnerFmrV3_(userEmail);

  const issues = getUsedRowsFmrV3_(FMR_V3.SHEETS.BULK_IMPORT_ISSUES);
  const items = getUsedRowsFmrV3_(FMR_V3.SHEETS.BULK_IMPORT_ITEMS);
  const bulkLines = getUsedRowsFmrV3_(FMR_V3.SHEETS.BULK_IMPORT_LINES);
  const stagingLines = getUsedRowsFmrV3_(FMR_V3.SHEETS.STAGING_LINES);
  const publishedLines = getUsedRowsFmrV3_(FMR_V3.SHEETS.LINES);
  const bagItems = getUsedRowsFmrV3_(FMR_V3.SHEETS.BAG_ITEMS);

  const itemsById = sizeReconciliationIndexOneFmrV3_(items, 'Import_Item_ID');
  const bulkByItemLine = sizeReconciliationIndexTwoFmrV3_(
    bulkLines,
    'Import_Item_ID',
    'Line_Number'
  );
  const stagingByFmrLine = sizeReconciliationIndexTwoFmrV3_(
    stagingLines,
    'Staging_FMR_ID',
    'Line_Number'
  );
  const publishedByStagingLine = sizeReconciliationIndexOneFmrV3_(
    publishedLines,
    'Source_Staging_Line_ID'
  );
  const bagsByLineId = sizeReconciliationIndexOneFmrV3_(
    bagItems,
    'FMR_Line_ID'
  );

  /**
   * A parser retry can append the same issue more than once to the same
   * Import_Item_ID + Line_Number. Keep the newest issue row only.
   */
  const latestIssueByLine = {};

  issues.forEach(function (issue) {
    if (
      normalizeUpperFmrV3_(issue.Issue_Code) !==
      FMR_V3_SIZE_RECONCILIATION.ISSUE_CODE
    ) {
      return;
    }

    const itemId = normalizeFmrV3_(issue.Import_Item_ID);
    const lineNumber = numberFmrV3_(issue.Line_Number);
    if (!itemId || lineNumber <= 0) return;

    const key = sizeReconciliationKeyFmrV3_(itemId, lineNumber);
    const existing = latestIssueByLine[key];

    if (
      !existing ||
      numberFmrV3_(issue._rowNumber) > numberFmrV3_(existing._rowNumber)
    ) {
      latestIssueByLine[key] = issue;
    }
  });

  const candidates = [];
  const allPatches = [];
  const coveredPublishedLineIds = new Set();

  Object.keys(latestIssueByLine)
    .sort()
    .forEach(function (issueKey) {
      const issue = latestIssueByLine[issueKey];
      const itemId = normalizeFmrV3_(issue.Import_Item_ID);
      const lineNumber = numberFmrV3_(issue.Line_Number);
      const candidate = {
        candidateId: 'SIZEFIX|' + itemId + '|' + lineNumber,
        issueId: normalizeFmrV3_(issue.Import_Issue_ID),
        importItemId: itemId,
        importLineId: '',
        fmrNumber: '',
        fmrLineId: '',
        lineNumber: lineNumber,
        commodityCode: '',
        materialDescription: '',
        evidenceSourceValue: normalizeFmrV3_(issue.Source_Value),
        evidenceRule: '',
        expectedWrong: '',
        correctedSize: '',
        layers: {
          bulk: {exists: false},
          staging: {exists: false},
          published: {exists: false},
          bags: []
        },
        patches: [],
        blockingReasons: [],
        repairableEvidence: false,
        status: 'MANUAL_REVIEW'
      };

      const evidence = sizeReconciliationEvidenceFmrV3_(issue.Source_Value);
      candidate.evidenceRule = normalizeFmrV3_(evidence.rule || evidence.reason);
      candidate.expectedWrong = normalizeFmrV3_(evidence.alpha30Wrong);
      candidate.correctedSize = normalizeFmrV3_(evidence.corrected);
      candidate.repairableEvidence = Boolean(evidence.repairable);

      if (!evidence.repairable) {
        candidate.blockingReasons.push(
          'Source evidence is not safely auto-repairable: ' +
          normalizeFmrV3_(evidence.reason)
        );
        candidates.push(candidate);
        return;
      }

      const itemMatches = itemsById[itemId] || [];
      if (itemMatches.length !== 1) {
        candidate.blockingReasons.push(
          'Expected exactly one Bulk_Import_Items row for ' + itemId +
          '; found ' + itemMatches.length + '.'
        );
        candidates.push(candidate);
        return;
      }

      const item = itemMatches[0];
      candidate.fmrNumber = normalizeFmrV3_(item.Official_FMR_Number);

      const bulkKey = sizeReconciliationKeyFmrV3_(itemId, lineNumber);
      const bulkMatches = bulkByItemLine[bulkKey] || [];

      if (bulkMatches.length !== 1) {
        candidate.blockingReasons.push(
          'Expected exactly one Bulk_Import_Lines row for ' +
          itemId + ' line ' + lineNumber + '; found ' + bulkMatches.length + '.'
        );
        candidates.push(candidate);
        return;
      }

      const bulkLine = bulkMatches[0];
      candidate.importLineId = normalizeFmrV3_(bulkLine.Import_Line_ID);
      candidate.commodityCode = normalizeFmrV3_(bulkLine.Commodity_Code);
      candidate.materialDescription = normalizeFmrV3_(bulkLine.Material_Description);

      const bulkPatch = sizeReconciliationPatchFmrV3_(
        candidate,
        'bulk',
        FMR_V3.SHEETS.BULK_IMPORT_LINES,
        bulkLine,
        evidence
      );
      if (bulkPatch) candidate.patches.push(bulkPatch);

      const stagingFmrId = normalizeFmrV3_(item.Staging_FMR_ID);
      let stagingLine = null;

      if (stagingFmrId) {
        const stagingKey = sizeReconciliationKeyFmrV3_(
          stagingFmrId,
          lineNumber
        );
        const stagingMatches = stagingByFmrLine[stagingKey] || [];

        if (stagingMatches.length === 1) {
          stagingLine = stagingMatches[0];
        } else if (stagingMatches.length > 1) {
          candidate.blockingReasons.push(
            'Multiple Import_Staging_Lines rows exist for staging FMR ' +
            stagingFmrId + ' line ' + lineNumber + '.'
          );
        }
      }

      if (stagingLine) {
        const stagingPatch = sizeReconciliationPatchFmrV3_(
          candidate,
          'staging',
          FMR_V3.SHEETS.STAGING_LINES,
          stagingLine,
          evidence
        );
        if (stagingPatch) candidate.patches.push(stagingPatch);

        const stagingLineId = normalizeFmrV3_(stagingLine.Staging_Line_ID);
        const publishedMatches = publishedByStagingLine[stagingLineId] || [];

        if (publishedMatches.length === 1) {
          const publishedLine = publishedMatches[0];
          candidate.fmrLineId = normalizeFmrV3_(publishedLine.FMR_Line_ID);
          candidate.fmrNumber = normalizeFmrV3_(publishedLine.FMR_Number) || candidate.fmrNumber;
          coveredPublishedLineIds.add(candidate.fmrLineId);

          const publishedPatch = sizeReconciliationPatchFmrV3_(
            candidate,
            'published',
            FMR_V3.SHEETS.LINES,
            publishedLine,
            evidence
          );
          if (publishedPatch) candidate.patches.push(publishedPatch);

          const candidateBagRows = bagsByLineId[candidate.fmrLineId] || [];

          candidateBagRows.forEach(function (bagItem) {
            const bagDisposition = sizeReconciliationValueDispositionFmrV3_(
              bagItem.Size,
              evidence
            );

            candidate.layers.bags.push({
              bagTagItemId: normalizeFmrV3_(bagItem.Bag_Tag_Item_ID),
              rowNumber: numberFmrV3_(bagItem._rowNumber),
              current: bagDisposition.current,
              disposition: bagDisposition.disposition
            });

            if (!bagDisposition.valid) {
              candidate.blockingReasons.push(
                'Bag_Tag_Items row ' + bagItem._rowNumber +
                ' currently contains unexpected Size "' +
                bagDisposition.current + '".'
              );
            } else if (bagDisposition.patch) {
              candidate.patches.push({
                candidateId: candidate.candidateId,
                fmrNumber: candidate.fmrNumber,
                fmrLineId: candidate.fmrLineId,
                layer: 'bag',
                sheetName: FMR_V3.SHEETS.BAG_ITEMS,
                rowNumber: numberFmrV3_(bagItem._rowNumber),
                before: bagDisposition.current,
                after: normalizeFmrV3_(evidence.corrected)
              });
            }
          });
        } else if (publishedMatches.length > 1) {
          candidate.blockingReasons.push(
            'Multiple FMR_Line_Items rows reference staging line ' +
            stagingLineId + '.'
          );
        }
      }

      if (candidate.blockingReasons.length) {
        candidate.status = 'MANUAL_REVIEW';
        candidate.patches = [];
      } else if (candidate.patches.length) {
        candidate.status = 'READY_TO_REPAIR';
        allPatches.push.apply(allPatches, candidate.patches);
      } else {
        candidate.status = 'ALREADY_CORRECT';
      }

      candidates.push(candidate);
    });

  /**
   * Flag suspicious published fractions that are not traceable to the parser
   * evidence used by this repair. They are never auto-mutated.
   */
  const orphanSuspiciousPublished = publishedLines
    .filter(function (line) {
      const lineId = normalizeFmrV3_(line.FMR_Line_ID);
      if (!lineId || coveredPublishedLineIds.has(lineId)) return false;

      const size = normalizeFmrV3_(line.Size);
      const match = size.match(/^(\d{1,2})\/(\d{1,2})$/);
      if (!match) return false;

      const left = Number(match[1]);
      const right = Number(match[2]);
      return left > right && left <= 31 && right >= 1;
    })
    .map(function (line) {
      return {
        fmrNumber: normalizeFmrV3_(line.FMR_Number),
        fmrLineId: normalizeFmrV3_(line.FMR_Line_ID),
        lineNumber: numberFmrV3_(line.Line_Number),
        commodityCode: normalizeFmrV3_(line.Commodity_Code),
        size: normalizeFmrV3_(line.Size),
        materialDescription: normalizeFmrV3_(line.Material_Description),
        reason: 'Suspicious reversed-looking fraction has no linked SIZE_DATE_COERCION_REPAIRED evidence.'
      };
    });

  const repairCandidates = candidates.filter(function (candidate) {
    return candidate.status === 'READY_TO_REPAIR';
  });
  const alreadyCorrect = candidates.filter(function (candidate) {
    return candidate.status === 'ALREADY_CORRECT';
  });
  const manualReview = candidates.filter(function (candidate) {
    return candidate.status === 'MANUAL_REVIEW';
  });

  const patchCounts = {};
  allPatches.forEach(function (patch) {
    patchCounts[patch.sheetName] = (patchCounts[patch.sheetName] || 0) + 1;
  });

  const affectedFmrNumbers = Array.from(new Set(
    repairCandidates
      .map(function (candidate) {
        return normalizeFmrV3_(candidate.fmrNumber);
      })
      .filter(Boolean)
  )).sort();

  const fingerprintPayload = repairCandidates
    .map(function (candidate) {
      return {
        candidateId: candidate.candidateId,
        issueId: candidate.issueId,
        fmrNumber: candidate.fmrNumber,
        fmrLineId: candidate.fmrLineId,
        correctedSize: candidate.correctedSize,
        patches: candidate.patches.map(function (patch) {
          return [
            patch.sheetName,
            patch.rowNumber,
            patch.before,
            patch.after
          ].join('|');
        })
      };
    });

  const digest = Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      JSON.stringify(fingerprintPayload)
    )
  ).replace(/=+$/g, '');

  const fingerprint = digest.slice(0, 24);
  const requiredConfirmation = repairCandidates.length
    ? (
        'REPAIR-' +
        repairCandidates.length +
        '-' +
        fingerprint.slice(0, 6).toUpperCase()
      )
    : '';

  return {
    generatedAt: formatDateTimeFmrV3_(nowFmrV3_()),
    owner: {email: owner.email, name: owner.name},
    version: FMR_V3_SIZE_RECONCILIATION.VERSION,
    fingerprint: fingerprint,
    requiredConfirmation: requiredConfirmation,
    summary: {
      parserEvidenceRows: Object.keys(latestIssueByLine).length,
      readyToRepair: repairCandidates.length,
      alreadyCorrect: alreadyCorrect.length,
      manualReview: manualReview.length,
      totalCellPatches: allPatches.length,
      affectedFmrCount: affectedFmrNumbers.length,
      orphanSuspiciousPublished: orphanSuspiciousPublished.length,
      patchCounts: patchCounts
    },
    affectedFmrNumbers: affectedFmrNumbers,
    repairCandidates: repairCandidates,
    alreadyCorrect: alreadyCorrect,
    manualReview: manualReview,
    orphanSuspiciousPublished: orphanSuspiciousPublished,
    patches: allPatches
  };
}

function sizeReconciliationSerializeCandidateFmrV3_(candidate) {
  return {
    candidateId: candidate.candidateId,
    issueId: candidate.issueId,
    importItemId: candidate.importItemId,
    importLineId: candidate.importLineId,
    fmrNumber: candidate.fmrNumber,
    fmrLineId: candidate.fmrLineId,
    lineNumber: candidate.lineNumber,
    commodityCode: candidate.commodityCode,
    materialDescription: candidate.materialDescription,
    evidenceSourceValue: candidate.evidenceSourceValue,
    evidenceRule: candidate.evidenceRule,
    expectedWrong: candidate.expectedWrong,
    correctedSize: candidate.correctedSize,
    layers: candidate.layers,
    patchCount: candidate.patches.length,
    patches: candidate.patches,
    blockingReasons: candidate.blockingReasons,
    status: candidate.status
  };
}

function previewSizeReconciliationFmrV3_(userEmail) {
  const started = Date.now();
  const plan = sizeReconciliationBuildPlanFmrV3_(userEmail);
  const max = FMR_V3_SIZE_RECONCILIATION.MAX_PREVIEW_CANDIDATES;

  return {
    generatedAt: plan.generatedAt,
    elapsedMs: Date.now() - started,
    owner: plan.owner,
    version: plan.version,
    fingerprint: plan.fingerprint,
    requiredConfirmation: plan.requiredConfirmation,
    backupPolicy: 'AUTOMATIC_PRE_APPLY_BACKUP',
    mutationPolicy: 'EVIDENCE_DRIVEN_NO_GLOBAL_FIND_REPLACE',
    summary: plan.summary,
    affectedFmrNumbers: plan.affectedFmrNumbers,
    repairCandidates: plan.repairCandidates
      .slice(0, max)
      .map(sizeReconciliationSerializeCandidateFmrV3_),
    alreadyCorrect: plan.alreadyCorrect
      .slice(0, max)
      .map(sizeReconciliationSerializeCandidateFmrV3_),
    manualReview: plan.manualReview
      .slice(0, max)
      .map(sizeReconciliationSerializeCandidateFmrV3_),
    orphanSuspiciousPublished: plan.orphanSuspiciousPublished.slice(0, max),
    truncated: {
      repairCandidates: plan.repairCandidates.length > max,
      alreadyCorrect: plan.alreadyCorrect.length > max,
      manualReview: plan.manualReview.length > max,
      orphanSuspiciousPublished: plan.orphanSuspiciousPublished.length > max
    }
  };
}

function sizeReconciliationColumnLetterFmrV3_(columnNumber) {
  let value = Number(columnNumber);
  let result = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }

  return result;
}

function sizeReconciliationHeaderMapFmrV3_(sheet) {
  const lastColumn = sheet.getLastColumn();
  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getDisplayValues()[0];
  const map = {};

  headers.forEach(function (header, index) {
    const key = normalizeFmrV3_(header);
    if (key) map[key] = index + 1;
  });

  return map;
}

function sizeReconciliationApplySheetPatchesFmrV3_(
  sheetName,
  patches,
  owner,
  appliedAt
) {
  const source = patches || [];
  if (!source.length) return 0;

  const sheet = sheetFmrV3_(sheetName);
  const headerMap = sizeReconciliationHeaderMapFmrV3_(sheet);
  const sizeColumn = headerMap.Size;

  if (!sizeColumn) {
    throw new Error(sheetName + ' does not contain a Size column.');
  }

  /**
   * Revalidate each target cell immediately before mutation. The plan was
   * rebuilt under ScriptLock, so any difference here is a hard stop.
   */
  source.forEach(function (patch) {
    const actual = normalizeFmrV3_(
      sheet.getRange(patch.rowNumber, sizeColumn).getDisplayValue()
    );

    if (actual !== normalizeFmrV3_(patch.before)) {
      throw new Error(
        sheetName + ' row ' + patch.rowNumber +
        ' changed after preview planning. Expected "' + patch.before +
        '", found "' + actual + '". No repair was applied to this pass.'
      );
    }
  });

  const byTarget = {};
  source.forEach(function (patch) {
    const target = normalizeFmrV3_(patch.after);
    if (!byTarget[target]) byTarget[target] = [];
    byTarget[target].push(patch.rowNumber);
  });

  const sizeColumnLetter = sizeReconciliationColumnLetterFmrV3_(sizeColumn);

  Object.keys(byTarget).forEach(function (target) {
    const addresses = byTarget[target].map(function (rowNumber) {
      return sizeColumnLetter + rowNumber;
    });

    const ranges = sheet.getRangeList(addresses).getRanges();
    ranges.forEach(function (range) {
      range.setNumberFormat('@');
      range.setValue(target);
    });
  });

  const changedRows = source.map(function (patch) {
    return patch.rowNumber;
  });

  if (headerMap.Updated_At) {
    const updatedAtLetter = sizeReconciliationColumnLetterFmrV3_(
      headerMap.Updated_At
    );
    sheet
      .getRangeList(changedRows.map(function (rowNumber) {
        return updatedAtLetter + rowNumber;
      }))
      .getRanges()
      .forEach(function (range) {
        range.setValue(appliedAt);
      });
  }

  if (headerMap.Updated_By) {
    const updatedByLetter = sizeReconciliationColumnLetterFmrV3_(
      headerMap.Updated_By
    );
    sheet
      .getRangeList(changedRows.map(function (rowNumber) {
        return updatedByLetter + rowNumber;
      }))
      .getRanges()
      .forEach(function (range) {
        range.setValue(owner.email);
      });
  }

  return source.length;
}

function sizeReconciliationAppendLogFmrV3_(
  reconciliationId,
  candidates,
  owner,
  appliedAt,
  backupId
) {
  const sheet = ensureSizeReconciliationLogFmrV3_();
  const headers = Array.from(FMR_V3_SIZE_RECONCILIATION.LOG_HEADERS);
  const rows = (candidates || []).map(function (candidate) {
    const bagBefore = (candidate.layers.bags || []).map(function (bag) {
      return {
        bagTagItemId: bag.bagTagItemId,
        rowNumber: bag.rowNumber,
        current: bag.current
      };
    });

    const patchedLayers = Array.from(new Set(
      candidate.patches.map(function (patch) {
        return patch.layer;
      })
    ));

    const record = {
      Reconciliation_ID: reconciliationId,
      Candidate_ID: candidate.candidateId,
      Issue_ID: candidate.issueId,
      Import_Item_ID: candidate.importItemId,
      Import_Line_ID: candidate.importLineId,
      FMR_Number: candidate.fmrNumber,
      FMR_Line_ID: candidate.fmrLineId,
      Line_Number: candidate.lineNumber,
      Commodity_Code: candidate.commodityCode,
      Material_Description: candidate.materialDescription,
      Evidence_Source_Value: candidate.evidenceSourceValue,
      Evidence_Rule: candidate.evidenceRule,
      Expected_Alpha30_3_Value: candidate.expectedWrong,
      Corrected_Size: candidate.correctedSize,
      Bulk_Before: candidate.layers.bulk && candidate.layers.bulk.current || '',
      Staging_Before: candidate.layers.staging && candidate.layers.staging.current || '',
      Published_Before: candidate.layers.published && candidate.layers.published.current || '',
      Bag_Before_JSON: JSON.stringify(bagBefore),
      Patched_Layers: patchedLayers.join(','),
      Status: 'APPLIED',
      Applied_By: owner.email,
      Applied_At: appliedAt,
      Backup_ID: backupId,
      Notes: (
        'Evidence-driven Alpha 30.4 Size reconciliation. ' +
        'Original Bulk_Import_Issues row retained.'
      )
    };

    return headers.map(function (header) {
      return Object.prototype.hasOwnProperty.call(record, header)
        ? record[header]
        : '';
    });
  });

  if (!rows.length) return 0;

  const startRow = Math.max(2, sheet.getLastRow() + 1);
  sheet
    .getRange(startRow, 1, rows.length, headers.length)
    .setValues(rows);

  return rows.length;
}

function applySizeReconciliationFmrV3_(userEmail, request) {
  const started = Date.now();
  const lock = LockService.getScriptLock();
  let backupId = '';
  let reconciliationId = '';
  let auditOwner = null;

  lock.waitLock(30000);

  try {
    const owner = assertOwnerFmrV3_(userEmail);
    auditOwner = owner;
    assertWriteEnabledFmrV3_('Historical Size reconciliation');

    const payload = request || {};
    const plan = sizeReconciliationBuildPlanFmrV3_(userEmail);

    if (!plan.repairCandidates.length) {
      return {
        success: true,
        noOp: true,
        generatedAt: formatDateTimeFmrV3_(nowFmrV3_()),
        elapsedMs: Date.now() - started,
        message: 'No evidence-backed Size repairs are currently required.',
        summary: plan.summary
      };
    }

    if (
      normalizeFmrV3_(payload.fingerprint) !==
      normalizeFmrV3_(plan.fingerprint)
    ) {
      throw new Error(
        'Size reconciliation preview is stale. Run Preview Size Repair again before applying.'
      );
    }

    if (
      normalizeUpperFmrV3_(payload.confirmation) !==
      normalizeUpperFmrV3_(plan.requiredConfirmation)
    ) {
      throw new Error(
        'Verification phrase must exactly match "' +
        plan.requiredConfirmation + '".'
      );
    }

    reconciliationId = uuidFmrV3_('SIZERECON');
    const appliedAt = nowFmrV3_();

    const backup = createDatabaseBackupFmrV3_(
      owner.email,
      'SIZE_RECONCILIATION',
      (
        'Pre-Size-reconciliation backup for ' + reconciliationId +
        '. Evidence-backed candidates: ' + plan.repairCandidates.length +
        '; cell patches: ' + plan.patches.length + '.'
      )
    );

    backupId = normalizeFmrV3_(
      backup && (backup.backupId || backup.Backup_ID)
    );

    /**
     * Alpha 30.3 introduced the global plain-text Size storage invariant.
     * Reassert it before writing corrected fractions so 3/4 cannot be
     * immediately coerced back into a date.
     */
    ensureFmrV3SizeTextStorageFmrV3_();

    const patchesBySheet = {};
    plan.patches.forEach(function (patch) {
      if (!patchesBySheet[patch.sheetName]) patchesBySheet[patch.sheetName] = [];
      patchesBySheet[patch.sheetName].push(patch);
    });

    const appliedPatchCounts = {};

    Object.keys(patchesBySheet).forEach(function (sheetName) {
      appliedPatchCounts[sheetName] = sizeReconciliationApplySheetPatchesFmrV3_(
        sheetName,
        patchesBySheet[sheetName],
        owner,
        appliedAt
      );
    });

    SpreadsheetApp.flush();

    const logRows = sizeReconciliationAppendLogFmrV3_(
      reconciliationId,
      plan.repairCandidates,
      owner,
      appliedAt,
      backupId
    );

    appendAuditFmrV3_(
      'SIZE_RECONCILIATION',
      reconciliationId,
      'HISTORICAL_SIZE_DATE_COERCION_REPAIRED',
      owner,
      reconciliationId,
      {
        sourceInterface: 'OWNER',
        payload: {
          version: FMR_V3_SIZE_RECONCILIATION.VERSION,
          fingerprint: plan.fingerprint,
          backupId: backupId,
          candidateCount: plan.repairCandidates.length,
          cellPatchCount: plan.patches.length,
          affectedFmrCount: plan.affectedFmrNumbers.length,
          affectedFmrNumbers: plan.affectedFmrNumbers,
          patchCounts: appliedPatchCounts,
          detailedLogSheet: FMR_V3_SIZE_RECONCILIATION.LOG_SHEET
        }
      }
    );

    SpreadsheetApp.flush();

    /**
     * Rebuild the plan from the now-current database. Evidence rows remain in
     * place, so successfully repaired candidates should move to ALREADY_CORRECT.
     */
    const post = sizeReconciliationBuildPlanFmrV3_(userEmail);

    if (post.repairCandidates.length) {
      throw new Error(
        'Size reconciliation applied but post-check still finds ' +
        post.repairCandidates.length +
        ' repairable candidate(s). Backup ' + backupId +
        ' exists; inspect ' + FMR_V3_SIZE_RECONCILIATION.LOG_SHEET +
        ' before retrying.'
      );
    }

    return {
      success: true,
      noOp: false,
      reconciliationId: reconciliationId,
      backupId: backupId,
      generatedAt: formatDateTimeFmrV3_(nowFmrV3_()),
      elapsedMs: Date.now() - started,
      repairedCandidates: plan.repairCandidates.length,
      cellPatches: plan.patches.length,
      affectedFmrCount: plan.affectedFmrNumbers.length,
      affectedFmrNumbers: plan.affectedFmrNumbers,
      patchCounts: appliedPatchCounts,
      logRows: logRows,
      postCheck: post.summary
    };
  } catch (error) {
    /**
     * If a failure occurs after the safety backup is created, preserve a
     * durable audit pointer to that backup. Do not attempt an automatic
     * rollback inside the same execution: the backup is the recovery source
     * and partial-state diagnosis should remain explicit.
     */
    if (backupId && auditOwner) {
      try {
        appendAuditFmrV3_(
          'SIZE_RECONCILIATION',
          reconciliationId || 'FAILED',
          'HISTORICAL_SIZE_RECONCILIATION_FAILED',
          auditOwner,
          reconciliationId || backupId,
          {
            sourceInterface: 'OWNER',
            payload: {
              version: FMR_V3_SIZE_RECONCILIATION.VERSION,
              backupId: backupId,
              error: normalizeFmrV3_(error && error.message || error)
            }
          }
        );
      } catch (auditError) {
        // Never hide the original reconciliation failure because audit logging
        // also failed. The backup ID remains included in the thrown message.
      }
    }

    const message = normalizeFmrV3_(error && error.message || error);
    throw new Error(
      message +
      (backupId ? (' Backup created before mutation: ' + backupId + '.') : '')
    );
  } finally {
    lock.releaseLock();
  }
}

/* Public library API */
function previewFmrV3HistoricalSizeReconciliation(databaseId, userEmail) {
  setFmrV3DatabaseContext_(databaseId);
  return previewSizeReconciliationFmrV3_(userEmail);
}

function applyFmrV3HistoricalSizeReconciliation(databaseId, userEmail, request) {
  setFmrV3DatabaseContext_(databaseId);
  return applySizeReconciliationFmrV3_(userEmail, request || {});
}
