const FMR_V3_ADMIN_ACCEPTANCE =
  Object.freeze({
    quantityRequested: 6,
    backorderQuantity: 2,
    uom: 'EA',
    size: '4',
    reason: 'Not found in laydown yard',
    requestedBy: 'Sprint 3A Admin Acceptance',
    dateRequired: '2026-08-20',
    priority: 'Normal',

    fixtures: Object.freeze({
      CONFIRM: Object.freeze({
        key: 'CONFIRM',
        fmrNumber: 'V3-ADMIN-CONFIRM-0003',
        stagingFmrId: 'STAGEFMR-V3-ADMIN-CONFIRM-0003',
        iwpNumber: 'V3-IWP-ADMIN-CONFIRM-0003',
        isoNumber: 'V3-ISO-ADMIN-CONFIRM-0003',
        commodityCode: 'V3-ADMIN-COMM-003',
        description: 'V3 ADMIN CONFIRM ACCEPTANCE VALVE'
      }),

      REJECT: Object.freeze({
        key: 'REJECT',
        fmrNumber: 'V3-ADMIN-REJECT-0004',
        stagingFmrId: 'STAGEFMR-V3-ADMIN-REJECT-0004',
        iwpNumber: 'V3-IWP-ADMIN-REJECT-0004',
        isoNumber: 'V3-ISO-ADMIN-REJECT-0004',
        commodityCode: 'V3-ADMIN-COMM-004',
        description: 'V3 ADMIN REJECT ACCEPTANCE FLANGE'
      }),

      RETURN: Object.freeze({
        key: 'RETURN',
        fmrNumber: 'V3-ADMIN-RETURN-0005',
        stagingFmrId: 'STAGEFMR-V3-ADMIN-RETURN-0005',
        iwpNumber: 'V3-IWP-ADMIN-RETURN-0005',
        isoNumber: 'V3-ISO-ADMIN-RETURN-0005',
        commodityCode: 'V3-ADMIN-COMM-005',
        description: 'V3 ADMIN RETURN ACCEPTANCE ELBOW'
      }),

      SPLIT: Object.freeze({
        key: 'SPLIT',
        fmrNumber: 'V3-ADMIN-SPLIT-0006',
        stagingFmrId: 'STAGEFMR-V3-ADMIN-SPLIT-0006',
        iwpNumber: 'V3-IWP-ADMIN-SPLIT-0006',
        isoNumber: 'V3-ISO-ADMIN-SPLIT-0006',
        commodityCode: 'V3-ADMIN-COMM-006',
        description: 'V3 ADMIN SPLIT ACCEPTANCE TEE'
      })
    })
  });

function currentAdminAcceptanceEmailFmrV3_() {
  const email =
    normalizeEmailFmrV3_(
      Session.getEffectiveUser().getEmail()
    );

  if (!email) {
    throw new Error(
      'The effective Google account email is unavailable.'
    );
  }

  return email;
}

function adminAcceptanceFixtureFmrV3_(fixtureKey) {
  const key =
    normalizeUpperFmrV3_(fixtureKey);

  const fixture =
    FMR_V3_ADMIN_ACCEPTANCE.fixtures[key];

  if (!fixture) {
    throw new Error(
      'Unsupported Admin acceptance fixture: ' + key
    );
  }

  return fixture;
}

function createAdminAcceptanceFixturesFmrV3() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const started = Date.now();
  const email =
    currentAdminAcceptanceEmailFmrV3_();
  const owner =
    assertOwnerFmrV3_(email);
  const fixtures = [];

  Object.keys(
    FMR_V3_ADMIN_ACCEPTANCE.fixtures
  ).forEach(function (fixtureKey) {
    const fixture =
      adminAcceptanceFixtureFmrV3_(fixtureKey);

    let search =
      searchPublishedFmrV3_(
        email,
        fixture.fmrNumber,
        'FMR'
      );

    let created = false;

    if (search.resultCount === 0) {
      const staged =
        saveStagedFmrFmrV3_(
          email,
          {
            stagingFmrId:
              fixture.stagingFmrId,
            sourceFileId: '',
            sourceFileName:
              'Generated Sprint 3A ' +
              fixture.key +
              ' acceptance fixture',
            officialFmrNumber:
              fixture.fmrNumber,
            iwpNumber:
              fixture.iwpNumber,
            requestedBy:
              FMR_V3_ADMIN_ACCEPTANCE.requestedBy,
            dateRequired:
              FMR_V3_ADMIN_ACCEPTANCE.dateRequired,
            priority:
              FMR_V3_ADMIN_ACCEPTANCE.priority,
            notes:
              'Sprint 3A Admin lifecycle fixture: ' +
              fixture.key,
            lines: [
              {
                isoNumber:
                  fixture.isoNumber,
                isoSheet: '1',
                commodityCode:
                  fixture.commodityCode,
                size:
                  FMR_V3_ADMIN_ACCEPTANCE.size,
                description:
                  fixture.description,
                qtyRequested:
                  FMR_V3_ADMIN_ACCEPTANCE
                    .quantityRequested,
                uom:
                  FMR_V3_ADMIN_ACCEPTANCE.uom,
                storageLocation: '',
                notes:
                  'Isolated Admin decision fixture.'
              }
            ]
          }
        );

      if (!staged.valid) {
        throw new Error(
          fixture.fmrNumber +
          ' failed staging validation: ' +
          (staged.validationErrors || [])
            .join(' | ')
        );
      }

      publishStagedFmrFmrV3_(
        email,
        fixture.stagingFmrId
      );

      SpreadsheetApp.flush();
      created = true;
    }

    let snapshot =
      adminAcceptanceSnapshotFmrV3_(
        fixture.key,
        email
      );

    if (snapshot.backorders.length === 0) {
      performFieldActionFmrV3_(
        email,
        {
          action:
            FMR_V3.ACTIONS
              .BACKORDER_REQUESTED,
          fmrLineId:
            snapshot.fmrLineId,
          quantity:
            FMR_V3_ADMIN_ACCEPTANCE
              .backorderQuantity,
          reason:
            FMR_V3_ADMIN_ACCEPTANCE.reason,
          performedByName:
            'Sprint 3A Fixture',
          notes:
            'Sprint 3A ' +
            fixture.key +
            ' Admin acceptance request.'
        }
      );

      SpreadsheetApp.flush();

      snapshot =
        adminAcceptanceSnapshotFmrV3_(
          fixture.key,
          email
        );
    }

    const check =
      compareAdminAcceptanceStageFmrV3_(
        snapshot,
        'PENDING'
      );

    if (!check.passed) {
      throw new Error(
        fixture.fmrNumber +
        ' is not pristine: ' +
        check.mismatches.join(' | ')
      );
    }

    appendAuditFmrV3_(
      'FMR',
      snapshot.fmrId,
      'ADMIN_ACCEPTANCE_FIXTURE_READY',
      owner,
      uuidFmrV3_('CORR'),
      {
        sourceInterface: 'DIAGNOSTIC',
        payload: {
          fixtureKey:
            fixture.key,
          fmrNumber:
            fixture.fmrNumber,
          fmrLineId:
            snapshot.fmrLineId,
          requestId:
            snapshot.backorders[0]
              .requestId,
          created: created
        }
      }
    );

    fixtures.push({
      fixtureKey:
        fixture.key,
      fmrNumber:
        fixture.fmrNumber,
      fmrLineId:
        snapshot.fmrLineId,
      requestId:
        snapshot.backorders[0]
          .requestId,
      created: created,
      pendingQuantity:
        snapshot.quantities
          .pendingBackorder,
      queueCount:
        snapshot.queueCount
    });
  });

  const integrity =
    inspectFmrV3DataIntegrity();

  const output = {
    passed:
      fixtures.length === 4 &&
      fixtures.every(
        function (item) {
          return (
            item.pendingQuantity === 2 &&
            item.queueCount === 1
          );
        }
      ) &&
      integrity.passed,
    destructive: true,
    elapsedMs:
      Date.now() - started,
    version:
      FMR_V3.VERSION,
    performedBy:
      owner.email,
    fixtureCount:
      fixtures.length,
    fixtures: fixtures,
    integrityPassed:
      integrity.passed
  };

  console.log(
    JSON.stringify(output, null, 2)
  );

  if (!output.passed) {
    throw new Error(
      'Sprint 3A fixture creation failed.'
    );
  }

  return output;
}

function inspectAdminAcceptanceFixtureFmrV3(
  fixtureKey
) {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const snapshot =
    adminAcceptanceSnapshotFmrV3_(
      fixtureKey,
      currentAdminAcceptanceEmailFmrV3_()
    );

  console.log(
    JSON.stringify(snapshot, null, 2)
  );

  return snapshot;
}

function adminAcceptanceSnapshotFmrV3_(
  fixtureKey,
  userEmail
) {
  const fixture =
    adminAcceptanceFixtureFmrV3_(fixtureKey);

  const result =
    searchPublishedFmrV3_(
      userEmail,
      fixture.fmrNumber,
      'FMR'
    );

  if (
    result.resultCount !== 1 ||
    !result.cards ||
    result.cards.length !== 1
  ) {
    throw new Error(
      'Expected one published FMR: ' +
      fixture.fmrNumber
    );
  }

  const card =
    result.cards[0];
  const materials =
    card.materials || [];

  if (materials.length !== 1) {
    throw new Error(
      fixture.fmrNumber +
      ' must contain one line.'
    );
  }

  const material =
    materials[0];
  const workflow =
    material.workflow || {};

  const rawBackorders =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.BACKORDERS
    ).filter(function (row) {
      return (
        normalizeUpperFmrV3_(
          row.FMR_Number
        ) ===
        normalizeUpperFmrV3_(
          fixture.fmrNumber
        )
      );
    }).sort(function (a, b) {
      return (
        numberFmrV3_(a._rowNumber) -
        numberFmrV3_(b._rowNumber)
      );
    });

  const backorders =
    rawBackorders.map(function (row) {
      return {
        requestId:
          normalizeFmrV3_(
            row.Backorder_Request_ID
          ),
        quantityRequested:
          numberFmrV3_(
            row.Qty_Requested_Backorder
          ),
        quantityConfirmed:
          numberFmrV3_(
            row.Qty_Confirmed_Backorder
          ),
        quantityPending:
          numberFmrV3_(
            row.Qty_Pending
          ),
        status:
          normalizeFmrV3_(row.Status),
        active:
          yesFmrV3_(row.Active),
        adminDecision:
          normalizeFmrV3_(
            row.Admin_Decision
          ),
        adminNotes:
          normalizeFmrV3_(
            row.Admin_Notes
          ),
        returnedReason:
          normalizeFmrV3_(
            row.Returned_Review_Reason
          )
      };
    });

  const requestIds =
    backorders.map(function (row) {
      return row.requestId;
    });

  const queue =
    getBackorderQueueFmrV3_(
      userEmail
    );

  const fixtureQueue =
    (queue.requests || [])
      .filter(function (request) {
        return (
          normalizeUpperFmrV3_(
            request.fmrNumber
          ) ===
          normalizeUpperFmrV3_(
            fixture.fmrNumber
          )
        );
      });

  const transactions =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.TRANSACTIONS
    ).filter(function (row) {
      return (
        normalizeUpperFmrV3_(
          row.FMR_Number
        ) ===
        normalizeUpperFmrV3_(
          fixture.fmrNumber
        )
      );
    }).map(function (row) {
      return {
        type:
          normalizeUpperFmrV3_(
            row.Transaction_Type
          ),
        quantity:
          numberFmrV3_(
            row.Quantity
          ),
        requestId:
          normalizeFmrV3_(
            row.Backorder_Request_ID
          ),
        correlationId:
          normalizeFmrV3_(
            row.Correlation_ID
          )
      };
    });

  const audits =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.AUDIT
    ).filter(function (row) {
      const entityId =
        normalizeFmrV3_(
          row.Entity_ID
        );

      const payload =
        normalizeFmrV3_(
          row.Payload_JSON
        );

      return (
        entityId ===
          normalizeFmrV3_(
            card.fmrId
          ) ||
        entityId ===
          normalizeFmrV3_(
            material.fmrLineId
          ) ||
        requestIds.includes(
          entityId
        ) ||
        payload.includes(
          fixture.fmrNumber
        )
      );
    }).map(function (row) {
      return {
        action:
          normalizeUpperFmrV3_(
            row.Action
          ),
        entityId:
          normalizeFmrV3_(
            row.Entity_ID
          ),
        correlationId:
          normalizeFmrV3_(
            row.Correlation_ID
          )
      };
    });

  const indexes =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.OPERATIONAL_INDEX
    ).filter(function (row) {
      return (
        normalizeFmrV3_(
          row.Parent_ID
        ) ===
          normalizeFmrV3_(
            material.fmrLineId
          ) ||
        requestIds.includes(
          normalizeFmrV3_(
            row.Entity_ID
          )
        )
      );
    }).map(function (row) {
      return {
        type:
          normalizeUpperFmrV3_(
            row.Index_Type
          ),
        entityId:
          normalizeFmrV3_(
            row.Entity_ID
          ),
        active:
          yesFmrV3_(
            row.Active
          )
      };
    });

  return {
    readOnly: true,
    version:
      FMR_V3.VERSION,
    fixtureKey:
      fixture.key,
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
    workflowPhase:
      normalizeUpperFmrV3_(
        workflow.phase
      ),
    hasPendingAdminReview:
      Boolean(
        workflow.hasPendingAdminReview
      ),
    requiresFieldReview:
      Boolean(
        workflow.requiresFieldReview
      ),
    returnedBackorders:
      (material.returnedBackorders || [])
        .map(function (row) {
          return {
            requestId:
              normalizeFmrV3_(
                row.requestId
              ),
            quantity:
              numberFmrV3_(
                row.quantity
              ),
            reason:
              normalizeFmrV3_(
                row.reason
              )
          };
        }),
    queueCount:
      fixtureQueue.length,
    queue:
      fixtureQueue,
    backorders:
      backorders,
    transactions:
      transactions,
    audits:
      audits,
    operationalIndexes:
      indexes
  };
}

function adminAcceptanceNumberEqualFmrV3_(
  left,
  right
) {
  return (
    Math.abs(
      numberFmrV3_(left) -
      numberFmrV3_(right)
    ) < 0.000001
  );
}

function adminAcceptanceCountFmrV3_(
  list,
  field,
  value
) {
  const expected =
    normalizeUpperFmrV3_(value);

  return (list || []).filter(
    function (item) {
      return (
        normalizeUpperFmrV3_(
          item[field]
        ) === expected
      );
    }
  ).length;
}

function compareAdminAcceptanceStageFmrV3_(
  snapshot,
  stageName
) {
  const stage =
    normalizeUpperFmrV3_(stageName);
  const mismatches = [];

  function expectNumber(
    label,
    actual,
    expected
  ) {
    if (
      !adminAcceptanceNumberEqualFmrV3_(
        actual,
        expected
      )
    ) {
      mismatches.push(
        label +
        ': expected ' +
        expected +
        ', received ' +
        actual
      );
    }
  }

  function expect(
    condition,
    message
  ) {
    if (!condition) {
      mismatches.push(message);
    }
  }

  expectNumber(
    'Requested',
    snapshot.quantities.requested,
    6
  );

  expectNumber(
    'Confirmed located',
    snapshot.quantities
      .confirmedLocated,
    0
  );

  expectNumber(
    'Issued',
    snapshot.quantities.issued,
    0
  );

  expectNumber(
    'Not yet located',
    snapshot.quantities
      .notYetLocated,
    6
  );

  expectNumber(
    'Remaining',
    snapshot.quantities.remaining,
    6
  );

  if (stage === 'PENDING') {
    expectNumber(
      'Pending backorder',
      snapshot.quantities
        .pendingBackorder,
      2
    );

    expectNumber(
      'Confirmed backorder',
      snapshot.quantities
        .confirmedBackorder,
      0
    );

    expect(
      snapshot.queueCount === 1,
      'Expected one Admin queue request.'
    );

    expect(
      snapshot.backorders.length === 1,
      'Expected one backorder row.'
    );

    if (snapshot.backorders.length === 1) {
      const request =
        snapshot.backorders[0];

      expect(
        normalizeUpperFmrV3_(
          request.status
        ) ===
          'PENDING ADMIN REVIEW',
        'Status must be Pending Admin Review.'
      );

      expectNumber(
        'Request pending',
        request.quantityPending,
        2
      );

      expectNumber(
        'Request confirmed',
        request.quantityConfirmed,
        0
      );

      expect(
        request.active,
        'Pending request must be active.'
      );
    }

    expect(
      adminAcceptanceCountFmrV3_(
        snapshot.transactions,
        'type',
        'BACKORDER_REQUESTED'
      ) === 1,
      'Expected one BACKORDER_REQUESTED transaction.'
    );
  } else if (
    stage ===
    'PARTIALLY_CONFIRMED'
  ) {
    expectNumber(
      'Pending backorder',
      snapshot.quantities
        .pendingBackorder,
      1
    );

    expectNumber(
      'Confirmed backorder',
      snapshot.quantities
        .confirmedBackorder,
      1
    );

    expect(
      snapshot.queueCount === 1,
      'Partially confirmed request must remain in queue.'
    );

    expect(
      snapshot.backorders.length === 1,
      'Expected one partially confirmed row.'
    );

    if (snapshot.backorders.length === 1) {
      const request =
        snapshot.backorders[0];

      expect(
        normalizeUpperFmrV3_(
          request.status
        ) ===
          'PARTIALLY CONFIRMED',
        'Status must be Partially Confirmed.'
      );

      expectNumber(
        'Request pending',
        request.quantityPending,
        1
      );

      expectNumber(
        'Request confirmed',
        request.quantityConfirmed,
        1
      );
    }

    expect(
      adminAcceptanceCountFmrV3_(
        snapshot.transactions,
        'type',
        'BACKORDER_CONFIRMED'
      ) === 1,
      'Expected one BACKORDER_CONFIRMED transaction.'
    );

    expect(
      adminAcceptanceCountFmrV3_(
        snapshot.audits,
        'action',
        'BACKORDER_CONFIRM'
      ) >= 1,
      'Expected BACKORDER_CONFIRM audit.'
    );
  } else if (
    stage === 'CONFIRMED'
  ) {
    expectNumber(
      'Pending backorder',
      snapshot.quantities
        .pendingBackorder,
      0
    );

    expectNumber(
      'Confirmed backorder',
      snapshot.quantities
        .confirmedBackorder,
      2
    );

    expect(
      snapshot.queueCount === 0,
      'Confirmed request must leave queue.'
    );

    expect(
      snapshot.backorders.length === 1,
      'Expected one confirmed row.'
    );

    if (snapshot.backorders.length === 1) {
      const request =
        snapshot.backorders[0];

      expect(
        normalizeUpperFmrV3_(
          request.status
        ) === 'CONFIRMED',
        'Status must be Confirmed.'
      );

      expectNumber(
        'Request pending',
        request.quantityPending,
        0
      );

      expectNumber(
        'Request confirmed',
        request.quantityConfirmed,
        2
      );
    }

    expect(
      adminAcceptanceCountFmrV3_(
        snapshot.transactions,
        'type',
        'BACKORDER_CONFIRMED'
      ) === 2,
      'Expected two confirmation transactions.'
    );
  } else if (
    stage === 'REJECTED'
  ) {
    expectNumber(
      'Pending backorder',
      snapshot.quantities
        .pendingBackorder,
      0
    );

    expectNumber(
      'Confirmed backorder',
      snapshot.quantities
        .confirmedBackorder,
      0
    );

    expect(
      snapshot.queueCount === 0,
      'Rejected request must leave queue.'
    );

    expect(
      snapshot.backorders.length === 1,
      'Expected one rejected row.'
    );

    if (snapshot.backorders.length === 1) {
      const request =
        snapshot.backorders[0];

      expect(
        normalizeUpperFmrV3_(
          request.status
        ) === 'REJECTED',
        'Status must be Rejected.'
      );

      expect(
        !request.active,
        'Rejected request must be inactive.'
      );
    }

    expect(
      adminAcceptanceCountFmrV3_(
        snapshot.transactions,
        'type',
        'BACKORDER_REJECTED'
      ) === 1,
      'Expected BACKORDER_REJECTED transaction.'
    );

    expect(
      adminAcceptanceCountFmrV3_(
        snapshot.audits,
        'action',
        'BACKORDER_REJECT'
      ) >= 1,
      'Expected BACKORDER_REJECT audit.'
    );

    const activeActionable =
      snapshot.operationalIndexes
        .filter(function (entry) {
          return (
            entry.active &&
            (
              entry.type === 'BACKORDER' ||
              entry.type ===
                'BACKORDERLINE'
            )
          );
        }).length;

    expect(
      activeActionable === 0,
      'Rejected request still has actionable indexes.'
    );
  } else if (
    stage === 'RETURNED'
  ) {
    expectNumber(
      'Pending backorder',
      snapshot.quantities
        .pendingBackorder,
      0
    );

    expectNumber(
      'Confirmed backorder',
      snapshot.quantities
        .confirmedBackorder,
      0
    );

    expect(
      snapshot.queueCount === 0,
      'Returned request must leave Admin queue.'
    );

    expect(
      snapshot.backorders.length === 1,
      'Expected one returned row.'
    );

    if (snapshot.backorders.length === 1) {
      const request =
        snapshot.backorders[0];

      expect(
        normalizeUpperFmrV3_(
          request.status
        ) ===
          'RETURNED FOR REVIEW',
        'Status must be Returned for Review.'
      );

      expect(
        request.active,
        'Returned request must remain active.'
      );

      expectNumber(
        'Returned quantity',
        request.quantityPending,
        2
      );
    }

    expect(
      snapshot.workflowPhase ===
        'FIELD_REVIEW_REQUIRED',
      'Field workflow must require review.'
    );

    expect(
      snapshot.requiresFieldReview,
      'Field review flag must be true.'
    );

    expect(
      snapshot.returnedBackorders
        .length === 1,
      'Expected one returned Field request.'
    );

    if (
      snapshot.returnedBackorders
        .length === 1
    ) {
      expectNumber(
        'Returned Field quantity',
        snapshot.returnedBackorders[0]
          .quantity,
        2
      );
    }

    expect(
      adminAcceptanceCountFmrV3_(
        snapshot.transactions,
        'type',
        'BACKORDER_RETURNED'
      ) === 1,
      'Expected BACKORDER_RETURNED transaction.'
    );
  } else if (
    stage === 'SPLIT_RETURNED'
  ) {
    expectNumber(
      'Pending backorder',
      snapshot.quantities
        .pendingBackorder,
      0
    );

    expectNumber(
      'Confirmed backorder',
      snapshot.quantities
        .confirmedBackorder,
      1
    );

    expect(
      snapshot.queueCount === 0,
      'Split result must leave Admin queue.'
    );

    expect(
      snapshot.backorders.length === 2,
      'Split result must contain two rows.'
    );

    expect(
      adminAcceptanceCountFmrV3_(
        snapshot.backorders,
        'status',
        'CONFIRMED'
      ) === 1,
      'Split result must preserve one Confirmed row.'
    );

    expect(
      adminAcceptanceCountFmrV3_(
        snapshot.backorders,
        'status',
        'RETURNED FOR REVIEW'
      ) === 1,
      'Split result must create one Returned row.'
    );

    const confirmed =
      snapshot.backorders.find(
        function (row) {
          return (
            normalizeUpperFmrV3_(
              row.status
            ) === 'CONFIRMED'
          );
        }
      );

    const returned =
      snapshot.backorders.find(
        function (row) {
          return (
            normalizeUpperFmrV3_(
              row.status
            ) ===
            'RETURNED FOR REVIEW'
          );
        }
      );

    if (confirmed) {
      expectNumber(
        'Split confirmed',
        confirmed.quantityConfirmed,
        1
      );

      expectNumber(
        'Split confirmed pending',
        confirmed.quantityPending,
        0
      );
    }

    if (returned) {
      expectNumber(
        'Split returned',
        returned.quantityPending,
        1
      );

      expectNumber(
        'Split returned confirmed',
        returned.quantityConfirmed,
        0
      );
    }

    expect(
      snapshot.workflowPhase ===
        'FIELD_REVIEW_REQUIRED',
      'Split remainder must require Field review.'
    );

    expect(
      snapshot.returnedBackorders
        .length === 1,
      'Expected one Field returned remainder.'
    );

    if (
      snapshot.returnedBackorders
        .length === 1
    ) {
      expectNumber(
        'Field returned remainder',
        snapshot.returnedBackorders[0]
          .quantity,
        1
      );
    }

    expect(
      adminAcceptanceCountFmrV3_(
        snapshot.audits,
        'action',
        'BACKORDER_RETURN_SPLIT_CREATED'
      ) >= 1,
      'Expected split-created audit.'
    );
  } else {
    throw new Error(
      'Unsupported stage: ' + stage
    );
  }

  const header =
    snapshot.headerTotals || {};

  expectNumber(
    'Header requested',
    header.requested,
    snapshot.quantities.requested
  );

  expectNumber(
    'Header pending',
    header.pendingBackorder,
    snapshot.quantities
      .pendingBackorder
  );

  expectNumber(
    'Header confirmed',
    header.confirmedBackorder,
    snapshot.quantities
      .confirmedBackorder
  );

  expectNumber(
    'Header remaining',
    header.remaining,
    snapshot.quantities.remaining
  );

  return {
    passed:
      mismatches.length === 0,
    mismatchCount:
      mismatches.length,
    mismatches: mismatches
  };
}

function verifyAdminAcceptanceStageFmrV3_(
  fixtureKey,
  stageName
) {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const started = Date.now();

  const snapshot =
    adminAcceptanceSnapshotFmrV3_(
      fixtureKey,
      currentAdminAcceptanceEmailFmrV3_()
    );

  const comparison =
    compareAdminAcceptanceStageFmrV3_(
      snapshot,
      stageName
    );

  const integrity =
    inspectFmrV3DataIntegrity();

  const output = {
    passed:
      comparison.passed &&
      integrity.passed,
    readOnly: true,
    elapsedMs:
      Date.now() - started,
    version:
      FMR_V3.VERSION,
    fixtureKey:
      snapshot.fixtureKey,
    stage:
      normalizeUpperFmrV3_(
        stageName
      ),
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
    queueCount:
      snapshot.queueCount,
    backorders:
      snapshot.backorders,
    returnedBackorders:
      snapshot.returnedBackorders,
    transactionTypes:
      snapshot.transactions.map(
        function (item) {
          return item.type;
        }
      ),
    auditActions:
      snapshot.audits.map(
        function (item) {
          return item.action;
        }
      ),
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
    JSON.stringify(output, null, 2)
  );

  if (!output.passed) {
    throw new Error(
      'Sprint 3A ' +
      snapshot.fixtureKey +
      ' ' +
      stageName +
      ' failed: ' +
      comparison.mismatches.join(
        ' | '
      )
    );
  }

  return output;
}

function verifyAdminAcceptanceInitialFmrV3() {
  const results = [
    verifyAdminAcceptanceStageFmrV3_(
      'CONFIRM',
      'PENDING'
    ),
    verifyAdminAcceptanceStageFmrV3_(
      'REJECT',
      'PENDING'
    ),
    verifyAdminAcceptanceStageFmrV3_(
      'RETURN',
      'PENDING'
    ),
    verifyAdminAcceptanceStageFmrV3_(
      'SPLIT',
      'PENDING'
    )
  ];

  return {
    passed:
      results.every(
        function (result) {
          return result.passed;
        }
      ),
    readOnly: true,
    fixtureCount:
      results.length,
    results: results
  };
}

function verifyAdminConfirmPartialFmrV3() {
  return verifyAdminAcceptanceStageFmrV3_(
    'CONFIRM',
    'PARTIALLY_CONFIRMED'
  );
}

function verifyAdminConfirmFinalFmrV3() {
  return verifyAdminAcceptanceStageFmrV3_(
    'CONFIRM',
    'CONFIRMED'
  );
}

function verifyAdminRejectFinalFmrV3() {
  return verifyAdminAcceptanceStageFmrV3_(
    'REJECT',
    'REJECTED'
  );
}

function verifyAdminReturnFinalFmrV3() {
  return verifyAdminAcceptanceStageFmrV3_(
    'RETURN',
    'RETURNED'
  );
}

function verifyAdminSplitPartialFmrV3() {
  return verifyAdminAcceptanceStageFmrV3_(
    'SPLIT',
    'PARTIALLY_CONFIRMED'
  );
}

function verifyAdminSplitReturnFinalFmrV3() {
  return verifyAdminAcceptanceStageFmrV3_(
    'SPLIT',
    'SPLIT_RETURNED'
  );
}
