function parseCombinedIsoFmrV3_(value) {
  const input = normalizeUpperFmrV3_(value);
  let splitIndex = Math.max(
    input.lastIndexOf('|'),
    input.lastIndexOf('/')
  );

  if (splitIndex <= 0) {
    const match = input.match(
      /^(.*?)[\s]+(?:SHT|SHEET)[\s:#-]*([A-Z0-9._-]+)$/
    );

    if (match) {
      return {
        isoNumber: normalizeUpperFmrV3_(match[1]),
        isoSheet: normalizeUpperFmrV3_(match[2])
      };
    }

    throw new Error(
      'Combined ISO search must include a sheet, such as FG-70912_001|3.'
    );
  }

  const isoNumber = normalizeUpperFmrV3_(input.slice(0, splitIndex));
  const isoSheet = normalizeUpperFmrV3_(input.slice(splitIndex + 1));

  if (!isoNumber || !isoSheet) {
    throw new Error('Both ISO Number and ISO Sheet are required.');
  }

  return {isoNumber: isoNumber, isoSheet: isoSheet};
}

function normalizeSearchRequestFmrV3_(query, mode) {
  const raw = normalizeFmrV3_(query);
  if (!raw) {
    throw new Error('Enter an FMR number or a combined ISO and sheet.');
  }

  const normalizedMode = normalizeUpperFmrV3_(mode || 'AUTO');
  const upper = normalizeUpperFmrV3_(raw);

  if (normalizedMode === 'FMR' || upper.indexOf('FMR:') === 0) {
    return [fmrSearchKeyFmrV3_(upper.replace(/^FMR:/, ''))];
  }

  if (normalizedMode === 'ISO' || upper.indexOf('ISO:') === 0) {
    const parsed = parseCombinedIsoFmrV3_(upper.replace(/^ISO:/, ''));
    return [isoSearchKeyFmrV3_(parsed.isoNumber, parsed.isoSheet)];
  }

  const candidates = [fmrSearchKeyFmrV3_(upper)];

  try {
    const parsed = parseCombinedIsoFmrV3_(upper);
    candidates.push(isoSearchKeyFmrV3_(parsed.isoNumber, parsed.isoSheet));
  } catch (ignored) {}

  return Array.from(new Set(candidates));
}

function serializeHeaderTotalsFmrV3_(header) {
  return {
    requested: numberFmrV3_(header.Qty_Requested),
    located: numberFmrV3_(header.Qty_Confirmed_Located),
    bagged: numberFmrV3_(header.Qty_Active_Bagged),
    available: numberFmrV3_(header.Qty_Available),
    issued: numberFmrV3_(header.Qty_Issued),
    pendingBackorder: numberFmrV3_(header.Qty_Pending_Backorder),
    confirmedBackorder: numberFmrV3_(header.Qty_Confirmed_Backorder),
    remaining: numberFmrV3_(header.Qty_Remaining_Requirement),
    fulfillmentPct: numberFmrV3_(header.Fulfillment_Pct)
  };
}
function fieldActionDescriptorFmrV3_(
  action,
  label,
  group,
  maximumQuantity,
  uom,
  requiredFields,
  optionalFields,
  helpText,
  sources
) {
  return {
    action: normalizeUpperFmrV3_(
      action
    ),

    label: normalizeFmrV3_(
      label
    ),

    group: normalizeUpperFmrV3_(
      group
    ),

    maxQuantity: Math.max(
      0,
      numberFmrV3_(
        maximumQuantity
      )
    ),

    uom: normalizeFmrV3_(
      uom
    ),

    requiredFields:
      requiredFields || [],

    optionalFields:
      optionalFields || [],

    helpText: normalizeFmrV3_(
      helpText
    ),

    quantityLimitScope:
      sources && sources.length
        ? 'SELECTED_BAG'
        : 'LINE',

    sources:
      sources || []
  };
}

function buildFieldWorkflowFmrV3_(
  line,
  actionLimits,
  activeBags,
  returnedBackorders
) {
  const limits =
    actionLimits || {};

  const bags =
    (activeBags || [])
      .filter(
        function (
          bag
        ) {
          return (
            numberFmrV3_(
              bag.qtyRemaining
            ) > 0
          );
        }
      );

  const returned =
    returnedBackorders || [];

  const actions = [];

  if (bags.length) {
    const bagSources =
      bags.map(
        function (
          bag
        ) {
          return {
            bagTagId:
              normalizeFmrV3_(
                bag.bagTagId
              ),

            tagNumber:
              normalizeFmrV3_(
                bag.tagNumber
              ),

            storageLocation:
              normalizeFmrV3_(
                bag.storageLocation
              ),

            qtyRemaining:
              numberFmrV3_(
                bag.qtyRemaining
              ),

            uom:
              normalizeFmrV3_(
                bag.uom
              ),

            status:
              normalizeFmrV3_(
                bag.status
              )
          };
        }
      );

    const totalBagRemaining =
      bagSources.reduce(
        function (
          total,
          bag
        ) {
          return (
            total +
            numberFmrV3_(
              bag.qtyRemaining
            )
          );
        },
        0
      );

    actions.push(
      fieldActionDescriptorFmrV3_(
        FMR_V3.ACTIONS
          .ISSUE_FROM_BAG,
        'Issue From Bag',
        'ISSUE',
        totalBagRemaining,
        line.UOM,
        [
          'quantity',
          'bagTagId',
          'issuedToName',
          'performedByName'
        ],
        [
          'notes'
        ],
        'Issue material already reserved under an active Bag & Tag.',
        bagSources
      )
    );
  }

  if (
    numberFmrV3_(
      limits.issueAvailable
    ) > 0
  ) {
    actions.push(
      fieldActionDescriptorFmrV3_(
        FMR_V3.ACTIONS
          .ISSUE_FROM_AVAILABLE,
        'Issue Available',
        'ISSUE',
        limits.issueAvailable,
        line.UOM,
        [
          'quantity',
          'issuedToName',
          'performedByName'
        ],
        [
          'notes'
        ],
        'Issue material that has already been located and is currently available.'
      )
    );
  }

  if (
    numberFmrV3_(
      limits.directIssue
    ) > 0
  ) {
    actions.push(
      fieldActionDescriptorFmrV3_(
        FMR_V3.ACTIONS
          .DIRECT_ISSUE,
        'Locate & Issue',
        'ISSUE',
        limits.directIssue,
        line.UOM,
        [
          'quantity',
          'issuedToName',
          'performedByName'
        ],
        [
          'storageLocation',
          'notes'
        ],
        'Record material as located and issue it directly to the recipient.'
      )
    );
  }

  if (
    numberFmrV3_(
      limits.bag
    ) > 0
  ) {
    actions.push(
      fieldActionDescriptorFmrV3_(
        FMR_V3.ACTIONS.BAG,
        'Bag & Tag',
        'RESERVE',
        limits.bag,
        line.UOM,
        [
          'quantity',
          'storageLocation',
          'performedByName'
        ],
        [
          'notes'
        ],
        'Reserve located material, or locate and reserve it in one controlled transaction.'
      )
    );
  }

  if (
    numberFmrV3_(
      limits.confirmAvailable
    ) > 0
  ) {
    actions.push(
      fieldActionDescriptorFmrV3_(
        FMR_V3.ACTIONS
          .CONFIRM_AVAILABLE,
        'Confirm Available',
        'LOCATE',
        limits.confirmAvailable,
        line.UOM,
        [
          'quantity',
          'storageLocation',
          'performedByName'
        ],
        [
          'notes'
        ],
        'Record material as physically located at a specific storage location.'
      )
    );
  }

  if (
    numberFmrV3_(
      limits.backorder
    ) > 0
  ) {
    actions.push(
      fieldActionDescriptorFmrV3_(
        FMR_V3.ACTIONS
          .BACKORDER_REQUESTED,
        'Submit Backorder',
        'EXCEPTION',
        limits.backorder,
        line.UOM,
        [
          'quantity',
          'reason',
          'performedByName'
        ],
        [
          'notes'
        ],
        'Submit the unresolved quantity for Admin review. Field users do not confirm backorders.'
      )
    );
  }

  const remaining =
    numberFmrV3_(
      line.Qty_Remaining_Requirement
    );

  const available =
    numberFmrV3_(
      line.Qty_Available
    );

  const pendingBackorder =
    numberFmrV3_(
      line.Qty_Pending_Backorder
    );

  let phase =
    'NO_ACTION';

  let headline =
    'No Field action is currently available.';

  if (
    remaining <= 0
  ) {
    phase =
      'COMPLETE';

    headline =
      'The requested requirement is complete.';
  } else if (
    returned.length
  ) {
    phase =
      'FIELD_REVIEW_REQUIRED';

    headline =
      'Admin returned a backorder request for Field review.';
  } else if (
    bags.length
  ) {
    phase =
      'ISSUE_RESERVED';

    headline =
      'Reserved material is ready to issue from an active Bag & Tag.';
  } else if (
    available > 0
  ) {
    phase =
      'ISSUE_OR_RESERVE_AVAILABLE';

    headline =
      'Located material is available to issue or reserve.';
  } else if (
    actions.length > 0
  ) {
    phase =
      'LOCATE_OR_EXCEPTION';

    headline =
      'Material still needs to be located, reserved, issued, or submitted for review.';
  } else if (
    pendingBackorder > 0
  ) {
    phase =
      'AWAITING_ADMIN_REVIEW';

    headline =
      'A backorder request is awaiting Admin review.';
  }

  return {
    phase:
      phase,

    headline:
      headline,

    isComplete:
      remaining <= 0,

    requiresFieldReview:
      returned.length > 0,

    returnedReviewCount:
      returned.length,

    hasPendingAdminReview:
      pendingBackorder > 0,

    activeBagCount:
      bags.length,

    availableActionCount:
      actions.length,

    actions:
      actions
  };
}

function serializeLineForPortalFmrV3_(
  line,
  activeBags,
  returnedBackorders,
  backorderNotices
) {
  const state =
    lineStateFmrV3_(
      line
    );

  const bags =
    activeBags || [];

  const returned =
    returnedBackorders || [];

  const notices =
    backorderNotices || [];

  const actionLimits =
    fieldActionLimitsFromStateFmrV3_(
      state
    );

  return {
    fmrLineId:
      normalizeFmrV3_(
        line.FMR_Line_ID
      ),

    lineNumber:
      numberFmrV3_(
        line.Line_Number
      ),

    isoNumber:
      normalizeFmrV3_(
        line.ISO_Number
      ),

    isoSheet:
      normalizeFmrV3_(
        line.ISO_Sheet
      ),

    isoKey:
      normalizeFmrV3_(
        line.ISO_Key
      ),

    commodityCode:
      normalizeFmrV3_(
        line.Commodity_Code
      ),

    size:
      normalizeFmrV3_(
        line.Size
      ),

    description:
      normalizeFmrV3_(
        line.Material_Description
      ),

    uom:
      normalizeFmrV3_(
        line.UOM
      ),

    qtyRequested:
      state.requested,

    qtyConfirmedLocated:
      state.confirmed,

    qtyActiveBagged:
      state.bagged,

    qtyAvailable:
      state.available,

    qtyIssued:
      state.issued,

    qtyPendingBackorder:
      state.pendingBackorder,

    qtyConfirmedBackorder:
      state.confirmedBackorder,

    qtyNotYetLocated:
      state.notYetLocated,

    qtyRemainingRequirement:
      state.remaining,

    lineStatus:
      normalizeFmrV3_(
        line.Line_Status
      ),

    storageLocation:
      normalizeFmrV3_(
        line.Storage_Location
      ),

    actionLimits:
      actionLimits,

    activeBags:
      bags,

    returnedBackorders:
      returned,

    backorderNotices:
      notices,

    hasBackorderNotice:
      notices.length > 0,

    hasActionRequiredNotice:
      notices.some(
        function (
          notice
        ) {
          return Boolean(
            notice.actionRequired
          );
        }
      ),

    workflow:
      buildFieldWorkflowFmrV3_(
        line,
        actionLimits,
        bags,
        returned
      )
  };
}

function searchPublishedFmrV3_(
  userEmail,
  query,
  mode
) {
  const performanceStartedAt =
    Date.now();

  let phaseStartedAt =
    performanceStartedAt;

  const timings = {};

  const user =
    assertSearchUserFmrV3_(
      userEmail
    );

  timings.authorizationMs =
    Date.now() -
    phaseStartedAt;

  phaseStartedAt =
    Date.now();

  const keys =
    normalizeSearchRequestFmrV3_(
      query,
      mode
    );

  timings.normalizeSearchMs =
    Date.now() -
    phaseStartedAt;

  phaseStartedAt =
    Date.now();

  let entries = [];

  keys.some(
    function (
      key
    ) {
      const found =
        lookupIndexEntriesFmrV3_(
          FMR_V3.SHEETS
            .SEARCH_INDEX,
          key
        );

      if (
        found.length
      ) {
        entries =
          found;

        return true;
      }

      return false;
    }
  );

  timings.searchIndexLookupMs =
    Date.now() -
    phaseStartedAt;

  if (
    !entries.length
  ) {
    timings.totalMs =
      Date.now() -
      performanceStartedAt;

    logPerformanceAlpha30_5_8FmrV3_(
      'FIELD_SEARCH',
      {
        queryMode:
          normalizeUpperFmrV3_(
            mode ||
            'AUTO'
          ),

        keyCount:
          keys.length,

        entryCount:
          0,

        lineCount:
          0,

        headerCount:
          0,

        cardCount:
          0,

        batchedReadsEnabled:
          Boolean(
            FMR_V3_ALPHA30_5_8_PERFORMANCE
              .USE_BATCHED_FIELD_SEARCH_READS
          ),

        combinedOperationalLookup:
          true,

        targetedNoticeLookup:
          true,

        timings:
          timings
      }
    );

    return {
      generatedAt:
        formatDateTimeFmrV3_(
          nowFmrV3_()
        ),

      user:
        user,

      query:
        normalizeFmrV3_(
          query
        ),

      resultCount:
        0,

      cards:
        []
    };
  }

  phaseStartedAt =
    Date.now();

  const lineRows =
    entries.map(
      function (
        entry
      ) {
        return entry.Line_Row;
      }
    );

  const lines =
    (
      FMR_V3_ALPHA30_5_8_PERFORMANCE
        .USE_BATCHED_FIELD_SEARCH_READS
        ? readRowsObjectsBatchedFmrV3_(
            FMR_V3.SHEETS.LINES,
            lineRows,
            {
              maxGapRows:
                12,

              maxGroups:
                20
            }
          )
        : readRowsObjectsFmrV3_(
            FMR_V3.SHEETS.LINES,
            lineRows
          )
    ).filter(
      function (
        line
      ) {
        return yesFmrV3_(
          line.Active
        );
      }
    );

  timings.lineReadMs =
    Date.now() -
    phaseStartedAt;

  phaseStartedAt =
    Date.now();

  const headerRows =
    entries.map(
      function (
        entry
      ) {
        return entry.Header_Row;
      }
    );

  const headers =
    (
      FMR_V3_ALPHA30_5_8_PERFORMANCE
        .USE_BATCHED_FIELD_SEARCH_READS
        ? readRowsObjectsBatchedFmrV3_(
            FMR_V3.SHEETS.HEADERS,
            headerRows,
            {
              maxGapRows:
                4,

              maxGroups:
                20
            }
          )
        : readRowsObjectsFmrV3_(
            FMR_V3.SHEETS.HEADERS,
            headerRows
          )
    ).filter(
      function (
        header
      ) {
        return yesFmrV3_(
          header.Active
        );
      }
    );

  timings.headerReadMs =
    Date.now() -
    phaseStartedAt;

  const headersById = {};

  headers.forEach(
    function (
      header
    ) {
      headersById[
        normalizeFmrV3_(
          header.FMR_ID
        )
      ] =
        header;
    }
  );

  const lineIds =
    lines.map(
      function (
        line
      ) {
        return normalizeFmrV3_(
          line.FMR_Line_ID
        );
      }
    );

  phaseStartedAt =
    Date.now();

  const operationalEntries =
    resolveFieldOperationalEntriesAlpha30_5_9FmrV3_(
      lineIds
    );

  timings.operationalIndexEnrichmentLookupMs =
    Date.now() -
    phaseStartedAt;

  phaseStartedAt =
    Date.now();

  const bagsByLine =
    getActiveBagsByLineIdsFmrV3_(
      lineIds,
      operationalEntries
        .bagEntriesByLine
    );

  timings.activeBagReadMs =
    Date.now() -
    phaseStartedAt;

  phaseStartedAt =
    Date.now();

  const returnedByLine =
    getReturnedBackordersByLineIdsFmrV3_(
      lineIds,
      operationalEntries
        .backorderEntriesByLine
    );

  timings.returnedBackorderReadMs =
    Date.now() -
    phaseStartedAt;

  phaseStartedAt =
    Date.now();

  const noticesByLine =
    getFieldBackorderNoticesByLineIdsFmrV3_(
      lineIds
    );

  timings.backorderNoticeReadMs =
    Date.now() -
    phaseStartedAt;

  phaseStartedAt =
    Date.now();

  const grouped = {};

  lines.forEach(
    function (
      line
    ) {
      const fmrId =
        normalizeFmrV3_(
          line.FMR_ID
        );

      const header =
        headersById[
          fmrId
        ];

      if (!header) {
        return;
      }

      if (
        !grouped[
          fmrId
        ]
      ) {
        grouped[
          fmrId
        ] = {
          fmrId:
            fmrId,

          fmrNumber:
            normalizeFmrV3_(
              header.FMR_Number
            ),

          iwpNumber:
            normalizeFmrV3_(
              header.IWP_Number
            ),

          requestedBy:
            normalizeFmrV3_(
              header.Requested_By
            ),

          dateRequired:
            formatDateTimeFmrV3_(
              header.Date_Required
            ),

          priority:
            normalizeFmrV3_(
              header.Priority
            ),

          status:
            normalizeFmrV3_(
              header.Current_Status
            ),

          notes:
            normalizeFmrV3_(
              header.Notes
            ),

          totals:
            serializeHeaderTotalsFmrV3_(
              header
            ),

          materials:
            []
        };
      }

      const lineId =
        normalizeFmrV3_(
          line.FMR_Line_ID
        );

      grouped[
        fmrId
      ].materials.push(
        serializeLineForPortalFmrV3_(
          line,
          bagsByLine[
            lineId
          ] || [],
          returnedByLine[
            lineId
          ] || [],
          noticesByLine[
            lineId
          ] || []
        )
      );
    }
  );

  const cards =
    Object.values(
      grouped
    ).sort(
      function (
        left,
        right
      ) {
        return left
          .fmrNumber
          .localeCompare(
            right.fmrNumber,
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

  timings.groupAndSerializeMs =
    Date.now() -
    phaseStartedAt;

  timings.totalMs =
    Date.now() -
    performanceStartedAt;

  logPerformanceAlpha30_5_8FmrV3_(
    'FIELD_SEARCH',
    {
      queryMode:
        normalizeUpperFmrV3_(
          mode ||
          'AUTO'
        ),

      keyCount:
        keys.length,

      entryCount:
        entries.length,

      lineCount:
        lines.length,

      headerCount:
        headers.length,

      cardCount:
        cards.length,

      operationalKeyCount:
        numberFmrV3_(
          operationalEntries
            .requestedKeyCount
        ),

      batchedReadsEnabled:
        Boolean(
          FMR_V3_ALPHA30_5_8_PERFORMANCE
            .USE_BATCHED_FIELD_SEARCH_READS
        ),

      combinedOperationalLookup:
        true,

      targetedNoticeLookup:
        true,

      timings:
        timings
    }
  );

  return {
    generatedAt:
      formatDateTimeFmrV3_(
        nowFmrV3_()
      ),

    user:
      user,

    query:
      normalizeFmrV3_(
        query
      ),

    resultCount:
      cards.length,

    cards:
      cards
  };
}
