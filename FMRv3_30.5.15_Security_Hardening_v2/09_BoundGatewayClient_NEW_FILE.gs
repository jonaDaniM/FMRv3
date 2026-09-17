/**
 * Add to Bound for alpha.30.5.15.
 *
 * Script Properties:
 *   FMR_GATEWAY_URL
 *   FMR_GATEWAY_SECRET
 *
 * Private helper names end with "_" so browser code cannot invoke the generic
 * gateway directly.
 */

function callFmrWriteGatewayV3_(
  operation,
  payload
) {
  const props =
    PropertiesService
      .getScriptProperties();

  const gatewayUrl =
    String(
      props.getProperty(
        'FMR_GATEWAY_URL'
      ) || ''
    ).trim();

  const secret =
    String(
      props.getProperty(
        'FMR_GATEWAY_SECRET'
      ) || ''
    );

  if (!gatewayUrl) {
    throw new Error(
      'FMR_GATEWAY_URL is not configured.'
    );
  }

  if (!secret) {
    throw new Error(
      'FMR_GATEWAY_SECRET is not configured.'
    );
  }

  const request = {
    requestId:
      'GWREQ-' +
      Utilities
        .getUuid()
        .toUpperCase(),

    timestampMs:
      Date.now(),

    nonce:
      Utilities
        .getUuid()
        .toUpperCase(),

    operation:
      String(
        operation || ''
      )
        .trim()
        .toUpperCase(),

    // This is obtained server-side from the authenticated Bound web app.
    // It is NOT accepted from Client.html.
    userEmail:
      String(
        callerEmailFmrV3_() ||
        ''
      )
        .trim()
        .toLowerCase(),

    environment:
      activeBoundEnvironmentV3_(),

    payload:
      payload || {}
  };

  request.signature =
    signFmrWriteGatewayRequestV3_(
      request,
      secret
    );

  const response =
    UrlFetchApp.fetch(
      gatewayUrl,
      {
        method: 'post',
        contentType:
          'application/json',
        payload:
          JSON.stringify(
            request
          ),
        muteHttpExceptions:
          true,
        followRedirects:
          true
      }
    );

  const status =
    response
      .getResponseCode();

  const text =
    response
      .getContentText();

  let decoded;

  try {
    decoded =
      JSON.parse(
        text
      );
  } catch (error) {
    throw new Error(
      'Gateway returned non-JSON response. HTTP ' +
      status +
      ': ' +
      text.slice(
        0,
        500
      )
    );
  }

  if (
    status < 200 ||
    status >= 300 ||
    !decoded ||
    decoded.ok !== true
  ) {
    throw new Error(
      'FMR gateway rejected request: ' +
      String(
        decoded &&
        decoded.error ||
        ('HTTP ' + status)
      )
    );
  }

  return decoded.result;
}

function signFmrWriteGatewayRequestV3_(
  request,
  secret
) {
  const signable =
    [
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

  const bytes =
    Utilities
      .computeHmacSha256Signature(
        signable,
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
