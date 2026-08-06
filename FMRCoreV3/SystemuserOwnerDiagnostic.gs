function diagnoseFmrV3SystemUserFunctions() {
  const output = {
    version:
      typeof FMR_V3 !== 'undefined' &&
      FMR_V3
        ? FMR_V3.VERSION
        : 'FMR_V3 unavailable',

    upsertSystemUserDefined:
      typeof upsertSystemUserFmrV3_ ===
      'function',

    setSystemUserActiveDefined:
      typeof setSystemUserActiveFmrV3_ ===
      'function',

    assertOwnerDefined:
      typeof assertOwnerFmrV3_ ===
      'function',

    multipleOwnerContinuityDefined:
      typeof assertSystemOwnerContinuityFmrV3_ ===
      'function'
  };

  output.passed =
    output.upsertSystemUserDefined &&
    output.setSystemUserActiveDefined &&
    output.assertOwnerDefined &&
    output.multipleOwnerContinuityDefined;

  console.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );

  if (!output.passed) {
    throw new Error(
      'One or more System User / Multiple Owner functions are missing. ' +
      JSON.stringify(output)
    );
  }

  return output;
}
