# Bound replacements — preserve the browser contract

Do not rename the public functions used by `Client.html`.

Add `09_BoundGatewayClient_NEW_FILE.gs`, then replace only the bodies below.

## `getPortalBootstrapV3`

Reason: bootstrap writes `Last_Login_At` and `Last_Interface`.

Use:

```javascript
function getPortalBootstrapV3(
  interfaceName
) {
  return callFmrWriteGatewayV3_(
    'BOOTSTRAP',
    {
      interfaceName:
        interfaceName ||
        'PORTAL'
    }
  );
}
```

## `performFieldActionV3`

Use:

```javascript
function performFieldActionV3(
  request
) {
  return callFmrWriteGatewayV3_(
    'FIELD_ACTION',
    {
      request:
        request || {}
    }
  );
}
```

## `reviewBackorderV3`

Use:

```javascript
function reviewBackorderV3(
  request
) {
  return callFmrWriteGatewayV3_(
    'ADMIN_BACKORDER_DECISION',
    {
      request:
        request || {}
    }
  );
}
```

## `recordWritePerformanceEventV3`

Your current repo already exposes this Bound function and Core API.
Route it too so Viewer users do not need raw spreadsheet write permission.

Use:

```javascript
function recordWritePerformanceEventV3(
  event
) {
  return callFmrWriteGatewayV3_(
    'WRITE_PERFORMANCE_EVENT',
    {
      event:
        event || {}
    }
  );
}
```

## Leave these direct in `.15`

Read-only operations can remain direct:

- `searchPortalV3`
- dashboard/register reads
- Active Bag queue reads
- other report/search APIs

Owner-only maintenance can remain direct in this release because:

- Jonathan remains primary owner and spreadsheet editor;
- Ernie remains delegated System Owner and spreadsheet editor.

This minimizes the amount of production code changed in one release.
