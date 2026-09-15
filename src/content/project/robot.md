# Robot — Scripture inside Telegram

GetBible Robot brings reading, reference lookup, full-text search, selections, bookmarks, and Scripture posting into Telegram. The Mini App reads public Bible data directly while Robot handles Telegram sessions and authoritative posting.

[Repository](https://github.com/getbible/robot) · [Support](https://git.vdm.dev/getBible/support) · [All projects](/project/)

The current reader uses Bible API v2 and Query API v2. Full-text search runs through Librarian on the Robot server. A Telegram bot token is needed to run your own bot; it is separate from access to the public GetBible data APIs.

GetBible Robot is a hardened Telegram interface for Scripture reading, search, history, bookmarking, selection, copying, and posting. The Mini App uses GetBible API V2 directly for public Scripture data. Temporary selections, durable device-local history, and the public Scripture cache stay in the browser; compact personal bookmarks and the last-read coordinate additionally synchronize through Telegram Mini App storage when the client supports it. Robot remains the authenticated Telegram control plane and the sole adapter for Librarian full-text search.

## Architecture at a glance

| Responsibility | Implementation |
|---|---|
| Public chapters and indexes | Bible API v2, called by Mini App |
| Reference resolution | Query API v2 |
| Selection and copy | Browser memory |
| Reading history | Scoped localStorage |
| Public Scripture cache | IndexedDB |
| Personal bookmarks and last read | Local storage with Telegram DeviceStorage/CloudStorage support |
| Global-topic visibility | Scoped localStorage and DeviceStorage |
| Sessions, preferences, Post, backup | Robot |
| Full-text search | Robot → Librarian |

Only full-text search and search pagination use Librarian.

A normal reader action does not pass through Robot. Selecting, unselecting, reordering, clearing, highlighting, counters, and copying are browser-owned and issue no Robot request. Final Post is the only selection synchronization boundary; Robot validates authoritative Scripture before Telegram delivery.

See [Architecture](https://github.com/getbible/robot/blob/HEAD/docs/ARCHITECTURE.md), [Browser data](https://github.com/getbible/robot/blob/HEAD/docs/BROWSER_DATA.md), [Mini App](https://github.com/getbible/robot/blob/HEAD/docs/MINI_APP.md), and [Interactions](https://github.com/getbible/robot/blob/HEAD/docs/INTERACTIONS.md).

## Commands

```text
/bible 1 John 3:16
/bible John 3:16-19;1 John 3:10-17
/bible Gen 1:1-5 codex
/bible Ps 1:1-5 aov
/bible
/search grace
/search
/help
```

`/get` and `/getbible` are aliases of `/bible`.

- An explicit `/bible <reference>` keeps the native fast path and posts immediately.
- Bare `/bible` opens the Mini App reader at the saved translation/book/chapter/verse.
- `/search <query>` opens Librarian-backed results in the Mini App.
- Bare `/search` opens the search form.
- Intermediate browsing never floods the chat.

## Mini App behavior

The Mini App has Home, Search, Bible, History, and Selected in one permanent bottom navigation. Bookmarks is a Home-managed surface rather than a sixth footer action. Home offers **Search Scripture** and **Read the Bible**, followed by current Selected, History, and Bookmarks summaries; the History summary appears only when history exists. Search and Bible retain the translation control; Home, History, Selected, and Bookmarks show only the centered getBible icon in the top bar.

- Translation metadata, localized books, chapter maps, chapter text, and hashes come directly from Main API.
- Explicit references use Query API.
- Public data is cached in bounded IndexedDB with exact-scope hash revalidation and in-memory fallback.
- Reader and search verses normalize to one descriptor.
- Coordinate identity is translation, book number, chapter, and verse.
- A verse selected in Search is selected in Reader and vice versa.
- A second click unselects immediately.
- Selected verse number/body styling, ARIA state, range boundaries, counters, and copy output derive from `BrowserSelectionStore`.
- Failed Post preserves the complete ordered browser selection.
- Successful Post clears it.
- A bounded, coordinate-only reading history remembers opened chapters and
  selected verses in user-scoped browser `localStorage`. Revisiting the same
  chapter or exact verse across translations moves its existing entry to the
  top. History remains available from every surface, displays verse text from
  the bounded public chapter cache, and opens each coordinate in the currently
  selected translation. Entries can be removed individually or cleared
  together.
- Selecting a reader verse reveals a compact bottom-right ellipsis. The
  anchored bookmark menu opens only when that control is activated. Each of
  the 800 personal canonical verse records may belong to multiple colored
  topics without consuming another verse slot; assigning an existing
  translation-independent coordinate updates its record instead of duplicating
  it.
- The Bookmarks surface keeps personal and global verse links in one topic
  list. Compact **Add all** and **Remove all** controls sit above topic search,
  while each topic retains its own add/remove controls. Global links carry a
  **G** marker and may also be hidden individually. Adding a topic or the
  complete catalog restores its hidden links without duplicating them. The
  built-in catalogue contains the repository's reviewed topic-to-verse links.
  Its scoped visibility, exclusions, and legacy numeric-topic mapping are
  mirrored through Telegram
  `DeviceStorage` when supported, so a Telegram Desktop WebView can restore
  them after its browser storage is discarded. They never enter CloudStorage,
  personal synchronization, or backups. Global rows resolve their verse text
  in the currently selected translation without copying that text into
  personal storage.
- A plus-card after the topic list creates personal topics. Topic detail keeps
  editing in context: every topic color is user-editable, custom names support
  inline confirm/cancel editing, and global names remain read-only server-owned
  metadata. Removing a topic warns that its linked verse assignments will also
  be removed; removing a global topic is user-local and **Add all** restores
  it. Approved contributors alone see the collapsible **Manage Contribution**
  panel immediately below Global topics.
- **Sync now** drips the contribution to Robot in bounded idempotent batches
  of at most 50 events over the same session-authenticated same-origin request
  path search uses. Snapshot-derived events carry deterministic
  content-derived IDs, so a redelivered event replays safely, and every
  response returns the complete result set: receipt counts, the full
  contributor status, and the live catalogue revision/checksum. The final
  batch settles the panel in one round trip. Alongside the session bearer,
  every batch body carries the short-lived `contribution_token` that only
  approved contributors receive inside JSON payloads — never a custom
  header — and the drip runs on its own contribution rate budget
  (`CONTRIBUTION_RATE_CAPACITY`, `CONTRIBUTION_RATE_REFILL_PER_SECOND`)
  separate from the public search limits. It requires no WebSocket,
  additional port, or repeated raw Telegram `initData` header.
- Personal bookmark aggregate version 3, topics, the clearable recently-used
  topic order, the active topic, and the compact last-read coordinate reconcile
  by timestamp across scoped
  `localStorage`, Telegram `DeviceStorage`, and Telegram `CloudStorage`;
  CloudStorage uses compact topic indexes for each bookmark. Unsupported or
  temporarily unavailable Telegram storage degrades to the local copy without
  blocking reading. Global visibility/exclusions use DeviceStorage only;
  history, selections, the global catalog itself, and downloaded Scripture
  never enter Telegram storage.
- Bookmark recovery supports both a local bounded JSON download/import and
  **Back up to chat**. Chat backup sends the validated JSON document to the
  user's private bot chat with an owner-bound **Restore bookmarks** button. A
  restore creates a fresh short-lived Mini App launch, merges only after user
  confirmation, persists the result, and explicitly acknowledges that launch;
  the backup message itself remains available for later recovery. New backups
  use compact version 4 `colorIndexes`; version 1, 2, and 3 documents remain
  importable.

Browser display text and UI identifiers are not final posting authority.

## Security boundaries

The public Mini App shell is not an authentication boundary.

Robot protects actions with:

- Telegram-signed `initData` at the initial session exchange, fresh unless
  a one-time launch token the robot itself issued proves the live tap;
- owner-bound, one-time launch tokens;
- bounded opaque sessions with a ninety-day default absolute lifetime;
- per-batch contributor-authority rechecks in the durable contribution store;
- user/chat/topic binding;
- bounded request bodies and output;
- per-user, per-chat, and trusted-client rate limits;
- idempotent final posting;
- escaped Telegram HTML and UTF-16-aware chunking;
- correlation IDs and user-safe errors.

The bot token remains server-side. It is never placed in HTML, JavaScript, URLs, browser storage, public API traffic, or logs.

Public API transport:

- uses only `https://api.getbible.net/v2/` and `https://query.getbible.net/v2/`;
- omits credentials and cookies;
- sends no Telegram data;
- rejects redirects;
- uses `no-referrer`;
- enforces timeout, size, schema, and coordinate bounds.

## Cache integrity

The browser cache stores public, identity-free data only under a versioned namespace. It has bounded record count, bounded total bytes, bounded per-record bytes, least-recently-used eviction, and request coalescing.

Every cached scope stores its published SHA-1 and is revalidated at least weekly. Parent hash changes invalidate descendants. Chapter replacement requires stable pre/post hashes, exact-byte SHA-1 verification, bounded schema validation, and atomic replacement. Failed validation never overwrites a valid record.

## Search isolation

Search and pagination alone use Librarian. They have separate bounded execution, timeout, cache, and circuit behavior so expensive corpus work cannot consume every direct-reference permit.

Search failure does not affect reader navigation. Main API or Query API failure does not invalidate Telegram authentication.

Librarian derives the matching strategy from the query text, so the robot ships
no per-language branch and no match-mode detector. Chinese, Japanese, Korean,
Thai, Lao, Khmer, Myanmar and Tibetan queries reach the index under the default
filters, unaccented Greek reaches accented text, and an unpointed Hebrew or
Arabic stem reaches the word behind its attached particle. See
[Search](https://github.com/getbible/robot/blob/HEAD/docs/SEARCH.md).

## Runtime and deployment

Supported runtime:

- Python 3.10, 3.11, 3.12, 3.13, or 3.14;
- Linux Docker/OCI for portable deployment;
- Linux with `systemd` for host-native deployment;
- a Telegram bot token;
- outbound HTTPS to Telegram and GetBible API;
- public HTTPS when the Mini App is enabled.

The host deployment keeps health, webhook, and Mini App listeners separate and loopback/private behind Caddy. Docker contains no Caddy or systemd and leaves TLS/ingress to the platform.

Published images are available from GitHub Container Registry:

```bash
docker pull ghcr.io/getbible/robot:2.1.0
```

Use exact reviewed image/version tags for production and rollback.

## Docker quick start

Run these commands on the host where you intend to deploy your own Robot instance:

```bash
git clone --branch v2.1.0 --depth 1 https://github.com/getbible/robot.git
cd robot
./setup.sh docker-init
${EDITOR:-vi} .env
./setup.sh docker-validate
./setup.sh docker-deploy
./setup.sh docker-doctor
```

The default Compose deployment runs one bot in one bounded, non-root, read-only container. Multi-bot mode is explicit and requires unique ports and isolated state.

See [Docker deployment](https://github.com/getbible/robot/blob/HEAD/docs/DOCKER.md).

## Host-native installation

```bash
git clone https://github.com/getbible/robot.git
cd robot
read -r -p 'Reviewed Robot commit SHA: ' ROBOT_COMMIT
if git checkout --detach "$ROBOT_COMMIT"; then
  sudo ./setup.sh install
fi
```

The manager creates an isolated service identity, exact hashed environment, root-only token/configuration, bounded cache/state/log paths, health listener, Mini App listener, and hardened systemd unit.

Use the manager for operations:

```bash
read -r -p 'Robot instance name: ' ROBOT_INSTANCE
sudo getbible-robot status "$ROBOT_INSTANCE"
sudo getbible-robot doctor "$ROBOT_INSTANCE"
sudo getbible-robot miniapp "$ROBOT_INSTANCE"
sudo getbible-robot update "$ROBOT_INSTANCE"
```

`update` automatically hands control to newer upgrade logic in the reviewed
target checkout, migrates configuration, regenerates setup-managed Caddy
routes, and verifies the Mini App contribution APIs. Running it again at the
same commit performs a safe deployment refresh, which repairs stale generated
routes without replacing the application tree. See
[Upgrading and rollback](https://github.com/getbible/robot/blob/HEAD/docs/UPGRADING.md).

Do not edit generated Caddy/systemd configuration directly.

## Dependency policy

Human-maintained intent lives in `requirements.in` and `requirements-dev.in`. Production and CI install exact hashed locks from `requirements.txt` and `requirements-dev.txt`.

Robot supports compatible Librarian 2.x releases beginning with 2.0.0:

```text
getbible>=2.0.0,<3
```

The reviewed runtime lock currently selects a specific released version. Production never resolves an unreviewed latest dependency during startup.

See [Dependency policy](https://github.com/getbible/robot/blob/HEAD/docs/DEPENDENCIES.md).

## Development and verification

```bash
git clone https://github.com/getbible/robot.git
cd robot
python3 -m venv venv
venv/bin/python -m pip install --upgrade pip
venv/bin/python -m pip install --require-hashes -r requirements-dev.txt
(cd miniapp && npm ci --ignore-scripts && npx playwright install chromium)
bash scripts/run-checks.sh
```

Focused iteration:

```bash
venv/bin/python -m unittest discover -s tests -v
(cd miniapp && npm run check)
(cd miniapp && npm run test:browser)
```

After reviewing updated global topic metadata or verse associations, regenerate
the deterministic browser catalogue with
`(cd miniapp && npm run generate:global-bookmarks)`. Accepted moderation exports
use the documented importer in `data/global-bookmarks/README.md`.

The permanent release gate requires:

- Python 3.10, 3.11, 3.12, 3.13, and 3.14;
- production container build and smoke test;
- Ruff, strict mypy, and branch coverage;
- browser unit and real Chromium tests;
- public API routing and CSP parity;
- cache hash/invalidation/bounds tests;
- browser selection add/remove/reorder/clear and visual highlight tests;
- scoped durable reading-history move-to-front/reopen/remove/clear and persistence tests;
- bookmark topic/domain, Telegram storage reconciliation, bounded JSON, and
  private-chat backup/restore tests;
- session-authenticated batched contribution sync, idempotent event replay,
  revocation, and rate-limit pacing tests;
- no pre-Post Robot selection mutation;
- authoritative idempotent Post tests;
- Bandit, dependency audit, secret scan, systemd verification, and CodeQL.

See [Testing](https://github.com/getbible/robot/blob/HEAD/docs/TESTING.md) and [Release gate](https://github.com/getbible/robot/blob/HEAD/docs/RELEASE_GATE.md).

## Production acceptance

After deploying one exact green commit, verify:

1. bare `/bible` opens the reader;
2. cold and warm chapter loads work;
3. explicit references resolve through Query API;
4. selecting highlights verse number and body;
5. second-click unselect works;
6. Search and Reader selections interoperate;
7. navigation preserves selected styling;
8. Copy does not Post or clear selection;
9. failed Post preserves selection;
10. successful Post delivers authoritative Scripture and clears selection;
11. reading history shows the verse text and reopens the exact verse in the
    currently selected translation;
12. History remains available in the footer on every Mini App surface;
13. revisiting a history location moves it to the top without duplication;
14. individual and complete history clearing work;
15. a personal bookmark can belong to multiple colored topics, be reopened,
    unassigned per topic, and remain within the 800-verse bound;
16. personal bookmarks and last-read reconcile across supported Telegram clients while
    history and Scripture caches remain device-local;
17. JSON download/import and private-chat backup/restore both work, including
    user confirmation and one-launch acknowledgement;
18. the unified topic list identifies global links with **G**, supports
    per-link hide and per-topic/all-catalog reset, and never includes those
    links in personal sync or backup;
19. approved-contributor Sync now completes through sequential
    `POST /api/v1/contributions/events` batches whose final response settles
    receipt counts and status, retried events replay without duplicates, and
    an ordinary or revoked user cannot submit;
20. private command and launcher cleanup still works.

Record the deployed commit SHA and permanent CI/CodeQL run links with release evidence.

## License

See the repository license and the copyright metadata returned for each Scripture translation. Robot's software license does not relicense Scripture translations or override publisher terms.


## Docker deployment

The recommended Docker layout runs one Telegram bot in one container. The
image contains only GetBible Robot and its non-root supervisor. It does not
install Caddy, systemd, a firewall, certificates, or listeners on ports 80 and
443. The container serves the Mini App and, when selected, Telegram webhook
delivery on independently configurable application ports; TLS, DNS, and
routing remain outside the container.

The same image also supports an explicit multi-bot mode for compact
deployments, but separate containers are the operational default because each
bot then has an independent memory limit, health state, restart policy, data
volume, update cycle, and application port.

### Published images

The repository publishes multi-platform Linux AMD64 and ARM64 images to GitHub
Container Registry:

```bash
docker pull ghcr.io/getbible/robot:2.1.0
```

The available tag contract is:

| Tag | Meaning | Production use |
|---|---|---|
| `2.1.0` | Exact stable release | Recommended |
| `2.1` | Newest patch in the selected minor series | Controlled rolling updates |
| `2` | Newest release in the selected major series | Compatibility testing |
| `latest` | Newest non-prerelease release | Convenient evaluation |
| `sha-<full-commit>` | One immutable source commit | Audit and rollback |
| `edge` | Latest `master` commit whose complete CI workflow passed | Pre-production only |

Every published image includes OCI source/license metadata, a BuildKit SBOM
and provenance record, and a signed GitHub artifact attestation. Verify an
image against this repository with a current GitHub CLI:

```bash
gh attestation verify \
  oci://ghcr.io/getbible/robot:2.1.0 \
  --repo getbible/robot
```

The release workflow accepts a stable release only when its `vX.Y.Z` tag
matches the version in `pyproject.toml` and the exact commit already has green
`robot/security-gate` and `robot/codeql-gate` statuses. A published `v2.1.0`
release produces `2.1.0`, `2.1`, `2`, and `latest`. Successful CI on `master`
publishes only `edge` and the immutable commit tag.

#### Maintainer release procedure

After merging the intended release commit:

1. confirm CI and CodeQL are green for that exact commit;
2. confirm `pyproject.toml`, the generated Compose environment, Kubernetes
   example, changelog, and release notes all name the same version;
3. create and publish the matching GitHub release, such as `v2.1.0`;
4. wait for **Publish container image** to complete;
5. record the published manifest digest and verify the attestation;
6. pull and smoke-test the exact version before moving production.

Creating a tag without publishing a GitHub release does not publish stable
container tags. This prevents an accidental tag push from changing `latest`.
The workflow needs no registry password or repository secret; GitHub's
short-lived workflow token publishes the package associated with this public
repository.

### Recommended one-bot quick start

From a checkout of the matching stable release:

```bash
git clone --branch v2.1.0 --depth 1 https://github.com/getbible/robot.git
cd robot
./setup.sh docker-init
${EDITOR:-vi} .env
./setup.sh docker-validate
./setup.sh docker-deploy
./setup.sh docker-doctor
```

At minimum, replace these values:

```dotenv
TELEGRAM_API_TOKEN=123456789:replace-with-the-token-from-BotFather
MINI_APP_PUBLIC_URL=https://bot.example.com/getbible/production
```

`compose.yaml` reads the project `.env` automatically. The same values may
instead be exported in the shell or supplied through:

```bash
read -r -p 'Path to your Robot environment file: ' ROBOT_ENV_FILE
./setup.sh docker-deploy --env-file "$ROBOT_ENV_FILE"
```

`compose.yaml` is the versioned, static deployment definition. The private
`.env` file is the operator-editable value layer generated by `docker-init`.
It pins `ROBOT_IMAGE=ghcr.io/getbible/robot:2.1.0` by default. Together they
expose the image release plus the application's concurrency, session, cache,
timeout, rate, abuse, memory, CPU, PID, tmpfs, and log-retention controls
without rebuilding the image.

Edit and apply the default environment in one operation:

```bash
./setup.sh docker-config
```

Or edit it directly and recreate the workload:

```bash
${EDITOR:-vi} .env
./setup.sh docker-validate
./setup.sh docker-restart
```

`docker-restart` deliberately uses Compose to recreate the currently installed
image. A plain `docker restart` does not reload changed environment variables
or Compose resource settings. Pass `--env-file`, `--secure`, or `--multi` to
the setup commands when using those matching deployment variants.
`docker-config --no-restart` validates and saves a change without applying it
yet.

`docker-deploy` and its `docker-update` alias pull `ROBOT_IMAGE`, validate it,
and recreate the workload without compiling source on the server:

```bash
./setup.sh docker-update
```

For a deliberate local source build, add the optional build overlay:

```bash
./setup.sh docker-validate --build
./setup.sh docker-deploy --build
```

This uses `compose.build.yaml` and tags the result as
`ROBOT_BUILD_IMAGE` (default `getbible-robot:local`). The production Compose
files contain no `build` directive, so normal deployments cannot silently
replace a reviewed registry image with whatever source happens to be present
on the host.

No interactive installation runs during container startup. The supervisor
derives per-instance state paths, validates the complete application
configuration, starts the bot, waits for health, and restarts it safely when a
runtime failure occurs. Missing or invalid application values are written to
stdout/stderr as structured `ERROR` events:

```bash
./setup.sh docker-logs getbible-robot-production 200
```

For example, a missing token produces an
`instance_configuration_rejected` event containing
`TELEGRAM_API_TOKEN is required`. The supervisor remains available for status
and diagnostics instead of repeatedly crash-looping the application.

The supervisor owns both SQLite paths and will not accept shared overrides:

```text
/data/<instance>/state/preferences.sqlite3
/data/<instance>/state/contributions.sqlite3
```

The second file contains contributor applications, Telegram profile metadata,
immutable events, review decisions, notification state, private audit history,
and live catalogue revisions. It is therefore more sensitive than recoverable
cache data. Keep the `robot-data` volume private, include it in encrypted
backups when contributions are enabled, and never mount it into another bot
instance. `CONTRIBUTION_CONTRIBUTOR_LIMIT` and `CONTRIBUTION_EVENT_LIMIT` pass
through Compose with defaults of `10000` and `250000` respectively.

### Token handling

The default Compose model accepts `TELEGRAM_API_TOKEN` from `.env` because it
is the smallest fully automatic deployment path. Keep `.env` mode `0600`; it
is ignored by Git.

For production, the optional Compose-secret overlay removes the token from the
container environment and mounts it at `/run/secrets/telegram_bot_token`:

```bash
./setup.sh docker-deploy --secure
```

The overlay sources the secret from `TELEGRAM_API_TOKEN` in the operator
environment or supplied Compose environment file and mounts it mode `0400` as
UID/GID 10001. The application receives only
`TELEGRAM_API_TOKEN_FILE=/run/secrets/telegram_bot_token`.

The explicit multi-bot mode uses file-backed secrets because each instance
needs a different token. Those source files must be readable by the host UID
mapped to container UID 10001.

### Ports and external routing

The default container publishes the Mini App backend and the optional Telegram
webhook backend on loopback:

```dotenv
MINI_APP_PORT=9201
MINI_APP_HOST_PORT=9201
MINI_APP_BIND_ADDRESS=127.0.0.1
TELEGRAM_WEBHOOK_PORT=9001
TELEGRAM_WEBHOOK_HOST_PORT=9001
TELEGRAM_WEBHOOK_BIND_ADDRESS=127.0.0.1
```

This produces `127.0.0.1:9201 -> container:9201` and
`127.0.0.1:9001 -> container:9001`. Point an existing HTTPS reverse proxy at
the first port for the Mini App. When `TELEGRAM_DELIVERY_MODE=webhook`, route
the exact private path in `TELEGRAM_WEBHOOK_PUBLIC_URL` to the second port. In
polling mode nothing listens on the webhook mapping. If the reverse proxy is
another container, use a Compose override to attach both services to a private
Docker network and route directly to the matching container ports; host
publishing can then be removed.

The health listener remains inside the container on port 8081 and is used by
the image `HEALTHCHECK`. It does not need a public or host mapping. Polling is
the default Telegram delivery mode, so its deployment does not need a routed
webhook endpoint even though Compose retains the configurable mapping.

`MINI_APP_PUBLIC_URL` must remain the externally reachable HTTPS URL used by
Telegram. Its path must be forwarded unchanged to the application port.

### Operate the deployed container

The host setup manager discovers containers by the
`io.getbible.robot.container=true` label:

```bash
./setup.sh docker-list
./setup.sh docker-status
./setup.sh docker-doctor
./setup.sh docker-logs
./setup.sh docker-follow
./setup.sh docker-manage
./setup.sh docker-shell
```

If multiple Robot containers exist, the interactive commands show a numbered
selector. A known container name may be supplied directly:

```bash
./setup.sh docker-manage getbible-robot-production
./setup.sh docker-shell getbible-robot-production
```

`docker-manage` opens `/app/setup.sh` inside the selected container. Its menu
supports listing, status, diagnostics, start, stop, restart, configuration
reload, contribution review/export, and a non-root Bash shell. Direct
equivalents are:

```bash
docker exec getbible-robot-production /app/setup.sh list
docker exec getbible-robot-production /app/setup.sh status production
docker exec getbible-robot-production /app/setup.sh doctor production
docker exec getbible-robot-production /app/setup.sh restart production
docker exec -it getbible-robot-production /app/setup.sh contributions production
docker exec getbible-robot-production /app/setup.sh contributions production status
docker exec -it getbible-robot-production /app/setup.sh
docker exec -it getbible-robot-production /bin/bash
docker logs --since 30m getbible-robot-production
```

The shell runs as the image's unprivileged UID/GID 10001. The root filesystem
remains read-only; only the instance data volume and bounded `/tmp` tmpfs are
writable.

The contribution submenu reviews applications, resolves topics, reviews verses
with authoritative text, publishes a live instance revision, and writes a
privacy-safe repository export. `status` and `export` also work
non-interactively. Exports are mode `0600` below:

```text
/data/<instance>/state/contribution-exports/reviewed-catalog-<UTC>.json
```

The image does not contain Node, Git, or a repository credential. Automated
branch publication from a container export is not supported in this release;
retain the JSON only for a separately reviewed manual repository import.

Do not add a Git credential or publisher checkout to the application
container. The guarded one-command repository publication workflow is
available only for native deployments through the dedicated non-root publisher
account described in
[Operations](https://github.com/getbible/robot/blob/HEAD/docs/OPERATIONS.md#contributor-enrolment-and-moderation); it is not a
runtime-container permission. Container-to-host publication needs a separate
privilege-boundary and lease design and is deliberately outside this release.

### User experience under load

Resource controls do not change the Telegram command, search, selection,
posting, or Mini App interface. The expensive search worker has an independent
bounded executor. A slow search therefore does not consume the direct
Scripture lookup workers or block ordinary Telegram update handling.

The supplied production defaults use:

- sixteen concurrent Telegram updates;
- eight direct Scripture/catalog workers;
- four CPU-bound search workers;
- bounded interactive and Mini App sessions;
- up to eight resident shared search corpora and one translation cache;
- a 1792 MiB per-bot RSS guard inside a 2 GiB container limit.

When capacity is temporarily exhausted, the application returns a controlled
retry message while liveness remains responsive. Three consecutive liveness
failures restart the bot child. Repeated failures open the restart circuit so
the container cannot consume the host in an endless restart/prewarm loop.

The search result, verse selection, single-verse/range behavior, saved default
translation, CJK handling, and explicit final posting flow are unchanged.
Lightweight authenticated Mini App navigation consumes only the configured
fractional `MINI_APP_NAVIGATION_RATE_COST`; session exchange, search, Scripture
fetches, and posting retain full request cost. Normal browsing therefore does
not exhaust the same budget intended to stop expensive request floods.

### Identity, client address, and abuse controls

Telegram Bot API updates contain a numeric Telegram user and chat identity,
but they do not expose the user's IP address. Mini App HTTP requests do have a
network peer address. `AUDIT_IDENTITY_MODE` controls what is attached to
structured events:

- `disabled` records no user, chat, or client identity;
- `pseudonymous` (the application default) records stable keyed identifiers;
- `raw` records numeric Telegram user/chat IDs and the resolved Mini App client
  IP for incident investigation.

The supplied Docker operator example selects `raw`. Treat those logs as
personal data and set access and retention accordingly. The bot never logs
tokens, names, usernames, verse bodies, or browser authorization data.

External proxy mode assumes the operator controls access to the backend and
accepts the standard forwarded client address from Caddy, Traefik, Nginx, the
container ingress, or a cloud load balancer. To add an application-level
restriction as well, set the optional `MINI_APP_TRUSTED_PROXY_CIDRS` list:

```dotenv
AUDIT_IDENTITY_MODE=raw
MINI_APP_TRUSTED_PROXY_CIDRS=172.20.0.5/32
```

User, chat, authenticated Mini App client, and unauthenticated session-exchange
token buckets remain bounded and configurable. Repeated individual user or
authenticated client exhaustion within `ABUSE_WINDOW_SECONDS` triggers a
temporary `ABUSE_BLOCK_SECONDS` pause after
`ABUSE_REJECTION_THRESHOLD` violations. Chat-wide saturation alone never
accuses or blocks one member. When the application knows the Telegram user, it
sends `ABUSE_WARNING_MESSAGE` privately or as an ephemeral group notice.
Warnings use a cooldown and a new block produces one immediate notice, so a
flood cannot create a second outbound-message flood.

### Resource profile for an 8 GiB host

The measurements below were taken against Librarian 1.x and are retained only as
a floor. They are not a baseline to hold Librarian 2 against: 1.x returned
nothing at all for continuous scripts under default criteria, so part of what it
was not spending was the cost of search that worked. A resident 2.x index is the
price of correct results, and it is paid once per translation and policy rather
than per search — see [Search](https://github.com/getbible/robot/blob/HEAD/docs/SEARCH.md).

Budget for that resident set rather than trying to shrink it. Lowering
`SEARCH_SHARED_CORPUS_LIMIT` does not save steady-state memory so much as force
the same corpora to be parsed and analysed again on the next search, which
trades a bounded, one-off cost for an unbounded, repeated one.

Current KJV measurements are approximately:

| State | Robot RSS |
|---|---:|
| Mini App listener initialized | 72 MiB |
| Default KJV search index warmed | 111 MiB |
| All four KJV search modes exercised | 148 MiB |

The default one-bot profile has a 2 GiB hard memory ceiling, a 1536 MiB
reservation, two CPUs, and a 256-task ceiling. It targets an 8 GiB, i3-class
or stronger host but does not enforce host eligibility. This leaves capacity
for the kernel, SSH, Docker, an external reverse proxy, and controlled
additional workloads. The child
supervisor restarts the bot before it can cross 1792 MiB RSS, while Docker
remains the final aggregate limit. These values are environment-driven
ceilings, not a promise that every workload will consume them.

Translations vary in size. The largest corpus observed in July 2026 was about
31 MB before Python parsing and indexing. Load-test non-default translations
before lowering the guard or increasing search concurrency.

### Multi-bot mode

Use multi-bot mode only when sharing one container is intentional. The following creates a new `production` instance; choose a different instance name and matching files when adding to an existing deployment. Enter the real token at the prompt so it is not saved as literal shell-history text:

```bash
mkdir -p docker/instances docker/secrets
cp docker/examples/production.env.example \
  docker/instances/production.env
read -r -s -p 'Telegram bot token from BotFather: ' ROBOT_TELEGRAM_TOKEN
printf '\n'
printf '%s\n' "$ROBOT_TELEGRAM_TOKEN" > docker/secrets/production.token
unset ROBOT_TELEGRAM_TOKEN
chmod 400 docker/secrets/production.token
sudo chown 10001:10001 docker/secrets/production.token
./setup.sh docker-deploy --multi
```

Each `/config/instances/*.env` file defines one bot. Every enabled Mini App,
health listener, or webhook listener must use a unique container port. Add the
matching secret and application-port mapping to `compose.multi.yaml` for each
additional instance, then run:

```bash
docker compose -f compose.multi.yaml up -d
docker exec getbible-robot getbible-robot-container reload
```

The supervisor rejects port collisions before starting a second bot and
isolates cache and SQLite state under `/data/<instance>`. In particular, each
bot receives its own `state/contributions.sqlite3` even if an instance file
attempts to configure another path.

The supplied multi-bot file starts with the same one-bot aggregate profile:
1536 MiB reserved, 2 GiB hard limit, and two CPUs. Before adding another bot,
raise `ROBOT_MEMORY_RESERVATION`, `ROBOT_MEMORY_LIMIT`, `ROBOT_CPU_LIMIT`, and
`ROBOT_PIDS_LIMIT` for the combined workload. Each instance retains its own
`CONTAINER_INSTANCE_MEMORY_LIMIT_MB` guard. Budget from observed per-bot RSS,
preserve host headroom, and prefer separate containers when independent
failure and deployment boundaries matter.

### Cluster deployment

[`deploy/kubernetes.example.yaml`](https://github.com/getbible/robot/blob/HEAD/deploy/kubernetes.example.yaml) is the
one-bot-per-workload cluster example. It includes:

- one replica per Telegram bot token;
- a mounted token Secret;
- persistent bounded cache, preference, and private contribution state;
- startup, liveness, and readiness probes;
- CPU, memory, and ephemeral-storage controls;
- a Service exposing the Mini App and optional Telegram webhook backends.

Keep `replicas: 1` for polling and for the current process-local Mini App
session model. Deploy additional bot tokens as separate workloads.

### External proxy contract

Forward the exact path in `MINI_APP_PUBLIC_URL` to the bot's application port.
Preserve `Host`, set trusted forwarding headers at the proxy, and do not expose
plain HTTP directly to the internet. Apply:

- request-header and request-body timeouts;
- a 64 KiB body cap for ordinary routes, with one narrowly matched exception
  of at least 4 MiB + 4 KiB only for `POST .../api/v1/bookmarks/backup` (the
  supplied Caddy configuration uses 5 MiB for the backup endpoint);
- an idle connection timeout;
- connection and request-rate budgets;
- current TLS certificate and protocol policy.

The embedded Tornado server independently applies a 16 KiB header cap, a
64 KiB ordinary body cap, a 4 MiB + 4 KiB cap only for the exact bookmark
backup POST route, a 10-second body timeout, a 30-second idle/header timeout,
and a 64 KiB socket buffer. Contribution event batches and ordinary actions
share the same Mini App domain, HTTPS ingress, application listener, and
64 KiB body budget; no WebSocket or extra port is part of synchronization.

### Capacity and incident logs

Application and supervisor output is structured JSON on stdout/stderr and is
available through `docker logs` or `./setup.sh docker-logs`. The important
pressure events are:

| Event | Meaning |
|---|---|
| `instance_memory_pressure` / `instance_memory_pressure_cleared` | Child RSS crossed or recovered below the configurable warning threshold |
| `instance_memory_limit_exceeded` | The child reached the hard per-bot RSS guard and was restarted |
| `capacity_queue_rejected` | A bounded worker permit was unavailable before the queue timeout |
| `lookup_timed_out` | Upstream work exceeded the outer lookup deadline |
| `upstream_circuit_rejected` | Repeated upstream failures opened the protective circuit |
| `inbound_rate_limited` | A user, chat, or Mini App client exhausted a request budget |
| `mini_app_request` | Route, status, duration, and configured identity for a Mini App request |
| `instance_restart_circuit_open` | Repeated child failures stopped automatic restart thrashing |

Aggregate counts, active blocks, process RSS, sessions, threads, file
descriptors, queues, timeouts, and circuit state remain available from
`/metrics` and `./setup.sh docker-doctor`. Use the warning events to tune
Compose limits before raising hard ceilings; raising a container limit cannot
create physical memory that the host does not have.

### Build validation

The exact Python dependency lock is installed with `--require-hashes`. Local
source builds are explicitly opt-in:

```bash
docker compose -f compose.yaml -f compose.build.yaml build --pull robot
docker build --pull -t getbible-robot:test .
docker run --rm --entrypoint python getbible-robot:test \
  -c 'from config import Settings; print("runtime imports OK")'
docker run --rm --entrypoint /app/setup.sh \
  getbible-robot:test help
```

CI validates the published-image and local-build Compose models, builds the
exact image, verifies the non-root user, and smoke-tests both the supervisor
and the in-container setup utility. After complete CI succeeds on `master`, a
separate least-privilege workflow publishes `edge`. Publishing a GitHub
release creates the stable tags only after rechecking the exact version and
required commit gates.


## Support and source documentation

For questions about this project, installation, unexpected output, or contributing, use the [single GetBible support desk](https://git.vdm.dev/getBible/support). Include the project, installed release or commit, operating system, relevant API version, and a minimal reproduction. General enquiries can be sent to [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church).

This guide follows the [repository README](https://github.com/getbible/robot/blob/HEAD/README.md) and [DOCKER](https://github.com/getbible/robot/blob/HEAD/docs/DOCKER.md). Scripture and study resources retain their own source licences; a software licence does not relicense the texts.
