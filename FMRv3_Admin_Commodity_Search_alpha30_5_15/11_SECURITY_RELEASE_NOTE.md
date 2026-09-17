# Security package version note

The separate security-hardening package was previously prepared under the
working version label `alpha.30.5.15`.

Because commodity search is being released first, use:

```text
Commodity search: 3.0.0-alpha.30.5.15
Security hardening: 3.0.0-alpha.30.5.16
```

Do not execute the old security ZIP literally against production until its
version references are refreshed for `.16`.

The security architecture itself remains valid:
- Bound identifies the real user;
- owner-executed write gateway performs authorized writes;
- ordinary users become Viewer only after testing;
- hard protections last.
