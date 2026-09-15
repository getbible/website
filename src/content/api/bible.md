---
title: "Bible API"
description: "Download complete translations, books and chapters as versioned static JSON, with indexes and change checksums."
---

The Bible API is the foundation of GetBible. It publishes Scripture as a predictable tree of JSON files, so a reader, mobile app, website or offline tool can request one chapter, one book or an entire translation. The same data feeds the reference and full-text services.

## Choose a version

| Version | Best fit | Documentation | Live base |
| --- | --- | --- | --- |
| v2 | Existing integrations and a compact chapter/verse text format | [Bible v2](/api/bible/v2/) | `https://api.getbible.net/v2/` |
| v3 | New reading and study experiences that can use source lexical and layout metadata | [Bible v3](/api/bible/v3/) | `https://api.getbible.net/v3/` |

Both versions publish translation, book and chapter documents. Version 3 retains the familiar `text`, `chapter`, `verse` and `name` fields and adds optional source metadata: paragraph starts, word tokens, annotation spans, introductions and chapter editorial layout. Availability depends on the translation and its source; metadata is not invented for translations that lack it.

The API version selects a data tree. It is separate from the version of the Python librarian package, the MCP package or the server deployment software. Keep the chosen API version in application configuration and cache keys. The [live version index](https://api.getbible.net/versions.json) identifies published trees and their contracts.

## Make your first request

```bash
curl --fail-with-body --compressed \
  'https://api.getbible.net/v3/kjv/43/3.json'
```

This returns John chapter 3 in the King James Version. `kjv` identifies the translation, `43` is the GetBible book number for John and `3` is the chapter. The response contains all verses in that chapter.

For an individual verse or a selection of references, use the [Query API](/api/query/). For words and phrases, use the [Search API](/api/search/). The static Bible API does not accept `?verse=16`, `?q=faith` or other query parameters.

## Discover data instead of guessing

```bash
# Translation catalogue, including language and distribution metadata
curl --fail-with-body --compressed 'https://api.getbible.net/v3/translations.json'

# Books actually published for the KJV
curl --fail-with-body --compressed 'https://api.getbible.net/v3/kjv/books.json'

# Chapters actually published for John
curl --fail-with-body --compressed 'https://api.getbible.net/v3/kjv/43/chapters.json'
```

The JSON indexes are objects keyed by translation abbreviation, book number or chapter number. Their entries include a document `url` and its `sha` change checksum. JSON object keys representing numbers are strings; book and chapter fields inside the records are integers.

Discover books independently for each translation. Translations may have different books, names or versification. In v3, additional source book identities can have stable numbers above the familiar 1–89 range. A translation's `books.json` is the authoritative inventory for that tree.

## Understand the three document sizes

| Resource | Example | Contents |
| --- | --- | --- |
| Whole translation | `/v3/kjv.json` | Translation metadata and every book, chapter and verse |
| Whole book | `/v3/kjv/43.json` | Shared translation metadata and every chapter in John |
| One chapter | `/v3/kjv/43/3.json` | Shared translation metadata, chapter identity and its verses |
| Translation catalogue | `/v3/translations.json` | Metadata for every published translation without the full Scripture hierarchy |

Choose the smallest document that serves the task. A chapter request is suitable for a reader; a full translation download is useful for offline use and indexing. Store catalogue metadata separately and join on `abbreviation`, so repeated verse selections do not need to carry translation history or distribution descriptions.

## Access, caching and change detection

Public calls work without registration. The live API advertises metered access by client address, with bearer tokens available to applications and partners. Request a token through [GetBible support](https://git.vdm.dev/getBible/support) or [email the team](mailto:getBible@TrueChristian.church). Tell us which API domains the application uses. Tokens are scoped to the domain that issued them and belong in the `Authorization` header, never in a URL.

Use the returned `Cache-Control` and `ETag` headers. Revalidate a stored representation with `If-None-Match`; an unchanged representation can return `304` with no response body. `Last-Modified` and `If-Modified-Since` are also available on static documents. Read the actual headers instead of hardcoding a lifetime: deployed policy can differ from server defaults.

Every JSON document has a sibling `.sha` file. For example, `/v3/kjv/43/3.sha` identifies the bytes of `/v3/kjv/43/3.json`. A checksum is a data change token; it is different from an HTTP validator and does not establish publisher identity. For persistent v2 Scripture caches, retain the relevant scope hashes and check at least weekly, as described in the [GetBible v2 cache policy](https://github.com/getbible/mcp/blob/main/site/v2/cache-policy.md). Replace changed text and its hash together.

## Browser applications

The public APIs allow cross-origin reads. Browser clients can fetch JSON directly and respect the translation's `direction` when displaying it. Keep private partner tokens on your own backend rather than embedding them in publicly downloadable JavaScript.

```javascript
const response = await fetch('https://api.getbible.net/v3/kjv/43/3.json');
if (!response.ok) {
  throw new Error(`GetBible returned HTTP ${response.status}`);
}
const chapter = await response.json();
for (const verse of chapter.verses) {
  console.log(verse.name, verse.text);
}
```

Render Scripture text as text content. Preserve the returned verse objects if the application stores or forwards v3 metadata.

## Data provenance and distribution

The [v2 builder](https://github.com/getbible/v2_builder) and [v3 builder](https://github.com/getbible/v3_builder) generate the published data from CrossWire SWORD modules. The v3 pipeline uses [GetBibleSWORD](/project/getbiblesword/) extraction and publishes compact reading data. Check the translation catalogue's `distribution_license`, `distribution_source` and related fields when choosing material for redistribution. A source-code licence and a translation's distribution terms describe different things.

## Contracts and upstream documentation

| Resource | Link |
| --- | --- |
| API service overview | [api.getbible.net](https://api.getbible.net/) |
| v2 live documentation | [api.getbible.net/v2/](https://api.getbible.net/v2/) |
| v2 OpenAPI 3.1 | [openapi.json](https://api.getbible.net/v2/openapi.json) |
| v3 live documentation | [api.getbible.net/v3/](https://api.getbible.net/v3/) |
| v3 OpenAPI 3.1 | [openapi.json](https://api.getbible.net/v3/openapi.json) |
| Server access and cache policy | [Access modes](https://github.com/getbible/api/blob/main/docs/ACCESS_MODES.md) |
| v3 data semantics | [Generated static output](https://github.com/getbible/v3_builder/blob/master/docs/static-output.md) |

For help with any API or project, use the shared [GetBible support desk](https://git.vdm.dev/getBible/support). Include the request URL, HTTP status and `X-Request-ID` response header when reporting an API problem; omit credentials.
