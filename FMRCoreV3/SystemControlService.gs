const FMR_V3_SYSTEM_CONTROL =
  Object.freeze({
    userLifecycleHeaders:
      Object.freeze([
        'Updated_By',
        'Updated_At',
        'Last_Login_At',
        'Last_Interface',
        'Deactivated_By',
        'Deactivated_At'
      ]),

    roleProfiles:
      Object.freeze({
        READ_ONLY:
          Object.freeze({
            key:
              'READ_ONLY',

            label:
              'Read Only',

            canSearch:
              true,

            canFieldTransact:
              false,

            canAdminBackorder:
              false,

            canOwnerEdit:
              false
          }),

        FIELD:
          Object.freeze({
            key:
              'FIELD',

            label:
              'Field User',

            canSearch:
              true,

            canFieldTransact:
              true,

            canAdminBackorder:
              false,

            canOwnerEdit:
              false
          }),

        ADMIN:
          Object.freeze({
            key:
              'ADMIN',

            label:
              'Material Admin',

            canSearch:
              true,

            canFieldTransact:
              false,

            canAdminBackorder:
              true,

            canOwnerEdit:
              false
          }),

        OWNER:
          Object.freeze({
            key:
              'OWNER',

            label:
              'System Owner',

            canSearch:
              true,

            canFieldTransact:
              true,

            canAdminBackorder:
              true,

            canOwnerEdit:
              true
          })
      }),

    configuration:
      Object.freeze({
        PROJECT_NAME:
          Object.freeze({
            defaultValue:
              'FMR Operations v3',

            description:
              'Project name displayed in the protected portal.',

            editable:
              true
          }),

        ENVIRONMENT_NAME:
          Object.freeze({
            defaultValue:
              'TEST',

            description:
              'Logical environment label for this database: TEST or PRODUCTION.',

            editable:
              true
          }),

        TRANSACTION_MODE:
          Object.freeze({
            defaultValue:
              'ENABLED',

            description:
              'ENABLED permits writes. READ_ONLY blocks Field, Admin, and Owner data transactions.',

            editable:
              true
          }),

        MAINTENANCE_MESSAGE:
          Object.freeze({
            defaultValue:
              '',

            description:
              'Message shown when transaction mode is READ_ONLY.',

            editable:
              true
          }),

        DEFAULT_CRAFT:
          Object.freeze({
            defaultValue:
              'PIPE',

            description:
              'Default craft used when generating FMR documents.',

            editable:
              true
          }),

        DEFAULT_DESTINATION:
          Object.freeze({
            defaultValue:
              'Field',

            description:
              'Default material destination.',

            editable:
              true
          }),

        DEFAULT_DELIVER_TO:
          Object.freeze({
            defaultValue:
              'Cedric Labassiere',

            description:
              'Default delivery contact.',

            editable:
              true
          }),

        DEFAULT_PRIORITY:
          Object.freeze({
            defaultValue:
              'Normal',

            description:
              'Default priority for newly staged FMRs.',

            editable:
              true
          }),

        TIMEZONE:
          Object.freeze({
            defaultValue:
              'America/Indiana/Indianapolis',

            description:
              'IANA timezone used for portal timestamps.',

            editable:
              true
          })
      }),

    environmentNames:
      Object.freeze([
        'TEST',
        'PRODUCTION'
      ]),

    transactionModes:
      Object.freeze([
        'ENABLED',
        'READ_ONLY'
      ])
  });

function systemControlUserHeadersFmrV3_() {
  return FMR_V3_HEADERS
    .Users
    .slice();
}

function ensureSystemControlUserHeadersFmrV3_() {
  const spreadsheet =
    fmrV3Database_();

  const sheet =
    spreadsheet.getSheetByName(
      FMR_V3.SHEETS.USERS
    );

  if (!sheet) {
    throw new Error(
      'Missing required sheet: ' +
      FMR_V3.SHEETS.USERS
    );
  }

  const expected =
    systemControlUserHeadersFmrV3_();

  const currentWidth =
    Math.max(
      sheet.getLastColumn(),
      expected.length
    );

  if (
    sheet.getMaxColumns() <
    expected.length
  ) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      expected.length -
      sheet.getMaxColumns()
    );
  }

  const current =
    sheet
      .getRange(
        1,
        1,
        1,
        currentWidth
      )
      .getDisplayValues()[0]
      .map(
        function (
          value
        ) {
          return normalizeFmrV3_(
            value
          );
        }
      );

  expected.forEach(
    function (
      header,
      index
    ) {
      const found =
        current[index];

      if (
        found &&
        found !== header
      ) {
        throw new Error(
          (
            'Users header mismatch at column ' +
            (index + 1) +
            '. Expected "' +
            header +
            '", found "' +
            found +
            '".'
          )
        );
      }

      if (!found) {
        sheet
          .getRange(
            1,
            index + 1
          )
          .setValue(
            header
          );
      }
    }
  );

  FMR_V3_HEADER_MAP_CACHE_[
    FMR_V3.SHEETS.USERS
  ] = null;

  return {
    sheetName:
      FMR_V3.SHEETS.USERS,

    headerCount:
      expected.length,

    lifecycleHeaders:
      Array.from(
        FMR_V3_SYSTEM_CONTROL
          .userLifecycleHeaders
      )
  };
}

function ensureSystemControlConfigurationFmrV3_() {
  const sheet =
    fmrV3Database_()
      .getSheetByName(
        FMR_V3.SHEETS.CONFIG
      );

  if (!sheet) {
    throw new Error(
      'Missing required sheet: ' +
      FMR_V3.SHEETS.CONFIG
    );
  }

  const existing = {};

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow >= 2
  ) {
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        4
      )
      .getValues()
      .forEach(
        function (
          values,
          index
        ) {
          const key =
            normalizeUpperFmrV3_(
              values[0]
            );

          if (key) {
            existing[
              key
            ] = {
              rowNumber:
                index + 2,

              value:
                values[1],

              description:
                values[2],

              editable:
                values[3]
            };
          }
        }
      );
  }

  const effectiveEmail =
    normalizeEmailFmrV3_(
      Session
        .getEffectiveUser()
        .getEmail()
    );

  const settings =
    Object.assign(
      {
        OWNER_EMAIL:
          Object.freeze({
            defaultValue:
              effectiveEmail,

            description:
              'Configured System Owner email. Transfer is intentionally not available from the portal.',

            editable:
              false
          })
      },
      FMR_V3_SYSTEM_CONTROL
        .configuration
    );

  const inserted = [];
  const updated = [];

  Object.keys(
    settings
  ).forEach(
    function (
      key
    ) {
      const definition =
        settings[
          key
        ];

      const current =
        existing[
          key
        ];

      if (!current) {
        sheet.appendRow([
          key,
          definition
            .defaultValue,
          definition
            .description,
          definition
            .editable
            ? FMR_V3.YES
            : FMR_V3.NO
        ]);

        inserted.push(
          key
        );

        return;
      }

      const patch = [
        key,
        current.value === '' ||
        current.value === null
          ? definition
              .defaultValue
          : current.value,
        definition
          .description,
        definition
          .editable
          ? FMR_V3.YES
          : FMR_V3.NO
      ];

      sheet
        .getRange(
          current.rowNumber,
          1,
          1,
          4
        )
        .setValues([
          patch
        ]);

      updated.push(
        key
      );
    }
  );

  invalidateConfigurationCacheFmrV3_();

  return {
    sheetName:
      FMR_V3.SHEETS.CONFIG,

    inserted:
      inserted,

    updated:
      updated
  };
}

function validSystemUserEmailFmrV3_(
  email
) {
  const normalized =
    normalizeEmailFmrV3_(
      email
    );

  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(
        normalized
      )
  );
}

function systemRoleProfileFmrV3_(
  profileKey
) {
  const key =
    normalizeUpperFmrV3_(
      profileKey
    );

  const profile =
    FMR_V3_SYSTEM_CONTROL
      .roleProfiles[
        key
      ];

  if (!profile) {
    throw new Error(
      (
        'Role profile must be one of: ' +
        Object.keys(
          FMR_V3_SYSTEM_CONTROL
            .roleProfiles
        ).join(', ') +
        '.'
      )
    );
  }

  return profile;
}

function inferSystemRoleProfileFmrV3_(
  record
) {
  const flags = {
    canSearch:
      yesFmrV3_(
        record.Can_Search
      ),

    canFieldTransact:
      yesFmrV3_(
        record
          .Can_Field_Transact
      ),

    canAdminBackorder:
      yesFmrV3_(
        record
          .Can_Admin_Backorder
      ),

    canOwnerEdit:
      yesFmrV3_(
        record.Can_Owner_Edit
      )
  };

  const profiles =
    Object.keys(
      FMR_V3_SYSTEM_CONTROL
        .roleProfiles
    );

  const match =
    profiles.find(
      function (
        key
      ) {
        const profile =
          FMR_V3_SYSTEM_CONTROL
            .roleProfiles[
              key
            ];

        return (
          flags.canSearch ===
            profile.canSearch &&
          flags.canFieldTransact ===
            profile.canFieldTransact &&
          flags.canAdminBackorder ===
            profile.canAdminBackorder &&
          flags.canOwnerEdit ===
            profile.canOwnerEdit
        );
      }
    );

  return (
    match ||
    'CUSTOM'
  );
}

function userCacheKeyFmrV3_(
  email
) {
  const normalizedEmail =
    normalizeEmailFmrV3_(
      email
    );

  return (
    'fmr3:user:' +
    Utilities
      .base64EncodeWebSafe(
        Utilities.computeDigest(
          Utilities
            .DigestAlgorithm
            .SHA_256,
          normalizedEmail
        )
      )
      .slice(
        0,
        40
      )
  );
}

function invalidateUserCacheFmrV3_(
  email
) {
  const normalized =
    normalizeEmailFmrV3_(
      email
    );

  if (!normalized) {
    return;
  }

  CacheService
    .getScriptCache()
    .remove(
      userCacheKeyFmrV3_(
        normalized
      )
    );
}

function serializeSystemUserFmrV3_(
  record
) {
  return {
    userId:
      normalizeFmrV3_(
        record.User_ID
      ),

    email:
      normalizeEmailFmrV3_(
        record.Email
      ),

    displayName:
      normalizeFmrV3_(
        record.Display_Name
      ),

    role:
      normalizeFmrV3_(
        record.Role
      ),

    profile:
      inferSystemRoleProfileFmrV3_(
        record
      ),

    canSearch:
      yesFmrV3_(
        record.Can_Search
      ),

    canFieldTransact:
      yesFmrV3_(
        record
          .Can_Field_Transact
      ),

    canAdminBackorder:
      yesFmrV3_(
        record
          .Can_Admin_Backorder
      ),

    canOwnerEdit:
      yesFmrV3_(
        record.Can_Owner_Edit
      ),

    active:
      yesFmrV3_(
        record.Active
      ),

    createdAt:
      formatDateTimeFmrV3_(
        record.Created_At
      ),

    updatedAt:
      formatDateTimeFmrV3_(
        record.Updated_At
      ),

    updatedBy:
      normalizeEmailFmrV3_(
        record.Updated_By
      ),

    lastLoginAt:
      formatDateTimeFmrV3_(
        record.Last_Login_At
      ),

    lastInterface:
      normalizeUpperFmrV3_(
        record.Last_Interface
      ),

    deactivatedAt:
      formatDateTimeFmrV3_(
        record.Deactivated_At
      ),

    deactivatedBy:
      normalizeEmailFmrV3_(
        record.Deactivated_By
      ),

    notes:
      normalizeFmrV3_(
        record.Notes
      )
  };
}

function databaseFingerprintFmrV3_() {
  const digest =
    Utilities.computeDigest(
      Utilities
        .DigestAlgorithm
        .SHA_256,
      normalizeFmrV3_(
        FMR_V3_DATABASE_ID_
      )
    );

  return Utilities
    .base64EncodeWebSafe(
      digest
    )
    .replace(
      /=+$/g,
      ''
    )
    .slice(
      0,
      12
    );
}

function normalizeEnvironmentNameFmrV3_(
  value
) {
  const normalized =
    normalizeUpperFmrV3_(
      value
    ) ||
    'TEST';

  if (
    !FMR_V3_SYSTEM_CONTROL
      .environmentNames
      .includes(
        normalized
      )
  ) {
    throw new Error(
      'Environment name must be TEST or PRODUCTION.'
    );
  }

  return normalized;
}

function normalizeTransactionModeFmrV3_(
  value
) {
  const normalized =
    normalizeUpperFmrV3_(
      value
    ) ||
    'ENABLED';

  if (
    !FMR_V3_SYSTEM_CONTROL
      .transactionModes
      .includes(
        normalized
      )
  ) {
    throw new Error(
      'Transaction mode must be ENABLED or READ_ONLY.'
    );
  }

  return normalized;
}

function runtimeEnvironmentFmrV3_(
  boundEnvironment
) {
  const configuration =
    getConfigurationFmrV3_();

  return {
    projectName:
      normalizeFmrV3_(
        configuration
          .PROJECT_NAME
      ) ||
      'FMR Operations v3',

    environmentName:
      normalizeEnvironmentNameFmrV3_(
        configuration
          .ENVIRONMENT_NAME
      ),

    boundEnvironment:
      normalizeUpperFmrV3_(
        boundEnvironment
      ) ||
      'UNSPECIFIED',

    transactionMode:
      normalizeTransactionModeFmrV3_(
        configuration
          .TRANSACTION_MODE
      ),

    maintenanceMessage:
      normalizeFmrV3_(
        configuration
          .MAINTENANCE_MESSAGE
      ),

    ownerEmail:
      normalizeEmailFmrV3_(
        configuration
          .OWNER_EMAIL
      ),

    databaseFingerprint:
      databaseFingerprintFmrV3_(),

    defaults: {
      craft:
        normalizeFmrV3_(
          configuration
            .DEFAULT_CRAFT
        ),

      destination:
        normalizeFmrV3_(
          configuration
            .DEFAULT_DESTINATION
        ),

      deliverTo:
        normalizeFmrV3_(
          configuration
            .DEFAULT_DELIVER_TO
        ),

      priority:
        normalizeFmrV3_(
          configuration
            .DEFAULT_PRIORITY
        ),

      timezone:
        normalizeFmrV3_(
          configuration.TIMEZONE
        )
    }
  };
}

function assertWriteEnabledFmrV3_(
  actionLabel
) {
  const environment =
    runtimeEnvironmentFmrV3_(
      ''
    );

  if (
    environment.transactionMode !==
    'ENABLED'
  ) {
    const message =
      environment
        .maintenanceMessage ||
      (
        environment
          .projectName +
        ' is currently read only.'
      );

    throw new Error(
      (
        normalizeFmrV3_(
          actionLabel
        ) ||
        'This transaction'
      ) +
      ' is unavailable. ' +
      message
    );
  }

  return environment;
}

function recordUserAccessFmrV3_(
  userEmail,
  interfaceName
) {
  const email =
    normalizeEmailFmrV3_(
      userEmail
    );

  if (!email) {
    return null;
  }

  const cache =
    CacheService
      .getScriptCache();

  const cacheKey =
    (
      'fmr3:last-access:' +
      Utilities
        .base64EncodeWebSafe(
          Utilities.computeDigest(
            Utilities
              .DigestAlgorithm
              .SHA_256,
            email
          )
        )
        .slice(
          0,
          40
        )
    );

  if (
    cache.get(
      cacheKey
    )
  ) {
    return null;
  }

  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS.USERS,
      2,
      email
    );

  if (
    !rows.length
  ) {
    return null;
  }

  const now =
    nowFmrV3_();

  updateRowObjectFmrV3_(
    FMR_V3.SHEETS.USERS,
    rows[0],
    {
      Last_Login_At:
        now,

      Last_Interface:
        normalizeUpperFmrV3_(
          interfaceName
        ) ||
        'PORTAL'
    }
  );

  cache.put(
    cacheKey,
    '1',
    21600
  );

  return now;
}

function getSystemControlFmrV3_(
  userEmail,
  boundEnvironment
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const users =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.USERS
    )
      .map(
        serializeSystemUserFmrV3_
      )
      .sort(
        function (
          left,
          right
        ) {
          const activeDifference =
            Number(
              right.active
            ) -
            Number(
              left.active
            );

          if (
            activeDifference !== 0
          ) {
            return activeDifference;
          }

          return left
            .displayName
            .localeCompare(
              right.displayName,
              undefined,
              {
                sensitivity:
                  'base'
              }
            );
        }
      );

  const environment =
    runtimeEnvironmentFmrV3_(
      boundEnvironment
    );

  const configuration =
    getConfigurationFmrV3_();

  return {
    generatedAt:
      formatDateTimeFmrV3_(
        nowFmrV3_()
      ),

    version:
      FMR_V3.VERSION,

    user:
      owner,

    environment:
      environment,

    configuration: {
      projectName:
        environment
          .projectName,

      environmentName:
        environment
          .environmentName,

      transactionMode:
        environment
          .transactionMode,

      maintenanceMessage:
        environment
          .maintenanceMessage,

      timezone:
        normalizeFmrV3_(
          configuration.TIMEZONE
        ),

      defaultCraft:
        normalizeFmrV3_(
          configuration
            .DEFAULT_CRAFT
        ),

      defaultDestination:
        normalizeFmrV3_(
          configuration
            .DEFAULT_DESTINATION
        ),

      defaultDeliverTo:
        normalizeFmrV3_(
          configuration
            .DEFAULT_DELIVER_TO
        ),

      defaultPriority:
        normalizeFmrV3_(
          configuration
            .DEFAULT_PRIORITY
        )
    },

    roleProfiles:
      Object.keys(
        FMR_V3_SYSTEM_CONTROL
          .roleProfiles
      ).map(
        function (
          key
        ) {
          const profile =
            FMR_V3_SYSTEM_CONTROL
              .roleProfiles[
                key
              ];

          return {
            key:
              profile.key,

            label:
              profile.label,

            canSearch:
              profile.canSearch,

            canFieldTransact:
              profile
                .canFieldTransact,

            canAdminBackorder:
              profile
                .canAdminBackorder,

            canOwnerEdit:
              profile
                .canOwnerEdit
          };
        }
      ),

    users:
      users,

    summary: {
      totalUsers:
        users.length,

      activeUsers:
        users.filter(
          function (
            user
          ) {
            return user.active;
          }
        ).length,

      fieldUsers:
        users.filter(
          function (
            user
          ) {
            return (
              user.active &&
              user
                .canFieldTransact
            );
          }
        ).length,

      admins:
        users.filter(
          function (
            user
          ) {
            return (
              user.active &&
              user
                .canAdminBackorder
            );
          }
        ).length
    }
  };
}

function upsertSystemUserFmrV3_(
  userEmail,
  payload
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const source =
    payload || {};

  const email =
    normalizeEmailFmrV3_(
      source.email
    );

  const displayName =
    normalizeFmrV3_(
      source.displayName
    );

  if (
    !validSystemUserEmailFmrV3_(
      email
    )
  ) {
    throw new Error(
      'Enter a valid Google account email.'
    );
  }

  if (!displayName) {
    throw new Error(
      'Display name is required.'
    );
  }

  const ownerEmail =
    normalizeEmailFmrV3_(
      getConfigurationFmrV3_()
        .OWNER_EMAIL
    );

  let requestedProfile =
    normalizeUpperFmrV3_(
      source.profile
    ) ||
    'READ_ONLY';

  if (
    email ===
    ownerEmail
  ) {
    requestedProfile =
      'OWNER';
  } else if (
    requestedProfile ===
    'OWNER'
  ) {
    throw new Error(
      'The OWNER profile is reserved for the configured System Owner.'
    );
  }

  const profile =
    systemRoleProfileFmrV3_(
      requestedProfile
    );

  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS.USERS,
      2,
      email
    );

  if (
    rows.length > 1
  ) {
    throw new Error(
      'Duplicate Users rows exist for ' +
      email +
      '. Resolve the duplicate before continuing.'
    );
  }

  const now =
    nowFmrV3_();

  let record;
  let action;

  if (
    rows.length
  ) {
    const existing =
      readRowObjectFmrV3_(
        FMR_V3.SHEETS.USERS,
        rows[0]
      );

    record =
      updateRowObjectFmrV3_(
        FMR_V3.SHEETS.USERS,
        rows[0],
        {
          Display_Name:
            displayName,

          Role:
            profile.label,

          Can_Search:
            profile.canSearch
              ? FMR_V3.YES
              : FMR_V3.NO,

          Can_Field_Transact:
            profile
              .canFieldTransact
              ? FMR_V3.YES
              : FMR_V3.NO,

          Can_Admin_Backorder:
            profile
              .canAdminBackorder
              ? FMR_V3.YES
              : FMR_V3.NO,

          Can_Owner_Edit:
            profile
              .canOwnerEdit
              ? FMR_V3.YES
              : FMR_V3.NO,

          Active:
            normalizeUpperFmrV3_(
              existing.Active
            ) ||
            FMR_V3.YES,

          Updated_By:
            owner.email,

          Updated_At:
            now,

          Notes:
            normalizeFmrV3_(
              source.notes
            )
        }
      );

    action =
      'SYSTEM_USER_UPDATED';
  } else {
    const rowNumber =
      appendObjectFmrV3_(
        FMR_V3.SHEETS.USERS,
        {
          User_ID:
            uuidFmrV3_(
              'USER'
            ),

          Email:
            email,

          Display_Name:
            displayName,

          Role:
            profile.label,

          Can_Search:
            profile.canSearch
              ? FMR_V3.YES
              : FMR_V3.NO,

          Can_Field_Transact:
            profile
              .canFieldTransact
              ? FMR_V3.YES
              : FMR_V3.NO,

          Can_Admin_Backorder:
            profile
              .canAdminBackorder
              ? FMR_V3.YES
              : FMR_V3.NO,

          Can_Owner_Edit:
            profile
              .canOwnerEdit
              ? FMR_V3.YES
              : FMR_V3.NO,

          Active:
            FMR_V3.YES,

          Created_At:
            now,

          Notes:
            normalizeFmrV3_(
              source.notes
            ),

          Updated_By:
            owner.email,

          Updated_At:
            now,

          Last_Login_At:
            '',

          Last_Interface:
            '',

          Deactivated_By:
            '',

          Deactivated_At:
            ''
        }
      );

    record =
      readRowObjectFmrV3_(
        FMR_V3.SHEETS.USERS,
        rowNumber
      );

    action =
      'SYSTEM_USER_CREATED';
  }

  invalidateUserCacheFmrV3_(
    email
  );

  appendAuditFmrV3_(
    'USER',
    record.User_ID,
    action,
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'OWNER',

      payload: {
        email:
          email,

        profile:
          profile.key,

        active:
          yesFmrV3_(
            record.Active
          )
      }
    }
  );

  SpreadsheetApp.flush();

  return {
    success:
      true,

    message:
      action ===
      'SYSTEM_USER_CREATED'
        ? 'User access created.'
        : 'User access updated.',

    user:
      serializeSystemUserFmrV3_(
        record
      )
  };
}

function setSystemUserActiveFmrV3_(
  userEmail,
  targetEmail,
  active,
  reason
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const email =
    normalizeEmailFmrV3_(
      targetEmail
    );

  const ownerEmail =
    normalizeEmailFmrV3_(
      getConfigurationFmrV3_()
        .OWNER_EMAIL
    );

  if (
    email ===
    ownerEmail &&
    !active
  ) {
    throw new Error(
      'The configured System Owner cannot be deactivated.'
    );
  }

  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3.SHEETS.USERS,
      2,
      email
    );

  if (
    rows.length !== 1
  ) {
    throw new Error(
      'Expected one Users row for ' +
      email +
      '.'
    );
  }

  const now =
    nowFmrV3_();

  const record =
    updateRowObjectFmrV3_(
      FMR_V3.SHEETS.USERS,
      rows[0],
      {
        Active:
          active
            ? FMR_V3.YES
            : FMR_V3.NO,

        Updated_By:
          owner.email,

        Updated_At:
          now,

        Deactivated_By:
          active
            ? ''
            : owner.email,

        Deactivated_At:
          active
            ? ''
            : now,

        Notes:
          normalizeFmrV3_(
            reason
          ) ||
          normalizeFmrV3_(
            readRowObjectFmrV3_(
              FMR_V3.SHEETS.USERS,
              rows[0]
            ).Notes
          )
      }
    );

  invalidateUserCacheFmrV3_(
    email
  );

  appendAuditFmrV3_(
    'USER',
    record.User_ID,
    active
      ? 'SYSTEM_USER_REACTIVATED'
      : 'SYSTEM_USER_DEACTIVATED',
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'OWNER',

      payload: {
        email:
          email,

        active:
          Boolean(
            active
          ),

        reason:
          normalizeFmrV3_(
            reason
          )
      }
    }
  );

  SpreadsheetApp.flush();

  return {
    success:
      true,

    message:
      active
        ? 'User access reactivated.'
        : 'User access deactivated.',

    user:
      serializeSystemUserFmrV3_(
        record
      )
  };
}

function updateSystemConfigurationFmrV3_(
  userEmail,
  payload
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const source =
    payload || {};

  const values = {
    PROJECT_NAME:
      normalizeFmrV3_(
        source.projectName
      ),

    ENVIRONMENT_NAME:
      normalizeEnvironmentNameFmrV3_(
        source.environmentName
      ),

    TRANSACTION_MODE:
      normalizeTransactionModeFmrV3_(
        source.transactionMode
      ),

    MAINTENANCE_MESSAGE:
      normalizeFmrV3_(
        source.maintenanceMessage
      ),

    TIMEZONE:
      normalizeFmrV3_(
        source.timezone
      ),

    DEFAULT_CRAFT:
      normalizeFmrV3_(
        source.defaultCraft
      ),

    DEFAULT_DESTINATION:
      normalizeFmrV3_(
        source.defaultDestination
      ),

    DEFAULT_DELIVER_TO:
      normalizeFmrV3_(
        source.defaultDeliverTo
      ),

    DEFAULT_PRIORITY:
      normalizeFmrV3_(
        source.defaultPriority
      )
  };

  if (
    !values.PROJECT_NAME
  ) {
    throw new Error(
      'Project name is required.'
    );
  }

  if (
    !values.TIMEZONE
  ) {
    throw new Error(
      'Timezone is required.'
    );
  }

  const sheet =
    sheetFmrV3_(
      FMR_V3.SHEETS.CONFIG
    );

  const rows =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.CONFIG
    );

  const bySetting = {};

  rows.forEach(
    function (
      row
    ) {
      bySetting[
        normalizeUpperFmrV3_(
          row.Setting
        )
      ] =
        row;
    }
  );

  Object.keys(
    values
  ).forEach(
    function (
      key
    ) {
      const row =
        bySetting[
          key
        ];

      if (!row) {
        throw new Error(
          'Missing configuration setting: ' +
          key
        );
      }

      if (
        !yesFmrV3_(
          row.Editable
        )
      ) {
        throw new Error(
          key +
          ' is not editable.'
        );
      }

      sheet
        .getRange(
          row._rowNumber,
          2
        )
        .setValue(
          values[
            key
          ]
        );
    }
  );

  invalidateConfigurationCacheFmrV3_();

  appendAuditFmrV3_(
    'SYSTEM',
    'CONFIGURATION',
    'SYSTEM_CONFIGURATION_UPDATED',
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'OWNER',

      payload: {
        settings:
          values
      }
    }
  );

  SpreadsheetApp.flush();

  return {
    success:
      true,

    message:
      'Production configuration updated.',

    environment:
      runtimeEnvironmentFmrV3_(
        source.boundEnvironment
      )
  };
}

function migrateFmrV3SystemControls() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const userHeaders =
      ensureSystemControlUserHeadersFmrV3_();

    const configuration =
      ensureSystemControlConfigurationFmrV3_();

    const effectiveEmail =
      normalizeEmailFmrV3_(
        Session
          .getEffectiveUser()
          .getEmail()
      );

    const ownerEmail =
      normalizeEmailFmrV3_(
        getConfigurationFmrV3_()
          .OWNER_EMAIL
      );

    if (
      !ownerEmail
    ) {
      throw new Error(
        'OWNER_EMAIL could not be established.'
      );
    }

    const ownerRows =
      findRowsByExactValueFmrV3_(
        FMR_V3.SHEETS.USERS,
        2,
        ownerEmail
      );

    if (
      ownerRows.length === 0
    ) {
      appendObjectFmrV3_(
        FMR_V3.SHEETS.USERS,
        {
          User_ID:
            uuidFmrV3_(
              'USER'
            ),

          Email:
            ownerEmail,

          Display_Name:
            ownerEmail ===
              effectiveEmail
              ? (
                  Session
                    .getEffectiveUser()
                    .getEmail()
                )
              : ownerEmail,

          Role:
            'System Owner',

          Can_Search:
            FMR_V3.YES,

          Can_Field_Transact:
            FMR_V3.YES,

          Can_Admin_Backorder:
            FMR_V3.YES,

          Can_Owner_Edit:
            FMR_V3.YES,

          Active:
            FMR_V3.YES,

          Created_At:
            nowFmrV3_(),

          Notes:
            'Created by Sprint 4A system-control migration.',

          Updated_By:
            effectiveEmail,

          Updated_At:
            nowFmrV3_()
        }
      );
    } else if (
      ownerRows.length === 1
    ) {
      updateRowObjectFmrV3_(
        FMR_V3.SHEETS.USERS,
        ownerRows[0],
        {
          Role:
            'System Owner',

          Can_Search:
            FMR_V3.YES,

          Can_Field_Transact:
            FMR_V3.YES,

          Can_Admin_Backorder:
            FMR_V3.YES,

          Can_Owner_Edit:
            FMR_V3.YES,

          Active:
            FMR_V3.YES,

          Updated_By:
            effectiveEmail,

          Updated_At:
            nowFmrV3_()
        }
      );
    } else {
      throw new Error(
        'Duplicate configured System Owner rows exist.'
      );
    }

    invalidateUserCacheFmrV3_(
      ownerEmail
    );

    SpreadsheetApp.flush();

    const diagnostic =
      inspectFmrV3SystemControlContract();

    const output = {
      passed:
        diagnostic.passed,

      migration:
        'ALPHA10_SYSTEM_CONTROLS',

      version:
        FMR_V3.VERSION,

      userHeaders:
        userHeaders,

      configuration:
        configuration,

      ownerEmail:
        ownerEmail,

      postDiagnostic:
        diagnostic
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
        'Sprint 4A system-control migration failed its post-diagnostic.'
      );
    }

    return output;
  } finally {
    lock.releaseLock();
  }
}

function inspectFmrV3SystemControlContract(
  databaseId
) {
  const targetDatabaseId =
    normalizeFmrV3_(
      databaseId
    ) ||
    normalizeFmrV3_(
      FMR_V3_DATABASE_ID_
    ) ||
    FMR_V3.DEFAULT_DATABASE_ID;

  setFmrV3DatabaseContext_(
    targetDatabaseId
  );

  const started =
    Date.now();

  ensureSystemControlUserHeadersFmrV3_();

  const configuration =
    getConfigurationFmrV3_();

  const ownerEmail =
    normalizeEmailFmrV3_(
      configuration
        .OWNER_EMAIL
    );

  const users =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.USERS
    );

  const emailCounts = {};

  users.forEach(
    function (
      user
    ) {
      const email =
        normalizeEmailFmrV3_(
          user.Email
        );

      if (email) {
        emailCounts[
          email
        ] =
          numberFmrV3_(
            emailCounts[
              email
            ]
          ) +
          1;
      }
    }
  );

  const duplicateEmails =
    Object.keys(
      emailCounts
    ).filter(
      function (
        email
      ) {
        return (
          emailCounts[
            email
          ] > 1
        );
      }
    );

  const ownerRows =
    users.filter(
      function (
        user
      ) {
        return (
          normalizeEmailFmrV3_(
            user.Email
          ) ===
          ownerEmail
        );
      }
    );

  const ownerValid =
    ownerRows.length === 1 &&
    yesFmrV3_(
      ownerRows[0].Active
    ) &&
    yesFmrV3_(
      ownerRows[0]
        .Can_Owner_Edit
    ) &&
    yesFmrV3_(
      ownerRows[0]
        .Can_Search
    );

  let environmentName = '';
  let transactionMode = '';
  const validationErrors = [];

  try {
    environmentName =
      normalizeEnvironmentNameFmrV3_(
        configuration
          .ENVIRONMENT_NAME
      );
  } catch (
    error
  ) {
    validationErrors.push(
      error.message
    );
  }

  try {
    transactionMode =
      normalizeTransactionModeFmrV3_(
        configuration
          .TRANSACTION_MODE
      );
  } catch (
    error
  ) {
    validationErrors.push(
      error.message
    );
  }

  const expectedLifecycle =
    Array.from(
      FMR_V3_SYSTEM_CONTROL
        .userLifecycleHeaders
    );

  const missingLifecycle =
    expectedLifecycle.filter(
      function (
        header
      ) {
        return (
          !FMR_V3_HEADERS
            .Users
            .includes(
              header
            )
        );
      }
    );

  const output = {
    passed:
      Boolean(
        ownerEmail
      ) &&
      ownerValid &&
      duplicateEmails.length ===
        0 &&
      missingLifecycle.length ===
        0 &&
      validationErrors.length ===
        0 &&
      Boolean(
        normalizeFmrV3_(
          configuration
            .PROJECT_NAME
        )
      ) &&
      Boolean(
        normalizeFmrV3_(
          configuration.TIMEZONE
        )
      ),

    readOnly:
      true,

    elapsedMs:
      Date.now() -
      started,

    version:
      FMR_V3.VERSION,

    ownerEmail:
      ownerEmail,

    ownerValid:
      ownerValid,

    userCount:
      users.length,

    activeUserCount:
      users.filter(
        function (
          user
        ) {
          return yesFmrV3_(
            user.Active
          );
        }
      ).length,

    duplicateEmailCount:
      duplicateEmails.length,

    duplicateEmails:
      duplicateEmails,

    missingLifecycleHeaders:
      missingLifecycle,

    environmentName:
      environmentName,

    transactionMode:
      transactionMode,

    databaseFingerprint:
      databaseFingerprintFmrV3_(),

    validationErrors:
      validationErrors
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

function runFmrV3SystemControlDiagnostic() {
  const output =
    inspectFmrV3SystemControlContract();

  if (!output.passed) {
    throw new Error(
      'FMR v3 system-control diagnostic failed.'
    );
  }

  return output;
}

function runFmrV3RoleAdministrationRoundTripDiagnostic() {
  setFmrV3DatabaseContext_(
    FMR_V3.DEFAULT_DATABASE_ID
  );

  const ownerEmail =
    normalizeEmailFmrV3_(
      Session
        .getEffectiveUser()
        .getEmail()
    );

  const owner =
    assertOwnerFmrV3_(
      ownerEmail
    );

  const suffix =
    String(
      Date.now()
    );

  const email =
    (
      'sprint4a-diagnostic-' +
      suffix +
      '@example.invalid'
    );

  let rowNumber = 0;

  try {
    const created =
      upsertSystemUserFmrV3_(
        owner.email,
        {
          email:
            email,

          displayName:
            'Sprint 4A Diagnostic User',

          profile:
            'READ_ONLY',

          notes:
            'Temporary role-administration round-trip diagnostic.'
        }
      );

    const rows =
      findRowsByExactValueFmrV3_(
        FMR_V3.SHEETS.USERS,
        2,
        email
      );

    if (
      rows.length !== 1
    ) {
      throw new Error(
        'Diagnostic user was not created exactly once.'
      );
    }

    rowNumber =
      rows[0];

    const deactivated =
      setSystemUserActiveFmrV3_(
        owner.email,
        email,
        false,
        'Sprint 4A diagnostic deactivation.'
      );

    const reactivated =
      setSystemUserActiveFmrV3_(
        owner.email,
        email,
        true,
        'Sprint 4A diagnostic reactivation.'
      );

    const output = {
      passed:
        created.user.profile ===
          'READ_ONLY' &&
        created.user.active ===
          true &&
        deactivated.user.active ===
          false &&
        reactivated.user.active ===
          true,

      destructive:
        true,

      temporaryUser:
        email,

      createdProfile:
        created.user.profile,

      deactivated:
        deactivated.user.active ===
          false,

      reactivated:
        reactivated.user.active ===
          true
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
        'Role-administration round-trip assertions failed.'
      );
    }

    return output;
  } finally {
    if (
      rowNumber >= 2
    ) {
      sheetFmrV3_(
        FMR_V3.SHEETS.USERS
      ).deleteRow(
        rowNumber
      );

      invalidateUserCacheFmrV3_(
        email
      );

      SpreadsheetApp.flush();
    }
  }
}
