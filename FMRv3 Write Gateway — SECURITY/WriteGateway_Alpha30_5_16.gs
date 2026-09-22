/**
 * FMRv3 alpha.30.5.16 Write Gateway
 *
 * Standalone Apps Script project.
 *
 * Script Properties:
 *   FMR_GATEWAY_SECRET
 *   FMR_V3_DATABASE_ID_TEST
 *   FMR_V3_DATABASE_ID_PRODUCTION
 *   FMR_GATEWAY_MAX_AGE_MS (optional; default 300000)
 */

const FMR_GATEWAY_ALPHA30_5_16 =
  Object.freeze({
    MAX_BODY_CHARS:
      60000,
    MAX_AGE_MS:
      300000,
    ALLOWED_OPERATIONS:
      Object.freeze([
        'BOOTSTRAP',
        'FIELD_ACTION',
        'ADMIN_BACKORDER_DECISION',
        'WRITE_PERFORMANCE_EVENT'
      ])
  });


function doPost(e) {
  let requestId = '';

  try {
    const request =
      parseFmrGatewayRequestAlpha30_5_16_(
        e
      );

    requestId =
      request.requestId;

    verifyFmrGatewayRequestAlpha30_5_16_(
      request
    );

    const databaseId =
      fmrGatewayDatabaseIdAlpha30_5_16_(
        request.environment
      );

    const environmentGuard =
      FMRCoreV3
        .assertFmrV3GatewayEnvironment(
          databaseId,
          request.environment
        );

    const result =
      dispatchFmrGatewayAlpha30_5_16_(
        request,
        databaseId
      );

    return fmrGatewayJsonAlpha30_5_16_({
      ok:
        true,
      requestId:
        requestId,
      environment:
        environmentGuard,
      result:
        result
    });
  } catch (error) {
    console.error(
      'FMR_GATEWAY_REJECT ' +
      JSON.stringify({
        requestId:
          requestId,
        message:
          String(
            error &&
            error.message ||
            error
          )
      })
    );

    return fmrGatewayJsonAlpha30_5_16_({
      ok:
        false,
      requestId:
        requestId,
      error:
        String(
          error &&
          error.message ||
          error
        )
    });
  }
}


function parseFmrGatewayRequestAlpha30_5_16_(
  e
) {
  if (
    !e ||
    !e.postData ||
    !e.postData.contents
  ) {
    throw new Error(
      'Request body is required.'
    );
  }

  const raw =
    String(
      e.postData.contents
    );

  if (
    raw.length >
    FMR_GATEWAY_ALPHA30_5_16
      .MAX_BODY_CHARS
  ) {
    throw new Error(
      'Gateway request exceeds size limit.'
    );
  }

  const source =
    JSON.parse(
      raw
    );

  const request = {
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

  if (
    request.requestId.length >
      128 ||
    request.nonce.length >
      128 ||
    request.userEmail.length >
      320
  ) {
    throw new Error(
      'Gateway request identifier is invalid.'
    );
  }

  return request;
}


function verifyFmrGatewayRequestAlpha30_5_16_(
  request
) {
  if (
    !request.requestId ||
    !request.nonce
  ) {
    throw new Error(
      'Gateway request ID and nonce are required.'
    );
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(
        request.userEmail
      )
  ) {
    throw new Error(
      'Authenticated user email is invalid.'
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
    !FMR_GATEWAY_ALPHA30_5_16
      .ALLOWED_OPERATIONS
      .includes(
        request.operation
      )
  ) {
    throw new Error(
      'Unsupported gateway operation.'
    );
  }

  const properties =
    PropertiesService
      .getScriptProperties();

  const secret =
    String(
      properties.getProperty(
        'FMR_GATEWAY_SECRET'
      ) || ''
    );

  if (
    secret.length <
    32
  ) {
    throw new Error(
      'Gateway secret is not configured with sufficient entropy.'
    );
  }

  const maximumAge =
    Math.max(
      60000,
      Math.min(
        600000,
        Number(
          properties.getProperty(
            'FMR_GATEWAY_MAX_AGE_MS'
          ) ||
          FMR_GATEWAY_ALPHA30_5_16
            .MAX_AGE_MS
        )
      )
    );

  const age =
    Math.abs(
      Date.now() -
      request.timestampMs
    );

  if (
    !request.timestampMs ||
    age >
      maximumAge
  ) {
    throw new Error(
      'Gateway request timestamp is stale or invalid.'
    );
  }

  const expected =
    fmrGatewaySignatureAlpha30_5_16_(
      request,
      secret
    );

  if (
    !constantTimeEqualsAlpha30_5_16_(
      expected,
      request.signature
    )
  ) {
    throw new Error(
      'Invalid gateway signature.'
    );
  }

  const replayLock =
    LockService
      .getScriptLock();

  replayLock.waitLock(
    5000
  );

  try {
    const cache =
      CacheService
        .getScriptCache();

    const replayKey =
      [
        'fmr-gateway',
        'nonce',
        request.environment,
        request.nonce
      ].join(':');

    if (
      cache.get(
        replayKey
      )
    ) {
      throw new Error(
        'Gateway replay detected.'
      );
    }

    cache.put(
      replayKey,
      request.requestId,
      Math.ceil(
        maximumAge /
        1000
      ) +
      60
    );
  } finally {
    replayLock.releaseLock();
  }
}


function dispatchFmrGatewayAlpha30_5_16_(
  request,
  databaseId
) {
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
        'Gateway operation is not implemented.'
      );
  }
}


function fmrGatewayDatabaseIdAlpha30_5_16_(
  environment
) {
  const propertyKey =
    environment ===
      'PRODUCTION'
      ? 'FMR_V3_DATABASE_ID_PRODUCTION'
      : 'FMR_V3_DATABASE_ID_TEST';

  const databaseId =
    String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          propertyKey
        ) || ''
    ).trim();

  if (!databaseId) {
    throw new Error(
      'Gateway database property is missing: ' +
      propertyKey
    );
  }

  return databaseId;
}


function fmrGatewaySignableAlpha30_5_16_(
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


function fmrGatewaySignatureAlpha30_5_16_(
  request,
  secret
) {
  const bytes =
    Utilities
      .computeHmacSha256Signature(
        fmrGatewaySignableAlpha30_5_16_(
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


function constantTimeEqualsAlpha30_5_16_(
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
    index <
      a.length;
    index += 1
  ) {
    difference |=
      a.charCodeAt(
        index
      ) ^
      b.charCodeAt(
        index
      );
  }

  return (
    difference ===
    0
  );
}


function fmrGatewayJsonAlpha30_5_16_(
  value
) {
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
