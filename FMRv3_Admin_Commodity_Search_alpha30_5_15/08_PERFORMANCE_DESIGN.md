# Why this implementation is fast

The existing Admin register is deliberately header-first: it reads active
`FMR_Header` summaries and does not load material lines until a user opens an
FMR.

Commodity Code lives on `FMR_Line_Items`, so the slow/simple implementation
would be:

```text
Admin searches commodity
    ↓
read all ~6,000 material lines
    ↓
scan Commodity_Code
    ↓
dedupe FMRs
    ↓
build register
```

Do **not** implement that.

This patch uses:

```text
COMMODITY:ABC123
    ↓
exact Search_Index lookup
    ↓
cached index entries
    ↓
Set(FMR_ID)
    ↓
filter lightweight FMR headers
    ↓
paginate 25 rows
```

The index cache already supports large results using chunked ScriptCache
storage, so a commonly used commodity can map to many material lines without
depending on one oversized cache value.

## Index-size impact

The current index has roughly three rows per published material line:
FMR, ISO, and LINE.

This feature adds at most one extra COMMODITY row per material line with a
nonblank commodity code.

At the current project scale (~6,000 material lines), that is a moderate,
predictable increase and is preferable to performing a full material-line
scan for every Admin commodity search.

## Exact vs partial commodity search

This release intentionally uses **exact normalized commodity-code matching**.

Advantages:
- fastest;
- deterministic;
- cache-friendly;
- avoids accidental matches between similar commodity codes;
- scales with project growth.

If partial/contains commodity search is needed later, build a separate
prefix/token index rather than scanning material lines interactively.
