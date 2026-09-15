---
title: "Query API"
description: "Resolve human-readable Scripture references into chapter-grouped verse JSON in API v2 or v3."
---

Give the Query API a Scripture reference and it returns the selected verses. It accepts familiar names and abbreviations, verse lists, ranges and multiple references in one call. The response groups verses by translation, book and chapter so the same renderer can display a single verse or a selection spanning several books.

## Choose your data version

| Version | Endpoint | Guide |
| --- | --- | --- |
| v2 | `https://query.getbible.net/v2/{translation}/{reference}` | [Query v2](/api/query/v2/) |
| v3 | `https://query.getbible.net/v3/{translation}/{reference}` | [Query v3](/api/query/v3/) |

Both versions use the same route and grouping contract. Version 3 preserves the selected source verses' optional `paragraph`, `tokens` and `spans`. Static chapter `editorial` is not part of assembled query results. If the application needs complete chapter headings or paragraph ranges, fetch the chapter from the [Bible API](/api/bible/).

## Request one verse

```bash
curl --fail-with-body --compressed \
  'https://query.getbible.net/v3/kjv/John3:16'
```

The top-level key is `kjv_43_3`: KJV, book 43, chapter 3. The chapter contains compact translation metadata, `book_nr`, `book_name`, `chapter`, `name`, `ref` and a `verses` array.

## Request several passages

```bash
curl --fail-with-body --compressed \
  'https://query.getbible.net/v3/kjv/Genesis%201:1-3;John%203:16,18-21;Romans%208:1-4'
```

Spaces are percent-encoded. Semicolons separate references; commas select verses within a chapter; a hyphen describes a range. Quote URLs in the shell so semicolons are not interpreted as command separators. Application code should encode the entire reference as one URL path segment.

```javascript
const reference = 'Genesis 1:1-3;John 3:16';
const url = `https://query.getbible.net/v3/kjv/${encodeURIComponent(reference)}`;
const response = await fetch(url);
const payload = await response.json();
if (!response.ok) {
  throw new Error(payload.detail ?? `HTTP ${response.status}`);
}
for (const chapter of Object.values(payload)) {
  for (const verse of chapter.verses) {
    console.log(verse.name, verse.text);
  }
}
```

## Explicit references and predictable errors

A missing reference returns `404 missing_reference`. An unresolvable reference returns a `404` problem document. If one reference in a multi-reference request cannot resolve, the entire request is rejected; the response is not silently reduced to the references that happened to work.

Omitting the translation on a valid short reference uses the configured default, KJV on the public service. For example, `/v3/John3:16` redirects to `/v3/kjv/John3:16`. Explicitly supplying an unknown translation returns `404`; it does not substitute KJV. No invalid input is replaced by a default passage.

Use an explicit version in production links. Unversioned aliases follow the domain's configured default endpoint, which can change independently of the application.

## Query versus search

| Your input | API |
| --- | --- |
| A chapter or verse reference | Query |
| Several known references | Query |
| Words, a phrase or search filters | [Search](/api/search/) |
| A complete chapter with editorial layout | [Bible](/api/bible/) |
| A whole translation for offline use | [Bible](/api/bible/) |

Query takes no query parameters and no JSON body. A URL such as `?reference=John3:16` is not the Query API contract. Put the translation and reference in the path.

## Access, caching and support

The public service is metered without a token. Application/partner tokens provide exemption from public rate budgets and must be used on their issuing domain. [Request access by email](mailto:getBible@TrueChristian.church) or through the shared [support desk](https://git.vdm.dev/getBible/support).

Respect the actual `Cache-Control` response and retain `ETag` for conditional requests. Include the API version, translation and reference in cache keys. If a v2 query result combines chapters, persistent caching needs the hashes of every participating chapter, as described in the [v2 cache contract](https://github.com/getbible/mcp/blob/main/site/v2/cache-policy.md).

## Contracts and upstream documentation

| Resource | Link |
| --- | --- |
| Service overview | [query.getbible.net](https://query.getbible.net/) |
| Version discovery | [versions.json](https://query.getbible.net/versions.json) |
| v2 service docs and OpenAPI | [Documentation](https://query.getbible.net/v2/) · [OpenAPI JSON](https://query.getbible.net/v2/openapi.json) |
| v3 service docs and OpenAPI | [Documentation](https://query.getbible.net/v3/) · [OpenAPI JSON](https://query.getbible.net/v3/openapi.json) |
| Runtime response and routing policy | [Runtime endpoints](https://github.com/getbible/api/blob/main/docs/RUNTIME_ENDPOINTS.md) |
| Reference grammar and grouping | [Librarian usage](https://github.com/getbible/librarian/blob/master/docs/USAGE.md) |
| Compact metadata contract | [Translation metadata](https://github.com/getbible/librarian/blob/master/docs/TRANSLATION_METADATA.md) |

Quote the API's `X-Request-ID` when asking [support](https://git.vdm.dev/getBible/support) about a failed request.
