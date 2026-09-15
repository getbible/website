# Get Bible website

The main Get Bible website and documentation hub at **https://getbible.net**. Built with Astro 7, TypeScript and Markdown, and deployed as static files through GitHub Pages.

## Develop

Requires Node.js 24 and npm.

```bash
npm ci
npm run build
npm run dev
```

`npm run build` generates the OpenAPI references, Postman collections, search index, Markdown alternatives, sitemap and AI indexes, then verifies the output. Run it before development when you need to preview generated resources. `npm test` checks contract conversion and HTML sanitization; `npm run check` checks Astro and TypeScript.

## Publish to GitHub Pages

The workflow in `.github/workflows/pages.yml` builds and checks pull requests. Pushes to `main` and manual runs on `main` also deploy through the official GitHub Pages artifact workflow.

1. In **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Set the custom domain to **getbible.net**, configure its DNS for GitHub Pages, and enable **Enforce HTTPS** once GitHub has issued the certificate.
3. Merge an approved change into `main`. The deployment appears in the **github-pages** environment.

`public/CNAME`, canonical URLs, sitemap and Astro's `site` are configured for `getbible.net`. No `/website/` base path is used with the custom domain. The API services retain their existing subdomains.

GitHub documents the [custom-domain DNS records](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) and [Actions deployment setup](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Bank donation details

In **Settings → Secrets and variables → Actions**, create the repository secret:

```text
DONATION_BANK_DETAILS_HTML
```

Its value is the basic HTML containing the actual donation bank details, for example paragraphs, strong labels or a table. No bank details are committed to source. The production build sanitizes this value to allow basic text formatting and safe links, then includes it on `/donate/` and in the equivalent Markdown exports. Scripts, event handlers, forms, images and unsafe URL schemes are removed.

**The rendered bank details are public website content.** A repository secret protects the source value; it does not make published donation instructions private. Never put passwords or payment credentials in this field. Pull request builds receive no donation secret. If it is unset, visitors can request donation information through the project's email link. Updating the secret requires a new deployment to refresh the page.

For a local preview, export the environment variable in the shell running the build; do not commit a file containing its value.

## Edit documentation

| Content | Source |
| --- | --- |
| API guides | `src/content/api/` |
| Project guides | `src/content/project/` |
| MCP, mission, tokens, donations | `src/content/*.md` |
| Home page and catalog | `src/pages/index.astro`, `src/data/catalog.mjs` |
| OpenAPI source snapshots | `public/openapi/` |
| Contract conversion | `scripts/openapi.mjs` |
| Shared styles and behavior | `src/styles/global.css`, `src/scripts/client.ts` |

Keep one top-level heading in each document. Routes follow `api/<type>/<version>` and `project/<slug>`. The Joomla page combines the package, component and scripture-loader plugin. Generated references under `src/generated/` are rebuilt and ignored by Git; change their source contracts or generator instead.

Refresh the API contracts deliberately:

```bash
npm run sync:apis
npm run build
npm test
npm run check
```

Review the source JSON diff and update narrative examples where contracts change. Normal builds use the checked-in snapshots, so an upstream outage cannot break publication. All 120 current operations have generated reference coverage and Postman requests, including request bodies, resource examples and text-response content types. Error-only operations are labelled in the collections.

## Markdown and AI access

Each HTML page advertises a `rel="alternate" type="text/markdown"` link. Direct Markdown paths work on GitHub Pages without JavaScript:

- `/index.md`
- `/api/bible/v3.md`
- `/project/librarian.md`
- `/mcp.md`

The page button opens `?format=markdown`, a browser view with a formatted-page link, raw Markdown link and copy button. This query parameter is a client-side convenience, not server content negotiation. Automated readers should use the direct `.md` URLs. GitHub Pages cannot implement arbitrary `Accept: text/markdown` negotiation or return different HTTP bodies based solely on a query string.

`/llms.txt` follows the [community proposal](https://llmstxt.org/); `/llms-full.txt` contains the complete documentation. These complement the regular sitemap and explicit Markdown alternatives rather than claiming a universal AI crawling standard. HTML and Markdown are generated from the same content.

## Documentation sources and migration

Guides were reviewed against the public Get Bible repositories and nine live API contracts in September 2026. Project status is described individually; the developing Flutter app uses v2 today and does not yet claim its intended v3/study integrations. MCP documentation targets the package being rolled out.

The older `getbible.life/docs`, `/loader` and `/joomla` pages could not be retrieved during the initial migration; their replacement guides were reconstructed and expanded from the current repository documentation and implementation. Configure redirects on the existing Joomla site when retiring those documentation routes:

| Existing route | Destination |
| --- | --- |
| `https://getbible.life/docs` | `https://getbible.net/api/` |
| `https://getbible.life/loader` | `https://getbible.net/project/loader/` |
| `https://getbible.life/joomla` | `https://getbible.net/project/joomla/` |

This repository does not control the Joomla host or API service redirects. The Bible reading experience remains at `getbible.life`. Loader examples explicitly set that reading-site URL because the historical loader default used `.net`.

Brand icons were supplied by the project. The ocean image comes from [getbible/robot](https://github.com/getbible/robot/blob/master/miniapp/assets/ocean-light-hero.webp). Fonts are DM Sans and Manrope; the system sans-serif fallback keeps the site usable if the font provider is unavailable.

## Support and affiliation

All public support: **https://git.vdm.dev/getBible/support**. Private enquiries: **getBible@TrueChristian.church**. Get Bible is a project of [trueChristian.church](https://trueChristian.church).

See [LICENSE](LICENSE) for this repository's license. Software licenses do not replace the content rights of Bible translations and study resources.
