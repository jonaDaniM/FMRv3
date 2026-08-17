const FMR_V3 = Object.freeze({
  VERSION: '3.0.0-alpha.30.4.1',
  DEFAULT_DATABASE_ID: '1nDEsty3PTVppEPAkKpN9RVXCl_P0pgQALyGPficjz68',

  SHEETS: Object.freeze({
    DASHBOARD: 'Dashboard',
    CONFIG: 'Configuration',
    USERS: 'Users',
    LISTS: 'Lists',
    STAGING_HEADERS: 'Import_Staging_Header',
    STAGING_LINES: 'Import_Staging_Lines',
    HEADERS: 'FMR_Header',
    LINES: 'FMR_Line_Items',
    SEARCH_INDEX: 'Search_Index',
    OPERATIONAL_INDEX: 'Operational_Index',
    TRANSACTIONS: 'Material_Transactions',
    BAG_HEADERS: 'Bag_Tag_Header',
    BAG_ITEMS: 'Bag_Tag_Items',
    BACKORDERS: 'Backorder_Requests',
    AUDIT: 'Audit_Log',
    HEALTH_LOG: 'Operational_Health_Log',
    BACKUP_HISTORY: 'Backup_History',
    RECOVERY_ACTIONS: 'Recovery_Actions',
    BULK_IMPORT_BATCHES: 'Bulk_Import_Batches',
    BULK_IMPORT_ITEMS: 'Bulk_Import_Items',
    BULK_IMPORT_LINES: 'Bulk_Import_Lines',
    BULK_IMPORT_ISSUES: 'Bulk_Import_Issues'
  }),

  ACTIONS: Object.freeze({
    CONFIRM_AVAILABLE: 'CONFIRM_AVAILABLE',
    BAG: 'BAG',
    DIRECT_ISSUE: 'DIRECT_ISSUE',
    ISSUE_FROM_AVAILABLE: 'ISSUE_FROM_AVAILABLE',
    ISSUE_FROM_BAG: 'ISSUE_FROM_BAG',
    BACKORDER_REQUESTED: 'BACKORDER_REQUESTED'
  }),

  BACKORDER_DECISIONS: Object.freeze({
    CONFIRM: 'CONFIRM',
    REJECT: 'REJECT',
    RETURN: 'RETURN'
  }),

  YES: 'YES',
  NO: 'NO'
});

const FMR_V3_HEADERS = Object.freeze({
  Configuration: ['Setting', 'Value', 'Description', 'Editable'],
  Users: [
  'User_ID', 'Email', 'Display_Name', 'Role', 'Can_Search',
  'Can_Field_Transact', 'Can_Admin_Backorder', 'Can_Owner_Edit',
  'Active', 'Created_At', 'Notes', 'Updated_By', 'Updated_At',
  'Last_Login_At', 'Last_Interface', 'Deactivated_By',
  'Deactivated_At'
],
  Lists: ['List_Name', 'Value', 'Sort_Order', 'Active'],
  Import_Staging_Header: [
    'Staging_FMR_ID', 'Source_File_ID', 'Source_File_Name',
    'Official_FMR_Number', 'IWP_Number', 'Requested_By',
    'Date_Required', 'Priority', 'Notes', 'Status', 'Created_By',
    'Created_At', 'Updated_At', 'Published_FMR_ID', 'Published_At',
    'Validation_Errors'
  ],
  Import_Staging_Lines: [
    'Staging_Line_ID', 'Staging_FMR_ID', 'Line_Number',
    'ISO_Number', 'ISO_Sheet', 'ISO_Key', 'Commodity_Code', 'Size',
    'Material_Description', 'Qty_Requested', 'UOM',
    'Storage_Location', 'Notes', 'Status', 'Validation_Errors',
    'Created_At', 'Updated_At', 'Published_Line_ID'
  ],
  FMR_Header: [
    'FMR_ID', 'FMR_Number', 'IWP_Number', 'Requested_By',
    'Date_Required', 'Priority', 'Current_Status', 'Total_Lines',
    'Qty_Requested', 'Qty_Confirmed_Located', 'Qty_Active_Bagged',
    'Qty_Available', 'Qty_Issued', 'Qty_Pending_Backorder',
    'Qty_Confirmed_Backorder', 'Qty_Remaining_Requirement',
    'Fulfillment_Pct', 'Source_Staging_ID', 'Active', 'Created_By',
    'Created_At', 'Updated_By', 'Updated_At', 'Last_Activity_At',
    'Notes'
  ],
  FMR_Line_Items: [
    'FMR_Line_ID', 'FMR_ID', 'FMR_Number', 'Line_Number',
    'ISO_Number', 'ISO_Sheet', 'ISO_Key', 'Commodity_Code', 'Size',
    'Material_Description', 'Qty_Requested', 'UOM',
    'Qty_Confirmed_Located', 'Qty_Active_Bagged', 'Qty_Available',
    'Qty_Issued', 'Qty_Pending_Backorder',
    'Qty_Confirmed_Backorder', 'Qty_Not_Yet_Located',
    'Qty_Remaining_Requirement', 'Line_Status', 'Storage_Location',
    'Active', 'Source_Staging_Line_ID', 'Created_By', 'Created_At',
    'Updated_By', 'Updated_At', 'Notes'
  ],
  Search_Index: [
    'Search_Key', 'Search_Type', 'FMR_ID', 'FMR_Number',
    'FMR_Line_ID', 'Header_Row', 'Line_Row', 'ISO_Key', 'Active',
    'Index_Version', 'Updated_At'
  ],
  Operational_Index: [
    'Index_Key', 'Index_Type', 'Entity_ID', 'Parent_ID',
    'Row_Number', 'Secondary_Row_Number', 'Active', 'Updated_At'
  ],
  Material_Transactions: [
    'Transaction_ID', 'Correlation_ID', 'FMR_ID', 'FMR_Number',
    'FMR_Line_ID', 'Transaction_Type', 'Quantity', 'UOM',
    'Authenticated_Email', 'Performed_By_Name', 'Issued_To_Name',
    'Source_Bag_Tag_ID', 'Target_Bag_Tag_ID', 'Storage_Location',
    'Backorder_Request_ID', 'Timestamp', 'Notes'
  ],
  Bag_Tag_Header: [
    'Bag_Tag_ID', 'Tag_Number', 'FMR_ID', 'FMR_Number', 'ISO_Key',
    'Storage_Location', 'Bagged_By_Name', 'Authenticated_Email',
    'Bagged_At', 'Status', 'Notes', 'Updated_At'
  ],
  Bag_Tag_Items: [
    'Bag_Tag_Item_ID', 'Bag_Tag_ID', 'Tag_Number', 'FMR_Line_ID',
    'Commodity_Code', 'Size', 'Material_Description', 'Qty_Bagged',
    'Qty_Issued_From_Bag', 'Qty_Remaining_In_Bag', 'UOM', 'Status',
    'Created_At', 'Updated_At'
  ],
  Backorder_Requests: [
    'Backorder_Request_ID', 'Correlation_ID', 'FMR_ID', 'FMR_Number',
    'FMR_Line_ID', 'ISO_Key', 'Commodity_Code',
    'Qty_Requested_Backorder', 'Qty_Confirmed_Backorder',
    'Qty_Pending', 'Reason', 'Field_Notes', 'Reported_By_Email',
    'Reported_By_Name', 'Reported_At', 'Status', 'Admin_Decision',
    'Admin_Notes', 'Decided_By_Email', 'Decided_By_Name',
    'Decided_At', 'Returned_Review_Reason', 'Active', 'Updated_At'
  ],
  Audit_Log: [
  'Audit_ID', 'Entity_Type', 'Entity_ID', 'Action', 'Field_Name',
  'Old_Value', 'New_Value', 'User_Email', 'User_Name', 'Timestamp',
  'Source_Interface', 'Correlation_ID', 'Notes'
],
  Operational_Health_Log: [
  'Health_Run_ID', 'Environment', 'Database_Fingerprint',
  'Overall_Status', 'Integrity_Status', 'Schema_Status',
  'System_Control_Status', 'Last_Backup_Status', 'Last_Backup_At',
  'Backup_Age_Hours', 'Published_FMRs', 'Active_Users',
  'Pending_Backorders', 'Returned_Notices', 'Rejected_Notices',
  'Stale_Backorders', 'Active_Bag_Items', 'Stale_Bag_Items',
  'Recent_Transactions_24H', 'Diagnostic_Duration_Ms',
  'Trigger_Type', 'Run_By_Email', 'Run_At', 'Details_JSON'
],
  Backup_History: [
  'Backup_ID', 'Backup_File_ID', 'Backup_File_Name',
  'Database_Fingerprint', 'Environment', 'Trigger_Type', 'Status',
  'Created_By_Email', 'Created_By_Name', 'Created_At', 'Completed_At',
  'File_Size_Bytes', 'Folder_Fingerprint', 'Retention_Expires_At',
  'Error_Message', 'Notes', 'Active'
],
  Recovery_Actions: [
  'Recovery_ID', 'Correlation_ID', 'Action_Type',
  'Target_FMR_Number', 'Target_FMR_ID', 'Status',
  'Previewed_By_Email', 'Previewed_At', 'Applied_By_Email',
  'Applied_At', 'Reason', 'Backup_ID', 'Before_JSON',
  'After_JSON', 'Error_Message'
],
  Bulk_Import_Batches: [
  'Batch_ID', 'Source_Type', 'Source_File_ID', 'Source_File_Name',
  'Source_Mime_Type', 'Source_Fingerprint', 'Source_Modified_At',
  'Converted_File_ID', 'Worksheet_Count', 'Proposed_FMR_Count',
  'Total_Line_Count', 'Valid_Item_Count', 'Warning_Item_Count',
  'Error_Item_Count', 'Status', 'Created_By', 'Created_At',
  'Updated_At', 'Notes', 'Active', 'Parser_Version'
],
Bulk_Import_Items: [
  'Import_Item_ID', 'Batch_ID', 'Worksheet_ID', 'Worksheet_Name',
  'Official_FMR_Number', 'IWP_Number', 'Destination', 'Warehouse',
  'Requested_By', 'Craft', 'Deliver_To', 'Date_Required',
  'ISO_Number', 'ISO_Sheet', 'ISO_Revision', 'Priority',
  'Parsed_Line_Count', 'Status', 'Staging_FMR_ID',
  'Existing_FMR_ID', 'Content_Fingerprint', 'Source_Header_JSON',
  'Error_Count', 'Warning_Count', 'Selected', 'Created_At',
  'Updated_At', 'Notes'
],
Bulk_Import_Lines: [
  'Import_Line_ID', 'Batch_ID', 'Import_Item_ID', 'Line_Number',
  'Source_Row_Number', 'Commodity_Code', 'Size', 'Qty_Requested',
  'Material_Description', 'Inferred_UOM', 'UOM_Rule',
  'Legacy_Issued', 'Legacy_Backordered', 'Legacy_Action_Taken',
  'Status', 'Validation_Errors', 'Created_At', 'Updated_At', 'Notes'
],
Bulk_Import_Issues: [
  'Import_Issue_ID', 'Batch_ID', 'Import_Item_ID', 'Worksheet_Name',
  'Severity', 'Issue_Code', 'Field_Name', 'Line_Number', 'Message',
  'Source_Value', 'Resolution_Value', 'Resolved', 'Resolved_By',
  'Resolved_At', 'Created_At', 'Notes'
]
});

let FMR_V3_DATABASE_ID_ = '';
let FMR_V3_SPREADSHEET_ = null;
let FMR_V3_HEADER_MAP_CACHE_ = {};
let FMR_V3_CONFIGURATION_CACHE_ = null;

function setFmrV3DatabaseContext_(databaseId) {
  const nextId = normalizeFmrV3_(databaseId);
  if (!nextId) throw new Error('databaseId is required.');

  if (FMR_V3_DATABASE_ID_ !== nextId) {
    FMR_V3_DATABASE_ID_ = nextId;
    FMR_V3_SPREADSHEET_ = null;
    FMR_V3_HEADER_MAP_CACHE_ = {};
    FMR_V3_CONFIGURATION_CACHE_ = null;
  }
}

function fmrV3Database_() {
  if (!FMR_V3_DATABASE_ID_) {
    throw new Error('FMR v3 database context has not been initialized.');
  }
  if (!FMR_V3_SPREADSHEET_) {
    FMR_V3_SPREADSHEET_ = SpreadsheetApp.openById(FMR_V3_DATABASE_ID_);
  }
  return FMR_V3_SPREADSHEET_;
}

function normalizeFmrV3_(value) {
  return String(value == null ? '' : value).trim();
}

function normalizeUpperFmrV3_(value) {
  return normalizeFmrV3_(value).toUpperCase();
}

function normalizeEmailFmrV3_(value) {
  return normalizeFmrV3_(value).toLowerCase();
}

function numberFmrV3_(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function positiveNumberFmrV3_(value, label) {
  const parsed = numberFmrV3_(value);
  if (parsed <= 0) {
    throw new Error(`${label || 'Quantity'} must be greater than zero.`);
  }
  return parsed;
}

function nowFmrV3_() {
  return new Date();
}

function uuidFmrV3_(prefix) {
  return `${normalizeUpperFmrV3_(prefix || 'ID')}-${Utilities.getUuid().toUpperCase()}`;
}

function yesFmrV3_(value) {
  return normalizeUpperFmrV3_(value) === FMR_V3.YES;
}

function isoKeyFmrV3_(isoNumber, isoSheet) {
  const iso = normalizeUpperFmrV3_(isoNumber);
  const sheet = normalizeUpperFmrV3_(isoSheet);
  if (!iso || !sheet) throw new Error('ISO Number and ISO Sheet are required.');
  return `${iso}|${sheet}`;
}

function fmrSearchKeyFmrV3_(fmrNumber) {
  const value = normalizeUpperFmrV3_(fmrNumber);
  if (!value) throw new Error('FMR Number is required.');
  return `FMR:${value}`;
}

function isoSearchKeyFmrV3_(isoNumber, isoSheet) {
  return `ISO:${isoKeyFmrV3_(isoNumber, isoSheet)}`;
}

function lineSearchKeyFmrV3_(lineId) {
  const value = normalizeUpperFmrV3_(lineId);
  if (!value) throw new Error('FMR Line ID is required.');
  return `LINE:${value}`;
}

function operationalIndexKeyFmrV3_(type, value) {
  const normalizedType = normalizeUpperFmrV3_(type);
  const normalizedValue = normalizeUpperFmrV3_(value);
  if (!normalizedType || !normalizedValue) {
    throw new Error('Operational index type and value are required.');
  }
  return `${normalizedType}:${normalizedValue}`;
}

function configurationCacheKeyFmrV3_() {
  return `fmr3:configuration:${FMR_V3_DATABASE_ID_}`;
}

function invalidateConfigurationCacheFmrV3_() {
  FMR_V3_CONFIGURATION_CACHE_ = null;

  if (FMR_V3_DATABASE_ID_) {
    CacheService.getScriptCache().remove(
      configurationCacheKeyFmrV3_()
    );
  }
}

function getConfigurationFmrV3_() {
  if (FMR_V3_CONFIGURATION_CACHE_) {
    return FMR_V3_CONFIGURATION_CACHE_;
  }

  const scriptCache = CacheService.getScriptCache();
  const cacheKey = configurationCacheKeyFmrV3_();
  const cached = scriptCache.get(cacheKey);

  if (cached) {
    FMR_V3_CONFIGURATION_CACHE_ = JSON.parse(cached);
    return FMR_V3_CONFIGURATION_CACHE_;
  }

  const values = {};

  getUsedRowsFmrV3_(FMR_V3.SHEETS.CONFIG).forEach(function (row) {
    const key = normalizeFmrV3_(row.Setting);
    if (key) values[key] = row.Value;
  });

  FMR_V3_CONFIGURATION_CACHE_ = values;

  scriptCache.put(
    cacheKey,
    JSON.stringify(values),
    21600
  );

  return values;
}

function formatDateTimeFmrV3_(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return normalizeFmrV3_(value);

  const timezone =
    normalizeFmrV3_(getConfigurationFmrV3_().TIMEZONE) ||
    Session.getScriptTimeZone() ||
    'America/Indiana/Indianapolis';

  return Utilities.formatDate(date, timezone, 'yyyy-MM-dd HH:mm');
}
