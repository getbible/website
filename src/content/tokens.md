---
title: Access and tokens
description: Use GetBible anonymously, understand traffic limits, and request endpoint-specific access from the project administrators.
---

# Access and tokens

**Normal public GetBible access is free and does not require an account or token.** This includes scripture, query, search, dictionaries, commentaries, public bookmarks and the MCP service. Start directly with the [API guides](/api/) or connect an AI application to the [MCP endpoint](/mcp/). Optional tokens are issued by GetBible administrators for approved access to individual endpoints. [Published access policy](https://github.com/getbible/mcp/blob/main/site/v2/usage-policy.md).

## Request an optional token

Email [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church) privately. Explain which endpoint you want to use, what your application does, and the request volume or access requirement you would like the team to consider. This helps the administrators assess the request; no automated signup or automatic quota upgrade is implied.

The administrators provide any approved token, its scope and its applicable policy. A token for one host is not automatically valid for another. Keep credentials out of the public [support desk](https://git.vdm.dev/getBible/support), repository issues, screenshots and shared logs.

## Where a token belongs

Use the secure credential settings in your application or MCP client to send an issued token as an HTTP bearer credential to its approved endpoint. The standard header is `Authorization: Bearer` followed by that token. Do not place tokens in a URL, Bible reference, MCP tool argument, public source code or a browser-delivered static site.

The public ChatGPT development connection uses **No Authentication**. GetBible's optional bearer credentials do not establish an OAuth flow or a ChatGPT API-key sign-in method. Use them in clients that support secure custom HTTP credentials, following the administrators' instructions. [Client authentication guidance](https://github.com/getbible/mcp/blob/main/docs/CLIENTS.md).

A credential configured for the MCP connection authenticates that connection. It is not a request to forward the credential to upstream API hosts. Deployment or package-publication credentials used by project maintainers are also separate from public API access tokens.

## Anonymous MCP traffic limits

The official MCP service documents the same default anonymous limits as public search, per client address:

| Control | Published default |
| --- | --- |
| Request rate | 50 requests per second |
| Burst allowance | 250 requests |
| Nominal hourly budget | 10,000 requests per hour |
| Nominal daily budget | 100,000 requests per day |
| Concurrent connections | 100 per address |

Hourly and daily figures are sustained-rate budgets, not calendar quotas that reset at a fixed time. All applicable controls must be satisfied together. These MCP/search defaults must not be assumed to apply identically to every service; use each endpoint's documentation and actual response headers. [Limit definitions](https://github.com/getbible/mcp/blob/main/site/v2/usage-policy.md).

## Handle rate limits and failures

When the server returns HTTP `429`, wait for `Retry-After` when it is present. Reduce concurrency and request rate, and use backoff instead of immediate retry loops. Handle other HTTP errors and unavailable upstreams explicitly. Successful health checks do not guarantee that every lookup can complete.

For efficient integrations, prefer individual chapters and study entries over repeatedly downloading whole translations or modules. Follow search pagination without restarting the same query unnecessarily. Optional tokens do not remove content-license requirements or cache freshness rules.

## Content rights and caching

Use each API version's translation catalog to read rich metadata and copyright information. Compact chapter, query or search results do not repeat every field, but the content's terms still apply. Dictionary and commentary modules have their own attribution, provenance and distribution terms. Public bookmarks supply topic/reference data with a separate license.

If you cache eligible content, preserve source freshness, obey shorter HTTP lifetimes and `no-store`, and refresh within the absolute 30-day retention ceiling. Retain exact checksums where published and invalidate changed data at the appropriate scope. An unchanged hash does not extend an expired response indefinitely. [Full cache policy](https://github.com/getbible/mcp/blob/main/site/v2/cache-policy.md).

Public questions about integrations, projects and API behavior belong at the [GetBible support desk](https://git.vdm.dev/getBible/support). Private token questions belong in [email](mailto:getBible@TrueChristian.church). You can also [support the project](/donate/) as it expands access to Scripture for developers and readers around the world.
