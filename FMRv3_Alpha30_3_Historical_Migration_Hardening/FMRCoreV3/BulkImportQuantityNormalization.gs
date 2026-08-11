/**
 * FMR Operations v3 — Alpha 30.3
 * Historical bulk-import quantity compatibility helpers.
 *
 * ADD AS A NEW FMRCoreV3 FILE:
 *   BulkImportQuantityNormalization
 *
 * This helper is deliberately narrow:
 *   - plain numeric quantities keep their current behavior;
 *   - only materials already inferred as UOM=LF can normalize a trailing
 *     linear-foot unit marker;
 *   - supported examples: 40.2', 66.7’, 0.3′, 12 LF, 12 FT;
 *   - blank quantities remain zero and therefore remain BLOCKED by the
 *     existing QUANTITY_INVALID validation;
 *   - feet/inches expressions such as 2'-6" are NOT guessed or converted.
 */

function normalizeBulkImportQuantityAlpha30_3FmrV3_(
  rawValue,
  displayValue,
  inferredUom
) {
  const rawPresent =
    rawValue !== '' &&
    rawValue !== null &&
    rawValue !== undefined;

  const selected =
    rawPresent
      ? rawValue
      : displayValue;

  const sourceText =
    normalizeFmrV3_(
      rawPresent
        ? rawValue
        : displayValue
    );

  /**
   * Preserve the current behavior for genuine numeric cells.
   */
  if (
    typeof selected === 'number' &&
    Number.isFinite(selected)
  ) {
    return {
      value:
        selected,

      normalized:
        false,

      sourceText:
        sourceText,

      rule:
        'SOURCE_NUMERIC'
    };
  }

  /**
   * Do not reinterpret non-pipe / EA quantities.
   */
  if (
    normalizeUpperFmrV3_(
      inferredUom
    ) !==
    'LF'
  ) {
    return {
      value:
        numberFmrV3_(
          selected
        ),

      normalized:
        false,

      sourceText:
        sourceText,

      rule:
        'STANDARD_NUMERIC_CONVERSION'
    };
  }

  /**
   * Strict decimal linear-foot syntax only.
   *
   * Accepted suffixes:
   *   '    ASCII foot mark
   *   ’    right single quotation mark
   *   ′    prime
   *   LF
   *   FT
   *   FOOT
   *   FEET
   */
  const match =
    sourceText.match(
      /^([+]?(?:\d+(?:\.\d+)?|\.\d+))\s*(['’′]|LF|FT|FOOT|FEET)\s*$/i
    );

  if (
    match
  ) {
    const parsed =
      Number(
        match[1]
      );

    if (
      Number.isFinite(parsed)
    ) {
      return {
        value:
          parsed,

        normalized:
          true,

        sourceText:
          sourceText,

        rule:
          'LF_SUFFIX_NORMALIZED'
      };
    }
  }

  return {
    value:
      numberFmrV3_(
        selected
      ),

    normalized:
      false,

    sourceText:
      sourceText,

    rule:
      sourceText
        ? 'UNRECOGNIZED_SOURCE_TEXT'
        : 'BLANK_SOURCE'
  };
}
