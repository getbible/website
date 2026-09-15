---
title: "Search API"
description: "Search Scripture across writing systems with words, phrases, exclusions, scope filters and ranked results."
---

The Search API finds verses containing words or phrases and returns both an ordered match list and chapter-grouped Scripture. It applies matching rules derived from the writing system of the text, so applications can send an ordinary search string without implementing their own language detector.

## Choose a data version

| Version | Base route | Guide |
| --- | --- | --- |
| v2 | `https://search.getbible.net/v2/{translation}/{search}` | [Search v2](/api/search/v2/) |
| v3 | `https://search.getbible.net/v3/{translation}/{search}` | [Search v3](/api/search/v3/) |

The HTTP filters and result envelope are the same. The selected data version controls the source verses: v3 can retain lexical tokens, annotation spans and paragraph-start metadata. Chapter-level editorial layout is obtained from the static Bible API.

## Search in one request

```bash
curl --fail-with-body --compressed --get \
  'https://search.getbible.net/v3/kjv' \
  --data-urlencode 'q=faith hope' \
  --data-urlencode 'scope=new_testament' \
  --data-urlencode 'limit=25'
```

By default, every search unit must occur in the verse, matching is case-insensitive, applicable diacritics are folded and results are in canonical order. The full version guides document every filter, accepted type, limit and error.

## GET and POST use the same search

GET accepts URL parameters. POST accepts the same parameters, a JSON object, or both. A value supplied in the path wins over the query string, which wins over the body, which wins over configured defaults. Explicit `false` and `0` are values; JSON `null` leaves a lower-priority/default value unchanged.

```bash
curl --fail-with-body --compressed \
  --header 'Content-Type: application/json' \
  --data '{"translation":"kjv","q":"faith hope","words":"all","sort":"relevance","limit":25}' \
  'https://search.getbible.net/v3'
```

Use GET for shareable, cacheable searches and POST when a structured body is more convenient. POST search responses are not cached. Neither method writes or modifies Scripture.

## One envelope, two kinds of result

| Member | Contents |
| --- | --- |
| `query` | Search text, kind, translation, engine version and counts; full-text searches also include criteria, pagination, source hash, cache state, analysis and cost |
| `results` | Scripture grouped by `{translation}_{book}_{chapter}` |
| `matches` | Ordered verse identities; full-text matches also include score, occurrences and matched terms |

Check `query.kind`. A string that resolves as a Scripture reference returns `kind: "reference"`; it does not apply full-text filtering or pagination. Full-text results use `kind: "search"`. For relevance sorting, `matches` is the authoritative order; do not use the property order of chapter objects as the ranking.

## Matching across scripts

The librarian inspects Unicode script properties in both the query and corpus. Alphabetic scripts use word units; continuous scripts such as Han and Hangul use positional character units; abjad handling supports optional vowel-point folding and attached-particle stems. Brahmic scripts preserve vowel-bearing combining marks. Mixed-script input is handled by its individual runs rather than switching the entire string to substring matching. Original returned verse text remains unchanged. See the [librarian search documentation](https://github.com/getbible/librarian/blob/master/docs/SEARCH.md).

## Pagination and limits

The public HTTP contract accepts `limit` from 1 to 100 and `offset` from 0 to 10000. Use `query.has_more` and advance the offset by the number returned. Keep the query, translation, API version and criteria unchanged while paging. If the source hash changes between pages, restart to avoid combining different data generations.

The Python librarian's local limits can differ from the public HTTP service. Use the API's OpenAPI limits when integrating over HTTP. A partner bearer token exempts public rate budgets; it does not disable search cost, input or execution limits.

## Access and operational behavior

Public calls work without a token under per-address budgets. Request application access through [support](https://git.vdm.dev/getBible/support) or [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church), naming `search.getbible.net` among the domains needed. Send the issued token in the `Authorization` header.

Retry `429` and temporary `503` responses according to `Retry-After`. Narrow a repeatedly expensive request with a scope, book filter or more precise words. A first request for an uncached translation can include corpus preparation time. Handle timeouts without assuming that the translation does not exist.

## Contracts and upstream documentation

| Resource | Link |
| --- | --- |
| Service overview | [search.getbible.net](https://search.getbible.net/) |
| Version discovery | [versions.json](https://search.getbible.net/versions.json) |
| v2 documentation and OpenAPI | [Documentation](https://search.getbible.net/v2/) · [OpenAPI JSON](https://search.getbible.net/v2/openapi.json) |
| v3 documentation and OpenAPI | [Documentation](https://search.getbible.net/v3/) · [OpenAPI JSON](https://search.getbible.net/v3/openapi.json) |
| Matching and search fields | [Librarian search](https://github.com/getbible/librarian/blob/master/docs/SEARCH.md) |
| Runtime contract | [Runtime endpoints](https://github.com/getbible/api/blob/main/docs/RUNTIME_ENDPOINTS.md) |
| Source data and study metadata | [Bible v3](/api/bible/v3/) |

Use the central [GetBible support desk](https://git.vdm.dev/getBible/support) for help with search behavior or an integration.
