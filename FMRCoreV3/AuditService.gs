function appendAuditFmrV3_(
  entityType,
  entityId,
  action,
  user,
  correlationId,
  details
) {
  const data = details || {};

  appendObjectFmrV3_(FMR_V3.SHEETS.AUDIT, {
    Audit_ID: uuidFmrV3_('AUDIT'),
    Entity_Type: normalizeFmrV3_(entityType),
    Entity_ID: normalizeFmrV3_(entityId),
    Action: normalizeUpperFmrV3_(action),
    Field_Name: normalizeFmrV3_(data.fieldName),
    Old_Value: data.oldValue == null ? '' : String(data.oldValue),
    New_Value: data.newValue == null ? '' : String(data.newValue),
    User_Email: user.email,
    User_Name: user.name,
    Timestamp: nowFmrV3_(),
    Source_Interface: normalizeUpperFmrV3_(data.sourceInterface || ''),
    Correlation_ID: normalizeFmrV3_(correlationId),
    Notes: normalizeFmrV3_(
      data.notes || (data.payload ? JSON.stringify(data.payload) : '')
    )
  });
}
