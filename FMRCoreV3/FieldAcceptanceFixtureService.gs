const FMR_V3_FIELD_ACCEPTANCE_FIXTURE =
  Object.freeze({
    fmrNumber:
      'V3-FIELD-ACCEPT-0002',

    stagingFmrId:
      'STAGEFMR-V3-FIELD-ACCEPT-0002',

    iwpNumber:
      'V3-IWP-FIELD-ACCEPT-0002',

    isoNumber:
      'V3-ISO-FIELD-ACCEPT-0002',

    isoSheet:
      '1',

    commodityCode:
      'V3-FIELD-COMM-001',

    size:
      '3',

    description:
      'V3 FIELD ACCEPTANCE TEST VALVE',

    quantity:
      8,

    uom:
      'EA',

    requestedBy:
      'Sprint 2D Field Acceptance',

    dateRequired:
      '2026-08-15',

    priority:
      'Normal',

    storageLocation:
      'V3-TEST-LAYDOWN',

    issuedToName:
      'Sprint 2D Test Recipient',

    performedByName:
      'Jonathan Muratalla',

    backorderReason:
      'Not found in laydown yard',

    notes:
      'Sprint 2D full Field transaction acceptance.'
  });

const FMR_V3_FIELD_ACCEPTANCE_STAGES =
  Object.freeze({
    INITIAL:
      Object.freeze({
        quantities:
          Object.freeze({
            requested: 8,
            confirmedLocated: 0,
            activeBagged: 0,
            available: 0,
            issued: 0,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            notYetLocated: 8,
            remaining: 8
          }),

        headerTotals:
          Object.freeze({
            requested: 8,
            located: 0,
            bagged: 0,
            available: 0,
            issued: 0,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            remaining: 8
          }),

        actions:
          Object.freeze({
            CONFIRM_AVAILABLE: 8,
            BAG: 8,
            DIRECT_ISSUE: 8,
            BACKORDER_REQUESTED: 8
          }),

        workflowPhase:
          'LOCATE_OR_EXCEPTION',

        activeBagCount:
          0,

        activeBagQuantity:
          0,

        adminQueueCount:
          0,

        hasPendingAdminReview:
          false
      }),

    AFTER_CONFIRM_AVAILABLE:
      Object.freeze({
        quantities:
          Object.freeze({
            requested: 8,
            confirmedLocated: 1,
            activeBagged: 0,
            available: 1,
            issued: 0,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            notYetLocated: 7,
            remaining: 8
          }),

        headerTotals:
          Object.freeze({
            requested: 8,
            located: 1,
            bagged: 0,
            available: 1,
            issued: 0,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            remaining: 8
          }),

        actions:
          Object.freeze({
            CONFIRM_AVAILABLE: 7,
            BAG: 8,
            DIRECT_ISSUE: 7,
            ISSUE_FROM_AVAILABLE: 1,
            BACKORDER_REQUESTED: 7
          }),

        workflowPhase:
          'ISSUE_OR_RESERVE_AVAILABLE',

        activeBagCount:
          0,

        activeBagQuantity:
          0,

        adminQueueCount:
          0,

        hasPendingAdminReview:
          false
      }),

    AFTER_ISSUE_AVAILABLE:
      Object.freeze({
        quantities:
          Object.freeze({
            requested: 8,
            confirmedLocated: 1,
            activeBagged: 0,
            available: 0,
            issued: 1,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            notYetLocated: 7,
            remaining: 7
          }),

        headerTotals:
          Object.freeze({
            requested: 8,
            located: 1,
            bagged: 0,
            available: 0,
            issued: 1,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            remaining: 7
          }),

        actions:
          Object.freeze({
            CONFIRM_AVAILABLE: 7,
            BAG: 7,
            DIRECT_ISSUE: 7,
            BACKORDER_REQUESTED: 7
          }),

        workflowPhase:
          'LOCATE_OR_EXCEPTION',

        activeBagCount:
          0,

        activeBagQuantity:
          0,

        adminQueueCount:
          0,

        hasPendingAdminReview:
          false
      }),

    AFTER_BAG:
      Object.freeze({
        quantities:
          Object.freeze({
            requested: 8,
            confirmedLocated: 2,
            activeBagged: 1,
            available: 0,
            issued: 1,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            notYetLocated: 6,
            remaining: 7
          }),

        headerTotals:
          Object.freeze({
            requested: 8,
            located: 2,
            bagged: 1,
            available: 0,
            issued: 1,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            remaining: 7
          }),

        actions:
          Object.freeze({
            ISSUE_FROM_BAG: 1,
            CONFIRM_AVAILABLE: 6,
            BAG: 6,
            DIRECT_ISSUE: 6,
            BACKORDER_REQUESTED: 6
          }),

        workflowPhase:
          'ISSUE_RESERVED',

        activeBagCount:
          1,

        activeBagQuantity:
          1,

        adminQueueCount:
          0,

        hasPendingAdminReview:
          false
      }),

    AFTER_ISSUE_FROM_BAG:
      Object.freeze({
        quantities:
          Object.freeze({
            requested: 8,
            confirmedLocated: 2,
            activeBagged: 0,
            available: 0,
            issued: 2,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            notYetLocated: 6,
            remaining: 6
          }),

        headerTotals:
          Object.freeze({
            requested: 8,
            located: 2,
            bagged: 0,
            available: 0,
            issued: 2,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            remaining: 6
          }),

        actions:
          Object.freeze({
            CONFIRM_AVAILABLE: 6,
            BAG: 6,
            DIRECT_ISSUE: 6,
            BACKORDER_REQUESTED: 6
          }),

        workflowPhase:
          'LOCATE_OR_EXCEPTION',

        activeBagCount:
          0,

        activeBagQuantity:
          0,

        adminQueueCount:
          0,

        hasPendingAdminReview:
          false
      }),

    AFTER_DIRECT_ISSUE:
      Object.freeze({
        quantities:
          Object.freeze({
            requested: 8,
            confirmedLocated: 3,
            activeBagged: 0,
            available: 0,
            issued: 3,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            notYetLocated: 5,
            remaining: 5
          }),

        headerTotals:
          Object.freeze({
            requested: 8,
            located: 3,
            bagged: 0,
            available: 0,
            issued: 3,
            pendingBackorder: 0,
            confirmedBackorder: 0,
            remaining: 5
          }),

        actions:
          Object.freeze({
            CONFIRM_AVAILABLE: 5,
            BAG: 5,
            DIRECT_ISSUE: 5,
            BACKORDER_REQUESTED: 5
          }),

        workflowPhase:
          'LOCATE_OR_EXCEPTION',

        activeBagCount:
          0,

        activeBagQuantity:
          0,

        adminQueueCount:
          0,

        hasPendingAdminReview:
          false
      }),

    AFTER_BACKORDER:
      Object.freeze({
        quantities:
          Object.freeze({
            requested: 8,
            confirmedLocated: 3,
            activeBagged: 0,
            available: 0,
            issued: 3,
            pendingBackorder: 1,
            confirmedBackorder: 0,
            notYetLocated: 5,
            remaining: 5
          }),

        headerTotals:
          Object.freeze({
            requested: 8,
            located: 3,
            bagged: 0,
            available: 0,
            issued: 3,
            pendingBackorder: 1,
            confirmedBackorder: 0,
            remaining: 5
          }),

        actions:
          Object.freeze({
            CONFIRM_AVAILABLE: 4,
            BAG: 4,
            DIRECT_ISSUE: 4,
            BACKORDER_REQUESTED: 4
          }),

        workflowPhase:
          'LOCATE_OR_EXCEPTION',

        activeBagCount:
          0,

        activeBagQuantity:
          0,

        adminQueueCount:
          1,

        hasPendingAdminReview:
          true
      })
  });

function currentFieldAcceptanceUserEmailFmrV3_() {
  const email =
    normalizeEmailFmrV3_(
      Session
        .getEffectiveUser()
        .getEmail()
    );

  if (!email) {
    throw new Error(
      'The effective Google account email is unavailable.'
    );
  }

  return email;
}

function createFieldAcceptanceFixtureFmrV3() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const started =
    Date.now();

  const email =
    currentFieldAcceptanceUserEmailFmrV3_();

  const owner =
    assertOwnerFmrV3_(
      email
    );

  const existing =
    searchPublishedFmrV3_(
      email,
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .fmrNumber,
      'FMR'
    );

  if (
    existing.resultCount > 0
  ) {
    const snapshot =
      fieldAcceptanceSnapshotFromResultFmrV3_(
        existing,
        email
      );

    const verification =
      compareFieldAcceptanceStageFmrV3_(
        snapshot,
        FMR_V3_FIELD_ACCEPTANCE_STAGES
          .INITIAL
      );

    if (
      !verification.passed
    ) {
      throw new Error(
        'The acceptance fixture already exists and is no longer pristine. ' +
        'Do not reset or overwrite it. Preserve its evidence and create a new numbered fixture.'
      );
    }

    const output = {
      passed:
        true,

      created:
        false,

      alreadyExisted:
        true,

      elapsedMs:
        Date.now() -
        started,

      version:
        FMR_V3.VERSION,

      performedBy:
        owner.email,

      fmrNumber:
        snapshot.fmrNumber,

      fmrLineId:
        snapshot.fmrLineId,

      snapshot:
        snapshot
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

  const payload = {
    stagingFmrId:
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .stagingFmrId,

    sourceFileId:
      '',

    sourceFileName:
      'Generated Sprint 2D Field acceptance fixture',

    officialFmrNumber:
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .fmrNumber,

    iwpNumber:
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .iwpNumber,

    requestedBy:
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .requestedBy,

    dateRequired:
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .dateRequired,

    priority:
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .priority,

    notes:
      (
        FMR_V3_FIELD_ACCEPTANCE_FIXTURE
          .notes +
        ' Created through the production staging and publication pipeline.'
      ),

    lines: [
      {
        isoNumber:
          FMR_V3_FIELD_ACCEPTANCE_FIXTURE
            .isoNumber,

        isoSheet:
          FMR_V3_FIELD_ACCEPTANCE_FIXTURE
            .isoSheet,

        commodityCode:
          FMR_V3_FIELD_ACCEPTANCE_FIXTURE
            .commodityCode,

        size:
          FMR_V3_FIELD_ACCEPTANCE_FIXTURE
            .size,

        description:
          FMR_V3_FIELD_ACCEPTANCE_FIXTURE
            .description,

        qtyRequested:
          FMR_V3_FIELD_ACCEPTANCE_FIXTURE
            .quantity,

        uom:
          FMR_V3_FIELD_ACCEPTANCE_FIXTURE
            .uom,

        storageLocation:
          '',

        notes:
          'Single-line fixture for all six guided Field actions.'
      }
    ]
  };

  const staged =
    saveStagedFmrFmrV3_(
      email,
      payload
    );

  if (
    !staged.valid
  ) {
    throw new Error(
      'Acceptance fixture staging validation failed: ' +
      (
        staged.validationErrors ||
        []
      ).join(
        ' | '
      )
    );
  }

  const published =
    publishStagedFmrFmrV3_(
      email,
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .stagingFmrId
    );

  SpreadsheetApp.flush();

  const result =
    searchPublishedFmrV3_(
      email,
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .fmrNumber,
      'FMR'
    );

  const snapshot =
    fieldAcceptanceSnapshotFromResultFmrV3_(
      result,
      email
    );

  const verification =
    compareFieldAcceptanceStageFmrV3_(
      snapshot,
      FMR_V3_FIELD_ACCEPTANCE_STAGES
        .INITIAL
    );

  if (
    !verification.passed
  ) {
    throw new Error(
      'The fixture was published, but its initial-state validation failed: ' +
      verification.mismatches.join(
        ' | '
      )
    );
  }

  appendAuditFmrV3_(
    'FMR',
    snapshot.fmrId,
    'FIELD_ACCEPTANCE_FIXTURE_CREATED',
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'DIAGNOSTIC',

      payload: {
        fmrNumber:
          snapshot.fmrNumber,

        fmrLineId:
          snapshot.fmrLineId,

        requestedQuantity:
          snapshot.quantities
            .requested,

        expectedSequence: [
          'CONFIRM_AVAILABLE',
          'ISSUE_FROM_AVAILABLE',
          'BAG',
          'ISSUE_FROM_BAG',
          'DIRECT_ISSUE',
          'BACKORDER_REQUESTED'
        ]
      }
    }
  );

  const integrity =
    inspectFmrV3DataIntegrity();

  const output = {
    passed:
      verification.passed &&
      integrity.passed,

    created:
      true,

    alreadyExisted:
      false,

    elapsedMs:
      Date.now() -
      started,

    version:
      FMR_V3.VERSION,

    performedBy:
      owner.email,

    staging:
      staged,

    published:
      published,

    fmrNumber:
      snapshot.fmrNumber,

    fmrLineId:
      snapshot.fmrLineId,

    initialVerification:
      verification,

    integrityPassed:
      integrity.passed,

    snapshot:
      snapshot
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (
    !output.passed
  ) {
    throw new Error(
      'Field acceptance fixture creation failed its post-publication checks.'
    );
  }

  return output;
}

function inspectFieldAcceptanceFixtureFmrV3() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const email =
    currentFieldAcceptanceUserEmailFmrV3_();

  const result =
    searchPublishedFmrV3_(
      email,
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .fmrNumber,
      'FMR'
    );

  const snapshot =
    fieldAcceptanceSnapshotFromResultFmrV3_(
      result,
      email
    );

  console.log(
    JSON.stringify(
      snapshot,
      null,
      2
    )
  );

  return snapshot;
}

function fieldAcceptanceSnapshotFromResultFmrV3_(
  result,
  userEmail
) {
  if (
    !result ||
    result.resultCount !== 1 ||
    !Array.isArray(
      result.cards
    ) ||
    result.cards.length !== 1
  ) {
    throw new Error(
      'Expected exactly one published acceptance fixture: ' +
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .fmrNumber
    );
  }

  const card =
    result.cards[0];

  const materials =
    card.materials || [];

  if (
    materials.length !== 1
  ) {
    throw new Error(
      'The Field acceptance fixture must contain exactly one material line.'
    );
  }

  const material =
    materials[0];

  const workflow =
    material.workflow || {};

  const actions =
    Array.isArray(
      workflow.actions
    )
      ? workflow.actions
      : [];

  const actionMaximums = {};

  actions.forEach(
    function (
      action
    ) {
      actionMaximums[
        normalizeUpperFmrV3_(
          action.action
        )
      ] =
        numberFmrV3_(
          action.maxQuantity
        );
    }
  );

  const activeBags =
    Array.isArray(
      material.activeBags
    )
      ? material.activeBags
      : [];

  const activeBagQuantity =
    activeBags.reduce(
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

  const queue =
    getBackorderQueueFmrV3_(
      userEmail
    );

  const fixtureQueue =
    (
      queue.requests ||
      []
    ).filter(
      function (
        request
      ) {
        return (
          normalizeUpperFmrV3_(
            request.fmrNumber
          ) ===
          normalizeUpperFmrV3_(
            FMR_V3_FIELD_ACCEPTANCE_FIXTURE
              .fmrNumber
          )
        );
      }
    );

  return {
    readOnly:
      true,

    version:
      FMR_V3.VERSION,

    fmrId:
      normalizeFmrV3_(
        card.fmrId
      ),

    fmrNumber:
      normalizeFmrV3_(
        card.fmrNumber
      ),

    fmrLineId:
      normalizeFmrV3_(
        material.fmrLineId
      ),

    commodityCode:
      normalizeFmrV3_(
        material.commodityCode
      ),

    description:
      normalizeFmrV3_(
        material.description
      ),

    quantities: {
      requested:
        numberFmrV3_(
          material.qtyRequested
        ),

      confirmedLocated:
        numberFmrV3_(
          material.qtyConfirmedLocated
        ),

      activeBagged:
        numberFmrV3_(
          material.qtyActiveBagged
        ),

      available:
        numberFmrV3_(
          material.qtyAvailable
        ),

      issued:
        numberFmrV3_(
          material.qtyIssued
        ),

      pendingBackorder:
        numberFmrV3_(
          material.qtyPendingBackorder
        ),

      confirmedBackorder:
        numberFmrV3_(
          material.qtyConfirmedBackorder
        ),

      notYetLocated:
        numberFmrV3_(
          material.qtyNotYetLocated
        ),

      remaining:
        numberFmrV3_(
          material.qtyRemainingRequirement
        )
    },

    headerTotals:
      card.totals || {},

    lineStatus:
      normalizeFmrV3_(
        material.lineStatus
      ),

    workflowPhase:
      normalizeUpperFmrV3_(
        workflow.phase
      ),

    workflowHeadline:
      normalizeFmrV3_(
        workflow.headline
      ),

    hasPendingAdminReview:
      Boolean(
        workflow.hasPendingAdminReview
      ),

    actions:
      Object.keys(
        actionMaximums
      ).sort(),

    actionMaximums:
      actionMaximums,

    activeBagCount:
      activeBags.length,

    activeBagQuantity:
      activeBagQuantity,

    activeBags:
      activeBags.map(
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
              ),

            storageLocation:
              normalizeFmrV3_(
                bag.storageLocation
              )
          };
        }
      ),

    adminQueueCount:
      fixtureQueue.length,

    adminQueue:
      fixtureQueue.map(
        function (
          request
        ) {
          return {
            requestId:
              normalizeFmrV3_(
                request.requestId
              ),

            quantityRequested:
              numberFmrV3_(
                request.qtyRequested
              ),

            quantityPending:
              numberFmrV3_(
                request.qtyPending
              ),

            quantityConfirmed:
              numberFmrV3_(
                request.qtyConfirmed
              ),

            reason:
              normalizeFmrV3_(
                request.reason
              ),

            status:
              normalizeFmrV3_(
                request.status
              )
          };
        }
      )
  };
}

function fieldAcceptanceNumbersEqualFmrV3_(
  left,
  right
) {
  return (
    Math.abs(
      numberFmrV3_(
        left
      ) -
      numberFmrV3_(
        right
      )
    ) <
    0.000001
  );
}

function compareFieldAcceptanceStageFmrV3_(
  snapshot,
  expected
) {
  const mismatches = [];

  Object.keys(
    expected.quantities
  ).forEach(
    function (
      key
    ) {
      if (
        !fieldAcceptanceNumbersEqualFmrV3_(
          snapshot.quantities[
            key
          ],
          expected.quantities[
            key
          ]
        )
      ) {
        mismatches.push(
          (
            'Line quantity ' +
            key +
            ': expected ' +
            expected.quantities[
              key
            ] +
            ', received ' +
            snapshot.quantities[
              key
            ]
          )
        );
      }
    }
  );

  Object.keys(
    expected.headerTotals
  ).forEach(
    function (
      key
    ) {
      if (
        !fieldAcceptanceNumbersEqualFmrV3_(
          snapshot.headerTotals[
            key
          ],
          expected.headerTotals[
            key
          ]
        )
      ) {
        mismatches.push(
          (
            'Header total ' +
            key +
            ': expected ' +
            expected.headerTotals[
              key
            ] +
            ', received ' +
            snapshot.headerTotals[
              key
            ]
          )
        );
      }
    }
  );

  const expectedActions =
    Object.keys(
      expected.actions
    ).sort();

  const actualActions =
    (
      snapshot.actions ||
      []
    ).slice().sort();

  if (
    JSON.stringify(
      actualActions
    ) !==
    JSON.stringify(
      expectedActions
    )
  ) {
    mismatches.push(
      (
        'Actions: expected [' +
        expectedActions.join(
          ', '
        ) +
        '], received [' +
        actualActions.join(
          ', '
        ) +
        ']'
      )
    );
  }

  expectedActions.forEach(
    function (
      action
    ) {
      if (
        !fieldAcceptanceNumbersEqualFmrV3_(
          snapshot.actionMaximums[
            action
          ],
          expected.actions[
            action
          ]
        )
      ) {
        mismatches.push(
          (
            'Action maximum ' +
            action +
            ': expected ' +
            expected.actions[
              action
            ] +
            ', received ' +
            snapshot.actionMaximums[
              action
            ]
          )
        );
      }
    }
  );

  if (
    normalizeUpperFmrV3_(
      snapshot.workflowPhase
    ) !==
    normalizeUpperFmrV3_(
      expected.workflowPhase
    )
  ) {
    mismatches.push(
      (
        'Workflow phase: expected ' +
        expected.workflowPhase +
        ', received ' +
        snapshot.workflowPhase
      )
    );
  }

  if (
    Number(
      snapshot.activeBagCount ||
      0
    ) !==
    Number(
      expected.activeBagCount ||
      0
    )
  ) {
    mismatches.push(
      (
        'Active bag count: expected ' +
        expected.activeBagCount +
        ', received ' +
        snapshot.activeBagCount
      )
    );
  }

  if (
    !fieldAcceptanceNumbersEqualFmrV3_(
      snapshot.activeBagQuantity,
      expected.activeBagQuantity
    )
  ) {
    mismatches.push(
      (
        'Active bag quantity: expected ' +
        expected.activeBagQuantity +
        ', received ' +
        snapshot.activeBagQuantity
      )
    );
  }

  if (
    Number(
      snapshot.adminQueueCount ||
      0
    ) !==
    Number(
      expected.adminQueueCount ||
      0
    )
  ) {
    mismatches.push(
      (
        'Admin queue count: expected ' +
        expected.adminQueueCount +
        ', received ' +
        snapshot.adminQueueCount
      )
    );
  }

  if (
    Boolean(
      snapshot.hasPendingAdminReview
    ) !==
    Boolean(
      expected.hasPendingAdminReview
    )
  ) {
    mismatches.push(
      (
        'Pending Admin-review flag: expected ' +
        expected.hasPendingAdminReview +
        ', received ' +
        snapshot.hasPendingAdminReview
      )
    );
  }

  if (
    expected.adminQueueCount > 0
  ) {
    const request =
      snapshot.adminQueue &&
      snapshot.adminQueue.length
        ? snapshot.adminQueue[0]
        : null;

    if (!request) {
      mismatches.push(
        'The expected Admin queue request is missing.'
      );
    } else {
      if (
        !fieldAcceptanceNumbersEqualFmrV3_(
          request.quantityRequested,
          1
        ) ||
        !fieldAcceptanceNumbersEqualFmrV3_(
          request.quantityPending,
          1
        ) ||
        !fieldAcceptanceNumbersEqualFmrV3_(
          request.quantityConfirmed,
          0
        )
      ) {
        mismatches.push(
          'The Admin queue request quantities are incorrect.'
        );
      }

      if (
        normalizeFmrV3_(
          request.reason
        ) !==
        FMR_V3_FIELD_ACCEPTANCE_FIXTURE
          .backorderReason
      ) {
        mismatches.push(
          (
            'Backorder reason: expected "' +
            FMR_V3_FIELD_ACCEPTANCE_FIXTURE
              .backorderReason +
            '", received "' +
            request.reason +
            '".'
          )
        );
      }

      if (
        normalizeUpperFmrV3_(
          request.status
        ) !==
        'PENDING ADMIN REVIEW'
      ) {
        mismatches.push(
          (
            'Backorder status: expected Pending Admin Review, received ' +
            request.status +
            '.'
          )
        );
      }
    }
  }

  return {
    passed:
      mismatches.length === 0,

    mismatchCount:
      mismatches.length,

    mismatches:
      mismatches
  };
}

function verifyFieldAcceptanceFixtureStageFmrV3_(
  stageName
) {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const started =
    Date.now();

  const normalizedStage =
    normalizeUpperFmrV3_(
      stageName
    );

  const expected =
    FMR_V3_FIELD_ACCEPTANCE_STAGES[
      normalizedStage
    ];

  if (!expected) {
    throw new Error(
      'Unsupported Field acceptance stage: ' +
      normalizedStage
    );
  }

  const email =
    currentFieldAcceptanceUserEmailFmrV3_();

  const result =
    searchPublishedFmrV3_(
      email,
      FMR_V3_FIELD_ACCEPTANCE_FIXTURE
        .fmrNumber,
      'FMR'
    );

  const snapshot =
    fieldAcceptanceSnapshotFromResultFmrV3_(
      result,
      email
    );

  const comparison =
    compareFieldAcceptanceStageFmrV3_(
      snapshot,
      expected
    );

  const integrity =
    inspectFmrV3DataIntegrity();

  const output = {
    passed:
      comparison.passed &&
      integrity.passed,

    readOnly:
      true,

    stage:
      normalizedStage,

    elapsedMs:
      Date.now() -
      started,

    version:
      FMR_V3.VERSION,

    fmrNumber:
      snapshot.fmrNumber,

    fmrLineId:
      snapshot.fmrLineId,

    quantities:
      snapshot.quantities,

    headerTotals:
      snapshot.headerTotals,

    workflowPhase:
      snapshot.workflowPhase,

    actionMaximums:
      snapshot.actionMaximums,

    activeBagCount:
      snapshot.activeBagCount,

    activeBagQuantity:
      snapshot.activeBagQuantity,

    firstActiveTag:
      snapshot.activeBags.length
        ? snapshot.activeBags[0]
            .tagNumber
        : '',

    adminQueueCount:
      snapshot.adminQueueCount,

    firstAdminQueueRequest:
      snapshot.adminQueue.length
        ? snapshot.adminQueue[0]
        : null,

    mismatchCount:
      comparison.mismatchCount,

    mismatches:
      comparison.mismatches,

    integrityPassed:
      integrity.passed,

    integrityIssueCounts: {
      line:
        integrity.lineIssueCount,

      header:
        integrity.headerIssueCount,

      bagIndex:
        integrity.bagIndexIssueCount
    }
  };

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (
    !output.passed
  ) {
    throw new Error(
      (
        'Field acceptance stage ' +
        normalizedStage +
        ' failed. ' +
        comparison.mismatches.join(
          ' | '
        )
      )
    );
  }

  return output;
}

function verifyFieldAcceptanceInitialFmrV3() {
  return verifyFieldAcceptanceFixtureStageFmrV3_(
    'INITIAL'
  );
}

function verifyFieldAcceptanceAfterConfirmFmrV3() {
  return verifyFieldAcceptanceFixtureStageFmrV3_(
    'AFTER_CONFIRM_AVAILABLE'
  );
}

function verifyFieldAcceptanceAfterIssueAvailableFmrV3() {
  return verifyFieldAcceptanceFixtureStageFmrV3_(
    'AFTER_ISSUE_AVAILABLE'
  );
}

function verifyFieldAcceptanceAfterBagFmrV3() {
  return verifyFieldAcceptanceFixtureStageFmrV3_(
    'AFTER_BAG'
  );
}

function verifyFieldAcceptanceAfterIssueFromBagFmrV3() {
  return verifyFieldAcceptanceFixtureStageFmrV3_(
    'AFTER_ISSUE_FROM_BAG'
  );
}

function verifyFieldAcceptanceAfterDirectIssueFmrV3() {
  return verifyFieldAcceptanceFixtureStageFmrV3_(
    'AFTER_DIRECT_ISSUE'
  );
}

function verifyFieldAcceptanceAfterBackorderFmrV3() {
  return verifyFieldAcceptanceFixtureStageFmrV3_(
    'AFTER_BACKORDER'
  );
}
