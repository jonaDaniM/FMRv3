/**
 * FMR Operations v3 — Alpha 29
 * High-volume historical FMR migration.
 *
 * Owner-only. Reuses the existing Bulk Import parser, staging service and
 * publication service. Source workbooks are never modified.
 *
 * Alpha 29 migration policy:
 *   - imports the already-published FMR definition/requested quantities;
 *   - legacy Issued / Backordered / Action Taken values remain source evidence;
 *   - those legacy activity columns do NOT create live Material_Transactions.
 */
const FMR_V3_HISTORICAL_MIGRATION = Object.freeze({
  JOB_SHEET: 'Historical_Migration_Jobs',
  FILE_SHEET: 'Historical_Migration_Files',
  JOB_HEADERS: Object.freeze([
    'Job_ID','Source_Folder_ID','Source_Folder_Name','Working_Folder_ID',
    'Mode','Allow_Warnings','Recursive','Status','File_Count',
    'Files_Completed','FMRs_Discovered','FMRs_Published','FMRs_Skipped',
    'FMRs_Blocked','Warning_Count','Error_Count','Created_By','Created_At',
    'Updated_At','Last_Error','Notes'
  ]),
  FILE_HEADERS: Object.freeze([
    'Migration_File_ID','Job_ID','Source_File_ID','Source_File_Name',
    'Source_Mime_Type','Source_Size_Bytes','Source_Modified_At','Status',
    'Converted_File_ID','Batch_ID','FMR_Count','Published_Count',
    'Skipped_Count','Blocked_Count','Warning_Count','Error_Count',
    'Last_Error','Created_At','Updated_At'
  ]),
  STATUS: Object.freeze({
    READY:'READY', RUNNING:'RUNNING', COMPLETE:'COMPLETE',
    COMPLETE_WITH_EXCEPTIONS:'COMPLETE_WITH_EXCEPTIONS',
    PENDING:'PENDING', PARSING:'PARSING', PUBLISHING:'PUBLISHING',
    FILE_COMPLETE:'COMPLETE',
    FILE_COMPLETE_WITH_EXCEPTIONS:'COMPLETE_WITH_EXCEPTIONS',
    FILE_FAILED:'FAILED'
  }),
  MIME: Object.freeze({
    SHEET:'application/vnd.google-apps.spreadsheet',
    XLSX:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    XLS:'application/vnd.ms-excel'
  }),
  MAX_FILES: 2000,
  MAX_SOURCE_BYTES: 25 * 1024 * 1024,
  DEFAULT_CHUNK: 10,
  MAX_CHUNK: 25
});

function ensureHistoricalMigrationSheetFmrV3_(sheetName, headers) {
  const db = fmrV3Database_();
  let sheet = db.getSheetByName(sheetName);
  if (!sheet) sheet = db.insertSheet(sheetName);
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }
  const current = sheet.getRange(1,1,1,headers.length).getDisplayValues()[0].map(normalizeFmrV3_);
  headers.forEach(function(header, i) {
    if (current[i] && current[i] !== header) {
      throw new Error(sheetName + ' header mismatch at column ' + (i+1) +
        '. Expected "' + header + '", found "' + current[i] + '".');
    }
    if (!current[i]) sheet.getRange(1,i+1).setValue(header);
  });
  sheet.setFrozenRows(1);
  return sheet;
}

function ensureHistoricalMigrationStorageFmrV3_() {
  ensureHistoricalMigrationSheetFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION.JOB_SHEET,
    FMR_V3_HISTORICAL_MIGRATION.JOB_HEADERS
  );
  ensureHistoricalMigrationSheetFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION.FILE_SHEET,
    FMR_V3_HISTORICAL_MIGRATION.FILE_HEADERS
  );
  return {passed:true};
}

function historicalReadRowsFmrV3_(sheetName, headers) {
  const sheet = ensureHistoricalMigrationSheetFmrV3_(sheetName, headers);
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2,1,last-1,headers.length).getValues().map(function(values, i) {
    const row = {_rowNumber:i+2};
    headers.forEach(function(h,j){ row[h] = values[j]; });
    return row;
  }).filter(function(row){
    return headers.some(function(h){ return row[h] !== '' && row[h] !== null; });
  });
}

function historicalAppendFmrV3_(sheetName, headers, record) {
  const sheet = ensureHistoricalMigrationSheetFmrV3_(sheetName, headers);
  const row = Math.max(2, sheet.getLastRow()+1);
  sheet.getRange(row,1,1,headers.length).setValues([headers.map(function(h){
    return Object.prototype.hasOwnProperty.call(record || {}, h) ? record[h] : '';
  })]);
  return row;
}

function historicalUpdateFmrV3_(sheetName, headers, rowNumber, patch) {
  const sheet = ensureHistoricalMigrationSheetFmrV3_(sheetName, headers);
  const values = sheet.getRange(rowNumber,1,1,headers.length).getValues()[0];
  headers.forEach(function(h,i){
    if (Object.prototype.hasOwnProperty.call(patch || {}, h)) values[i] = patch[h];
  });
  sheet.getRange(rowNumber,1,1,headers.length).setValues([values]);
}

function historicalJobByIdFmrV3_(jobId) {
  const target = normalizeFmrV3_(jobId);
  const rows = historicalReadRowsFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION.JOB_SHEET,
    FMR_V3_HISTORICAL_MIGRATION.JOB_HEADERS
  ).filter(function(r){ return normalizeFmrV3_(r.Job_ID) === target; });
  if (rows.length !== 1) throw new Error('Historical migration job not found: ' + target);
  return rows[0];
}

function historicalFilesForJobFmrV3_(jobId) {
  const target = normalizeFmrV3_(jobId);
  return historicalReadRowsFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION.FILE_SHEET,
    FMR_V3_HISTORICAL_MIGRATION.FILE_HEADERS
  ).filter(function(r){ return normalizeFmrV3_(r.Job_ID) === target; });
}

function historicalFolderIdFmrV3_(value) {
  const source = normalizeFmrV3_(value);
  if (!source) throw new Error('Google Drive folder URL or ID is required.');
  const match = source.match(/\/folders\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : source;
}

function historicalSupportedMimeFmrV3_(mime) {
  return [
    FMR_V3_HISTORICAL_MIGRATION.MIME.SHEET,
    FMR_V3_HISTORICAL_MIGRATION.MIME.XLSX,
    FMR_V3_HISTORICAL_MIGRATION.MIME.XLS
  ].includes(normalizeFmrV3_(mime));
}
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
function historicalInventoryFmrV3_(folderValue, options) {
  const folderId = historicalFolderIdFmrV3_(folderValue);
  const folder = DriveApp.getFolderById(folderId);
  const recursive = Boolean(options && options.recursive);
  const files = historicalCollectFilesFmrV3_(folder, recursive, '', []).sort(function(a,b){
    return a.relativePath.localeCompare(b.relativePath, undefined, {numeric:true,sensitivity:'base'});
  });
  const oversize = files.filter(function(f){
    return f.sizeBytes > FMR_V3_HISTORICAL_MIGRATION.MAX_SOURCE_BYTES;
  });
  return {
    folderId:folderId,
    folderName:folder.getName(),
    recursive:recursive,
    fileCount:files.length,
    oversizeCount:oversize.length,
    files:files.map(function(f){
      return {
        fileId:f.fileId, name:f.name, relativePath:f.relativePath,
        mimeType:f.mimeType, sizeBytes:f.sizeBytes,
        modifiedAt:formatDateTimeFmrV3_(f.modifiedAt),
        oversize:f.sizeBytes > FMR_V3_HISTORICAL_MIGRATION.MAX_SOURCE_BYTES
      };
    })
  };
}

function previewHistoricalMigrationFmrV3_(userEmail, folderValue, options) {
  const owner = assertOwnerFmrV3_(userEmail);
  ensureHistoricalMigrationStorageFmrV3_();
  const inventory = historicalInventoryFmrV3_(folderValue, options || {});
  return {
    generatedAt:formatDateTimeFmrV3_(nowFmrV3_()),
    owner:{email:owner.email,name:owner.name},
    mode:'REQUEST_ONLY',
    historicalActivityPolicy:'SOURCE_EVIDENCE_ONLY',
    allowWarnings:Boolean(options && options.allowWarnings),
    canStart:inventory.fileCount > 0 && inventory.oversizeCount === 0,
    requiredConfirmation:'START ' + inventory.fileCount + ' FILES',
    inventory:inventory
  };
}

function startHistoricalMigrationFmrV3_(userEmail, folderValue, options) {
  const owner = assertOwnerFmrV3_(userEmail);
  assertWriteEnabledFmrV3_('Historical FMR migration');
  const settings = options || {};
  const preview = previewHistoricalMigrationFmrV3_(owner.email, folderValue, settings);
  if (!preview.canStart) {
    throw new Error(preview.inventory.oversizeCount
      ? 'One or more source workbooks exceed the migration file-size limit.'
      : 'No supported spreadsheet files were found.');
  }
  if (normalizeUpperFmrV3_(settings.confirmation) !==
      normalizeUpperFmrV3_(preview.requiredConfirmation)) {
    throw new Error('Confirmation must exactly match "' + preview.requiredConfirmation + '".');
  }

  const jobId = uuidFmrV3_('MIGRATION');
  const now = nowFmrV3_();
  const sourceFolder = DriveApp.getFolderById(preview.inventory.folderId);
  const workingFolder = sourceFolder.createFolder(
    '_FMRv3_Historical_Migration_Working_' + jobId.slice(-8)
  );

  historicalAppendFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION.JOB_SHEET,
    FMR_V3_HISTORICAL_MIGRATION.JOB_HEADERS,
    {
      Job_ID:jobId, Source_Folder_ID:preview.inventory.folderId,
      Source_Folder_Name:preview.inventory.folderName,
      Working_Folder_ID:workingFolder.getId(), Mode:'REQUEST_ONLY',
      Allow_Warnings:settings.allowWarnings ? FMR_V3.YES : FMR_V3.NO,
      Recursive:settings.recursive ? FMR_V3.YES : FMR_V3.NO,
      Status:FMR_V3_HISTORICAL_MIGRATION.STATUS.READY,
      File_Count:preview.inventory.fileCount, Files_Completed:0,
      FMRs_Discovered:0, FMRs_Published:0, FMRs_Skipped:0, FMRs_Blocked:0,
      Warning_Count:0, Error_Count:0, Created_By:owner.email,
      Created_At:now, Updated_At:now, Last_Error:'',
      Notes:normalizeFmrV3_(settings.notes)
    }
  );

  preview.inventory.files.forEach(function(file){
    historicalAppendFmrV3_(
      FMR_V3_HISTORICAL_MIGRATION.FILE_SHEET,
      FMR_V3_HISTORICAL_MIGRATION.FILE_HEADERS,
      {
        Migration_File_ID:uuidFmrV3_('MIGFILE'), Job_ID:jobId,
        Source_File_ID:file.fileId, Source_File_Name:file.relativePath,
        Source_Mime_Type:file.mimeType, Source_Size_Bytes:file.sizeBytes,
        Source_Modified_At:file.modifiedAt,
        Status:FMR_V3_HISTORICAL_MIGRATION.STATUS.PENDING,
        Converted_File_ID:'', Batch_ID:'', FMR_Count:0, Published_Count:0,
        Skipped_Count:0, Blocked_Count:0, Warning_Count:0, Error_Count:0,
        Last_Error:'', Created_At:now, Updated_At:now
      }
    );
  });

  appendAuditFmrV3_('HISTORICAL_MIGRATION',jobId,'HISTORICAL_MIGRATION_STARTED',
    owner,uuidFmrV3_('CORR'),{
      sourceInterface:'OWNER',
      payload:{
        sourceFolder:preview.inventory.folderName,
        fileCount:preview.inventory.fileCount,
        allowWarnings:Boolean(settings.allowWarnings),
        recursive:Boolean(settings.recursive),
        mode:'REQUEST_ONLY'
      }
    });

  SpreadsheetApp.flush();
  return getHistoricalMigrationJobFmrV3_(owner.email, jobId);
}

function historicalOpenSourceSpreadsheetFmrV3_(job, fileRow) {
  const mime = normalizeFmrV3_(fileRow.Source_Mime_Type);
  if (mime === FMR_V3_HISTORICAL_MIGRATION.MIME.SHEET) {
    return {spreadsheet:SpreadsheetApp.openById(fileRow.Source_File_ID), convertedFileId:''};
  }

  const source = DriveApp.getFileById(fileRow.Source_File_ID);
  if (numberFmrV3_(source.getSize()) > FMR_V3_HISTORICAL_MIGRATION.MAX_SOURCE_BYTES) {
    throw new Error('Source workbook exceeds migration limit: ' + source.getName());
  }

  const converted = Drive.Files.create({
    name:'[FMR MIGRATION] ' + source.getName(),
    mimeType:FMR_V3_HISTORICAL_MIGRATION.MIME.SHEET,
    parents:[normalizeFmrV3_(job.Working_Folder_ID)]
  }, source.getBlob(), {fields:'id,name,mimeType'});

  return {
    spreadsheet:openBulkImportSpreadsheetWithRetryFmrV3_(converted.id),
    convertedFileId:normalizeFmrV3_(converted.id)
  };
}

function historicalParseFileFmrV3_(owner, job, fileRow) {
  const existingBatch = normalizeFmrV3_(fileRow.Batch_ID);
  if (existingBatch) return existingBatch;

  historicalUpdateFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION.FILE_SHEET,
    FMR_V3_HISTORICAL_MIGRATION.FILE_HEADERS,
    fileRow._rowNumber,
    {Status:FMR_V3_HISTORICAL_MIGRATION.STATUS.PARSING, Updated_At:nowFmrV3_(), Last_Error:''}
  );

  const opened = historicalOpenSourceSpreadsheetFmrV3_(job, fileRow);
  const sourceFile = DriveApp.getFileById(fileRow.Source_File_ID);
  const fingerprint = bulkImportFingerprintFmrV3_([
    fileRow.Source_File_ID,
    sourceFile.getLastUpdated().getTime(),
    numberFmrV3_(fileRow.Source_Size_Bytes),
    FMR_V3_BULK_IMPORT.parserVersion
  ].join('|'));

  const batch = persistBulkImportBatchFmrV3_(owner,{
    sourceType:normalizeFmrV3_(fileRow.Source_Mime_Type) ===
      FMR_V3_HISTORICAL_MIGRATION.MIME.SHEET
        ? FMR_V3_BULK_IMPORT.sourceTypes.GOOGLE_SHEET
        : FMR_V3_BULK_IMPORT.sourceTypes.UPLOAD,
    sourceFileId:fileRow.Source_File_ID,
    sourceFileName:fileRow.Source_File_Name,
    sourceMimeType:fileRow.Source_Mime_Type,
    sourceFingerprint:fingerprint,
    sourceModifiedAt:sourceFile.getLastUpdated(),
    convertedFileId:opened.convertedFileId,
    notes:'Historical migration job ' + job.Job_ID + '. REQUEST_ONLY.'
  }, opened.spreadsheet);

  let batchId = normalizeFmrV3_(batch && (batch.batchId || batch.Batch_ID));
  if (!batchId) {
    const candidates = getUsedRowsFmrV3_(FMR_V3_BULK_IMPORT.sheets.BATCHES)
      .filter(function(row){
        return normalizeFmrV3_(row.Source_Fingerprint) === fingerprint &&
          yesFmrV3_(row.Active);
      })
      .sort(function(a,b){
        return new Date(b.Created_At||0).getTime() - new Date(a.Created_At||0).getTime();
      });
    batchId = candidates.length ? normalizeFmrV3_(candidates[0].Batch_ID) : '';
  }
  if (!batchId) throw new Error('Parser did not return a Batch ID for ' + fileRow.Source_File_Name);

  historicalUpdateFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION.FILE_SHEET,
    FMR_V3_HISTORICAL_MIGRATION.FILE_HEADERS,
    fileRow._rowNumber,
    {
      Converted_File_ID:opened.convertedFileId, Batch_ID:batchId,
      Status:FMR_V3_HISTORICAL_MIGRATION.STATUS.PUBLISHING,
      Updated_At:nowFmrV3_()
    }
  );
  return batchId;
}

function historicalItemPublishedFmrV3_(item) {
  const number = normalizeFmrV3_(item && item.Official_FMR_Number);
  return number ? Boolean(existingPublishedFmrForImportFmrV3_(number)) : false;
}

function historicalFileStatsFmrV3_(items, allowWarnings) {
  const result = {discovered:0,published:0,skipped:0,blocked:0,warnings:0,errors:0,remaining:0};
  (items||[]).forEach(function(item){
    result.discovered += 1;
    result.warnings += numberFmrV3_(item.Warning_Count);
    result.errors += numberFmrV3_(item.Error_Count);
    if (historicalItemPublishedFmrV3_(item)) { result.published += 1; return; }

    const status = normalizeUpperFmrV3_(item.Status);
    if (status === FMR_V3_BULK_IMPORT.status.BLOCKED || numberFmrV3_(item.Error_Count)>0) {
      result.blocked += 1; return;
    }
    if (status === FMR_V3_BULK_IMPORT.status.WARNING && !allowWarnings) {
      result.skipped += 1; return;
    }
    if ([
      FMR_V3_BULK_IMPORT.status.VALID,
      FMR_V3_BULK_IMPORT.status.WARNING,
      FMR_V3_BULK_IMPORT.status.STAGED,
      FMR_V3_BULK_IMPORT.status.PARTIALLY_STAGED
    ].includes(status)) {
      result.remaining += 1;
    } else {
      result.skipped += 1;
    }
  });
  return result;
}

function historicalPublishFileChunkFmrV3_(owner, job, fileRow, limit) {
  const batchId = historicalParseFileFmrV3_(owner,job,fileRow);
  const allowWarnings = yesFmrV3_(job.Allow_Warnings);
  let items = bulkImportItemsForBatchFmrV3_(batchId);

  const stagedCandidates = [];
  items.forEach(function(item){
    if (stagedCandidates.length >= limit || historicalItemPublishedFmrV3_(item)) return;
    const status = normalizeUpperFmrV3_(item.Status);
    if ([FMR_V3_BULK_IMPORT.status.STAGED,FMR_V3_BULK_IMPORT.status.PARTIALLY_STAGED].includes(status)
        && normalizeFmrV3_(item.Staging_FMR_ID)) {
      stagedCandidates.push({
        importItemId:normalizeFmrV3_(item.Import_Item_ID),
        fmrNumber:normalizeFmrV3_(item.Official_FMR_Number),
        stagingFmrId:normalizeFmrV3_(item.Staging_FMR_ID)
      });
    }
  });

  const remainingSlots = Math.max(0, limit - stagedCandidates.length);
  if (remainingSlots) {
    const stageIds = items.filter(function(item){
      if (historicalItemPublishedFmrV3_(item)) return false;
      const status = normalizeUpperFmrV3_(item.Status);
      return status === FMR_V3_BULK_IMPORT.status.VALID ||
        (status === FMR_V3_BULK_IMPORT.status.WARNING && allowWarnings);
    }).slice(0,remainingSlots).map(function(item){ return normalizeFmrV3_(item.Import_Item_ID); });

    if (stageIds.length) {
      const staged = stageBulkImportItemsFmrV3_(owner.email,batchId,stageIds);
      (staged && staged.staged ? staged.staged : []).forEach(function(item){
        if (item && item.stagingFmrId) {
          stagedCandidates.push({
            importItemId:normalizeFmrV3_(item.importItemId),
            fmrNumber:normalizeFmrV3_(item.fmrNumber),
            stagingFmrId:normalizeFmrV3_(item.stagingFmrId)
          });
        }
      });
    }
  }

  const failures = [];
  stagedCandidates.slice(0,limit).forEach(function(candidate){
    try {
      publishStagedFmrAlpha20FmrV3_(owner.email,candidate.stagingFmrId);
    } catch (error) {
      failures.push({
        fmrNumber:candidate.fmrNumber,
        error:error && error.message ? error.message : String(error)
      });
    }
  });

  items = bulkImportItemsForBatchFmrV3_(batchId);
  const stats = historicalFileStatsFmrV3_(items,allowWarnings);
  const done = stats.remaining === 0;
  const status = done
    ? ((stats.blocked||stats.skipped||stats.errors||failures.length)
      ? FMR_V3_HISTORICAL_MIGRATION.STATUS.FILE_COMPLETE_WITH_EXCEPTIONS
      : FMR_V3_HISTORICAL_MIGRATION.STATUS.FILE_COMPLETE)
    : FMR_V3_HISTORICAL_MIGRATION.STATUS.PUBLISHING;

  historicalUpdateFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION.FILE_SHEET,
    FMR_V3_HISTORICAL_MIGRATION.FILE_HEADERS,
    fileRow._rowNumber,
    {
      Status:status, FMR_Count:stats.discovered, Published_Count:stats.published,
      Skipped_Count:stats.skipped, Blocked_Count:stats.blocked,
      Warning_Count:stats.warnings, Error_Count:stats.errors + failures.length,
      Last_Error:failures.map(function(f){ return f.fmrNumber + ': ' + f.error; }).join(' | '),
      Updated_At:nowFmrV3_()
    }
  );

  return {batchId:batchId,stats:stats,failures:failures,fileComplete:done,fileStatus:status};
}

function historicalRefreshJobTotalsFmrV3_(job) {
  const files = historicalFilesForJobFmrV3_(job.Job_ID);
  const complete = files.filter(function(f){
    return ['COMPLETE','COMPLETE_WITH_EXCEPTIONS'].includes(normalizeUpperFmrV3_(f.Status));
  }).length;
  const failed = files.filter(function(f){ return normalizeUpperFmrV3_(f.Status)==='FAILED'; }).length;

  const totals = files.reduce(function(r,f){
    r.discovered += numberFmrV3_(f.FMR_Count);
    r.published += numberFmrV3_(f.Published_Count);
    r.skipped += numberFmrV3_(f.Skipped_Count);
    r.blocked += numberFmrV3_(f.Blocked_Count);
    r.warnings += numberFmrV3_(f.Warning_Count);
    r.errors += numberFmrV3_(f.Error_Count);
    return r;
  },{discovered:0,published:0,skipped:0,blocked:0,warnings:0,errors:0});

  const allResolved = complete + failed === files.length;
  const status = allResolved
    ? ((failed||totals.blocked||totals.skipped||totals.errors)
      ? FMR_V3_HISTORICAL_MIGRATION.STATUS.COMPLETE_WITH_EXCEPTIONS
      : FMR_V3_HISTORICAL_MIGRATION.STATUS.COMPLETE)
    : FMR_V3_HISTORICAL_MIGRATION.STATUS.RUNNING;

  historicalUpdateFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION.JOB_SHEET,
    FMR_V3_HISTORICAL_MIGRATION.JOB_HEADERS,
    job._rowNumber,
    {
      Status:status, Files_Completed:complete, FMRs_Discovered:totals.discovered,
      FMRs_Published:totals.published, FMRs_Skipped:totals.skipped,
      FMRs_Blocked:totals.blocked, Warning_Count:totals.warnings,
      Error_Count:totals.errors, Updated_At:nowFmrV3_()
    }
  );
  return status;
}

function runHistoricalMigrationChunkFmrV3_(userEmail, jobId, publicationLimit) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const owner = assertOwnerFmrV3_(userEmail);
    assertWriteEnabledFmrV3_('Historical FMR migration');
    ensureHistoricalMigrationStorageFmrV3_();
    let job = historicalJobByIdFmrV3_(jobId);
    if (['COMPLETE','COMPLETE_WITH_EXCEPTIONS'].includes(normalizeUpperFmrV3_(job.Status))) {
      return getHistoricalMigrationJobFmrV3_(owner.email,job.Job_ID);
    }

    historicalUpdateFmrV3_(
      FMR_V3_HISTORICAL_MIGRATION.JOB_SHEET,
      FMR_V3_HISTORICAL_MIGRATION.JOB_HEADERS,
      job._rowNumber,
      {Status:FMR_V3_HISTORICAL_MIGRATION.STATUS.RUNNING, Updated_At:nowFmrV3_(), Last_Error:''}
    );

    const limit = Math.max(1,Math.min(
      FMR_V3_HISTORICAL_MIGRATION.MAX_CHUNK,
      Math.floor(numberFmrV3_(publicationLimit) || FMR_V3_HISTORICAL_MIGRATION.DEFAULT_CHUNK)
    ));
    const files = historicalFilesForJobFmrV3_(job.Job_ID);
    const file = files.find(function(f){
      return ['PENDING','PARSING','PUBLISHING'].includes(normalizeUpperFmrV3_(f.Status));
    });

    if (!file) {
      job = historicalJobByIdFmrV3_(job.Job_ID);
      historicalRefreshJobTotalsFmrV3_(job);
      return getHistoricalMigrationJobFmrV3_(owner.email,job.Job_ID);
    }

    let chunk = null;
    try {
      chunk = historicalPublishFileChunkFmrV3_(owner,job,file,limit);
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      historicalUpdateFmrV3_(
        FMR_V3_HISTORICAL_MIGRATION.FILE_SHEET,
        FMR_V3_HISTORICAL_MIGRATION.FILE_HEADERS,
        file._rowNumber,
        {Status:'FAILED',Error_Count:Math.max(1,numberFmrV3_(file.Error_Count)),Last_Error:message,Updated_At:nowFmrV3_()}
      );
      historicalUpdateFmrV3_(
        FMR_V3_HISTORICAL_MIGRATION.JOB_SHEET,
        FMR_V3_HISTORICAL_MIGRATION.JOB_HEADERS,
        job._rowNumber,
        {Last_Error:file.Source_File_Name + ': ' + message,Updated_At:nowFmrV3_()}
      );
      appendAuditFmrV3_('HISTORICAL_MIGRATION_FILE',file.Migration_File_ID,
        'HISTORICAL_MIGRATION_FILE_FAILED',owner,uuidFmrV3_('CORR'),{
          sourceInterface:'OWNER',payload:{jobId:job.Job_ID,fileName:file.Source_File_Name,error:message}
        });
    }

    job = historicalJobByIdFmrV3_(job.Job_ID);
    historicalRefreshJobTotalsFmrV3_(job);
    const result = getHistoricalMigrationJobFmrV3_(owner.email,job.Job_ID);
    result.chunk = chunk;
    return result;
  } finally {
    lock.releaseLock();
  }
}

function retryHistoricalMigrationFileFmrV3_(userEmail, migrationFileId) {
  const owner = assertOwnerFmrV3_(userEmail);
  assertWriteEnabledFmrV3_('Historical migration retry');
  const target = normalizeFmrV3_(migrationFileId);
  const rows = historicalReadRowsFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION.FILE_SHEET,
    FMR_V3_HISTORICAL_MIGRATION.FILE_HEADERS
  ).filter(function(r){ return normalizeFmrV3_(r.Migration_File_ID)===target; });
  if (rows.length!==1) throw new Error('Migration file record not found: ' + target);
  const row = rows[0];
  historicalUpdateFmrV3_(
    FMR_V3_HISTORICAL_MIGRATION.FILE_SHEET,
    FMR_V3_HISTORICAL_MIGRATION.FILE_HEADERS,
    row._rowNumber,
    {Status:normalizeFmrV3_(row.Batch_ID)?'PUBLISHING':'PENDING',Last_Error:'',Updated_At:nowFmrV3_()}
  );
  appendAuditFmrV3_('HISTORICAL_MIGRATION_FILE',target,'HISTORICAL_MIGRATION_FILE_RETRY',
    owner,uuidFmrV3_('CORR'),{sourceInterface:'OWNER',payload:{jobId:row.Job_ID,fileName:row.Source_File_Name}});
  return getHistoricalMigrationJobFmrV3_(owner.email,row.Job_ID);
}

function getHistoricalMigrationJobFmrV3_(userEmail, jobId) {
  const owner = assertOwnerFmrV3_(userEmail);
  ensureHistoricalMigrationStorageFmrV3_();
  const job = historicalJobByIdFmrV3_(jobId);
  const files = historicalFilesForJobFmrV3_(job.Job_ID);
  return {
    generatedAt:formatDateTimeFmrV3_(nowFmrV3_()),
    owner:{email:owner.email,name:owner.name},
    job:{
      jobId:normalizeFmrV3_(job.Job_ID),
      sourceFolderName:normalizeFmrV3_(job.Source_Folder_Name),
      status:normalizeUpperFmrV3_(job.Status),
      mode:normalizeUpperFmrV3_(job.Mode),
      allowWarnings:yesFmrV3_(job.Allow_Warnings),
      recursive:yesFmrV3_(job.Recursive),
      fileCount:numberFmrV3_(job.File_Count),
      filesCompleted:numberFmrV3_(job.Files_Completed),
      fmrsDiscovered:numberFmrV3_(job.FMRs_Discovered),
      fmrsPublished:numberFmrV3_(job.FMRs_Published),
      fmrsSkipped:numberFmrV3_(job.FMRs_Skipped),
      fmrsBlocked:numberFmrV3_(job.FMRs_Blocked),
      warningCount:numberFmrV3_(job.Warning_Count),
      errorCount:numberFmrV3_(job.Error_Count),
      lastError:normalizeFmrV3_(job.Last_Error),
      createdAt:formatDateTimeFmrV3_(job.Created_At),
      updatedAt:formatDateTimeFmrV3_(job.Updated_At)
    },
    files:files.map(function(f){
      return {
        migrationFileId:normalizeFmrV3_(f.Migration_File_ID),
        sourceFileName:normalizeFmrV3_(f.Source_File_Name),
        status:normalizeUpperFmrV3_(f.Status),
        batchId:normalizeFmrV3_(f.Batch_ID),
        fmrCount:numberFmrV3_(f.FMR_Count),
        publishedCount:numberFmrV3_(f.Published_Count),
        skippedCount:numberFmrV3_(f.Skipped_Count),
        blockedCount:numberFmrV3_(f.Blocked_Count),
        warningCount:numberFmrV3_(f.Warning_Count),
        errorCount:numberFmrV3_(f.Error_Count),
        lastError:normalizeFmrV3_(f.Last_Error)
      };
    })
  };
}


function getRecentHistoricalMigrationJobsFmrV3_(userEmail, maximumRows) {
  const owner = assertOwnerFmrV3_(userEmail);
  ensureHistoricalMigrationStorageFmrV3_();
  const limit = Math.max(1,Math.min(50,Math.floor(numberFmrV3_(maximumRows)||10)));
  return {
    owner:{email:owner.email,name:owner.name},
    jobs:historicalReadRowsFmrV3_(
      FMR_V3_HISTORICAL_MIGRATION.JOB_SHEET,
      FMR_V3_HISTORICAL_MIGRATION.JOB_HEADERS
    ).sort(function(a,b){
      return new Date(b.Created_At||0).getTime()-new Date(a.Created_At||0).getTime();
    }).slice(0,limit).map(function(job){
      return {
        jobId:normalizeFmrV3_(job.Job_ID),
        sourceFolderName:normalizeFmrV3_(job.Source_Folder_Name),
        status:normalizeUpperFmrV3_(job.Status),
        fileCount:numberFmrV3_(job.File_Count),
        filesCompleted:numberFmrV3_(job.Files_Completed),
        fmrsDiscovered:numberFmrV3_(job.FMRs_Discovered),
        fmrsPublished:numberFmrV3_(job.FMRs_Published),
        fmrsBlocked:numberFmrV3_(job.FMRs_Blocked),
        fmrsSkipped:numberFmrV3_(job.FMRs_Skipped),
        createdAt:formatDateTimeFmrV3_(job.Created_At),
        updatedAt:formatDateTimeFmrV3_(job.Updated_At)
      };
    })
  };
}

function getFmrV3RecentHistoricalMigrationJobs(databaseId,userEmail,maximumRows) {
  setFmrV3DatabaseContext_(databaseId);
  return getRecentHistoricalMigrationJobsFmrV3_(userEmail,maximumRows);
}

/* Public library API */
function previewFmrV3HistoricalMigration(databaseId,userEmail,folderValue,options) {
  setFmrV3DatabaseContext_(databaseId);
  return previewHistoricalMigrationFmrV3_(userEmail,folderValue,options||{});
}
function startFmrV3HistoricalMigration(databaseId,userEmail,folderValue,options) {
  setFmrV3DatabaseContext_(databaseId);
  return startHistoricalMigrationFmrV3_(userEmail,folderValue,options||{});
}
function runFmrV3HistoricalMigrationChunk(databaseId,userEmail,jobId,publicationLimit) {
  setFmrV3DatabaseContext_(databaseId);
  return runHistoricalMigrationChunkFmrV3_(userEmail,jobId,publicationLimit);
}
function getFmrV3HistoricalMigrationJob(databaseId,userEmail,jobId) {
  setFmrV3DatabaseContext_(databaseId);
  return getHistoricalMigrationJobFmrV3_(userEmail,jobId);
}
function retryFmrV3HistoricalMigrationFile(databaseId,userEmail,migrationFileId) {
  setFmrV3DatabaseContext_(databaseId);
  return retryHistoricalMigrationFileFmrV3_(userEmail,migrationFileId);
}
