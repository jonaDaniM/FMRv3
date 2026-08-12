/**
 * FMR Operations v3 — Alpha 30.4
 * Correct Size normalization for Excel/Google date coercion.
 *
 * This helper is intentionally named differently from the Alpha 30.3 helper.
 * BulkImportService.gs should call normalizeBulkImportSizeAlpha30_4FmrV3_()
 * after installation. The older helper can remain in place as dead code until
 * a later cleanup release.
 */
const FMR_V3_SIZE_NORMALIZATION_ALPHA30_4 = Object.freeze({
  MAX_SERIAL_SIZE: 120,
  EARLY_SERIAL_MAX_YEAR: 1904,
  MODERN_FRACTION_MIN_YEAR: 2000
});

function bulkImportSizeAlpha30_4MonthNumberFmrV3_(monthName) {
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

function bulkImportSizeAlpha30_4SerialFmrV3_(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (!y || !m || !d) return null;

  /**
   * Google Sheets serial day 1 is 1899-12-31. Using 1899-12-30 as the UTC
   * epoch therefore recovers a numeric value of 1 from 1899-12-31, 2 from
   * 1900-01-01, etc. This matches the historical source evidence observed in
   * the imported FMR workbooks.
   */
  const serial = Math.round(
    (
      Date.UTC(y, m - 1, d) -
      Date.UTC(1899, 11, 30)
    ) / 86400000
  );

  if (
    serial < 1 ||
    serial > FMR_V3_SIZE_NORMALIZATION_ALPHA30_4.MAX_SERIAL_SIZE
  ) {
    return null;
  }

  return serial;
}

function bulkImportSizeAlpha30_4FromPartsFmrV3_(
  year,
  month,
  day,
  sourceDisplay,
  sourceRule
) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (
    !y ||
    m < 1 || m > 12 ||
    d < 1 || d > 31
  ) {
    return null;
  }

  if (
    y <=
    FMR_V3_SIZE_NORMALIZATION_ALPHA30_4.EARLY_SERIAL_MAX_YEAR
  ) {
    const serial = bulkImportSizeAlpha30_4SerialFmrV3_(y, m, d);

    if (serial === null) {
      return {
        value: '',
        repaired: false,
        unresolvedDateLike: true,
        sourceDisplay: normalizeFmrV3_(sourceDisplay),
        rule: 'EARLY_DATE_SERIAL_OUTSIDE_ALLOWED_SIZE_RANGE'
      };
    }

    return {
      value: String(serial),
      repaired: true,
      unresolvedDateLike: false,
      sourceDisplay: normalizeFmrV3_(sourceDisplay),
      rule: sourceRule + '_TO_NUMERIC_SIZE'
    };
  }

  if (
    y >=
    FMR_V3_SIZE_NORMALIZATION_ALPHA30_4.MODERN_FRACTION_MIN_YEAR
  ) {
    return {
      /**
       * Excel interpreted the source text 3/4 as March 4. Therefore the source
       * Size is MONTH/DAY, not DAY/MONTH.
       */
      value: m + '/' + d,
      repaired: true,
      unresolvedDateLike: false,
      sourceDisplay: normalizeFmrV3_(sourceDisplay),
      rule: sourceRule + '_TO_MONTH_DAY_FRACTION'
    };
  }

  return {
    value: '',
    repaired: false,
    unresolvedDateLike: true,
    sourceDisplay: normalizeFmrV3_(sourceDisplay),
    rule: 'HISTORICAL_DATE_REQUIRES_SOURCE_REVIEW'
  };
}

function bulkImportSizeAlpha30_4ParseDateTextFmrV3_(value) {
  const source = normalizeFmrV3_(value);
  if (!source) return null;

  const named = source.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,|\s)+\s*(\d{4})\b/i
  );

  if (named) {
    return bulkImportSizeAlpha30_4FromPartsFmrV3_(
      Number(named[3]),
      bulkImportSizeAlpha30_4MonthNumberFmrV3_(named[1]),
      Number(named[2]),
      source,
      'SERIALIZED_NAMED_DATE'
    );
  }

  const iso = source.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/
  );

  if (iso) {
    return bulkImportSizeAlpha30_4FromPartsFmrV3_(
      Number(iso[1]),
      Number(iso[2]),
      Number(iso[3]),
      source,
      'SERIALIZED_ISO_DATE'
    );
  }

  const slash = source.match(
    /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})(?:\s+.*)?$/
  );

  if (slash) {
    return bulkImportSizeAlpha30_4FromPartsFmrV3_(
      Number(slash[3]),
      Number(slash[1]),
      Number(slash[2]),
      source,
      'SERIALIZED_SLASH_DATE'
    );
  }

  return null;
}

function normalizeBulkImportSizeAlpha30_4FmrV3_(
  rawValue,
  displayValue,
  timezone
) {
  const displayed = normalizeFmrV3_(displayValue);
  const rawText = normalizeFmrV3_(rawValue);
  const activeTimezone =
    normalizeFmrV3_(timezone) ||
    Session.getScriptTimeZone() ||
    'America/Indiana/Indianapolis';

  if (
    rawValue &&
    typeof rawValue === 'object' &&
    typeof rawValue.getTime === 'function' &&
    !Number.isNaN(rawValue.getTime())
  ) {
    const year = Number(
      Utilities.formatDate(rawValue, activeTimezone, 'yyyy')
    );
    const month = Number(
      Utilities.formatDate(rawValue, activeTimezone, 'M')
    );
    const day = Number(
      Utilities.formatDate(rawValue, activeTimezone, 'd')
    );

    const repaired = bulkImportSizeAlpha30_4FromPartsFmrV3_(
      year,
      month,
      day,
      rawText || displayed,
      'DATE_OBJECT'
    );

    if (repaired) return repaired;
  }

  const rawDate = bulkImportSizeAlpha30_4ParseDateTextFmrV3_(rawText);
  if (rawDate) return rawDate;

  const displayedDate = bulkImportSizeAlpha30_4ParseDateTextFmrV3_(displayed);
  if (displayedDate) return displayedDate;

  const selectedValue = displayed || rawText;

  return {
    value: selectedValue,
    repaired: false,
    unresolvedDateLike: false,
    sourceDisplay: selectedValue,
    rule: 'SOURCE_TEXT'
  };
}
