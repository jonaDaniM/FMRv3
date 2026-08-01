const FMR_V3_DATABASE_ID =
  '1nDEsty3PTVppEPAkKpN9RVXCl_P0pgQALyGPficjz68';

function callerEmailFmrV3_() {
  const email =
    Session
      .getActiveUser()
      .getEmail();

  if (!email) {
    throw new Error(
      'Authenticated Google account email is unavailable.'
    );
  }

  return email;
}

function getPortalBootstrapV3() {
  return FMRCoreV3.getFmrV3Bootstrap(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_()
  );
}

function searchPortalV3(
  query,
  mode
) {
  return FMRCoreV3.searchFmrV3(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    query,
    mode || 'AUTO'
  );
}

function performFieldActionV3(
  request
) {
  return FMRCoreV3.performFmrV3FieldAction(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    request || {}
  );
}

function getAdminDashboardV3() {
  return FMRCoreV3.getFmrV3AdminDashboard(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_()
  );
}

function getAdminFmrRegisterV3(
  request
) {
  return FMRCoreV3.getFmrV3AdminRegister(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    request || {}
  );
}

function getAdminActiveBagsV3(
  request
) {
  return FMRCoreV3.getFmrV3AdminActiveBags(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    request || {}
  );
}

function reviewBackorderV3(
  request
) {
  return FMRCoreV3.reviewFmrV3Backorder(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    request || {}
  );
}

function saveStagingV3(
  payload
) {
  return FMRCoreV3.saveFmrV3Staging(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    payload || {}
  );
}

function getStagingListV3(
  maximumRows
) {
  return FMRCoreV3.getFmrV3StagingList(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    maximumRows || 100
  );
}

function getStagedFmrV3(
  stagingFmrId
) {
  return FMRCoreV3.getFmrV3StagedFmr(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    stagingFmrId
  );
}

function publishStagedFmrV3(
  stagingFmrId
) {
  return FMRCoreV3.publishFmrV3StagedFmr(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    stagingFmrId
  );
}

function renumberPublishedFmrV3(
  fmrId,
  newFmrNumber,
  reason
) {
  return FMRCoreV3.renumberFmrV3(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    fmrId,
    newFmrNumber,
    reason
  );
}

function renumberPublishedFmrByNumberV3(
  currentFmrNumber,
  newFmrNumber,
  reason
) {
  return FMRCoreV3.renumberFmrV3ByNumber(
    FMR_V3_DATABASE_ID,
    callerEmailFmrV3_(),
    currentFmrNumber,
    newFmrNumber,
    reason
  );
}

function verifyBoundFmrV3Connection() {
  const result =
    getPortalBootstrapV3();

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

/**
 * Returns true when a Core version belongs to
 * the 3.0.0 alpha series and meets or exceeds
 * the required alpha release.
 */
function isCompatibleFmrV3Alpha_(
  version,
  minimumAlpha
) {
  const match =
    /^3\.0\.0-alpha\.(\d+)$/
      .exec(
        String(
          version || ''
        ).trim()
      );

  return (
    Boolean(match) &&
    Number(match[1]) >=
      Number(
        minimumAlpha || 0
      )
  );
}

function verifyBoundAdminActiveBagsV3() {
  const started =
    Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const result =
    getAdminActiveBagsV3({
      query: '',
      readiness: 'ALL',
      sortOrder: 'OLDEST_FIRST',
      page: 1,
      pageSize: 10
    });

  const firstRecord =
    result.records &&
    result.records.length
      ? result.records[0]
      : null;

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        3
      ) &&
      Boolean(result) &&
      Boolean(result.summary) &&
      Boolean(result.pagination) &&
      Array.isArray(
        result.records
      ) &&
      result.summary.activeTags === 1 &&
      result.records.length === 1 &&
      Boolean(firstRecord) &&
      firstRecord.tagNumber ===
        'BT-2026-00001',

    readOnly: true,

    elapsedMs:
      Date.now() - started,

    coreVersion:
      coreVersion,

    activeTags:
      result.summary.activeTags,

    activeItems:
      result.summary.activeItems,

    returnedRecords:
      result.records.length,

    firstTag:
      firstRecord
        ? firstRecord.tagNumber
        : '',

    firstReadiness:
      firstRecord
        ? firstRecord.readiness
        : '',

    authenticatedUser:
      result.user
        ? result.user.email
        : ''
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
      'Bound Admin Active Bag integration diagnostic failed.'
    );
  }

  return output;
}

function verifyBoundAdminOperationalRailV3() {
  const started =
    Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const result =
    getAdminDashboardV3();

  const rail =
    result.operationalRail;

  const activeBags =
    rail.activeBags;

  const backorders =
    rail.backorders;

  const firstActiveBag =
    activeBags.records.length
      ? activeBags.records[0]
      : null;

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        4
      ) &&
      Boolean(result.kpis) &&
      Array.isArray(
        backorders.requests
      ) &&
      Array.isArray(
        activeBags.records
      ) &&
      activeBags.summary.activeTags === 1 &&
      activeBags.records.length === 1 &&
      Boolean(firstActiveBag) &&
      firstActiveBag.tagNumber ===
        'BT-2026-00001',

    readOnly: true,

    elapsedMs:
      Date.now() - started,

    coreVersion:
      coreVersion,

    backorderCount:
      backorders.count,

    activeTags:
      activeBags.summary.activeTags,

    activeItems:
      activeBags.summary.activeItems,

    returnedActiveBags:
      activeBags.records.length,

    firstTag:
      firstActiveBag
        ? firstActiveBag.tagNumber
        : '',

    firstReadiness:
      firstActiveBag
        ? firstActiveBag.readiness
        : '',

    authenticatedUser:
      result.user
        ? result.user.email
        : ''
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
      'Bound Admin operational-rail integration failed.'
    );
  }

  return output;
}

function verifyBoundFieldWorkflowContractV3() {
  const started =
    Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const result =
    searchPortalV3(
      'V3-ACCEPT-0001',
      'FMR'
    );

  const materials =
    (result.cards || [])
      .reduce(
        function (
          all,
          card
        ) {
          return all.concat(
            card.materials || []
          );
        },
        []
      );

  const missingWorkflow =
    materials.filter(
      function (
        material
      ) {
        return (
          !material.workflow ||
          !Array.isArray(
            material
              .workflow
              .actions
          )
        );
      }
    );

  const invalidActions = [];

  materials.forEach(
    function (
      material
    ) {
      const actions =
        material.workflow &&
        Array.isArray(
          material
            .workflow
            .actions
        )
          ? material
              .workflow
              .actions
          : [];

      actions.forEach(
        function (
          action
        ) {
          if (
            !action.action ||
            !action.label ||
            !action.group ||
            !Array.isArray(
              action.requiredFields
            ) ||
            !Array.isArray(
              action.optionalFields
            ) ||
            Number(
              action.maxQuantity ||
              0
            ) <= 0
          ) {
            invalidActions.push({
              fmrLineId:
                material.fmrLineId,

              action:
                action.action || ''
            });
          }
        }
      );
    }
  );

  const materialWithBag =
    materials.find(
      function (
        material
      ) {
        return (
          Array.isArray(
            material.activeBags
          ) &&
          material
            .activeBags
            .length > 0
        );
      }
    );

  const issueFromBagAction =
    materialWithBag &&
    materialWithBag.workflow
      ? materialWithBag
          .workflow
          .actions
          .find(
            function (
              action
            ) {
              return (
                action.action ===
                'ISSUE_FROM_BAG'
              );
            }
          )
      : null;

  const firstBagSource =
    issueFromBagAction &&
    Array.isArray(
      issueFromBagAction
        .sources
    ) &&
    issueFromBagAction
      .sources
      .length
      ? issueFromBagAction
          .sources[0]
      : null;

  const requiredFields =
    issueFromBagAction
      ? issueFromBagAction
          .requiredFields || []
      : [];

  const requiredFieldContract =
    [
      'quantity',
      'bagTagId',
      'issuedToName',
      'performedByName'
    ].every(
      function (
        fieldName
      ) {
        return requiredFields.includes(
          fieldName
        );
      }
    );

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        5
      ) &&
      result.resultCount > 0 &&
      materials.length > 0 &&
      missingWorkflow.length === 0 &&
      invalidActions.length === 0 &&
      Boolean(
        materialWithBag
      ) &&
      Boolean(
        issueFromBagAction
      ) &&
      Boolean(
        firstBagSource
      ) &&
      requiredFieldContract,

    readOnly: true,

    elapsedMs:
      Date.now() - started,

    coreVersion:
      coreVersion,

    authenticatedUser:
      result.user
        ? result.user.email
        : '',

    resultCount:
      result.resultCount,

    materialLineCount:
      materials.length,

    missingWorkflowCount:
      missingWorkflow.length,

    invalidActionCount:
      invalidActions.length,

    activeBagLine:
      materialWithBag
        ? materialWithBag
            .fmrLineId
        : '',

    firstBagTag:
      firstBagSource
        ? firstBagSource
            .tagNumber
        : '',

    issueFromBagMaximum:
      issueFromBagAction
        ? issueFromBagAction
            .maxQuantity
        : 0,

    issueFromBagRequiredFields:
      requiredFields
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
      'Bound Field workflow contract integration failed.'
    );
  }

  return output;
}

function verifyBoundFieldTransactionPreflightV3() {
  const started = Date.now();
  const coreVersion = FMRCoreV3.getFmrV3Version();
  const result = searchPortalV3(
    'V3-ACCEPT-0001',
    'FMR'
  );

  const materials = (result.cards || []).reduce(
    function (all, card) {
      return all.concat(card.materials || []);
    },
    []
  );

  const expectedActions = [
    'CONFIRM_AVAILABLE',
    'BAG',
    'DIRECT_ISSUE',
    'ISSUE_FROM_AVAILABLE',
    'ISSUE_FROM_BAG',
    'BACKORDER_REQUESTED'
  ];

  const coverage = {};
  expectedActions.forEach(function (action) {
    coverage[action] = [];
  });

  const lines = materials.map(function (material) {
    const workflow = material.workflow || {};
    const actions = Array.isArray(workflow.actions)
      ? workflow.actions
      : [];

    const actionSummaries = actions.map(function (action) {
      const sources = Array.isArray(action.sources)
        ? action.sources
        : [];

      const summary = {
        action: action.action,
        label: action.label,
        group: action.group,
        maximumQuantity: Number(
          action.maxQuantity || 0
        ),
        safeTestQuantity:
          Number(action.maxQuantity || 0) > 0
            ? Math.min(
                1,
                Number(action.maxQuantity || 0)
              )
            : 0,
        uom: action.uom || material.uom,
        quantityLimitScope:
          action.quantityLimitScope || 'LINE',
        requiredFields:
          action.requiredFields || [],
        optionalFields:
          action.optionalFields || [],
        helpText: action.helpText || '',
        sources: sources.map(function (source) {
          return {
            bagTagId: source.bagTagId || '',
            tagNumber: source.tagNumber || '',
            storageLocation:
              source.storageLocation || '',
            qtyRemaining: Number(
              source.qtyRemaining || 0
            ),
            uom: source.uom || '',
            status: source.status || ''
          };
        })
      };

      if (
        Object.prototype.hasOwnProperty.call(
          coverage,
          action.action
        )
      ) {
        coverage[action.action].push({
          fmrLineId: material.fmrLineId,
          commodityCode: material.commodityCode,
          isoKey: material.isoKey,
          maximumQuantity:
            summary.maximumQuantity,
          safeTestQuantity:
            summary.safeTestQuantity,
          uom: summary.uom,
          sourceTags: summary.sources.map(
            function (source) {
              return source.tagNumber;
            }
          )
        });
      }

      return summary;
    });

    return {
      fmrLineId: material.fmrLineId,
      lineNumber: material.lineNumber,
      isoKey: material.isoKey,
      commodityCode: material.commodityCode,
      size: material.size,
      description: material.description,
      uom: material.uom,
      quantities: {
        requested: Number(
          material.qtyRequested || 0
        ),
        confirmedLocated: Number(
          material.qtyConfirmedLocated || 0
        ),
        activeBagged: Number(
          material.qtyActiveBagged || 0
        ),
        available: Number(
          material.qtyAvailable || 0
        ),
        issued: Number(
          material.qtyIssued || 0
        ),
        pendingBackorder: Number(
          material.qtyPendingBackorder || 0
        ),
        confirmedBackorder: Number(
          material.qtyConfirmedBackorder || 0
        ),
        notYetLocated: Number(
          material.qtyNotYetLocated || 0
        ),
        remaining: Number(
          material.qtyRemainingRequirement || 0
        )
      },
      lineStatus: material.lineStatus,
      storageLocation:
        material.storageLocation,
      workflowPhase: workflow.phase || '',
      workflowHeadline:
        workflow.headline || '',
      requiresFieldReview: Boolean(
        workflow.requiresFieldReview
      ),
      hasPendingAdminReview: Boolean(
        workflow.hasPendingAdminReview
      ),
      activeBagCount: Number(
        workflow.activeBagCount || 0
      ),
      availableActionCount:
        actionSummaries.length,
      actions: actionSummaries
    };
  });

  const actionCoverage = {};
  expectedActions.forEach(function (action) {
    actionCoverage[action] = {
      available: coverage[action].length > 0,
      candidateCount: coverage[action].length,
      candidates: coverage[action]
    };
  });

  const missingActions = expectedActions.filter(
    function (action) {
      return coverage[action].length === 0;
    }
  );

  const missingWorkflowCount =
    materials.filter(function (material) {
      return (
        !material.workflow ||
        !Array.isArray(
          material.workflow.actions
        )
      );
    }).length;

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        5
      ) &&
      result.resultCount === 1 &&
      materials.length > 0 &&
      missingWorkflowCount === 0,
    readOnly: true,
    destructive: false,
    elapsedMs: Date.now() - started,
    coreVersion: coreVersion,
    authenticatedUser:
      result.user
        ? result.user.email
        : '',
    fmrNumber:
      result.cards && result.cards.length
        ? result.cards[0].fmrNumber
        : '',
    resultCount: result.resultCount,
    materialLineCount: materials.length,
    missingWorkflowCount:
      missingWorkflowCount,
    readyForFullAcceptance:
      missingActions.length === 0,
    missingActions: missingActions,
    actionCoverage: actionCoverage,
    lines: lines
  };

  console.log(
    JSON.stringify(output, null, 2)
  );

  if (!output.passed) {
    throw new Error(
      'Bound Field transaction acceptance preflight failed.'
    );
  }

  return output;
}

function getBoundFieldAcceptanceSnapshotV3() {
  const started = Date.now();
  const result = searchPortalV3(
    'V3-ACCEPT-0001',
    'FMR'
  );

  const materials = (result.cards || []).reduce(
    function (all, card) {
      return all.concat(card.materials || []);
    },
    []
  );

  const output = {
    passed:
      result.resultCount === 1 &&
      materials.length > 0,
    readOnly: true,
    destructive: false,
    elapsedMs: Date.now() - started,
    coreVersion:
      FMRCoreV3.getFmrV3Version(),
    fmrNumber:
      result.cards && result.cards.length
        ? result.cards[0].fmrNumber
        : '',
    lines: materials.map(function (material) {
      return {
        fmrLineId: material.fmrLineId,
        commodityCode:
          material.commodityCode,
        lineStatus: material.lineStatus,
        requested: Number(
          material.qtyRequested || 0
        ),
        confirmedLocated: Number(
          material.qtyConfirmedLocated || 0
        ),
        activeBagged: Number(
          material.qtyActiveBagged || 0
        ),
        available: Number(
          material.qtyAvailable || 0
        ),
        issued: Number(
          material.qtyIssued || 0
        ),
        pendingBackorder: Number(
          material.qtyPendingBackorder || 0
        ),
        confirmedBackorder: Number(
          material.qtyConfirmedBackorder || 0
        ),
        notYetLocated: Number(
          material.qtyNotYetLocated || 0
        ),
        remaining: Number(
          material.qtyRemainingRequirement || 0
        ),
        activeTags:
          (material.activeBags || []).map(
            function (bag) {
              return {
                bagTagId: bag.bagTagId,
                tagNumber: bag.tagNumber,
                qtyRemaining: Number(
                  bag.qtyRemaining || 0
                ),
                status: bag.status
              };
            }
          ),
        workflowPhase:
          material.workflow
            ? material.workflow.phase
            : '',
        actions:
          material.workflow &&
          Array.isArray(
            material.workflow.actions
          )
            ? material.workflow.actions.map(
                function (action) {
                  return {
                    action: action.action,
                    maxQuantity: Number(
                      action.maxQuantity || 0
                    )
                  };
                }
              )
            : []
      };
    })
  };

  console.log(
    JSON.stringify(output, null, 2)
  );

  if (!output.passed) {
    throw new Error(
      'Bound Field acceptance snapshot failed.'
    );
  }

  return output;
}
