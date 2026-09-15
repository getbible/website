# Desktop — the GetBible website as a desktop application

A configurable C++ desktop shell opens the GetBible web reader through the operating system's native web engine. It packages the existing website for Linux, macOS, and Windows while preserving cookies and local storage.

[Repository](https://github.com/getbible/desktop) · [Support](https://git.vdm.dev/getBible/support) · [All projects](/project/)

This desktop shell and the native Flutter [GetBible App](/project/app/) are separate projects. The shell follows the capabilities and API version of its configured website; the default website is [app.getbible.life](https://app.getbible.life/), which currently uses Bible API v2. Build and Store packaging support do not imply that an application is already listed in every Store.

A configurable C++ shell that turns an HTTPS website into a focused Linux, macOS, and Windows desktop application. It uses the operating system's native web engine through [CHOC](https://github.com/Tracktion/choc), preserves cookies and local storage, displays a branded offline page, disables the browser context menu, and prevents top-level navigation outside configured origins.

## Default GetBible profile

Without overrides, the repository builds:

```text
Name:             getBible.Life
Application URL:  https://app.getbible.life/
Homepage:         https://app.getbible.life/
Allowed origin:   https://app.getbible.life
Application ID:   live.getbible.app
Executable:       getbible-life
Snap name:        getbible-life
```

The default floating three-dot menu is disabled so it cannot cover controls owned by the website. Public support for this application is provided through the [GetBible support desk](https://git.vdm.dev/getBible/support).

## Features

- Configurable name, domain, allowed origins, version, descriptions, support information, offline messages, window size, icons, and Store identities.
- JSON configuration with repository variable and secret overrides.
- Persistent native WebView cookies, local storage, and login state.
- Branded embedded offline, About, and Support pages.
- Top-level navigation restricted to configured HTTPS origins.
- Right-click, middle-click, auxiliary buttons, and keyboard context menus disabled.
- JavaScript and user-agent application detection for website-specific layouts.
- Linux portable archive and Snap packaging.
- Windows MSIX packaging with optional certificate signing.
- macOS DMG packaging with optional Developer ID signing and notarization.
- Automatic builds on every push to `main`.
- Tag-driven GitHub Releases with all packages and SHA-256 checksums.
- Optional Snap Store publication after the GitHub Release succeeds.

## Repository layout

```text
config/app.json                 Default application configuration
config/app.schema.json          Configuration schema
branding/                       Default and custom source icons
src/                            C++ desktop shell
scripts/                        Local build and packaging commands
tools/                          Configuration and metadata generator
tests/                          Generator tests
docs/                           Integration and distribution guides
.github/workflows/build.yml     Main-branch multi-platform builds
.github/workflows/release.yml   Tag-driven release and Snap publication
```

Generated metadata is written under `generated/` and should not be edited manually.

## Linux quick start

First obtain the source. The Linux, macOS, Windows, configuration, and validation commands below run from this checkout:

```bash
git clone https://github.com/getbible/desktop.git
cd desktop
```

```bash
sudo apt update
sudo apt install --yes \
    build-essential cmake git libgtk-3-dev libwebkit2gtk-4.1-dev \
    pkg-config python3 python3-pil

chmod +x scripts/*.sh
./scripts/build-linux.sh
./build/getbible-life
```

The bootstrap script fetches the pinned upstream CHOC revision. Repository maintainers can use `scripts/register-submodule.sh` when intentionally changing how their checkout records that dependency; ordinary builds do not require a repository commit.

## macOS

Run on macOS with Xcode Command Line Tools, CMake, Git, Python 3, and Pillow:

```bash
chmod +x scripts/*.sh
./scripts/build-macos.sh
open ./build-macos/getbible-life.app
./scripts/package-macos.sh
```

See [macOS distribution](https://github.com/getbible/desktop/blob/HEAD/docs/MACOS_DISTRIBUTION.md).

## Windows

Run from PowerShell on Windows with Visual Studio 2022 C++ tools, CMake, Git, Python 3, Pillow, and the Windows SDK:

```powershell
python -m pip install --requirement tools/requirements.txt
./scripts/build-windows.ps1
./scripts/package-windows.ps1
```

See [Windows distribution](https://github.com/getbible/desktop/blob/HEAD/docs/WINDOWS_STORE.md).

## Configure another website

Copy the default configuration and supply another icon:

```bash
mkdir -p config/sites branding/sites
cp config/app.json config/sites/example.json
read -r -p 'Path to your PNG icon: ' WEBAPP_SOURCE_ICON
cp -- "$WEBAPP_SOURCE_ICON" branding/sites/example.png
```

Minimal profile:

```json
{
  "app": {
    "name": "Example Portal",
    "slug": "example-portal",
    "id": "com.example.portal",
    "version": "1.0.0",
    "url": "https://portal.example.com/",
    "homepage_url": "https://portal.example.com/",
    "allowed_origins": ["https://portal.example.com"]
  },
  "window": {
    "show_app_menu": false
  },
  "branding": {
    "icon": "branding/sites/example.png"
  },
  "snap": {
    "name": "example-portal"
  },
  "windows": {
    "identity_name": "com.example.portal",
    "publisher": "CN=Example Publisher",
    "publisher_display_name": "Example Publisher"
  }
}
```

Build it:

```bash
WEBAPP_CONFIG_FILE=config/sites/example.json ./scripts/build-linux.sh
```

See [configuration](https://github.com/getbible/desktop/blob/HEAD/docs/CONFIGURATION.md).

## Application detection

Every page receives:

```javascript
window.WebAppDesktop
```

The default profile also exposes:

```javascript
window.GetBibleApp
```

Example:

```javascript
if (window.WebAppDesktop?.isApp) {
    document.querySelector('.browser-only')?.remove();
}
```

The document root receives `webapp-desktop-app` and a configurable application-specific class. Linux also appends `GetBibleLifeDesktop/<version>` to WebKitGTK's normal user agent. These markers control presentation only; they are not authentication credentials.

See [website integration](https://github.com/getbible/desktop/blob/HEAD/docs/APP_INTEGRATION.md).

## About and Support

The embedded overlay menu is disabled by default. A website can add controls where they fit its own layout:

```javascript
document.querySelector('#desktop-about')?.addEventListener('click', () => {
    window.location.assign(window.WebAppDesktop.aboutURL);
});

document.querySelector('#desktop-support')?.addEventListener('click', () => {
    window.location.assign(window.WebAppDesktop.supportURL);
});
```

The internal destinations are `webapp://app/about` and `webapp://app/support`.

## Automatic builds

Every push to `main` runs **Build all desktop targets** and produces downloadable workflow artifacts for:

- Linux `.tar.gz`;
- Linux `.snap`;
- Windows `.msix`;
- macOS `.dmg`.

Repository configuration and signing values are optional. The default GetBible profile is used when none are supplied.

## Releases and distribution

Users can obtain available packages from the [release page](https://github.com/getbible/desktop/releases). Publishing a new release is a repository-maintainer action: after the intended commit passes the main-branch checks, a new matching semantic-version tag triggers the release workflow. Follow the repository's [automated release procedure](https://github.com/getbible/desktop/blob/HEAD/docs/AUTOMATED_RELEASES.md) when managing your own distribution.

**Build and publish release** then:

1. builds all four packages;
2. creates `SHA256SUMS`;
3. creates the GitHub Release and uploads all packages;
4. attempts Snap Store publication only afterward.

When `SNAPCRAFT_STORE_CREDENTIALS` is absent, the final Store job fails clearly, but the GitHub Release and downloadable packages remain available.

See [automated releases](https://github.com/getbible/desktop/blob/HEAD/docs/AUTOMATED_RELEASES.md) and [Snap Store distribution](https://github.com/getbible/desktop/blob/HEAD/docs/SNAP_STORE.md).

## Validation

```bash
chmod +x scripts/*.sh
./scripts/validate.sh
```

## Distribution channels

- Linux: GitHub Release archive or Snap Store.
- Windows: signed MSIX and Microsoft Store.
- macOS: signed/notarized DMG or a separately prepared Mac App Store submission.

The Snap Store distributes Linux packages only.

## License

The template is GPL-3.0-or-later. CHOC is distributed separately under its ISC license.


## Application configuration

The template resolves application settings in this order, with later sources overriding earlier sources:

1. Built-in GetBible defaults.
2. `config/app.json` or the file selected by `WEBAPP_CONFIG_FILE`.
3. The optional `WEBAPP_CONFIG_JSON` secret.
4. Individual `WEBAPP_*` environment variables.

Run the generator directly:

```bash
python3 tools/configure_app.py \
  --root . \
  --config config/app.json \
  --output generated
```

Or use:

```bash
./scripts/configure-app.sh
```

### Core application fields

```json
{
  "app": {
    "name": "getBible.Life",
    "slug": "getbible-life",
    "id": "live.getbible.app",
    "version": "1.0.0",
    "url": "https://app.getbible.life/",
    "homepage_url": "https://app.getbible.life/",
    "allowed_origins": ["https://app.getbible.life"],
    "summary": "Short Store summary",
    "description": "Long Store description",
    "about": "About-page text",
    "user_agent_product": "GetBibleLifeDesktop",
    "javascript_object": "GetBibleApp",
    "html_class": "getbible-life-desktop-app"
  }
}
```

`app.url`, `app.homepage_url`, and every allowed origin must use HTTPS. The origin of `app.url` is automatically added to the allowed list.

### Window and embedded menu

```json
{
  "window": {
    "width": 1200,
    "height": 800,
    "minimum_width": 720,
    "minimum_height": 520,
    "show_app_menu": false
  }
}
```

The floating three-dot menu is disabled by default because it can cover website controls. Enable it only when the website intentionally reserves space for it. About and Support pages remain available at `webapp://app/about` and `webapp://app/support` even when the menu is disabled.

### Offline and support content

The `offline` object controls the embedded reconnect page. The `support` object controls the generated support page and Store contact metadata.

A support URL opens in the application only when its origin is included in `app.allowed_origins`; otherwise it is displayed as information without allowing an external website to replace the application.

### Branding

`branding.icon` may point to a PNG or to a text file containing raw base64 PNG data. `WEBAPP_ICON_BASE64` takes priority in CI.

The generator produces:

- Linux PNG sizes;
- Windows ICO and MSIX tile images;
- macOS ICNS;
- an embedded PNG header used by offline, About, and Support pages.

### Platform metadata

The `snap`, `windows`, and `macos` objects control Store identity and package settings. Store identity values should be chosen before the first public publication because changing them later may create a different application identity.

Windows `publisher` must equal the subject of the signing certificate. The application ID and Snap name must satisfy the naming requirements of their target Stores.

### Using another configuration file

```bash
WEBAPP_CONFIG_FILE=config/sites/example.json ./scripts/build-linux.sh
```

Windows PowerShell:

```powershell
./scripts/build-windows.ps1 -ConfigFile config/sites/example.json
```

macOS:

```bash
WEBAPP_CONFIG_FILE=config/sites/example.json ./scripts/package-macos.sh
```

### Generated files

Do not edit files under `generated/` manually. They are regenerated from configuration and branding before builds. The generator also refreshes `snap/snapcraft.yaml` and `snap/gui/` so the Snap metadata always matches the selected profile.


## Website integration

The desktop shell exposes a stable application identity before the website's normal scripts execute.

### JavaScript identity

Every page receives:

```javascript
window.WebAppDesktop
```

The configured alias is also created. For the default profile:

```javascript
window.GetBibleApp
```

Example:

```javascript
if (window.WebAppDesktop?.isApp === true) {
    document.documentElement.classList.add('running-in-desktop-shell');
    console.log(window.WebAppDesktop.version);
    console.log(window.WebAppDesktop.platform);
}
```

The object includes the application name, slug, version, platform, application URL, About URL, and Support URL. It is frozen and installed as a non-writable property.

The document root also receives:

```html
<html
  class="webapp-desktop-app getbible-life-desktop-app"
  data-webapp-desktop="true"
  data-webapp-desktop-platform="linux"
  data-webapp-desktop-version="1.0.0"
  data-webapp-desktop-slug="getbible-life">
```

CSS example:

```css
html.webapp-desktop-app .browser-only {
    display: none !important;
}

html:not(.webapp-desktop-app) .desktop-only {
    display: none !important;
}
```

### Server-side detection

On Linux, the native WebKit user agent retains its normal value and appends:

```text
GetBibleLifeDesktop/1.0.0
```

PHP example:

```php
<?php
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isDesktopApp = preg_match(
    '/(?:^|\s)GetBibleLifeDesktop\/([0-9A-Za-z.+-]+)/',
    $userAgent,
    $matches
) === 1;
$appVersion = $isDesktopApp ? $matches[1] : null;
```

This marker is suitable for layout and feature selection. It is not authentication because any HTTP client can imitate a user agent.

### About and Support

The website may provide controls in a position that fits its own layout:

```javascript
document.querySelector('#desktop-about')?.addEventListener('click', () => {
    window.location.assign(window.WebAppDesktop.aboutURL);
});

document.querySelector('#desktop-support')?.addEventListener('click', () => {
    window.location.assign(window.WebAppDesktop.supportURL);
});
```

The built-in floating menu is disabled in the default profile to avoid covering website controls.

### Navigation restrictions

Top-level pages may load only from `app.allowed_origins` or the internal `webapp://app/` pages. Attempts to open unrelated websites are cancelled and return to the configured application URL.

Subresources required by the allowed website, such as images, APIs, fonts, or authentication resources, are not subjected to the top-level origin restriction. Configure the website's own Content Security Policy and CORS rules normally.

Right-click, middle-click, auxiliary mouse buttons, the context-menu key, and `Shift+F10` are blocked. Normal left-click interaction remains available.


## Support and source documentation

For questions about this project, installation, unexpected output, or contributing, use the [single GetBible support desk](https://git.vdm.dev/getBible/support). Include the project, installed release or commit, operating system, relevant API version, and a minimal reproduction. General enquiries can be sent to [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church).

This guide follows the [repository README](https://github.com/getbible/desktop/blob/HEAD/README.md) and [CONFIGURATION](https://github.com/getbible/desktop/blob/HEAD/docs/CONFIGURATION.md), [APP INTEGRATION](https://github.com/getbible/desktop/blob/HEAD/docs/APP_INTEGRATION.md). Scripture and study resources retain their own source licences; a software licence does not relicense the texts.
