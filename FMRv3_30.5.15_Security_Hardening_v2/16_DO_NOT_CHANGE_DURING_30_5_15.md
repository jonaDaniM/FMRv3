# Changes explicitly excluded from alpha.30.5.15

To keep the release narrow, do not combine the following with the security cutover:

- primary-owner transfer;
- Apps Script ownership transfer;
- changing the production database file;
- changing the production `/exec` URL;
- deleting old Apps Script projects;
- removing `jonathanmura05@gmail.com`;
- demoting/removing Ernie;
- large UI redesign;
- schema-wide timestamp cleanup;
- material quantity normalization;
- new import workflows.

The stale `Updated_At` line metadata issue should be diagnosed separately after security is stable.

The Admin UI improvements for:
- actual transaction timestamp;
- Last Activity;
- recent user activity;

should also be a separate, testable UI/telemetry change unless you explicitly decide to include them after the security cutover is validated.
