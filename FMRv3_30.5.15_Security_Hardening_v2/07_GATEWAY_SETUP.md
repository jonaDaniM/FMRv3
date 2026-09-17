# Write Gateway setup

## 1. Create the project

Under the existing primary owner account:

`jonathanmura05@gmail.com`

create a standalone Apps Script project:

`FMRv3 Write Gateway - SECURITY`

Do not replace the current Bound project.

## 2. Add FMRCoreV3 library

Use the existing FMRCore library project and an immutable version.

For preliminary TEST development you may use library development mode only in a controlled TEST setup.
For production canary, pin an immutable library version.

## 3. Add `08_WriteGateway.gs`

Paste the complete file into the new gateway project.

## 4. Gateway Script Properties

Create:

```text
FMR_GATEWAY_SECRET
FMR_V3_DATABASE_ID_TEST
FMR_V3_DATABASE_ID_PRODUCTION
FMR_GATEWAY_MAX_AGE_MS
```

Recommended max age:

```text
300000
```

Generate the secret as at least 32 random bytes.
Do not store it in source control.

The TEST and PROD IDs are fixed by the gateway.
A request cannot supply an arbitrary spreadsheet ID.

## 5. Deploy

Deploy gateway as a web app:

- Execute as: **Me / deploying primary owner**
- Access: endpoint must be reachable by server-side `UrlFetchApp`

If the deployment uses a public-reachable endpoint, the URL itself is NOT the security control.
The HMAC signature, timestamp, nonce, operation allowlist, fixed environment mapping, and FMRCore authorization are the security controls.

Do not expose this URL as a normal user-facing application URL.

## 6. Bound Script Properties

In TEST Bound first, set:

```text
FMR_GATEWAY_URL=<gateway /exec URL>
FMR_GATEWAY_SECRET=<same secret>
```

Never place the secret in:
- `Client.html`;
- `Index.html`;
- URL query parameters;
- browser localStorage;
- GitHub.

## 7. Existing manifest

The current Bound manifest already includes the external-request OAuth scope used by `UrlFetchApp`.
Do not remove existing scopes during this security release.
