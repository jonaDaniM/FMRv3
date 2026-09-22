function assertFmrV3GatewayEnvironment(
  databaseId,
  expectedEnvironment
) {
  setFmrV3DatabaseContext_(
    databaseId
  );

  const expected =
    normalizeEnvironmentNameFmrV3_(
      expectedEnvironment
    );

  const runtime =
    runtimeEnvironmentFmrV3_(
      expected
    );

  const actual =
    normalizeEnvironmentNameFmrV3_(
      runtime.environmentName
    );

  if (
    actual !==
    expected
  ) {
    throw new Error(
      'FMR environment mismatch. Expected ' +
      expected +
      ', database reports ' +
      actual +
      '. Write blocked.'
    );
  }

  return {
    passed:
      true,
    expectedEnvironment:
      expected,
    environmentName:
      actual,
    transactionMode:
      runtime.transactionMode,
    databaseFingerprint:
      runtime.databaseFingerprint
  };
}
