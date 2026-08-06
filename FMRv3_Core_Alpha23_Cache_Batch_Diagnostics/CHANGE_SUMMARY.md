# Change Summary

## Database-scoped cache keys

Before:

```text
fmr3:user:<email hash>
fmr3:list:<list name>
fmr3:last-access:<email hash>
```

After:

```text
fmr3:<database fingerprint>:user:<email hash>
fmr3:<database fingerprint>:list:<list name>
fmr3:<database fingerprint>:last-access:<email hash>
```

This prevents TEST and PRODUCTION from sharing cached users, list values, or
last-access suppression.

Configuration caching was already scoped to the database ID and remains
unchanged.

## Batched Admin ISO summaries

Before:

```text
One Search Index lookup per visible FMR register record
```

After:

```text
One regex TextFinder pass for all visible FMR search keys
One batched row read
ISO references grouped in memory by FMR
```

The existing single-record lookup is retained as a fallback and for diagnostic
parity comparison.

## Identity behavior

No identity enforcement changes are made.

The new Bound diagnostic records:

```text
Active user
Effective user
Resolved caller
Whether fallback was used
Environment property state
Resolved and Core database fingerprints
```

A later release can remove the interactive effective-user fallback only after
all account paths are verified.
