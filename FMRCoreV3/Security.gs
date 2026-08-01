function getUserFmrV3_(email) {
  const normalizedEmail = normalizeEmailFmrV3_(email);
  if (!normalizedEmail) {
    throw new Error('Authenticated Google account email is unavailable.');
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = 'fmr3:user:' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      normalizedEmail
    )
  ).slice(0, 40);

  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const rows = findRowsByExactValueFmrV3_(
    FMR_V3.SHEETS.USERS, 2, normalizedEmail
  );

  const record = rows.length
    ? readRowObjectFmrV3_(FMR_V3.SHEETS.USERS, rows[0])
    : null;

  if (!record || !yesFmrV3_(record.Active)) {
    throw new Error(`Unauthorized user: ${normalizedEmail}`);
  }

  const user = {
    id: normalizeFmrV3_(record.User_ID),
    email: normalizedEmail,
    name: normalizeFmrV3_(record.Display_Name),
    role: normalizeFmrV3_(record.Role),
    canSearch: yesFmrV3_(record.Can_Search),
    canFieldTransact: yesFmrV3_(record.Can_Field_Transact),
    canAdminBackorder: yesFmrV3_(record.Can_Admin_Backorder),
    canOwnerEdit: yesFmrV3_(record.Can_Owner_Edit)
  };

  cache.put(cacheKey, JSON.stringify(user), 900);
  return user;
}

function assertSearchUserFmrV3_(email) {
  const user = getUserFmrV3_(email);
  if (!user.canSearch) throw new Error(`${user.role} cannot search FMR records.`);
  return user;
}

function assertFieldUserFmrV3_(email) {
  const user = getUserFmrV3_(email);
  if (!user.canFieldTransact) {
    throw new Error(`${user.role} cannot perform Field transactions.`);
  }
  return user;
}

function assertBackorderAdminFmrV3_(email) {
  const user = getUserFmrV3_(email);
  if (!user.canAdminBackorder) {
    throw new Error(`${user.role} cannot review backorders.`);
  }
  return user;
}

function assertOwnerFmrV3_(email) {
  const user = getUserFmrV3_(email);
  const ownerEmail = normalizeEmailFmrV3_(
    getConfigurationFmrV3_().OWNER_EMAIL
  );

  if (!user.canOwnerEdit || user.email !== ownerEmail) {
    throw new Error('Only the configured System Owner may change FMR master data.');
  }
  return user;
}

function getListValuesFmrV3_(listName) {
  const target = normalizeUpperFmrV3_(listName);
  const cache = CacheService.getScriptCache();
  const key = `fmr3:list:${target}`;
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);

  const values = getUsedRowsFmrV3_(FMR_V3.SHEETS.LISTS)
    .filter(function (row) {
      return normalizeUpperFmrV3_(row.List_Name) === target &&
        yesFmrV3_(row.Active);
    })
    .sort(function (a, b) {
      return numberFmrV3_(a.Sort_Order) - numberFmrV3_(b.Sort_Order);
    })
    .map(function (row) { return normalizeFmrV3_(row.Value); })
    .filter(Boolean);

  cache.put(key, JSON.stringify(values), 21600);
  return values;
}
