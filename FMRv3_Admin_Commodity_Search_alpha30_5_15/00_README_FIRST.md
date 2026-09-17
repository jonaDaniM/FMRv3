# FMRv3 Admin Commodity Search — alpha.30.5.15

## Scope

This patch adds an **Admin-only Commodity Code search mode** to the published FMR register.

A search for one exact commodity code returns every published FMR containing at least one active material line with that code.

Example:

```text
Search Type: Commodity Code
Search: ABC123
```

returns each matching FMR **once**, even if that FMR contains ABC123 on multiple material lines.

## Performance design

This patch intentionally does **not** scan `FMR_Line_Items` on every Admin search.

Instead it extends the existing `Search_Index` with exact keys:

```text
COMMODITY:<NORMALIZED_COMMODITY_CODE>
```

The Admin register then:

1. performs one exact indexed lookup;
2. deduplicates matching `FMR_ID`s;
3. filters the already lightweight FMR header summaries;
4. sorts/paginates only the matching FMR headers;
5. still loads material-line details only when an Admin opens one FMR.

This preserves the existing fast Admin-register architecture.

## Release boundary

Use this as:

```text
3.0.0-alpha.30.5.15
Admin commodity-code indexed search
```

The security-hardening release previously called `.15` should move to `.16`.
Do not combine the commodity-search change with the write-gateway/security cutover.

## Files changed

- `FMRCoreV3/Config.gs` — version only.
- `FMRCoreV3/IndexServiceFmr.gs` — commodity key + one index entry per material line.
- `FMRCoreV3/AdminRegisterService.gs` — COMMODITY query mode.
- `Bound/Index.html` — Commodity Code search option.
- `Bound/Client.html` — Admin placeholder text only.

No Field transaction code changes.
No quantity logic changes.
No Bag & Tag changes.
No authorization changes.
No database schema columns are added.
