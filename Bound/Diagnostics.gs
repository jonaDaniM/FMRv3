function logBoundEnvironmentV3() {
  const result =
    inspectBoundEnvironmentV3();

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}