# Installing Page Tweaker on macOS

Page Tweaker currently ships as an unsigned Apple Silicon (`arm64`) macOS app. macOS will warn because the app is not yet signed and notarized with an Apple Developer certificate.

## Install from a release

1. Download `Page Tweaker-<version>-arm64.dmg` from Releases.
2. Double-click the DMG and drag **Page Tweaker** to **Applications**.
3. On first launch, Control-click the app and choose **Open**, then choose **Open** in the confirmation dialog.

This grants an exception for this app only. Do not disable Gatekeeper system-wide.

If macOS still blocks a known-good download, inspect the file first, then remove only that file's quarantine flag:

```sh
xattr -dr com.apple.quarantine "/Applications/Page Tweaker.app"
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

Do not open `src/index.html` directly in Chrome or another browser. It is the Electron app shell and its element-selection and export bridges exist only when you launch Page Tweaker with `npm start` or the installed `.app`.

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

The result is written to `dist/`. A locally built DMG is also unsigned unless you configure an Apple Developer ID Application certificate and notarization credentials.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| `Electron failed to install correctly` | Delete `node_modules`, run `npm install` again, and ensure outbound access to Electron's official GitHub release downloads. |
| A page does not load | Confirm it is a public `http` or `https` URL. v1 intentionally does not reuse browser cookies or authenticated sessions. |
| The exported bundle has no image | The JSON and prompt are still exported. Retry after the page has fully loaded; some pages restrict capture behavior. |
| An edit does not match the source | Use the exported locator, values, note, and screenshot together. Page Tweaker is a handoff tool, not a source-code writer. |
