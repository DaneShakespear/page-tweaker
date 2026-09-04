# Installing PageTweaker on macOS

PageTweaker currently ships as an ad-hoc signed Apple Silicon (`arm64`) macOS app. The ad-hoc signature protects bundle integrity and is verified during release QA, but it is not an Apple Developer ID signature and the app is not notarized. macOS may therefore warn on first launch.

## Install from a release

1. Download `PageTweaker-<version>-arm64.dmg` from Releases.
2. Double-click the DMG and drag **PageTweaker** to **Applications**.
3. On first launch, Control-click the app and choose **Open**, then choose **Open** in the confirmation dialog.

This grants an exception for this app only. Do not disable Gatekeeper system-wide.

## Open links from Chrome

PageTweaker includes a no-extension Chrome bookmarklet in the app's Help tab.

1. Open PageTweaker.
2. Go to **How it works**.
3. Drag **Open in PageTweaker** to Chrome's bookmarks bar.
4. In Chrome, open the page you want to inspect.
5. Click the **Open in PageTweaker** bookmark.

The bookmarklet launches the installed app through `page-tweaker://open?url=...` and sends only the current tab URL. It does not copy Chrome cookies, localStorage, IndexedDB, password-manager state, or auth tokens.

If dragging is unavailable, click **Open in PageTweaker** inside the Help tab to copy the launcher code, create a bookmark in Chrome, and paste the copied code into its URL field.

For protected pages, sign in once inside PageTweaker. The preview browser uses a persistent PageTweaker profile, so site cookies can survive app relaunches. Login fields, buttons, links, and other form controls pass clicks through to the page; hold Option while clicking one of those controls if you need to select it for tweaking.

## Open links from other apps

When PageTweaker is installed in Applications, macOS registers it as a handler for public `http` and `https` links as well as HTML and Safari `.webloc` files. Apps with an **Open with** or browser-selection menu can then list PageTweaker. PageTweaker does not make itself the default browser automatically.

If macOS still blocks a known-good download, inspect the file first, then remove only that file's quarantine flag:

```sh
xattr -dr com.apple.quarantine "/Applications/PageTweaker.app"
```

Use that command only for a release you obtained from this repository and have chosen to trust.

## Run from source

Requirements: macOS, Node.js 20 or newer, and npm.

```sh
git clone https://github.com/DaneShakespear/page-tweaker.git
cd page-tweaker
npm install
npm start
```

Do not open `src/index.html` directly in Chrome or another browser. It is the Electron app shell and its element-selection and export bridges exist only when you launch PageTweaker with `npm start` or the installed `.app`.

The repository includes `.npmrc` so Electron's official post-install runtime download is permitted in environments that require package-script allowlisting.

## Terminal opener

```sh
npm link
page-tweaker ./report.html
page-tweaker https://example.com
```

## Build your own DMG

```sh
npm run package:mac
```

The result is written to `dist/`. The repository's packaging hook applies an ad-hoc signature. A locally built DMG is not Developer ID signed or notarized unless you separately configure an Apple Developer ID Application certificate and notarization credentials.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| `Electron failed to install correctly` | Delete `node_modules`, run `npm install` again, and ensure outbound access to Electron's official GitHub release downloads. |
| The Chrome bookmarklet does not appear | Show Chrome's bookmarks bar, then drag **Open in PageTweaker** from the PageTweaker Help tab onto it. |
| The Chrome bookmarklet does not launch PageTweaker | Confirm PageTweaker is installed in Applications and has been opened once. macOS registers the `page-tweaker://` handler after installation/first launch. |
| A protected page redirects to login | Sign in once inside PageTweaker. Its persistent preview profile keeps cookies for later sessions, but it does not import Chrome's existing cookies. |
| A login form click selects the field or button instead of using it | Update to a build with interactive-control pass-through. Form fields, buttons, links, and common ARIA controls remain clickable; hold Option to select one for tweaking. |
| The handoff button appears to do nothing | Use the installed packaged app, not `src/index.html` in a browser. A successful handoff opens the Handoff tab and saves one ZIP in `Downloads/PageTweaker Handoffs`. |
| An edit does not match the source | Give the entire ZIP to the AI session so it can use the locator, scope, previewed values, notes, drawing data, and markup explanation together. PageTweaker is a handoff tool, not a source-code writer. |
| Right-click does not show Copy | Confirm you are using v0.1.13 or newer. Selected text in the app and preview has a native Copy context menu; Command-C continues to work. |
