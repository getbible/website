# GetBible App — help build the native reader

The GetBible App is the cross-platform Flutter project for Android, iOS, web, Windows, macOS, and Linux. It brings the GetBible reader experience into native controls with local Scripture caching and study data.

[Repository](https://github.com/getbible/app) · [Support](https://git.vdm.dev/getBible/support) · [All projects](/project/)

**Under development.** The app currently uses Bible API v2. Store publication, complete feature parity, and physical-device verification are still ahead. Bible API v3, dictionaries, commentaries, and broader study integration are future priorities, not released features. Developers and testers can help move the project toward those goals.

## Supported targets

| Target | Development/test command | Distribution output |
|---|---|---|
| Android | `flutter run -d android` | APK or Play Store AAB |
| iOS/iPadOS | `flutter run -d ios` | Xcode archive/App Store package |
| Web | `flutter run -d chrome` | Static files in `build/web` |
| Windows | `flutter run -d windows` | Windows runner bundle |
| macOS | `flutter run -d macos` | macOS application bundle |
| Linux | `flutter run -d linux` | Linux runner bundle |

## Requirements

- Flutter stable 3.44.6 or newer
- Dart 3.12.2 or newer
- Android Studio/SDK for Android builds
- macOS with Xcode for iOS builds

## Start developing

```bash
git clone https://github.com/getbible/app.git
cd app
flutter doctor -v
flutter pub get
flutter run
```

The application ID and iOS bundle ID are `life.getbible.mobile`. No API key is required for the public GetBible API.

## Test the application

The fastest interactive test is the web target:

```bash
flutter pub get
flutter run -d chrome
```

For Android, enable developer mode/USB debugging or start an emulator, then run `flutter devices` followed by `flutter run`. GitHub Actions also publishes two downloadable artifacts after a successful `main` build:

- `getBible-live-debug-apk` for installation on an Android test device.
- `getBible-live-web`, containing the compiled static web application.

Open the successful workflow run’s **Artifacts** section to download them. Web files must be served by an HTTP server; opening `index.html` directly is not supported. A permanent GitHub Pages preview can be enabled later after the repository is public and Pages is configured to deploy from GitHub Actions.

**pub.dev is not an application testing service.** It is Dart and Flutter’s public package registry. This application is not intended to be published there as a reusable package. Test builds belong in GitHub Actions artifacts, GitHub Pages, TestFlight, Play Console internal testing, or locally attached Flutter devices.

## Quality checks

```bash
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
flutter build apk --debug
```

CI runs the same checks and uploads an unsigned debug APK plus a compiled web build. Consult [testing](https://github.com/getbible/app/blob/HEAD/docs/TESTING.md) before merging reader, storage, backup, or cache changes.

## Release builds

Android:

```bash
flutter build apk --release
flutter build appbundle --release
```

iOS, on macOS:

```bash
flutter build ios --release --no-codesign
```

Signing keys and provisioning profiles must never be committed. Complete instructions are in [deployment and distribution](https://github.com/getbible/app/blob/HEAD/docs/DEPLOYMENT.md).

## Architecture

The code is divided into domain models/contracts, data adapters, application state, services, and presentation. SQLite is accessed through Drift's executor; network responses are parsed into strongly typed immutable models. Opened chapters are cached, their SHA endpoints are checked, and usable cached Scripture remains available when verification cannot reach the network.

```text
lib/
  application/       lifecycle and reader state
  core/              errors, JSON validation, starter groups
  data/api/          GetBible API v2 client
  data/database/     local SQLite schema and platform executors
  data/repositories/ cache and persistence implementations
  domain/models/     versioned data contracts
  domain/repositories/abstract persistence contracts
  presentation/      native Flutter reader UI
  services/          backup, search, Markdown
```

See [architecture](https://github.com/getbible/app/blob/HEAD/docs/ARCHITECTURE.md) and [data contracts](https://github.com/getbible/app/blob/HEAD/docs/DATA_AND_BACKUPS.md).

## Privacy

Notes, markings, preferences, cached Scripture, and reading position are stored locally. The app has no accounts, advertising, analytics, or tracking. Network traffic is limited to resources required for Scripture and daily-passage retrieval. See [privacy policy draft](https://github.com/getbible/app/blob/HEAD/docs/PRIVACY.md).

## Branding

All platform launchers, favicons, splash artwork, window icons, and in-app identity use the approved GetBible artwork in `assets/branding/`. CI validates a committed checksum manifest so generated Flutter template icons cannot silently return. The source artwork must be replaced only with explicitly approved GetBible assets.

## Documentation index

- [Agent operating guide](https://github.com/getbible/app/blob/HEAD/AGENTS.md)
- [Architecture](https://github.com/getbible/app/blob/HEAD/docs/ARCHITECTURE.md)
- [API and cache workflow](https://github.com/getbible/app/blob/HEAD/docs/API_AND_CACHE.md)
- [Data and backup compatibility](https://github.com/getbible/app/blob/HEAD/docs/DATA_AND_BACKUPS.md)
- [Feature-parity ledger](https://github.com/getbible/app/blob/HEAD/docs/FEATURE_PARITY.md)
- [Web-to-Flutter parity contract](https://github.com/getbible/app/blob/HEAD/docs/WEB_FLUTTER_PARITY.md)
- [Source-backed parity audit (July 2026)](https://github.com/getbible/app/blob/HEAD/docs/PARITY_AUDIT_2026-07.md)
- [Brand assets](https://github.com/getbible/app/blob/HEAD/docs/BRANDING.md)
- [Testing and QA](https://github.com/getbible/app/blob/HEAD/docs/TESTING.md)
- [Deployment and distribution](https://github.com/getbible/app/blob/HEAD/docs/DEPLOYMENT.md)
- [Release checklist](https://github.com/getbible/app/blob/HEAD/docs/RELEASE_CHECKLIST.md)
- [Privacy policy draft](https://github.com/getbible/app/blob/HEAD/docs/PRIVACY.md)

## License

The existing repository license is retained in [LICENSE](https://github.com/getbible/app/blob/HEAD/LICENSE). Scripture translations remain subject to the license and copyright metadata returned by GetBible API v2; the application license does not relicense translation content.


## Feature-parity ledger

Status meanings: **Implemented** exists in source; **Partial** needs remaining UX/integration work; **Pending verification** requires platform/device confirmation.

| Area | Status | Implementation / remaining gate |
|---|---|---|
| Typed API v2 and dynamic indexes | Implemented | `GetBibleApiClient`, `CachedBibleRepository` |
| SQLite notes/markings/preferences/cache | Implemented | `LocalDatabase` and SQL repositories |
| SHA verification and offline chapter fallback | Implemented | Three freshness states shown by reader |
| Native line/paragraph reader | Implemented | `ReaderScreen`; no WebView |
| Translation/book/chapter selection | Implemented | Dynamic selectors |
| Last passage persistence | Implemented | Exact verse restoration/centering needs expanded widget integration |
| Swipe and cross-book navigation | Implemented core | Shared cross-book turn operation, horizontal swipe, Alt+arrow shortcuts, arrows/mobile row, and tested deliberate double-boundary intent; device gesture QA remains |
| Deep links/shareable links | Partial | Parser exists; GoRouter/platform association needs integration tests |
| RTL and appearance modes | Implemented | Device selection behavior still requires QA |
| Contextual selection toolbar | Partial | Verse-number and native selected-text menus expose the active group, searchable compact all-group palette, note/removal actions, and preserve native copy controls; exact overlay-positioning widget tests remain |
| Whole/text markings and overlap rules | Implemented core | Whole-verse recolor/removal, selected-range marking/removal, overlap rendering, active group memory, searchable Study card grid, per-marking open/delete, and add/edit/recolor/delete group UI exist; full journey tests and backup UI remain |
| Inline notes | Implemented core | Add/edit/delete editor opens under its verse and saved note folds inline; keyboard-shortcut and full widget journey tests remain |
| Search modes and isolate execution | Partial | Full filter UI, total-result count, isolate search, and progressive 20-result rendering exist; cooperative corpus parsing, match highlighting, seven-second arrival emphasis, and cancellation tests remain |
| Website-compatible backups | Implemented core | Model validation/merge exists; native file picker/share UI remains |
| Markdown generation | Implemented core | Native copy/share/save UI remains |
| Complete website localization | Partial | All 69 compact website locale packs are mirrored and contract-tested; Flutter runtime message loading and full widget adoption remain |
| Approved GetBible branding | Implemented | Supplied artwork is installed for Android, iOS, macOS, Windows, Linux, web, splash, and the reader header; CI verifies exact hashes |
| Accessibility | Partial | Safe area, semantics, scaling foundations; full focus/screen-reader audit remains |
| CI | Implemented | Format, analyze, tests, Android debug artifact |
| Signed store distribution | External | Requires Apple/Google credentials and store review |

This ledger is intentionally candid. “Ready for distribution” means every Partial row applicable to mobile is completed, automated checks pass, release artifacts build, and the manual QA matrix is signed off.


## GetBible API and cache workflow

Base URL: `https://api.getbible.net/v2`.

| Resource | Endpoint | Cache behavior |
|---|---|---|
| Translations | `/translations.json` | Refresh after seven days; changed translation SHA invalidates subordinate indexes/corpus. |
| Books | `/{translation}/books.json` | Dynamic; changed book SHA invalidates that book. |
| Chapters | `/{translation}/{book}/chapters.json` | Dynamic; changed chapter SHA invalidates only that chapter. |
| Chapter | `/{translation}/{book}/{chapter}.json` | Cached after opening. |
| Chapter SHA | `/{translation}/{book}/{chapter}.sha` | Checked before using a network-verified cached chapter. |
| Full translation | `/{translation}.json` | Download only for deliberate search/offline workflows; bind cache to translation SHA. |

Freshness states are `fresh`, `cachedVerified`, and `cachedUnverified`. A failed network/hash check must not erase a valid cached chapter. Malformed cached JSON is discarded. Storage bookkeeping failure must not hide usable Scripture already fetched or verified.

Chapter activation uses the MCP consistency sequence: read the chapter SHA,
download and fully parse the chapter, then read the SHA again. If the source
rotated, retry once from the new SHA. Only a payload bracketed by identical
hashes is activated. SQLite's single-row upsert is the atomic activation point;
the previous row remains the last-known-good value on any preceding failure.

API responses must remain dynamically discovered; never hard-code available translations, book names, chapter counts, or verse counts. Timeouts, non-2xx responses, malformed UTF-8/JSON, and empty resources are typed failures.


## Support and source documentation

For questions about this project, installation, unexpected output, or contributing, use the [single GetBible support desk](https://git.vdm.dev/getBible/support). Include the project, installed release or commit, operating system, relevant API version, and a minimal reproduction. General enquiries can be sent to [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church).

This guide follows the [repository README](https://github.com/getbible/app/blob/HEAD/README.md) and [FEATURE PARITY](https://github.com/getbible/app/blob/HEAD/docs/FEATURE_PARITY.md), [API AND CACHE](https://github.com/getbible/app/blob/HEAD/docs/API_AND_CACHE.md). Scripture and study resources retain their own source licences; a software licence does not relicense the texts.
