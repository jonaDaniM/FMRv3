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


function validBoundActiveBagRecordV3_(
  record
) {
  const source =
    record || {};

  const readiness =
    String(
      source.readiness || ''
    ).trim();

  const status =
    String(
      source.status || ''
    ).trim()
      .toUpperCase();

  const bagged =
    Number(
      source.qtyBagged || 0
    );

  const issued =
    Number(
      source.qtyIssued || 0
    );

  const remaining =
    Number(
      source.qtyRemaining || 0
    );

  return (
    Boolean(
      source.bagTagId
    ) &&
    Boolean(
      source.bagTagItemId
    ) &&
    Boolean(
      source.tagNumber
    ) &&
    Boolean(
      source.fmrNumber
    ) &&
    Boolean(
      source.fmrLineId
    ) &&
    Boolean(
      source.commodityCode
    ) &&
    Boolean(
      source.materialDescription
    ) &&
    Number.isFinite(
      bagged
    ) &&
    Number.isFinite(
      issued
    ) &&
    Number.isFinite(
      remaining
    ) &&
    bagged > 0 &&
    issued >= 0 &&
    remaining > 0 &&
    Math.abs(
      bagged -
      issued -
      remaining
    ) < 0.000001 &&
    [
      'READY_FOR_FIELD',
      'PARTIALLY_ISSUED'
    ].includes(
      readiness
    ) &&
    [
      'ACTIVE',
      'PARTIALLY ISSUED'
    ].includes(
      status
    )
  );
}

function uniqueBoundActiveBagRecordsV3_(
  records
) {
  const seen = {};

  return (
    (records || [])
      .every(
        function (
          record
        ) {
          const key =
            String(
              record.bagTagId || ''
            ) +
            '|' +
            String(
              record.bagTagItemId || ''
            );

          if (
            !key ||
            key === '|' ||
            seen[key]
          ) {
            return false;
          }

          seen[key] =
            true;

          return true;
        }
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
      pageSize: 50
    });

  const summary =
    result &&
    result.summary
      ? result.summary
      : {};

  const pagination =
    result &&
    result.pagination
      ? result.pagination
      : {};

  const records =
    result &&
    Array.isArray(
      result.records
    )
      ? result.records
      : [];

  const expectedReturned =
    Math.min(
      Number(
        pagination.pageSize || 0
      ),
      Number(
        pagination.totalRecords || 0
      )
    );

  const recordsValid =
    records.every(
      validBoundActiveBagRecordV3_
    );

  const recordsUnique =
    uniqueBoundActiveBagRecordsV3_(
      records
    );

  const firstRecord =
    records.length
      ? records[0]
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
      Number(
        summary.activeTags || 0
      ) >= 1 &&
      Number(
        summary.activeItems || 0
      ) >=
        Number(
          summary.activeTags || 0
        ) &&
      Number(
        summary.matchingItems || 0
      ) ===
        Number(
          pagination.totalRecords || 0
        ) &&
      records.length ===
        expectedReturned &&
      records.length > 0 &&
      recordsValid &&
      recordsUnique,

    readOnly: true,

    elapsedMs:
      Date.now() - started,

    coreVersion:
      coreVersion,

    activeTags:
      Number(
        summary.activeTags || 0
      ),

    activeItems:
      Number(
        summary.activeItems || 0
      ),

    matchingItems:
      Number(
        summary.matchingItems || 0
      ),

    returnedRecords:
      records.length,

    recordsValid:
      recordsValid,

    recordsUnique:
      recordsUnique,

    firstTag:
      firstRecord
        ? firstRecord.tagNumber
        : '',

    firstReadiness:
      firstRecord
        ? firstRecord.readiness
        : '',

    firstRemaining:
      firstRecord
        ? Number(
            firstRecord.qtyRemaining ||
            0
          )
        : 0,

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
    result &&
    result.operationalRail
      ? result.operationalRail
      : {};

  const activeBags =
    rail.activeBags || {};

  const backorders =
    rail.backorders || {};

  const records =
    Array.isArray(
      activeBags.records
    )
      ? activeBags.records
      : [];

  const recordsValid =
    records.every(
      validBoundActiveBagRecordV3_
    );

  const recordsUnique =
    uniqueBoundActiveBagRecordsV3_(
      records
    );

  const firstActiveBag =
    records.length
      ? records[0]
      : null;

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        4
      ) &&
      Boolean(result) &&
      Boolean(result.kpis) &&
      Boolean(
        result.operationalRail
      ) &&
      Array.isArray(
        backorders.requests
      ) &&
      Number(
        backorders.count || 0
      ) ===
        backorders.requests.length &&
      Boolean(
        activeBags.summary
      ) &&
      Array.isArray(
        activeBags.records
      ) &&
      Number(
        activeBags.summary
          .activeTags || 0
      ) >= 1 &&
      Number(
        activeBags.summary
          .activeItems || 0
      ) >= records.length &&
      records.length > 0 &&
      recordsValid &&
      recordsUnique,

    readOnly: true,

    elapsedMs:
      Date.now() - started,

    coreVersion:
      coreVersion,

    backorderCount:
      Number(
        backorders.count || 0
      ),

    activeTags:
      Number(
        activeBags.summary
          ? activeBags.summary
              .activeTags || 0
          : 0
      ),

    activeItems:
      Number(
        activeBags.summary
          ? activeBags.summary
              .activeItems || 0
          : 0
      ),

    returnedActiveBags:
      records.length,

    recordsValid:
      recordsValid,

    recordsUnique:
      recordsUnique,

    firstTag:
      firstActiveBag
        ? firstActiveBag.tagNumber
        : '',

    firstReadiness:
      firstActiveBag
        ? firstActiveBag.readiness
        : '',

    firstRemaining:
      firstActiveBag
        ? Number(
            firstActiveBag
              .qtyRemaining ||
            0
          )
        : 0,

    authenticatedUser:
      result &&
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

function verifyBoundFieldMetadataContractV3() {
  const started =
    Date.now();

  const bootstrap =
    getPortalBootstrapV3();

  const coreVersion =
    bootstrap.version ||
    FMRCoreV3.getFmrV3Version();

  const field =
    bootstrap.field || {};

  const options =
    field.options || {};

  const policy =
    field.metadataPolicy || {};

  const storageLocations =
    Array.isArray(
      options.storageLocations
    )
      ? options.storageLocations
      : [];

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        8
      ) &&
      Boolean(
        bootstrap.user
      ) &&
      storageLocations.length > 0 &&
      storageLocations.every(
        function (
          location
        ) {
          return (
            Boolean(
              location
            ) &&
            String(
              location
            ) ===
            String(
              location
            ).toUpperCase()
          );
        }
      ) &&
      policy.authenticatedPerformer ===
        true &&
      policy.storageLocationMode ===
        'FREE_TEXT_WITH_SUGGESTIONS' &&
      Array.isArray(
        policy.storageLocationRequiredFor
      ) &&
      policy
        .storageLocationRequiredFor
        .includes(
          'CONFIRM_AVAILABLE'
        ) &&
      policy
        .storageLocationRequiredFor
        .includes(
          'BAG'
        ),

    readOnly:
      true,

    elapsedMs:
      Date.now() -
      started,

    coreVersion:
      coreVersion,

    authenticatedUser:
      bootstrap.user
        ? bootstrap.user.email
        : '',

    authenticatedPerformer:
      bootstrap.user
        ? (
            bootstrap.user.name ||
            bootstrap.user.email
          )
        : '',

    storageSuggestions:
      storageLocations,

    metadataPolicy:
      policy
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
      'Bound Field metadata contract failed.'
    );
  }

  return output;
}

function verifyBoundFieldBackorderNoticeContractV3() {
  const started =
    Date.now();

  const coreVersion =
    FMRCoreV3.getFmrV3Version();

  const expectations = [
    {
      fmrNumber:
        'V3-ADMIN-CONFIRM-0003',

      notices: [
        {
          type:
            'CONFIRMED',

          quantity:
            2,

          actionRequired:
            false
        }
      ]
    },
    {
      fmrNumber:
        'V3-ADMIN-REJECT-0004',

      notices: [
        {
          type:
            'REJECTED',

          quantity:
            2,

          actionRequired:
            true
        }
      ]
    },
    {
      fmrNumber:
        'V3-ADMIN-RETURN-0005',

      notices: [
        {
          type:
            'RETURNED_FOR_REVIEW',

          quantity:
            2,

          actionRequired:
            true
        }
      ]
    },
    {
      fmrNumber:
        'V3-ADMIN-SPLIT-0006',

      notices: [
        {
          type:
            'CONFIRMED',

          quantity:
            1,

          actionRequired:
            false
        },
        {
          type:
            'RETURNED_FOR_REVIEW',

          quantity:
            1,

          actionRequired:
            true
        }
      ]
    }
  ];

  const results =
    expectations.map(
      function (
        expectation
      ) {
        const search =
          searchPortalV3(
            expectation.fmrNumber,
            'FMR'
          );

        const material =
          search.cards &&
          search.cards.length === 1 &&
          search.cards[0].materials &&
          search.cards[0].materials.length === 1
            ? search.cards[0].materials[0]
            : null;

        const notices =
          material &&
          Array.isArray(
            material.backorderNotices
          )
            ? material.backorderNotices
            : [];

        const mismatches = [];

        expectation.notices.forEach(
          function (
            expected
          ) {
            const actual =
              notices.find(
                function (
                  notice
                ) {
                  return (
                    String(
                      notice.type ||
                      ''
                    ).toUpperCase() ===
                    expected.type
                  );
                }
              );

            if (!actual) {
              mismatches.push(
                (
                  'Missing ' +
                  expected.type
                )
              );

              return;
            }

            if (
              Number(
                actual.quantity ||
                0
              ) !==
              expected.quantity
            ) {
              mismatches.push(
                (
                  expected.type +
                  ' quantity expected ' +
                  expected.quantity +
                  ', received ' +
                  Number(
                    actual.quantity ||
                    0
                  )
                )
              );
            }

            if (
              Boolean(
                actual.actionRequired
              ) !==
              expected.actionRequired
            ) {
              mismatches.push(
                (
                  expected.type +
                  ' actionRequired expected ' +
                  expected.actionRequired
                )
              );
            }
          }
        );

        return {
          passed:
            Boolean(
              material
            ) &&
            mismatches.length === 0,

          fmrNumber:
            expectation.fmrNumber,

          noticeCount:
            notices.length,

          notices:
            notices,

          mismatches:
            mismatches
        };
      }
    );

  const output = {
    passed:
      isCompatibleFmrV3Alpha_(
        coreVersion,
        9
      ) &&
      results.every(
        function (
          result
        ) {
          return result.passed;
        }
      ),

    readOnly:
      true,

    elapsedMs:
      Date.now() -
      started,

    coreVersion:
      coreVersion,

    fixtureCount:
      results.length,

    results:
      results
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
      'Bound Field backorder notice contract failed.'
    );
  }

  return output;
}

