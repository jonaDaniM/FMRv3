function gatewayCallerEmailFmrV3_() {
  const email =
    String(
      Session
        .getActiveUser()
        .getEmail() ||
      ''
    )
      .trim()
      .toLowerCase();

  if (!email) {
    throw new Error(
      'Active Google account email is unavailable. ' +
      'Sign in to the FMR portal with the authorized account and retry.'
    );
  }

  return email;
}


function callFmrWriteGatewayV3_(
  operation,
  payload
) {
  const properties =
    PropertiesService
      .getScriptProperties();

  const gatewayUrl =
    String(
      properties.getProperty(
        'FMR_GATEWAY_URL'
      ) || ''
    ).trim();

  const secret =
    String(
      properties.getProperty(
        'FMR_GATEWAY_SECRET'
      ) || ''
    );

  if (!gatewayUrl) {
    throw new Error(
      'FMR_GATEWAY_URL is not configured.'
    );
  }

  if (
    secret.length <
    32
  ) {
    throw new Error(
      'FMR_GATEWAY_SECRET is not configured with sufficient entropy.'
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

    userEmail:
      gatewayCallerEmailFmrV3_(),

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
        method:
          'post',
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

  const responseText =
    response
      .getContentText();

  if (
    /^\s*<!doctype html/i
      .test(
        responseText
      ) ||
    /^\s*<html/i
      .test(
        responseText
      )
  ) {
    throw new Error(
      'Gateway returned HTML instead of JSON. ' +
      'Check the gateway web-app access/deployment settings.'
    );
  }

  let decoded;

  try {
    decoded =
      JSON.parse(
        responseText
      );
  } catch (error) {
    throw new Error(
      'Gateway returned non-JSON response. HTTP ' +
      status +
      ': ' +
      responseText.slice(
        0,
        500
      )
    );
  }

  if (
    status < 200 ||
    status >= 300 ||
    !decoded ||
    decoded.ok !==
      true
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
