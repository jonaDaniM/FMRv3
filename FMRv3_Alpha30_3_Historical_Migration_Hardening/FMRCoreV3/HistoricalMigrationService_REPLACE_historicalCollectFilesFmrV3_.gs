/**
 * Alpha 30.3 COMPLETE REPLACEMENT FUNCTION
 *
 * Replace the existing historicalCollectFilesFmrV3_ definition in
 * FMRCoreV3/HistoricalMigrationService.gs.
 *
 * Generated migration working folders and converted migration files are
 * excluded from recursive discovery.
 */
function historicalCollectFilesFmrV3_(
  folder,
  recursive,
  prefix,
  output
) {
  const result =
    output ||
    [];

  const path =
    normalizeFmrV3_(
      prefix
    );

  const files =
    folder.getFiles();

  while (
    files.hasNext()
  ) {
    const file =
      files.next();

    if (
      historicalMigrationGeneratedConvertedFileFmrV3_(
        file.getName()
      )
    ) {
      continue;
    }

    if (
      !historicalSupportedMimeFmrV3_(
        file.getMimeType()
      )
    ) {
      continue;
    }

    if (
      result.length >=
      FMR_V3_HISTORICAL_MIGRATION
        .MAX_FILES
    ) {
      throw new Error(
        (
          'Migration folder exceeds ' +
          FMR_V3_HISTORICAL_MIGRATION
            .MAX_FILES +
          ' supported spreadsheet files.'
        )
      );
    }

    result.push({
      fileId:
        file.getId(),

      name:
        file.getName(),

      relativePath:
        (
          path
            ? path +
              '/'
            : ''
        ) +
        file.getName(),

      mimeType:
        file.getMimeType(),

      sizeBytes:
        numberFmrV3_(
          file.getSize()
        ),

      modifiedAt:
        file.getLastUpdated()
    });
  }

  if (
    recursive
  ) {
    const folders =
      folder.getFolders();

    while (
      folders.hasNext()
    ) {
      const child =
        folders.next();

      if (
        historicalMigrationGeneratedWorkingFolderFmrV3_(
          child.getName()
        )
      ) {
        continue;
      }

      historicalCollectFilesFmrV3_(
        child,
        true,
        (
          path
            ? path +
              '/'
            : ''
        ) +
        child.getName(),
        result
      );
    }
  }

  return result;
}
