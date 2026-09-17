/**
 * FMRv3 alpha.30.5.15 Write Gateway
 *
 * Standalone Apps Script web app.
 * Execute as the deploying PRIMARY OWNER.
 *
 * Script Properties:
 *   FMR_GATEWAY_SECRET
 *   FMR_V3_DATABASE_ID_TEST
 *   FMR_V3_DATABASE_ID_PRODUCTION
 *   FMR_GATEWAY_MAX_AGE_MS   optional, default 300000
 *
 * Existing FMRCore public APIs remain the business-rule authority.
 */

const FMR_GATEWAY_ALLOWED_OPERATIONS_ =
  Object.freeze([
    'BOOTSTRAP',
    'FIELD_ACTION',
    'ADMIN_BACKORDER_DECISION',
    'WRITE_PERFORMANCE_EVENT'
  ]);

function doPost(e) {
  try {
    const request =
      fmrGatewayParse_(e);

    fmrGatewayVerify_(
      request
    );

    const result =
      fmrGatewayDispatch_(
        request
      );

    return fmrGatewayJson_({
      ok: true,
      requestId:
        request.requestId,
      result:
        result
    });
  } catch (error) {
    console.error(
      'FMR_GATEWAY_REJECT ' +
      JSON.stringify({
        message:
          String(
            error &&
            error.message ||
            error
          )
      })
    );

    return fmrGatewayJson_({
      ok: false,
      error:
        String(
          error &&
          error.message ||
          error
        )
    });
  }
}

function fmrGatewayParse_(e) {
  if (
    !e ||
    !e.postData ||
    !e.postData.contents
  ) {
    throw new Error(
      'Request body is required.'
    );
  }

  const source =
    JSON.parse(
      e.postData.contents
    );

  return {
    requestId:
      String(
        source.requestId || ''
      ).trim(),

    timestampMs:
      Number(
        source.timestampMs || 0
      ),

    nonce:
      String(
        source.nonce || ''
      ).trim(),

    operation:
      String(
        source.operation || ''
      )
        .trim()
        .toUpperCase(),

    userEmail:
      String(
        source.userEmail || ''
      )
        .trim()
        .toLowerCase(),

    environment:
      String(
        source.environment || ''
      )
        .trim()
        .toUpperCase(),

    payload:
      source.payload || {},

    signature:
      String(
        source.signature || ''
      ).trim()
  };
}

function fmrGatewayVerify_(request) {
  if (!request.requestId) {
    throw new Error(
      'requestId is required.'
    );
  }

  if (!request.nonce) {
    throw new Error(
      'nonce is required.'
    );
  }

  if (!request.userEmail) {
    throw new Error(
      'userEmail is required.'
    );
  }

  if (
    ![
      'TEST',
      'PRODUCTION'
    ].includes(
      request.environment
    )
  ) {
    throw new Error(
      'Unsupported environment.'
    );
  }

  if (
    !FMR_GATEWAY_ALLOWED_OPERATIONS_
      .includes(
        request.operation
      )
  ) {
    throw new Error(
      'Unsupported gateway operation.'
    );
  }

  const props =
    PropertiesService
      .getScriptProperties();

  const secret =
    String(
      props.getProperty(
        'FMR_GATEWAY_SECRET'
      ) || ''
    );

  if (!secret) {
    throw new Error(
      'Gateway secret is not configured.'
    );
  }

  const maxAgeMs =
    Math.max(
      60000,
      Number(
        props.getProperty(
          'FMR_GATEWAY_MAX_AGE_MS'
        ) || 300000
      )
    );

  const ageMs =
    Math.abs(
      Date.now() -
      request.timestampMs
    );

  if (
    !request.timestampMs ||
    ageMs > maxAgeMs
  ) {
    throw new Error(
      'Request timestamp is stale or invalid.'
    );
  }

  const expected =
    fmrGatewaySignature_(
      request,
      secret
    );

  if (
    !fmrGatewayConstantTimeEquals_(
      expected,
      request.signature
    )
  ) {
    throw new Error(
      'Invalid gateway signature.'
    );
  }

  // Keep the replay lock extremely short. It protects only nonce registration.
  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(5000);

  try {
    const cache =
      CacheService
        .getScriptCache();

    const replayKey =
      [
        'fmr-gateway-nonce',
        request.environment,
        request.nonce
      ].join(':');

    if (
      cache.get(
        replayKey
      )
    ) {
      throw new Error(
        'Replay detected.'
      );
    }

    cache.put(
      replayKey,
      request.requestId,
      Math.ceil(
        maxAgeMs / 1000
      ) + 60
    );
  } finally {
    lock.releaseLock();
  }
}

function fmrGatewayDispatch_(request) {
  const databaseId =
    fmrGatewayDatabaseId_(
      request.environment
    );

  switch (
    request.operation
  ) {
    case 'BOOTSTRAP':
      return FMRCoreV3
        .getFmrV3Bootstrap(
          databaseId,
          request.userEmail,
          String(
            request.payload
              .interfaceName ||
            'PORTAL'
          ),
          request.environment
        );

    case 'FIELD_ACTION':
      return FMRCoreV3
        .performFmrV3FieldAction(
          databaseId,
          request.userEmail,
          request.payload
            .request ||
          {}
        );

    case 'ADMIN_BACKORDER_DECISION':
      return FMRCoreV3
        .reviewFmrV3Backorder(
          databaseId,
          request.userEmail,
          request.payload
            .request ||
          {}
        );

    case 'WRITE_PERFORMANCE_EVENT':
      return FMRCoreV3
        .recordFmrV3WritePerformanceEvent(
          databaseId,
          request.userEmail,
          request.payload
            .event ||
          {}
        );

    default:
      throw new Error(
        'Gateway operation not implemented.'
      );
  }
}

function fmrGatewayDatabaseId_(
  environment
) {
  const key =
    environment ===
      'PRODUCTION'
      ? 'FMR_V3_DATABASE_ID_PRODUCTION'
      : 'FMR_V3_DATABASE_ID_TEST';

  const id =
    String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          key
        ) ||
      ''
    ).trim();

  if (!id) {
    throw new Error(
      'Missing gateway database property: ' +
      key
    );
  }

  return id;
}

function fmrGatewaySignable_(
  request
) {
  return [
    request.requestId,
    String(
      request.timestampMs
    ),
    request.nonce,
    request.operation,
    request.userEmail,
    request.environment,
    JSON.stringify(
      request.payload || {}
    )
  ].join('\n');
}

function fmrGatewaySignature_(
  request,
  secret
) {
  const bytes =
    Utilities
      .computeHmacSha256Signature(
        fmrGatewaySignable_(
          request
        ),
        secret
      );

  return Utilities
    .base64EncodeWebSafe(
      bytes
    )
    .replace(
      /=+$/g,
      ''
    );
}

function fmrGatewayConstantTimeEquals_(
  left,
  right
) {
  const a =
    String(
      left || ''
    );

  const b =
    String(
      right || ''
    );

  if (
    a.length !==
    b.length
  ) {
    return false;
  }

  let difference = 0;

  for (
    let index = 0;
    index < a.length;
    index += 1
  ) {
    difference |=
      a.charCodeAt(index) ^
      b.charCodeAt(index);
  }

  return (
    difference === 0
  );
}

function fmrGatewayJson_(value) {
  return ContentService
    .createTextOutput(
      JSON.stringify(
        value
      )
    )
    .setMimeType(
      ContentService
        .MimeType
        .JSON
    );
}
