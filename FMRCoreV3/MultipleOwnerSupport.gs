/**
 * FMR Operations v3 — delegated System Owner support.
 *
 * OWNER_EMAIL remains the protected primary owner.
 * Additional owners are active Users rows with Can_Owner_Edit = YES.
 */

function activeSystemOwnerRecordsFmrV3_() {
  return getUsedRowsFmrV3_(
    FMR_V3.SHEETS.USERS
  ).filter(
    function (
      record
    ) {
      return (
        yesFmrV3_(
          record.Active
        ) &&
        yesFmrV3_(
          record.Can_Owner_Edit
        )
      );
    }
  );
}

function activeSystemOwnerEmailsFmrV3_() {
  return Array.from(
    new Set(
      activeSystemOwnerRecordsFmrV3_()
        .map(
          function (
            record
          ) {
            return normalizeEmailFmrV3_(
              record.Email
            );
          }
        )
        .filter(
          Boolean
        )
    )
  ).sort();
}

function assertSystemOwnerContinuityFmrV3_(
  targetEmail,
  willRemainActiveOwner
) {
  if (
    willRemainActiveOwner
  ) {
    return;
  }

  const email =
    normalizeEmailFmrV3_(
      targetEmail
    );

  const activeOwners =
    activeSystemOwnerRecordsFmrV3_();

  const targetIsActiveOwner =
    activeOwners.some(
      function (
        record
      ) {
        return (
          normalizeEmailFmrV3_(
            record.Email
          ) ===
          email
        );
      }
    );

  if (
    targetIsActiveOwner &&
    activeOwners.length <=
      1
  ) {
    throw new Error(
      'At least one active System Owner must remain.'
    );
  }
}

function inspectFmrV3MultipleOwnerContract(
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

  const configuration =
    getConfigurationFmrV3_();

  const primaryOwnerEmail =
    normalizeEmailFmrV3_(
      configuration
        .OWNER_EMAIL
    );

  const ownerRecords =
    activeSystemOwnerRecordsFmrV3_();

  const ownerEmails =
    activeSystemOwnerEmailsFmrV3_();

  const primaryOwnerActive =
    ownerEmails.includes(
      primaryOwnerEmail
    );

  const output = {
    passed:
      Boolean(
        primaryOwnerEmail
      ) &&
      primaryOwnerActive &&
      ownerEmails.length >=
        1,

    readOnly:
      true,

    version:
      FMR_V3.VERSION,

    primaryOwnerEmail:
      primaryOwnerEmail,

    primaryOwnerActive:
      primaryOwnerActive,

    activeOwnerCount:
      ownerEmails.length,

    activeOwnerEmails:
      ownerEmails,

    ownerRecords:
      ownerRecords.map(
        function (
          record
        ) {
          return {
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
              )
          };
        }
      )
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

function runFmrV3MultipleOwnerDiagnostic() {
  const output =
    inspectFmrV3MultipleOwnerContract();

  if (
    !output.passed
  ) {
    throw new Error(
      'Multiple System Owner contract failed.'
    );
  }

  return output;
}
