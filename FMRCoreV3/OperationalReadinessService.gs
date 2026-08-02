const FMR_V3_OPERATIONS =
  Object.freeze({
    sheets:
      Object.freeze({
        HEALTH:
          'Operational_Health_Log',

        BACKUPS:
          'Backup_History',

        RECOVERY:
          'Recovery_Actions'
      }),

    healthStatuses:
      Object.freeze({
        PASS:
          'PASS',

        WARN:
          'WARN',

        FAIL:
          'FAIL'
      }),

    backupStatuses:
      Object.freeze({
        SUCCESS:
          'SUCCESS',

        FAILED:
          'FAILED'
      }),

    recoveryActions:
      Object.freeze({
        REFRESH_HEADER_TOTALS:
          'REFRESH_HEADER_TOTALS',

        REBUILD_SEARCH_INDEX:
          'REBUILD_SEARCH_INDEX',

        SYNC_FIELD_NOTICES:
          'SYNC_FIELD_NOTICES',

        SAFE_RECONCILE:
          'SAFE_RECONCILE'
      }),

    recoveryStatuses:
      Object.freeze({
        PREVIEWED:
          'PREVIEWED',

        APPLIED:
          'APPLIED',

        FAILED:
          'FAILED'
      }),

    settings:
      Object.freeze({
        BACKUP_FOLDER_ID:
          Object.freeze({
            defaultValue:
              '',

            description:
              'Internal Google Drive folder ID used for database backups.',

            editable:
              false
          }),

        BACKUP_RETENTION_DAYS:
          Object.freeze({
            defaultValue:
              '30',

            description:
              'Number of days successful backup files are retained.',

            editable:
              true
          }),

        BACKUP_MAX_AGE_HOURS:
          Object.freeze({
            defaultValue:
              '30',

            description:
              'Maximum acceptable age of the latest successful backup.',

            editable:
              true
          }),

        STALE_BACKORDER_HOURS:
          Object.freeze({
            defaultValue:
              '48',

            description:
              'Pending backorder age that triggers an operational warning.',

            editable:
              true
          }),

        STALE_BAG_DAYS:
          Object.freeze({
            defaultValue:
              '7',

            description:
              'Active Bag & Tag age that triggers an operational warning.',

            editable:
              true
          }),

        HEALTH_HISTORY_LIMIT:
          Object.freeze({
            defaultValue:
              '100',

            description:
              'Maximum health-check records retained in the operational log.',

            editable:
              false
          })
      })
  });

function operationsSheetDefinitionsFmrV3_() {
  return [
    {
      name:
        FMR_V3_OPERATIONS
          .sheets
          .HEALTH,

      headers:
        FMR_V3_HEADERS[
          FMR_V3_OPERATIONS
            .sheets
            .HEALTH
        ]
    },
    {
      name:
        FMR_V3_OPERATIONS
          .sheets
          .BACKUPS,

      headers:
        FMR_V3_HEADERS[
          FMR_V3_OPERATIONS
            .sheets
            .BACKUPS
        ]
    },
    {
      name:
        FMR_V3_OPERATIONS
          .sheets
          .RECOVERY,

      headers:
        FMR_V3_HEADERS[
          FMR_V3_OPERATIONS
            .sheets
            .RECOVERY
        ]
    }
  ];
}

function ensureOperationsSheetFmrV3_(
  sheetName,
  headers
) {
  const spreadsheet =
    fmrV3Database_();

  let sheet =
    spreadsheet.getSheetByName(
      sheetName
    );

  if (!sheet) {
    sheet =
      spreadsheet.insertSheet(
        sheetName
      );
  }

  if (
    sheet.getMaxColumns() <
    headers.length
  ) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      headers.length -
      sheet.getMaxColumns()
    );
  }

  const current =
    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
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

  headers.forEach(
    function (
      header,
      index
    ) {
      const existing =
        current[
          index
        ];

      if (
        existing &&
        existing !== header
      ) {
        throw new Error(
          (
            sheetName +
            ' header mismatch at column ' +
            (index + 1) +
            '. Expected "' +
            header +
            '", found "' +
            existing +
            '".'
          )
        );
      }

      if (!existing) {
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

  sheet.setFrozenRows(
    1
  );

  FMR_V3_HEADER_MAP_CACHE_[
    sheetName
  ] = null;

  return {
    sheetName:
      sheetName,

    headerCount:
      headers.length
  };
}

function operationsConfigurationRowsFmrV3_() {
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

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow < 2
  ) {
    return [];
  }

  return sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      4
    )
    .getValues()
    .map(
      function (
        values,
        index
      ) {
        return {
          _rowNumber:
            index + 2,

          Setting:
            values[0],

          Value:
            values[1],

          Description:
            values[2],

          Editable:
            values[3]
        };
      }
    )
    .filter(
      function (
        row
      ) {
        return Boolean(
          normalizeFmrV3_(
            row.Setting
          )
        );
      }
    );
}

function ensureOperationsConfigurationFmrV3_() {
  const sheet =
    fmrV3Database_()
      .getSheetByName(
        FMR_V3.SHEETS.CONFIG
      );

  const existing = {};

  operationsConfigurationRowsFmrV3_()
    .forEach(
      function (
        row
      ) {
        existing[
          normalizeUpperFmrV3_(
            row.Setting
          )
        ] = row;
      }
    );

  const inserted = [];
  const updated = [];

  Object.keys(
    FMR_V3_OPERATIONS
      .settings
  ).forEach(
    function (
      key
    ) {
      const definition =
        FMR_V3_OPERATIONS
          .settings[
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

      sheet
        .getRange(
          current._rowNumber,
          1,
          1,
          4
        )
        .setValues([
          [
            key,
            current.Value === '' ||
            current.Value === null
              ? definition
                  .defaultValue
              : current.Value,
            definition
              .description,
            definition
              .editable
              ? FMR_V3.YES
              : FMR_V3.NO
          ]
        ]);

      updated.push(
        key
      );
    }
  );

  invalidateConfigurationCacheFmrV3_();

  return {
    inserted:
      inserted,

    updated:
      updated
  };
}

function setOperationsConfigurationValueFmrV3_(
  setting,
  value
) {
  const key =
    normalizeUpperFmrV3_(
      setting
    );

  const row =
    operationsConfigurationRowsFmrV3_()
      .find(
        function (
          item
        ) {
          return (
            normalizeUpperFmrV3_(
              item.Setting
            ) ===
            key
          );
        }
      );

  if (!row) {
    throw new Error(
      'Missing configuration setting: ' +
      key
    );
  }

  sheetFmrV3_(
    FMR_V3.SHEETS.CONFIG
  )
    .getRange(
      row._rowNumber,
      2
    )
    .setValue(
      value
    );

  invalidateConfigurationCacheFmrV3_();

  return value;
}

function positiveIntegerOperationsFmrV3_(
  value,
  fallback,
  minimum,
  maximum
) {
  const parsed =
    Math.floor(
      numberFmrV3_(
        value
      )
    );

  const resolved =
    parsed > 0
      ? parsed
      : fallback;

  return Math.max(
    minimum,
    Math.min(
      maximum,
      resolved
    )
  );
}

function operationsSettingsFmrV3_() {
  const configuration =
    getConfigurationFmrV3_();

  return {
    backupFolderId:
      normalizeFmrV3_(
        configuration
          .BACKUP_FOLDER_ID
      ),

    backupRetentionDays:
      positiveIntegerOperationsFmrV3_(
        configuration
          .BACKUP_RETENTION_DAYS,
        30,
        1,
        3650
      ),

    backupMaxAgeHours:
      positiveIntegerOperationsFmrV3_(
        configuration
          .BACKUP_MAX_AGE_HOURS,
        30,
        1,
        8760
      ),

    staleBackorderHours:
      positiveIntegerOperationsFmrV3_(
        configuration
          .STALE_BACKORDER_HOURS,
        48,
        1,
        8760
      ),

    staleBagDays:
      positiveIntegerOperationsFmrV3_(
        configuration
          .STALE_BAG_DAYS,
        7,
        1,
        3650
      ),

    healthHistoryLimit:
      positiveIntegerOperationsFmrV3_(
        configuration
          .HEALTH_HISTORY_LIMIT,
        100,
        10,
        1000
      )
  };
}

function fingerprintOperationsIdFmrV3_(
  value
) {
  const normalized =
    normalizeFmrV3_(
      value
    );

  if (!normalized) {
    return '';
  }

  return Utilities
    .base64EncodeWebSafe(
      Utilities.computeDigest(
        Utilities
          .DigestAlgorithm
          .SHA_256,
        normalized
      )
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

function hoursBetweenOperationsFmrV3_(
  earlier,
  later
) {
  const start =
    earlier instanceof Date
      ? earlier
      : new Date(
          earlier
        );

  const end =
    later instanceof Date
      ? later
      : new Date(
          later
        );

  const startMs =
    start.getTime();

  const endMs =
    end.getTime();

  if (
    !Number.isFinite(
      startMs
    ) ||
    !Number.isFinite(
      endMs
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    (
      endMs -
      startMs
    ) /
    3600000
  );
}

function latestRowByDateFmrV3_(
  rows,
  dateField,
  predicate
) {
  return (
    (rows || [])
      .filter(
        function (
          row
        ) {
          return (
            !predicate ||
            predicate(
              row
            )
          );
        }
      )
      .sort(
        function (
          left,
          right
        ) {
          return (
            new Date(
              right[
                dateField
              ] ||
              0
            ).getTime() -
            new Date(
              left[
                dateField
              ] ||
              0
            ).getTime()
          );
        }
      )[0] ||
    null
  );
}

function ensureBackupFolderFmrV3_(
  owner,
  environment
) {
  const settings =
    operationsSettingsFmrV3_();

  if (
    settings.backupFolderId
  ) {
    try {
      return DriveApp.getFolderById(
        settings.backupFolderId
      );
    } catch (
      error
    ) {
      throw new Error(
        (
          'Configured backup folder is unavailable. ' +
          error.message
        )
      );
    }
  }

  const folderName =
    (
      environment
        .projectName +
      ' Backups - ' +
      environment
        .environmentName
    );

  const folder =
    DriveApp.createFolder(
      folderName
    );

  setOperationsConfigurationValueFmrV3_(
    'BACKUP_FOLDER_ID',
    folder.getId()
  );

  appendAuditFmrV3_(
    'SYSTEM',
    'BACKUP_FOLDER',
    'BACKUP_FOLDER_CREATED',
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'OWNER',

      payload: {
        folderName:
          folderName,

        folderFingerprint:
          fingerprintOperationsIdFmrV3_(
            folder.getId()
          )
      }
    }
  );

  return folder;
}

function backupHistoryRowsFmrV3_() {
  return getUsedRowsFmrV3_(
    FMR_V3_OPERATIONS
      .sheets
      .BACKUPS
  );
}

function latestSuccessfulBackupFmrV3_() {
  return latestRowByDateFmrV3_(
    backupHistoryRowsFmrV3_(),
    'Completed_At',
    function (
      row
    ) {
      return (
        normalizeUpperFmrV3_(
          row.Status
        ) ===
          FMR_V3_OPERATIONS
            .backupStatuses
            .SUCCESS &&
        yesFmrV3_(
          row.Active
        )
      );
    }
  );
}

function cleanupExpiredBackupsFmrV3_(
  owner
) {
  const settings =
    operationsSettingsFmrV3_();

  const now =
    nowFmrV3_();

  const cutoff =
    new Date(
      now.getTime() -
      (
        settings
          .backupRetentionDays *
        86400000
      )
    );

  let trashed = 0;
  const errors = [];

  backupHistoryRowsFmrV3_()
    .filter(
      function (
        row
      ) {
        return (
          yesFmrV3_(
            row.Active
          ) &&
          normalizeUpperFmrV3_(
            row.Status
          ) ===
            FMR_V3_OPERATIONS
              .backupStatuses
              .SUCCESS &&
          new Date(
            row.Completed_At ||
            0
          ).getTime() <
            cutoff.getTime()
        );
      }
    )
    .forEach(
      function (
        row
      ) {
        try {
          const fileId =
            normalizeFmrV3_(
              row.Backup_File_ID
            );

          if (fileId) {
            DriveApp
              .getFileById(
                fileId
              )
              .setTrashed(
                true
              );
          }

          updateRowObjectFmrV3_(
            FMR_V3_OPERATIONS
              .sheets
              .BACKUPS,
            row._rowNumber,
            {
              Active:
                FMR_V3.NO,

              Notes:
                (
                  normalizeFmrV3_(
                    row.Notes
                  ) +
                  ' Retention cleanup completed.'
                ).trim()
            }
          );

          trashed +=
            1;
        } catch (
          error
        ) {
          errors.push({
            backupId:
              row.Backup_ID,

            message:
              error.message
          });
        }
      }
    );

  if (
    trashed > 0 ||
    errors.length > 0
  ) {
    appendAuditFmrV3_(
      'SYSTEM',
      'BACKUP_RETENTION',
      'BACKUP_RETENTION_CLEANUP',
      owner,
      uuidFmrV3_(
        'CORR'
      ),
      {
        sourceInterface:
          'OWNER',

        payload: {
          retentionDays:
            settings
              .backupRetentionDays,

          trashed:
            trashed,

          errors:
            errors
        }
      }
    );
  }

  return {
    retentionDays:
      settings
        .backupRetentionDays,

    trashed:
      trashed,

    errors:
      errors
  };
}

function createDatabaseBackupFmrV3_(
  userEmail,
  triggerType,
  notes
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const environment =
    runtimeEnvironmentFmrV3_(
      ''
    );

  const backupId =
    uuidFmrV3_(
      'BACKUP'
    );

  const now =
    nowFmrV3_();

  const timezone =
    environment.defaults
      .timezone ||
    Session
      .getScriptTimeZone();

  const timestamp =
    Utilities.formatDate(
      now,
      timezone,
      'yyyyMMdd-HHmmss'
    );

  const fileName =
    (
      environment
        .projectName +
      ' - ' +
      environment
        .environmentName +
      ' Backup - ' +
      timestamp
    );

  let rowNumber = 0;
  let folder = null;

  try {
    folder =
      ensureBackupFolderFmrV3_(
        owner,
        environment
      );

    rowNumber =
      appendObjectFmrV3_(
        FMR_V3_OPERATIONS
          .sheets
          .BACKUPS,
        {
          Backup_ID:
            backupId,

          Backup_File_ID:
            '',

          Backup_File_Name:
            fileName,

          Database_Fingerprint:
            databaseFingerprintFmrV3_(),

          Environment:
            environment
              .environmentName,

          Trigger_Type:
            normalizeUpperFmrV3_(
              triggerType
            ) ||
            'MANUAL',

          Status:
            'IN_PROGRESS',

          Created_By_Email:
            owner.email,

          Created_By_Name:
            owner.name,

          Created_At:
            now,

          Completed_At:
            '',

          File_Size_Bytes:
            0,

          Folder_Fingerprint:
            fingerprintOperationsIdFmrV3_(
              folder.getId()
            ),

          Retention_Expires_At:
            new Date(
              now.getTime() +
              (
                operationsSettingsFmrV3_()
                  .backupRetentionDays *
                86400000
              )
            ),

          Error_Message:
            '',

          Notes:
            normalizeFmrV3_(
              notes
            ),

          Active:
            FMR_V3.YES
        }
      );

    const backupFile =
      DriveApp
        .getFileById(
          FMR_V3_DATABASE_ID_
        )
        .makeCopy(
          fileName,
          folder
        );

    const completed =
      nowFmrV3_();

    const updated =
      updateRowObjectFmrV3_(
        FMR_V3_OPERATIONS
          .sheets
          .BACKUPS,
        rowNumber,
        {
          Backup_File_ID:
            backupFile.getId(),

          Status:
            FMR_V3_OPERATIONS
              .backupStatuses
              .SUCCESS,

          Completed_At:
            completed,

          File_Size_Bytes:
            numberFmrV3_(
              backupFile.getSize()
            ),

          Active:
            FMR_V3.YES
        }
      );

    const retention =
      cleanupExpiredBackupsFmrV3_(
        owner
      );

    appendAuditFmrV3_(
      'BACKUP',
      backupId,
      'DATABASE_BACKUP_CREATED',
      owner,
      uuidFmrV3_(
        'CORR'
      ),
      {
        sourceInterface:
          normalizeUpperFmrV3_(
            triggerType
          ) ||
          'OWNER',

        payload: {
          backupFileName:
            fileName,

          databaseFingerprint:
            databaseFingerprintFmrV3_(),

          retention:
            retention
        }
      }
    );

    SpreadsheetApp.flush();

    return {
      success:
        true,

      backupId:
        backupId,

      fileName:
        fileName,

      createdAt:
        formatDateTimeFmrV3_(
          completed
        ),

      environment:
        environment
          .environmentName,

      databaseFingerprint:
        databaseFingerprintFmrV3_(),

      folderFingerprint:
        fingerprintOperationsIdFmrV3_(
          folder.getId()
        ),

      retention:
        retention,

      record:
        serializeBackupHistoryFmrV3_(
          updated
        )
    };
  } catch (
    error
  ) {
    const completed =
      nowFmrV3_();

    if (
      rowNumber >= 2
    ) {
      updateRowObjectFmrV3_(
        FMR_V3_OPERATIONS
          .sheets
          .BACKUPS,
        rowNumber,
        {
          Status:
            FMR_V3_OPERATIONS
              .backupStatuses
              .FAILED,

          Completed_At:
            completed,

          Error_Message:
            error.message,

          Active:
            FMR_V3.NO
        }
      );
    } else {
      appendObjectFmrV3_(
        FMR_V3_OPERATIONS
          .sheets
          .BACKUPS,
        {
          Backup_ID:
            backupId,

          Backup_File_ID:
            '',

          Backup_File_Name:
            fileName,

          Database_Fingerprint:
            databaseFingerprintFmrV3_(),

          Environment:
            environment
              .environmentName,

          Trigger_Type:
            normalizeUpperFmrV3_(
              triggerType
            ) ||
            'MANUAL',

          Status:
            FMR_V3_OPERATIONS
              .backupStatuses
              .FAILED,

          Created_By_Email:
            owner.email,

          Created_By_Name:
            owner.name,

          Created_At:
            now,

          Completed_At:
            completed,

          File_Size_Bytes:
            0,

          Folder_Fingerprint:
            folder
              ? fingerprintOperationsIdFmrV3_(
                  folder.getId()
                )
              : '',

          Retention_Expires_At:
            '',

          Error_Message:
            error.message,

          Notes:
            normalizeFmrV3_(
              notes
            ),

          Active:
            FMR_V3.NO
        }
      );
    }

    appendAuditFmrV3_(
      'BACKUP',
      backupId,
      'DATABASE_BACKUP_FAILED',
      owner,
      uuidFmrV3_(
        'CORR'
      ),
      {
        sourceInterface:
          normalizeUpperFmrV3_(
            triggerType
          ) ||
          'OWNER',

        payload: {
          error:
            error.message
        }
      }
    );

    SpreadsheetApp.flush();

    throw new Error(
      'Database backup failed: ' +
      error.message
    );
  }
}

function schemaHealthOperationsFmrV3_() {
  const missingSheets = [];
  const headerMismatches = [];

  Object.keys(
    FMR_V3_HEADERS
  ).forEach(
    function (
      sheetName
    ) {
      const sheet =
        fmrV3Database_()
          .getSheetByName(
            sheetName
          );

      if (!sheet) {
        missingSheets.push(
          sheetName
        );

        return;
      }

      try {
        headerMapFmrV3_(
          sheetName
        );
      } catch (
        error
      ) {
        headerMismatches.push({
          sheetName:
            sheetName,

          message:
            error.message
        });
      }
    }
  );

  return {
    passed:
      missingSheets.length ===
        0 &&
      headerMismatches.length ===
        0,

    missingSheets:
      missingSheets,

    headerMismatches:
      headerMismatches
  };
}

function activeBagHealthOperationsFmrV3_(
  settings,
  now
) {
  const headersById = {};

  getUsedRowsFmrV3_(
    FMR_V3.SHEETS
      .BAG_HEADERS
  ).forEach(
    function (
      row
    ) {
      headersById[
        normalizeFmrV3_(
          row.Bag_Tag_ID
        )
      ] = row;
    }
  );

  const activeItems =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .BAG_ITEMS
    )
      .filter(
        function (
          item
        ) {
          return (
            numberFmrV3_(
              item
                .Qty_Remaining_In_Bag
            ) > 0 &&
            [
              'ACTIVE',
              'PARTIALLY ISSUED'
            ].includes(
              normalizeUpperFmrV3_(
                item.Status
              )
            )
          );
        }
      );

  const stale =
    activeItems.filter(
      function (
        item
      ) {
        const header =
          headersById[
            normalizeFmrV3_(
              item.Bag_Tag_ID
            )
          ];

        const ageHours =
          header
            ? hoursBetweenOperationsFmrV3_(
                header.Bagged_At,
                now
              )
            : null;

        return (
          ageHours !== null &&
          ageHours >
            (
              settings
                .staleBagDays *
              24
            )
        );
      }
    );

  return {
    activeItems:
      activeItems.length,

    staleItems:
      stale.length,

    oldestAgeHours:
      activeItems.reduce(
        function (
          maximum,
          item
        ) {
          const header =
            headersById[
              normalizeFmrV3_(
                item.Bag_Tag_ID
              )
            ];

          const age =
            header
              ? hoursBetweenOperationsFmrV3_(
                  header.Bagged_At,
                  now
                )
              : null;

          return age ===
            null
            ? maximum
            : Math.max(
                maximum,
                age
              );
        },
        0
      )
  };
}

function backorderHealthOperationsFmrV3_(
  settings,
  now
) {
  const active =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .BACKORDERS
    )
      .filter(
        function (
          row
        ) {
          return (
            yesFmrV3_(
              row.Active
            ) &&
            [
              'PENDING ADMIN REVIEW',
              'PARTIALLY CONFIRMED'
            ].includes(
              normalizeUpperFmrV3_(
                row.Status
              )
            ) &&
            numberFmrV3_(
              row.Qty_Pending
            ) > 0
          );
        }
      );

  const stale =
    active.filter(
      function (
        row
      ) {
        const age =
          hoursBetweenOperationsFmrV3_(
            row.Reported_At,
            now
          );

        return (
          age !== null &&
          age >
            settings
              .staleBackorderHours
        );
      }
    );

  return {
    pending:
      active.length,

    stale:
      stale.length,

    oldestAgeHours:
      active.reduce(
        function (
          maximum,
          row
        ) {
          const age =
            hoursBetweenOperationsFmrV3_(
              row.Reported_At,
              now
            );

          return age ===
            null
            ? maximum
            : Math.max(
                maximum,
                age
              );
        },
        0
      )
  };
}

function fieldNoticeHealthOperationsFmrV3_() {
  const active =
    fieldNoticeRowsFmrV3_()
      .filter(
        function (
          row
        ) {
          return (
            yesFmrV3_(
              row.Active
            ) &&
            numberFmrV3_(
              row.Qty_Remaining
            ) > 0
          );
        }
      );

  return {
    returned:
      active.filter(
        function (
          row
        ) {
          return (
            normalizeUpperFmrV3_(
              row.Notice_Type
            ) ===
            'RETURNED_FOR_REVIEW'
          );
        }
      ).length,

    rejected:
      active.filter(
        function (
          row
        ) {
          return (
            normalizeUpperFmrV3_(
              row.Notice_Type
            ) ===
            'REJECTED'
          );
        }
      ).length
  };
}

function calculateOperationalHealthFmrV3_() {
  const started =
    Date.now();

  const now =
    nowFmrV3_();

  const settings =
    operationsSettingsFmrV3_();

  const schema =
    schemaHealthOperationsFmrV3_();

  const integrity =
    inspectFmrV3DataIntegrity();

  const systemControl =
    inspectFmrV3SystemControlContract();

  const environment =
    runtimeEnvironmentFmrV3_(
      ''
    );

  const backup =
    latestSuccessfulBackupFmrV3_();

  const backupAgeHours =
    backup
      ? hoursBetweenOperationsFmrV3_(
          backup.Completed_At,
          now
        )
      : null;

  const backorders =
    backorderHealthOperationsFmrV3_(
      settings,
      now
    );

  const bags =
    activeBagHealthOperationsFmrV3_(
      settings,
      now
    );

  const notices =
    fieldNoticeHealthOperationsFmrV3_();

  const recentTransactions =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .TRANSACTIONS
    )
      .filter(
        function (
          row
        ) {
          const age =
            hoursBetweenOperationsFmrV3_(
              row.Timestamp,
              now
            );

          return (
            age !== null &&
            age <= 24
          );
        }
      ).length;

  const publishedFmrs =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .HEADERS
    )
      .filter(
        function (
          row
        ) {
          return yesFmrV3_(
            row.Active
          );
        }
      ).length;

  const activeUsers =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.USERS
    )
      .filter(
        function (
          row
        ) {
          return yesFmrV3_(
            row.Active
          );
        }
      ).length;

  const hardFailure =
    (
      !schema.passed ||
      !integrity.passed ||
      !systemControl.passed
    );

  const warnings = [];

  if (!backup) {
    warnings.push(
      'No successful database backup exists.'
    );
  } else if (
    backupAgeHours >
    settings.backupMaxAgeHours
  ) {
    warnings.push(
      (
        'Latest successful backup is ' +
        Math.round(
          backupAgeHours *
          10
        ) /
        10 +
        ' hours old.'
      )
    );
  }

  if (
    backorders.stale > 0
  ) {
    warnings.push(
      (
        backorders.stale +
        ' backorder request(s) exceed the stale threshold.'
      )
    );
  }

  if (
    bags.staleItems > 0
  ) {
    warnings.push(
      (
        bags.staleItems +
        ' active Bag & Tag item(s) exceed the stale threshold.'
      )
    );
  }

  const overallStatus =
    hardFailure
      ? FMR_V3_OPERATIONS
          .healthStatuses
          .FAIL
      : warnings.length
        ? FMR_V3_OPERATIONS
            .healthStatuses
            .WARN
        : FMR_V3_OPERATIONS
            .healthStatuses
            .PASS;

  const rollout = {
    pilotReady:
      (
        schema.passed &&
        integrity.passed &&
        systemControl.passed &&
        Boolean(
          backup
        ) &&
        backupAgeHours <=
          settings
            .backupMaxAgeHours &&
        environment.transactionMode ===
          'ENABLED'
      ),

    productionReady:
      (
        environment
          .environmentName ===
          'PRODUCTION' &&
        schema.passed &&
        integrity.passed &&
        systemControl.passed &&
        Boolean(
          backup
        ) &&
        backupAgeHours <=
          settings
            .backupMaxAgeHours &&
        environment.transactionMode ===
          'ENABLED'
      )
  };

  return {
    generatedAt:
      formatDateTimeFmrV3_(
        now
      ),

    generatedAtValue:
      now,

    overallStatus:
      overallStatus,

    warnings:
      warnings,

    schema:
      schema,

    integrity: {
      passed:
        integrity.passed,

      lineIssueCount:
        integrity
          .lineIssueCount,

      headerIssueCount:
        integrity
          .headerIssueCount,

      bagIndexIssueCount:
        integrity
          .bagIndexIssueCount
    },

    systemControl: {
      passed:
        systemControl
          .passed,

      ownerValid:
        systemControl
          .ownerValid,

      duplicateEmailCount:
        systemControl
          .duplicateEmailCount
    },

    backup: {
      exists:
        Boolean(
          backup
        ),

      status:
        backup
          ? normalizeUpperFmrV3_(
              backup.Status
            )
          : 'MISSING',

      backupId:
        backup
          ? normalizeFmrV3_(
              backup.Backup_ID
            )
          : '',

      completedAt:
        backup
          ? formatDateTimeFmrV3_(
              backup.Completed_At
            )
          : '',

      ageHours:
        backupAgeHours,

      maxAgeHours:
        settings
          .backupMaxAgeHours,

      current:
        Boolean(
          backup
        ) &&
        backupAgeHours <=
          settings
            .backupMaxAgeHours
    },

    counts: {
      publishedFmrs:
        publishedFmrs,

      activeUsers:
        activeUsers,

      pendingBackorders:
        backorders.pending,

      staleBackorders:
        backorders.stale,

      returnedNotices:
        notices.returned,

      rejectedNotices:
        notices.rejected,

      activeBagItems:
        bags.activeItems,

      staleBagItems:
        bags.staleItems,

      recentTransactions24h:
        recentTransactions
    },

    thresholds: {
      staleBackorderHours:
        settings
          .staleBackorderHours,

      staleBagDays:
        settings
          .staleBagDays,

      backupMaxAgeHours:
        settings
          .backupMaxAgeHours
    },

    environment:
      environment,

    rollout:
      rollout,

    elapsedMs:
      Date.now() -
      started
  };
}

function appendOperationalHealthLogFmrV3_(
  health,
  user,
  triggerType
) {
  return appendObjectFmrV3_(
    FMR_V3_OPERATIONS
      .sheets
      .HEALTH,
    {
      Health_Run_ID:
        uuidFmrV3_(
          'HEALTH'
        ),

      Environment:
        health
          .environment
          .environmentName,

      Database_Fingerprint:
        health
          .environment
          .databaseFingerprint,

      Overall_Status:
        health
          .overallStatus,

      Integrity_Status:
        health
          .integrity
          .passed
          ? 'PASS'
          : 'FAIL',

      Schema_Status:
        health
          .schema
          .passed
          ? 'PASS'
          : 'FAIL',

      System_Control_Status:
        health
          .systemControl
          .passed
          ? 'PASS'
          : 'FAIL',

      Last_Backup_Status:
        health
          .backup
          .status,

      Last_Backup_At:
        health
          .backup
          .completedAt,

      Backup_Age_Hours:
        health
          .backup
          .ageHours === null
          ? ''
          : health
              .backup
              .ageHours,

      Published_FMRs:
        health
          .counts
          .publishedFmrs,

      Active_Users:
        health
          .counts
          .activeUsers,

      Pending_Backorders:
        health
          .counts
          .pendingBackorders,

      Returned_Notices:
        health
          .counts
          .returnedNotices,

      Rejected_Notices:
        health
          .counts
          .rejectedNotices,

      Stale_Backorders:
        health
          .counts
          .staleBackorders,

      Active_Bag_Items:
        health
          .counts
          .activeBagItems,

      Stale_Bag_Items:
        health
          .counts
          .staleBagItems,

      Recent_Transactions_24H:
        health
          .counts
          .recentTransactions24h,

      Diagnostic_Duration_Ms:
        health
          .elapsedMs,

      Trigger_Type:
        normalizeUpperFmrV3_(
          triggerType
        ) ||
        'MANUAL',

      Run_By_Email:
        user.email,

      Run_At:
        health
          .generatedAtValue,

      Details_JSON:
        JSON.stringify({
          warnings:
            health.warnings,

          rollout:
            health.rollout,

          thresholds:
            health.thresholds
        })
    }
  );
}

function trimOperationalHealthHistoryFmrV3_() {
  const settings =
    operationsSettingsFmrV3_();

  const sheet =
    sheetFmrV3_(
      FMR_V3_OPERATIONS
        .sheets
        .HEALTH
    );

  const dataRows =
    Math.max(
      0,
      sheet.getLastRow() -
      1
    );

  const excess =
    dataRows -
    settings
      .healthHistoryLimit;

  if (
    excess > 0
  ) {
    sheet.deleteRows(
      2,
      excess
    );
  }

  return Math.max(
    0,
    excess
  );
}

function runOperationalHealthCheckFmrV3_(
  userEmail,
  triggerType
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const health =
    calculateOperationalHealthFmrV3_();

  appendOperationalHealthLogFmrV3_(
    health,
    owner,
    triggerType
  );

  const trimmed =
    trimOperationalHealthHistoryFmrV3_();

  appendAuditFmrV3_(
    'SYSTEM',
    'OPERATIONAL_HEALTH',
    'OPERATIONAL_HEALTH_CHECK',
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        normalizeUpperFmrV3_(
          triggerType
        ) ||
        'OWNER',

      payload: {
        overallStatus:
          health
            .overallStatus,

        warnings:
          health
            .warnings,

        trimmedHistoryRows:
          trimmed
      }
    }
  );

  SpreadsheetApp.flush();

  return health;
}

function serializeBackupHistoryFmrV3_(
  row
) {
  return {
    backupId:
      normalizeFmrV3_(
        row.Backup_ID
      ),

    fileName:
      normalizeFmrV3_(
        row.Backup_File_Name
      ),

    environment:
      normalizeUpperFmrV3_(
        row.Environment
      ),

    triggerType:
      normalizeUpperFmrV3_(
        row.Trigger_Type
      ),

    status:
      normalizeUpperFmrV3_(
        row.Status
      ),

    createdBy:
      normalizeEmailFmrV3_(
        row.Created_By_Email
      ),

    createdAt:
      formatDateTimeFmrV3_(
        row.Created_At
      ),

    completedAt:
      formatDateTimeFmrV3_(
        row.Completed_At
      ),

    retentionExpiresAt:
      formatDateTimeFmrV3_(
        row.Retention_Expires_At
      ),

    errorMessage:
      normalizeFmrV3_(
        row.Error_Message
      ),

    active:
      yesFmrV3_(
        row.Active
      )
  };
}

function serializeHealthHistoryFmrV3_(
  row
) {
  return {
    healthRunId:
      normalizeFmrV3_(
        row.Health_Run_ID
      ),

    environment:
      normalizeUpperFmrV3_(
        row.Environment
      ),

    overallStatus:
      normalizeUpperFmrV3_(
        row.Overall_Status
      ),

    integrityStatus:
      normalizeUpperFmrV3_(
        row.Integrity_Status
      ),

    schemaStatus:
      normalizeUpperFmrV3_(
        row.Schema_Status
      ),

    systemControlStatus:
      normalizeUpperFmrV3_(
        row.System_Control_Status
      ),

    backupStatus:
      normalizeUpperFmrV3_(
        row.Last_Backup_Status
      ),

    pendingBackorders:
      numberFmrV3_(
        row.Pending_Backorders
      ),

    staleBackorders:
      numberFmrV3_(
        row.Stale_Backorders
      ),

    staleBagItems:
      numberFmrV3_(
        row.Stale_Bag_Items
      ),

    runAt:
      formatDateTimeFmrV3_(
        row.Run_At
      ),

    triggerType:
      normalizeUpperFmrV3_(
        row.Trigger_Type
      ),

    elapsedMs:
      numberFmrV3_(
        row.Diagnostic_Duration_Ms
      )
  };
}

function serializeRecoveryHistoryFmrV3_(
  row
) {
  return {
    recoveryId:
      normalizeFmrV3_(
        row.Recovery_ID
      ),

    actionType:
      normalizeUpperFmrV3_(
        row.Action_Type
      ),

    fmrNumber:
      normalizeFmrV3_(
        row.Target_FMR_Number
      ),

    status:
      normalizeUpperFmrV3_(
        row.Status
      ),

    previewedBy:
      normalizeEmailFmrV3_(
        row.Previewed_By_Email
      ),

    previewedAt:
      formatDateTimeFmrV3_(
        row.Previewed_At
      ),

    appliedBy:
      normalizeEmailFmrV3_(
        row.Applied_By_Email
      ),

    appliedAt:
      formatDateTimeFmrV3_(
        row.Applied_At
      ),

    reason:
      normalizeFmrV3_(
        row.Reason
      ),

    backupId:
      normalizeFmrV3_(
        row.Backup_ID
      ),

    errorMessage:
      normalizeFmrV3_(
        row.Error_Message
      )
  };
}

function getOperationsCenterFmrV3_(
  userEmail,
  boundEnvironment
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const environment =
    runtimeEnvironmentFmrV3_(
      boundEnvironment
    );

  const settings =
    operationsSettingsFmrV3_();

  const currentHealth =
    calculateOperationalHealthFmrV3_();

  const backups =
    backupHistoryRowsFmrV3_()
      .sort(
        function (
          left,
          right
        ) {
          return (
            new Date(
              right.Created_At ||
              0
            ).getTime() -
            new Date(
              left.Created_At ||
              0
            ).getTime()
          );
        }
      )
      .slice(
        0,
        10
      )
      .map(
        serializeBackupHistoryFmrV3_
      );

  const healthHistory =
    getUsedRowsFmrV3_(
      FMR_V3_OPERATIONS
        .sheets
        .HEALTH
    )
      .sort(
        function (
          left,
          right
        ) {
          return (
            new Date(
              right.Run_At ||
              0
            ).getTime() -
            new Date(
              left.Run_At ||
              0
            ).getTime()
          );
        }
      )
      .slice(
        0,
        10
      )
      .map(
        serializeHealthHistoryFmrV3_
      );

  const recoveryHistory =
    getUsedRowsFmrV3_(
      FMR_V3_OPERATIONS
        .sheets
        .RECOVERY
    )
      .sort(
        function (
          left,
          right
        ) {
          return (
            new Date(
              right.Previewed_At ||
              0
            ).getTime() -
            new Date(
              left.Previewed_At ||
              0
            ).getTime()
          );
        }
      )
      .slice(
        0,
        10
      )
      .map(
        serializeRecoveryHistoryFmrV3_
      );

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

    settings: {
      backupRetentionDays:
        settings
          .backupRetentionDays,

      backupMaxAgeHours:
        settings
          .backupMaxAgeHours,

      staleBackorderHours:
        settings
          .staleBackorderHours,

      staleBagDays:
        settings
          .staleBagDays,

      backupFolderConfigured:
        Boolean(
          settings
            .backupFolderId
        ),

      backupFolderFingerprint:
        fingerprintOperationsIdFmrV3_(
          settings
            .backupFolderId
        )
    },

    currentHealth:
      currentHealth,

    backups:
      backups,

    healthHistory:
      healthHistory,

    recoveryHistory:
      recoveryHistory
  };
}

function updateOperationalSettingsFmrV3_(
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
    BACKUP_RETENTION_DAYS:
      positiveIntegerOperationsFmrV3_(
        source
          .backupRetentionDays,
        30,
        1,
        3650
      ),

    BACKUP_MAX_AGE_HOURS:
      positiveIntegerOperationsFmrV3_(
        source
          .backupMaxAgeHours,
        30,
        1,
        8760
      ),

    STALE_BACKORDER_HOURS:
      positiveIntegerOperationsFmrV3_(
        source
          .staleBackorderHours,
        48,
        1,
        8760
      ),

    STALE_BAG_DAYS:
      positiveIntegerOperationsFmrV3_(
        source
          .staleBagDays,
        7,
        1,
        3650
      )
  };

  Object.keys(
    values
  ).forEach(
    function (
      key
    ) {
      setOperationsConfigurationValueFmrV3_(
        key,
        String(
          values[
            key
          ]
        )
      );
    }
  );

  appendAuditFmrV3_(
    'SYSTEM',
    'OPERATIONAL_SETTINGS',
    'OPERATIONAL_SETTINGS_UPDATED',
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
      'Operational thresholds updated.',

    settings:
      operationsSettingsFmrV3_()
  };
}

function recoveryActionFmrV3_(
  action
) {
  const normalized =
    normalizeUpperFmrV3_(
      action
    );

  if (
    !Object.values(
      FMR_V3_OPERATIONS
        .recoveryActions
    ).includes(
      normalized
    )
  ) {
    throw new Error(
      (
        'Recovery action must be one of: ' +
        Object.values(
          FMR_V3_OPERATIONS
            .recoveryActions
        ).join(', ') +
        '.'
      )
    );
  }

  return normalized;
}

function recoveryTargetSnapshotFmrV3_(
  fmrNumber
) {
  const normalizedFmr =
    normalizeUpperFmrV3_(
      fmrNumber
    );

  if (!normalizedFmr) {
    throw new Error(
      'FMR number is required.'
    );
  }

  const headers =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .HEADERS
    )
      .filter(
        function (
          row
        ) {
          return (
            normalizeUpperFmrV3_(
              row.FMR_Number
            ) ===
              normalizedFmr &&
            yesFmrV3_(
              row.Active
            )
          );
        }
      );

  if (
    headers.length !== 1
  ) {
    throw new Error(
      (
        'Expected one active published FMR for ' +
        normalizedFmr +
        ', found ' +
        headers.length +
        '.'
      )
    );
  }

  const header =
    headers[0];

  const lines =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS.LINES
    )
      .filter(
        function (
          row
        ) {
          return (
            normalizeFmrV3_(
              row.FMR_ID
            ) ===
              normalizeFmrV3_(
                header.FMR_ID
              ) &&
            yesFmrV3_(
              row.Active
            )
          );
        }
      )
      .sort(
        function (
          left,
          right
        ) {
          return (
            numberFmrV3_(
              left.Line_Number
            ) -
            numberFmrV3_(
              right.Line_Number
            )
          );
        }
      );

  if (!lines.length) {
    throw new Error(
      'Published FMR has no active material lines.'
    );
  }

  const searchIndexRows =
    getUsedRowsFmrV3_(
      FMR_V3.SHEETS
        .SEARCH_INDEX
    )
      .filter(
        function (
          row
        ) {
          return (
            normalizeFmrV3_(
              row.FMR_ID
            ) ===
              normalizeFmrV3_(
                header.FMR_ID
              ) &&
            yesFmrV3_(
              row.Active
            )
          );
        }
      );

  const lineIds = {};

  lines.forEach(
    function (
      line
    ) {
      lineIds[
        normalizeFmrV3_(
          line.FMR_Line_ID
        )
      ] = true;
    }
  );

  const notices =
    fieldNoticeRowsFmrV3_()
      .filter(
        function (
          row
        ) {
          return (
            lineIds[
              normalizeFmrV3_(
                row.FMR_Line_ID
              )
            ] &&
            yesFmrV3_(
              row.Active
            )
          );
        }
      );

  return {
    fmrId:
      normalizeFmrV3_(
        header.FMR_ID
      ),

    fmrNumber:
      normalizeFmrV3_(
        header.FMR_Number
      ),

    headerRow:
      header._rowNumber,

    lineCount:
      lines.length,

    lines:
      lines,

    header: {
      requested:
        numberFmrV3_(
          header.Qty_Requested
        ),

      located:
        numberFmrV3_(
          header
            .Qty_Confirmed_Located
        ),

      bagged:
        numberFmrV3_(
          header
            .Qty_Active_Bagged
        ),

      available:
        numberFmrV3_(
          header.Qty_Available
        ),

      issued:
        numberFmrV3_(
          header.Qty_Issued
        ),

      pendingBackorder:
        numberFmrV3_(
          header
            .Qty_Pending_Backorder
        ),

      confirmedBackorder:
        numberFmrV3_(
          header
            .Qty_Confirmed_Backorder
        ),

      remaining:
        numberFmrV3_(
          header
            .Qty_Remaining_Requirement
        ),

      updatedAt:
        formatDateTimeFmrV3_(
          header.Updated_At
        )
    },

    activeSearchIndexRows:
      searchIndexRows.length,

    expectedSearchIndexRows:
      lines.length *
      3,

    activeFieldNotices:
      notices.length
  };
}

function recoveryCacheKeyFmrV3_(
  token
) {
  return (
    'fmr3:recovery:' +
    normalizeFmrV3_(
      token
    )
  );
}

function previewRecoveryFmrV3_(
  userEmail,
  request
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const source =
    request || {};

  const action =
    recoveryActionFmrV3_(
      source.action
    );

  const snapshot =
    recoveryTargetSnapshotFmrV3_(
      source.fmrNumber
    );

  const recoveryId =
    uuidFmrV3_(
      'RECOVERY'
    );

  const token =
    Utilities
      .getUuid()
      .replace(
        /-/g,
        ''
      )
      .toUpperCase();

  const now =
    nowFmrV3_();

  const cachePayload = {
    recoveryId:
      recoveryId,

    token:
      token,

    ownerEmail:
      owner.email,

    databaseFingerprint:
      databaseFingerprintFmrV3_(),

    action:
      action,

    fmrNumber:
      snapshot.fmrNumber,

    fmrId:
      snapshot.fmrId,

    previewedAt:
      now.toISOString(),

    before:
      {
        fmrId:
          snapshot.fmrId,

        fmrNumber:
          snapshot.fmrNumber,

        header:
          snapshot.header,

        lineCount:
          snapshot.lineCount,

        activeSearchIndexRows:
          snapshot
            .activeSearchIndexRows,

        expectedSearchIndexRows:
          snapshot
            .expectedSearchIndexRows,

        activeFieldNotices:
          snapshot
            .activeFieldNotices
      }
  };

  CacheService
    .getScriptCache()
    .put(
      recoveryCacheKeyFmrV3_(
        token
      ),
      JSON.stringify(
        cachePayload
      ),
      900
    );

  appendObjectFmrV3_(
    FMR_V3_OPERATIONS
      .sheets
      .RECOVERY,
    {
      Recovery_ID:
        recoveryId,

      Correlation_ID:
        '',

      Action_Type:
        action,

      Target_FMR_Number:
        snapshot
          .fmrNumber,

      Target_FMR_ID:
        snapshot
          .fmrId,

      Status:
        FMR_V3_OPERATIONS
          .recoveryStatuses
          .PREVIEWED,

      Previewed_By_Email:
        owner.email,

      Previewed_At:
        now,

      Applied_By_Email:
        '',

      Applied_At:
        '',

      Reason:
        '',

      Backup_ID:
        '',

      Before_JSON:
        JSON.stringify(
          cachePayload
            .before
        ),

      After_JSON:
        '',

      Error_Message:
        ''
    }
  );

  appendAuditFmrV3_(
    'RECOVERY',
    recoveryId,
    'RECOVERY_PREVIEWED',
    owner,
    uuidFmrV3_(
      'CORR'
    ),
    {
      sourceInterface:
        'OWNER',

      payload: {
        action:
          action,

        fmrNumber:
          snapshot
            .fmrNumber
      }
    }
  );

  SpreadsheetApp.flush();

  return {
    success:
      true,

    recoveryId:
      recoveryId,

    previewToken:
      token,

    expiresInSeconds:
      900,

    action:
      action,

    fmrNumber:
      snapshot
        .fmrNumber,

    before:
      cachePayload
        .before,

    requirements: {
      transactionMode:
        'READ_ONLY',

      reasonRequired:
        true,

      automaticBackup:
        true
    }
  };
}

function assertRecoveryMaintenanceWindowFmrV3_() {
  const environment =
    runtimeEnvironmentFmrV3_(
      ''
    );

  if (
    environment
      .transactionMode !==
    'READ_ONLY'
  ) {
    throw new Error(
      (
        'Recovery application requires Transaction Mode READ_ONLY. ' +
        'Enable maintenance mode before applying the preview.'
      )
    );
  }

  return environment;
}

function updateRecoveryRecordFmrV3_(
  recoveryId,
  patch
) {
  const rows =
    findRowsByExactValueFmrV3_(
      FMR_V3_OPERATIONS
        .sheets
        .RECOVERY,
      1,
      recoveryId
    );

  if (
    rows.length !== 1
  ) {
    throw new Error(
      'Expected one recovery record for ' +
      recoveryId +
      '.'
    );
  }

  return updateRowObjectFmrV3_(
    FMR_V3_OPERATIONS
      .sheets
      .RECOVERY,
    rows[0],
    patch
  );
}

function rebuildSearchIndexForRecoveryFmrV3_(
  snapshot
) {
  const now =
    nowFmrV3_();

  let deactivated = 0;

  getUsedRowsFmrV3_(
    FMR_V3.SHEETS
      .SEARCH_INDEX
  )
    .filter(
      function (
        row
      ) {
        return (
          normalizeFmrV3_(
            row.FMR_ID
          ) ===
            snapshot.fmrId &&
          yesFmrV3_(
            row.Active
          )
        );
      }
    )
    .forEach(
      function (
        row
      ) {
        updateRowObjectFmrV3_(
          FMR_V3.SHEETS
            .SEARCH_INDEX,
          row._rowNumber,
          {
            Active:
              FMR_V3.NO,

            Updated_At:
              now
          }
        );

        invalidateIndexKeyFmrV3_(
          FMR_V3.SHEETS
            .SEARCH_INDEX,
          row.Search_Key
        );

        deactivated +=
          1;
      }
    );

  const header =
    readRowObjectFmrV3_(
      FMR_V3.SHEETS
        .HEADERS,
      snapshot.headerRow
    );

  const entries = [];

  snapshot.lines.forEach(
    function (
      line
    ) {
      entries.push.apply(
        entries,
        buildSearchEntriesForPublishedLineFmrV3_(
          header,
          snapshot.headerRow,
          line,
          line._rowNumber
        )
      );
    }
  );

  appendSearchIndexEntriesFmrV3_(
    entries
  );

  return {
    deactivated:
      deactivated,

    appended:
      entries.length
  };
}

function applyRecoveryFmrV3_(
  userEmail,
  request
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const source =
    request || {};

  const token =
    normalizeFmrV3_(
      source.previewToken
    );

  const reason =
    normalizeFmrV3_(
      source.reason
    );

  if (!token) {
    throw new Error(
      'Preview token is required.'
    );
  }

  if (
    reason.length < 10
  ) {
    throw new Error(
      'Provide a recovery reason of at least 10 characters.'
    );
  }

  assertRecoveryMaintenanceWindowFmrV3_();

  const cache =
    CacheService
      .getScriptCache();

  const cached =
    cache.get(
      recoveryCacheKeyFmrV3_(
        token
      )
    );

  if (!cached) {
    throw new Error(
      'Recovery preview expired. Generate a new preview.'
    );
  }

  const preview =
    JSON.parse(
      cached
    );

  if (
    preview.ownerEmail !==
      owner.email ||
    preview.databaseFingerprint !==
      databaseFingerprintFmrV3_()
  ) {
    throw new Error(
      'Recovery preview does not belong to this owner and database.'
    );
  }

  const current =
    recoveryTargetSnapshotFmrV3_(
      preview.fmrNumber
    );

  const action =
    recoveryActionFmrV3_(
      preview.action
    );

  const correlationId =
    uuidFmrV3_(
      'CORR'
    );

  let backup = null;

  try {
    backup =
      createDatabaseBackupFmrV3_(
        owner.email,
        'RECOVERY',
        (
          action +
          ' for ' +
          current.fmrNumber +
          '. ' +
          reason
        )
      );

    const actionResults = {};

    if (
      [
        FMR_V3_OPERATIONS
          .recoveryActions
          .REBUILD_SEARCH_INDEX,
        FMR_V3_OPERATIONS
          .recoveryActions
          .SAFE_RECONCILE
      ].includes(
        action
      )
    ) {
      actionResults.searchIndex =
        rebuildSearchIndexForRecoveryFmrV3_(
          current
        );
    }

    if (
      [
        FMR_V3_OPERATIONS
          .recoveryActions
          .REFRESH_HEADER_TOTALS,
        FMR_V3_OPERATIONS
          .recoveryActions
          .SAFE_RECONCILE
      ].includes(
        action
      )
    ) {
      refreshHeaderFromIndexedLinesFmrV3_(
        current.fmrId,
        current.fmrNumber,
        owner
      );

      actionResults.headerTotals =
        'REFRESHED';
    }

    if (
      [
        FMR_V3_OPERATIONS
          .recoveryActions
          .SYNC_FIELD_NOTICES,
        FMR_V3_OPERATIONS
          .recoveryActions
          .SAFE_RECONCILE
      ].includes(
        action
      )
    ) {
      current.lines.forEach(
        function (
          line
        ) {
          syncFieldNotificationsForLineFmrV3_(
            line
          );
        }
      );

      actionResults.fieldNotices =
        current.lines.length;
    }

    SpreadsheetApp.flush();

    const after =
      recoveryTargetSnapshotFmrV3_(
        current.fmrNumber
      );

    const integrity =
      inspectFmrV3DataIntegrity();

    if (!integrity.passed) {
      throw new Error(
        (
          'Post-recovery integrity failed. ' +
          'Use backup ' +
          backup.backupId +
          ' for manual rollback review.'
        )
      );
    }

    updateRecoveryRecordFmrV3_(
      preview.recoveryId,
      {
        Correlation_ID:
          correlationId,

        Status:
          FMR_V3_OPERATIONS
            .recoveryStatuses
            .APPLIED,

        Applied_By_Email:
          owner.email,

        Applied_At:
          nowFmrV3_(),

        Reason:
          reason,

        Backup_ID:
          backup.backupId,

        After_JSON:
          JSON.stringify({
            fmrId:
              after.fmrId,

            fmrNumber:
              after.fmrNumber,

            header:
              after.header,

            lineCount:
              after.lineCount,

            activeSearchIndexRows:
              after
                .activeSearchIndexRows,

            expectedSearchIndexRows:
              after
                .expectedSearchIndexRows,

            activeFieldNotices:
              after
                .activeFieldNotices,

            actionResults:
              actionResults,

            integrityPassed:
              integrity.passed
          }),

        Error_Message:
          ''
      }
    );

    appendAuditFmrV3_(
      'RECOVERY',
      preview.recoveryId,
      'RECOVERY_APPLIED',
      owner,
      correlationId,
      {
        sourceInterface:
          'OWNER',

        payload: {
          action:
            action,

          fmrNumber:
            current.fmrNumber,

          reason:
            reason,

          backupId:
            backup.backupId,

          actionResults:
            actionResults
        }
      }
    );

    cache.remove(
      recoveryCacheKeyFmrV3_(
        token
      )
    );

    SpreadsheetApp.flush();

    return {
      success:
        true,

      recoveryId:
        preview.recoveryId,

      correlationId:
        correlationId,

      action:
        action,

      fmrNumber:
        current.fmrNumber,

      backupId:
        backup.backupId,

      before:
        preview.before,

      after: {
        header:
          after.header,

        lineCount:
          after.lineCount,

        activeSearchIndexRows:
          after
            .activeSearchIndexRows,

        expectedSearchIndexRows:
          after
            .expectedSearchIndexRows,

        activeFieldNotices:
          after
            .activeFieldNotices
      },

      actionResults:
        actionResults,

      integrityPassed:
        true
    };
  } catch (
    error
  ) {
    updateRecoveryRecordFmrV3_(
      preview.recoveryId,
      {
        Correlation_ID:
          correlationId,

        Status:
          FMR_V3_OPERATIONS
            .recoveryStatuses
            .FAILED,

        Applied_By_Email:
          owner.email,

        Applied_At:
          nowFmrV3_(),

        Reason:
          reason,

        Backup_ID:
          backup
            ? backup.backupId
            : '',

        Error_Message:
          error.message
      }
    );

    appendAuditFmrV3_(
      'RECOVERY',
      preview.recoveryId,
      'RECOVERY_FAILED',
      owner,
      correlationId,
      {
        sourceInterface:
          'OWNER',

        payload: {
          action:
            action,

          fmrNumber:
            preview.fmrNumber,

          backupId:
            backup
              ? backup.backupId
              : '',

          error:
            error.message
        }
      }
    );

    SpreadsheetApp.flush();

    throw error;
  }
}

function runScheduledOperationsFmrV3_(
  userEmail,
  boundEnvironment
) {
  const owner =
    assertOwnerFmrV3_(
      userEmail
    );

  const environment =
    runtimeEnvironmentFmrV3_(
      boundEnvironment
    );

  const backup =
    createDatabaseBackupFmrV3_(
      owner.email,
      'SCHEDULED',
      (
        'Scheduled backup for ' +
        environment
          .environmentName +
        '.'
      )
    );

  const health =
    runOperationalHealthCheckFmrV3_(
      owner.email,
      'SCHEDULED'
    );

  return {
    success:
      true,

    environment:
      environment
        .environmentName,

    backup:
      backup,

    health:
      health
  };
}

function migrateFmrV3OperationalReadiness(
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

  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const sheets =
      operationsSheetDefinitionsFmrV3_()
        .map(
          function (
            definition
          ) {
            return ensureOperationsSheetFmrV3_(
              definition.name,
              definition.headers
            );
          }
        );

    const configuration =
      ensureOperationsConfigurationFmrV3_();

    SpreadsheetApp.flush();

    const diagnostic =
      inspectFmrV3OperationalReadinessContract();

    const output = {
      passed:
        diagnostic.passed,

      migration:
        'ALPHA11_OPERATIONAL_READINESS',

      version:
        FMR_V3.VERSION,

      sheets:
        sheets,

      configuration:
        configuration,

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
        'Sprint 4B operational-readiness migration failed.'
      );
    }

    return output;
  } finally {
    lock.releaseLock();
  }
}

function inspectFmrV3OperationalReadinessContract(
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

  const sheetResults =
    operationsSheetDefinitionsFmrV3_()
      .map(
        function (
          definition
        ) {
          const sheet =
            fmrV3Database_()
              .getSheetByName(
                definition.name
              );

          let valid = false;
          let error = '';

          try {
            valid =
              Boolean(
                sheet
              ) &&
              Boolean(
                headerMapFmrV3_(
                  definition.name
                )
              );
          } catch (
            exception
          ) {
            error =
              exception.message;
          }

          return {
            sheetName:
              definition.name,

            valid:
              valid,

            error:
              error
          };
        }
      );

  const settings =
    operationsSettingsFmrV3_();

  const output = {
    passed:
      sheetResults.every(
        function (
          result
        ) {
          return result.valid;
        }
      ) &&
      settings
        .backupRetentionDays > 0 &&
      settings
        .backupMaxAgeHours > 0 &&
      settings
        .staleBackorderHours > 0 &&
      settings
        .staleBagDays > 0,

    readOnly:
      true,

    elapsedMs:
      Date.now() -
      started,

    version:
      FMR_V3.VERSION,

    databaseFingerprint:
      databaseFingerprintFmrV3_(),

    sheets:
      sheetResults,

    settings:
      settings
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

function runFmrV3OperationalReadinessDiagnostic() {
  const output =
    inspectFmrV3OperationalReadinessContract();

  if (!output.passed) {
    throw new Error(
      'FMR v3 operational-readiness contract failed.'
    );
  }

  return output;
}
