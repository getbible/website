# Loader — embed Scripture in any website

Add Bible verses to articles, sermons, study pages, or an existing application with a small JavaScript include and ordinary HTML. Loader finds elements marked with the `getBible` class, resolves their references through [Query API v2](/api/query/v2/), and displays Scripture inline, in a tooltip, or in a modal.

[Repository](https://github.com/getbible/loader) · [Support](https://git.vdm.dev/getBible/support) · [Joomla integration](/project/joomla/)

## A complete working page

Save the following as an HTML page and serve it from your website. The script is pinned to the documented Loader release, `3.1.0`, so a new upstream version cannot change your site without review.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Scripture with GetBible Loader</title>
  <script defer src="https://cdn.jsdelivr.net/gh/getbible/loader@3.1.0/dist/js/getBible.min.js"></script>
</head>
<body>
  <main>
    <h1>Read John 3:16</h1>
    <div class="getBible"
         data-format="inline"
         data-translation="kjv"
         data-show-translation="1"
         data-show-reference="1"
         data-bible-url="https://getbible.life/">
      John 3:16
    </div>
  </main>
</body>
</html>
```

No GetBible API token is needed for this public reference request. Your content remains visible as a written reference before JavaScript loads. The returned translation text and its upstream terms still determine how Scripture may be used.

## Choose the display

| Format | Intended use | Markup |
|---|---|---|
| `inline` | Put the verse directly in the document | `data-format="inline"` |
| `tooltip` | Show Scripture around a short reference | `data-format="tooltip"` |
| `modal` | Open a larger passage without leaving the page | `data-format="modal"` |

The source default is **inline**. Set the format explicitly when authoring reusable content.

```html
<p>
  Read
  <span class="getBible"
        data-format="tooltip"
        data-translation="kjv">Psalm 23:1-6</span>
  and
  <span class="getBible"
        data-format="modal"
        data-translation="kjv">Romans 8:1-4</span>.
</p>
```

Loader includes adapters for Bootstrap, Foundation, Tailwind, and UIkit, as well as its base display implementations. Use the repository's matching [framework examples](https://github.com/getbible/loader/tree/master/tests) when integrating with an existing CSS/JavaScript framework. Framework assets and their correct versions remain the host page's responsibility.

## Data-attribute reference

These defaults come from the Loader's [Action class](https://github.com/getbible/loader/blob/master/src/js/core/Action.js).

| Attribute | Accepted value | Default | Purpose |
|---|---|---|---|
| `data-format` | `inline`, `tooltip`, `modal` | `inline` | Display behavior |
| `data-translation` | One abbreviation or a semicolon-separated list | `kjv` | Translation selection |
| `data-show-book-name` | `0` or `1` | `0` | Include the book name |
| `data-show-reference` | `0` or `1` | `1` | Include the resolved reference |
| `data-show-local-reference` | `0` or `1` | `0` | Show the reference as authored locally |
| `data-show-translation` | `0` or `1` | `0` | Include the full translation name |
| `data-show-abbreviation` | `0` or `1` | `0` | Include the translation abbreviation |
| `data-show-language` | `0` or `1` | `0` | Include the language name |
| `data-show-language-code` | `0` or `1` | `0` | Include the language code |
| `data-show-bible-link` | `0` or `1` | `0` | Include a link to a Bible reader |
| `data-bible-url` | Bible-reader base URL | Historical `https://getBible.net/` | Set the reader destination |

When `data-show-local-reference="1"`, Loader disables the resolved-reference display. Setting a custom `data-bible-url` automatically enables the Bible link.

**Set the reader URL explicitly to `https://getbible.life/` when enabling Bible links.** The historical Loader default points to `getBible.net`, which now hosts the project documentation. A custom reader destination must implement the Joomla component's translation/book/chapter/verse routes. The documentation host does not expose those reading routes.

## Multiple translations

Translation abbreviations are lowercased and separated with semicolons. Fetch the current [translation catalogue](https://api.getbible.net/v2/translations.json) to discover available codes.

```html
<div class="getBible"
     data-format="inline"
     data-translation="kjv;aov"
     data-show-translation="1"
     data-show-language="1"
     data-bible-url="https://getbible.life/">
  John 3:16,19
</div>
```

Each translation is fetched independently. Do not infer the available translations or their licensing from a fixed count in an old article.

## Reference syntax

| Selection | Example |
|---|---|
| A single verse | `John 3:16` |
| Several verses from one chapter | `John 3:16,18,21` |
| A range in one chapter | `John 3:16-19` |
| Separate passages | `John 3:16-19;1 John 3:16` |
| Common abbreviated book name | `Jn 3:16` |

Use explicit book, chapter, and verse coordinates in published examples. Aliases are resolved by the Query service using Librarian's language-aware reference data. Each semicolon-separated reference should target one chapter. An unsupported alias, malformed reference, or missing passage needs correction; current Query API error handling should be used instead of relying on historical fallbacks.

To inspect the exact upstream request independently of your page:

```bash
curl --fail-with-body --silent --show-error \
  'https://query.getbible.net/v2/kjv/John%203%3A16'
```

The Query API returns chapter-keyed Scripture groups rather than a single unwrapped verse. Loader handles this grouping for you.

## Loading and caching behavior

The distributed script registers a `DOMContentLoaded` listener, scans `.getBible` elements, and creates a Loader for each matching element. Include the script in the initial page with `defer`, as in the complete example. The default bundle does not advertise a public rescanning API for content injected after that event.

Reference/translation responses are stored in the page origin's `localStorage` with a 30-day timestamp expiry. This is a reference cache; it is not the hash-verified offline corpus used by the newer reader applications. Browser storage restrictions, malformed stored values, or a full storage quota can surface as loading errors.

The default API URL is fixed in the [Api class](https://github.com/getbible/loader/blob/master/src/js/core/Api.js) to `https://query.getbible.net/v2/`. The documented HTML attributes do not include an API-version override. Test the data contract before adapting the source to another endpoint.

## Host the bundle yourself

The repository commits both development and minified bundles under `dist/js/`. For a deployment that does not use a CDN, copy the reviewed `getBible.min.js` into your site's assets and reference that local asset from the page.

To rebuild from the repository:

```bash
git clone https://github.com/getbible/loader.git
cd loader
npm ci
npm run build
```

The build uses Rollup. Commit or distribute the generated bundle through your own release process.

## Troubleshooting

| Symptom | Check |
|---|---|
| Only the original reference is visible | Verify that the bundle loaded before `DOMContentLoaded` and that the element has the exact `getBible` class |
| Fetch fails | Inspect the browser Network panel and test the same reference with cURL |
| Tooltip/modal appearance is wrong | Compare against the matching framework example and check the host framework assets |
| Reference text works in one translation only | Confirm the abbreviation exists and try an explicit book name |
| A Bible link opens documentation | Set `data-bible-url="https://getbible.life/"` |
| Old Scripture persists | Check the Loader's 30-day origin-local cache and test with a clean browser profile |

For assistance, use the [GetBible support desk](https://git.vdm.dev/getBible/support). Include the page URL or minimal HTML, browser, Loader version, translation, reference, and failing request. General enquiries: [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church).

## Source and licence

This guide consolidates the [Loader README](https://github.com/getbible/loader/blob/master/README.md), [entry point](https://github.com/getbible/loader/blob/master/src/js/getBible.js), [configuration](https://github.com/getbible/loader/blob/master/src/js/core/Action.js), [API client](https://github.com/getbible/loader/blob/master/src/js/core/Api.js), and [cache implementation](https://github.com/getbible/loader/blob/master/src/js/core/Memory.js). Loader uses the [MIT licence](https://github.com/getbible/loader/blob/master/LICENSE.md). Scripture retains its own source terms.

