# Joomla — put the Bible on your website

GetBible for Joomla lets a church, ministry, community, or developer host a Bible reading and study experience inside an existing Joomla site. The component provides Scripture browsing, search, notes, tags, and a visitor linker system. A separate Loader plugin adds Scripture references to ordinary site content.

[Support](https://git.vdm.dev/getBible/support) · [Live Joomla reader](https://getbible.life/) · [All projects](/project/)

## Choose the right integration

| Project | Role | Repository |
|---|---|---|
| Joomla package | Installs the matching component together with related modules and a Loader plugin | [joomla-pkg](https://github.com/getbible/joomla-pkg) |
| Joomla component | Full Bible application and administrator management | [joomla-component](https://github.com/getbible/joomla-component) |
| Joomla Scripture Loader | Adds the JavaScript reference loader to Joomla pages | [joomla-scripture-loader](https://github.com/getbible/joomla-scripture-loader) |
| Standalone JavaScript Loader | Adds inline Scripture, tooltips, or modals to any website | [Loader guide](/project/loader/) |

The package contains the component, Daily Light module, Daily Scripture module, and system Loader plugin. The Loader is useful when you only need to display verses within content; the component provides the full reader and study experience.

## Match your Joomla version

The repositories maintain different release lines. The package source reviewed for this guide identifies `5.0.16` for Joomla 5.0 through 5.4. The component's current default source identifies `6.0.16` and uses the `6.x` update channel. These are not interchangeable installation targets.

| Source | Version/channel documented in source | What to verify |
|---|---|---|
| Package | `5.0.16`, Joomla 5 | Select the package intended for your installed Joomla version |
| Component | `6.0.16`, `6.x` update channel | Check the release manifest and Joomla compatibility before installation |
| Scripture Loader | `3.1.0`; current manifest targets Joomla 5 | Use a build compatible with your Joomla release rather than relying on older broad README claims |

Download a compatible installable archive from the appropriate repository. The Joomla package archive includes bundled extension ZIP files; a component archive and a package archive have different purposes. A test installation and a current site/database backup are useful before changing any established site.

## Install the package or component

1. Download the package or component release that matches your Joomla version.
2. Sign into Joomla's administrator interface with extension-install permission.
3. Open **System → Install → Extensions** and upload the installable ZIP.
4. Open the Get Bible component from the administrator component menu.
5. Review the component options, select the default translation, and configure any required repository access for your installation.
6. Create a Joomla menu item for the Get Bible application's reader view.
7. Open that menu item on the public site and verify translation selection, chapter navigation, and the features you enable.

The installer provisions the component's database tables. Updates are distributed through the release channel declared in the selected extension manifest. Keep the installed component and package on compatible release lines.

The source includes a `show_install_button` option intended for initial translation setup. Enable it only when that installation action is needed, complete the translation setup, and then return the site to its intended reader presentation.

## Administrator features

The component manifest exposes administrator views for:

- Linkers, which identify reader sessions.
- Notes and tagged verses.
- Tags.
- Prompts and stored OpenAI responses.
- Translations, books, chapters, and verses.
- The main GetBible dashboard.

The reader's linker system uses a GUID rather than requiring each visitor to create a Joomla login. This lets a visitor retain study notes and verse associations and supports sharing a study session. A linker belongs to that installation's feature model; it is not a public Bible API token.

For site owners, Joomla permissions still control administrative access. Review the component's access configuration and avoid giving ordinary site visitors access to administrator views or service credentials.

## Useful reader settings

These settings are present in the component's configuration and reader menu metadata.

| Setting | Purpose |
|---|---|
| `default_translation` | Initial translation; source default is `kjv` |
| `show_install_button` | Expose translation installation during initial setup |
| `show_getbible_logo` | Show the GetBible brand |
| `show_getbible_link` | Show the project link |
| `show_hash_validation` | Show hash-validation information |
| `show_api_link` | Show the API link |
| `verse_per_line` | Choose a verse-per-line reader layout |
| `previous_next_navigation` | Control adjacent-passage navigation |
| Reader menu/card settings | Choose tabs, icons, positions, and card presentation |
| `enable_open_ai` | Enable optional OpenAI functionality; default is disabled |

Many reader-menu settings can inherit the component default. Set site-wide behavior in component options and override individual menu items only when the page needs a different presentation.

## VDM access tokens

The component includes an optional password field named `gitea_token`, displayed as **VDM Access Token**. Its documented purpose is obtaining updates from VDM.

1. Sign into the VDM account you use for this integration.
2. Open [VDM application and access-token settings](https://git.vdm.dev/user/settings/applications).
3. Create the token required for the repository access your installation needs.
4. Save it in the GetBible component's VDM Access Token field.
5. Verify the update or repository action from Joomla.

The field's current source does not prescribe an exact scope selection. If the required access is unclear, use the [support desk](https://git.vdm.dev/getBible/support) before expanding permissions. Keep the token in administrator configuration; do not paste it into a public issue, article, script tag, or browser console.

This VDM token is separate from normal public GetBible API access. It is also separate from an OpenAI API key or a Telegram bot token. See the [API overview](/api/) for the endpoint contracts.

## Optional OpenAI integration

The component can send Scripture-based prompts to OpenAI when the site administrator enables the feature and supplies the appropriate server-side API credentials. The component exposes prompt management, stored responses, model configuration, and generation settings.

This optional integration is disabled by default. It is not required to read Scripture, browse the public Bible APIs, or use the Loader. Use the current [OpenAI API documentation](https://platform.openai.com/docs/) for the account and API setup; configure only settings supported by your installed component release. A list of model names in an older component release does not establish their present availability.

Treat generated responses as a separate application feature from the source Bible text. Keep the source translation, its attribution, and its licensing visible in the reader. For the GetBible MCP integration, including connecting tools to ChatGPT, use the separate [MCP guide](/mcp/).

## Install the Joomla Scripture Loader

The system plugin adds the JavaScript Loader to Joomla's page header.

1. Download a compatible plugin archive from [joomla-scripture-loader](https://github.com/getbible/joomla-scripture-loader).
2. Install it through Joomla's extension installer.
3. Open Joomla's plugin manager and enable the GetBible Loader system plugin.
4. Edit an article or other content area in HTML/source mode.
5. Add the `getBible` class to an element containing a Scripture reference.

```html
<div class="getBible"
     data-format="inline"
     data-translation="kjv"
     data-show-translation="1"
     data-show-reference="1"
     data-bible-url="https://getbible.life/">
  John 3:16-19
</div>
```

The editor and Joomla text filters must preserve the class and `data-*` attributes. If the markup disappears on save, inspect the editor's allowed-HTML settings and the appropriate Joomla text-filter policy.

Use `tooltip` or `modal` for a compact reference that opens the passage on interaction:

```html
<p>
  The passage is
  <span class="getBible"
        data-format="modal"
        data-translation="kjv"
        data-bible-url="https://getbible.life/">1 John 3:16-19</span>.
</p>
```

The full [Loader guide](/project/loader/) documents the attributes, current Query v2 dependency, local cache, display adapters, and loading behavior. When the Joomla plugin supplies the bundle, avoid inserting a second copy manually.

## Scripture sources and version compatibility

GetBible's public data services evolve independently from Joomla extension releases. Read the chosen extension's source and release notes before changing endpoints or assuming new response fields are supported. Availability of Bible API v3, dictionaries, or commentaries on the platform does not automatically add those services to an older Joomla component.

The live [getbible.life](https://getbible.life/) site remains a Bible reading site. Project documentation, API references, and integration guides belong on [getbible.net](https://getbible.net/).

## Troubleshooting

| Problem | Next check |
|---|---|
| Extension fails to install | Confirm the package type, release channel, Joomla version, and installer error |
| Reader page is missing | Check that the Get Bible reader menu item is published and accessible |
| Translation data is unavailable | Check installation status, selected translation, outbound API access, and the component's configuration |
| Update access fails | Verify the VDM token and its intended access without posting the token publicly |
| Loader shows only a reference | Verify that the plugin is enabled and the saved HTML retains `getBible` and its attributes |
| Loader links open documentation | Set `data-bible-url="https://getbible.life/"` or your own compatible reader base |
| OpenAI features fail | Check the optional feature's enabled state and server-side configuration for the installed release |

All public support goes to the [GetBible support desk](https://git.vdm.dev/getBible/support). Include the Joomla version, extension version, PHP version, affected page, and steps to reproduce. General enquiries: [getBible@TrueChristian.church](mailto:getBible@TrueChristian.church).

## Source documentation and contribution

- [Joomla package README](https://github.com/getbible/joomla-pkg/blob/HEAD/README.md) and [package manifest](https://github.com/getbible/joomla-pkg/blob/HEAD/pkg_getbible.xml).
- [Component README](https://github.com/getbible/joomla-component/blob/HEAD/README.md), [extension manifest](https://github.com/getbible/joomla-component/blob/HEAD/getbible.xml), and [configuration](https://github.com/getbible/joomla-component/blob/HEAD/admin/config.xml).
- [Reader menu configuration](https://github.com/getbible/joomla-component/blob/HEAD/site/tmpl/app/default.xml).
- [Loader plugin README](https://github.com/getbible/joomla-scripture-loader/blob/HEAD/README.md) and [plugin manifest](https://github.com/getbible/joomla-scripture-loader/blob/HEAD/getbibleloader.xml).

The extensions are built with Joomla Component Builder. Contributions must respect the generated structure and be made in the appropriate source/build process so regeneration preserves the work. The Joomla extensions use GPL licensing; individual Bible translations retain their own copyright and distribution terms.

