# PageTweaker

> Make the change you can see.

<img src="assets/pagetweaker-app-icon-transparent-v3.png" alt="PageTweaker app icon" width="160">

PageTweaker is a focused macOS desktop app for the frustrating last mile of AI-generated HTML: the report, interface, or landing page is almost right, but getting it there requires too much back-and-forth.

Open the page. Click what looks wrong. Tune the visible value. Mark up what needs a bigger change. Create one handoff file that gives an AI session or developer the exact implementation brief.

![Concept render of PageTweaker](assets/page-tweaker-concept.png)

*Concept render. A real product screenshot walkthrough remains planned.*

## Why it exists

“Make the header smaller” is not an implementation instruction. It is a guess that becomes a loop of edits, previews, and more guesses.

PageTweaker puts the visual decision where it belongs: on the page itself. It is not a full CSS editor or no-code site builder. It is a fast visual QA and AI-handoff layer for pages that are already close.

![PageTweaker workflow](docs/workflow.svg)

## What it does

- Opens a local HTML artifact, public `http(s)` URL, app URL handler target, or URL sent from the Chrome bookmarklet in a dedicated desktop workspace.
- Uses a persistent PageTweaker browser profile so sites can stay logged in after you sign in inside PageTweaker.
- Lets you select visible elements and preview typography, spacing, and color adjustments immediately.
- Lets login forms, links, buttons, and other interactive controls behave normally; hold Option while clicking an interactive control to select it for tweaking.
- Adds desktop, tablet, and mobile preview controls and keeps every edit, note, and drawing attached to the size where it was created.
- Supports plain-text replacement when the words need to fit the layout.
- Pins natural-language AI notes to elements and gives every freehand mark its own editable explanation and nearby element locator.
- Creates one draggable ZIP containing `handoff.json`, a `START-HERE.md` AI brief, and annotated screenshots showing the real page beneath the feedback at each visited preview size.
- Keeps the original file and page untouched. Every adjustment is preview-only until someone applies the exported handoff.

## Open From Chrome

PageTweaker includes a no-extension bookmarklet in the Help tab. Drag **Open in PageTweaker** to Chrome's bookmarks bar once, then click that bookmark on any page to send the current URL to PageTweaker. Clicking it inside PageTweaker copies the launcher code as a fallback for creating the bookmark manually.

The bookmarklet launches the installed app through:

```js
javascript:location.href='page-tweaker://open?url='+encodeURIComponent(location.href)
```

This sends only the URL. It does not copy Chrome cookies, localStorage, IndexedDB, password-manager state, or auth tokens. For protected pages, sign in once inside PageTweaker; its own persistent browser profile can keep that site session for later.

Page controls work normally. Hold **Option (⌥)** while clicking a link, button, or form field when you want to select that control for tweaking instead. Chrome and Safari password-manager extensions do not run inside PageTweaker; use your password manager's standalone app or menu to copy and paste credentials.

## How the handoff works

1. **Open** a local report, page, public URL, or Chrome bookmarklet target.
2. **Tune** the element until it looks right.
3. **Explain** larger changes with a pinned note or markup.
4. **Create the handoff**. PageTweaker saves one ZIP in `Downloads/PageTweaker Handoffs`.
5. Drag its icon directly into Codex, Claude, another AI chat, or copy the displayed full path.

The AI receives the original page address, selectors, scope, previewed values, replacement text, pinned notes, breakpoint context, drawing coordinates, per-mark explanations, nearby element locators, and a plain-language brief. The brief explicitly treats those details as evidence of the desired outcome, not code or architecture to paste blindly. The Handoff tab keeps the file icon, selectable full path, Copy Path button, and Show in Finder action together.

## Install

Download the Apple Silicon DMG from [Releases](../../releases), drag PageTweaker to Applications, then Control-click and choose **Open** the first time.

The top bar always shows the running version. Paste a path or URL and press Enter, drop it anywhere, or choose a local `.html` or Safari `.webloc` file. Loading a different page or reloading always asks before clearing the current preview edits, pins, and markup. For an app-icon target, open a Safari `.webloc` with PageTweaker or use `page-tweaker://open?url=` followed by an encoded URL.

The installed app registers as an alternate handler for `http` and `https` links. Apps that expose an “Open with” or browser picker can offer PageTweaker without PageTweaker silently replacing your default browser.

When you select an element, PageTweaker defaults to changing only that exact element at the active desktop, tablet, or mobile preview. The selector bar along the bottom lets you deliberately widen visual changes to every element sharing its CSS class or tag, such as all `h1` headings. Replacement text updates as you type, and color controls include synchronized hex fields for copying or pasting exact colors. Pinned notes stay attached to the exact clicked element and preview size. Each Inspector reset button names the one property it restores. Markup lines move with the page while it scrolls, and each line keeps its own explanation.

The app is ad-hoc signed for bundle integrity, but it is not Developer ID signed or Apple notarized. Read the complete, safe setup and troubleshooting guide in [Installing PageTweaker](docs/INSTALLING.md). It explains the per-app Gatekeeper exception and why you should not disable macOS protections globally.

## Run from source

```sh
git clone https://github.com/DaneShakespear/page-tweaker.git
cd page-tweaker
npm install
npm start
```

To open a file or URL from the terminal after `npm link`:

```sh
page-tweaker ./report.html
page-tweaker https://example.com
```

## Current boundaries

PageTweaker v1 supports public pages, local HTML artifacts, and its own persistent web session for sites you log into inside PageTweaker. It does not reuse your Chrome profile, import cookies, log into sites on your behalf, modify the original source file, or send changes directly to an AI provider. Those limits are deliberate.

The Chrome bookmarklet is a low-friction URL launcher, not an authenticated page capture tool. A browser extension or native bridge may be added later if PageTweaker needs to capture authenticated page context directly from Chrome without moving cookies or tokens.

## Development

```sh
npm test
npm run package:mac
npm run smoke:ui
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance and current licensing status.

## Roadmap

- Signed and notarized macOS release
- Real product screenshot walkthrough
- Manual verification and polish for the Chrome bookmarklet flow
- Optional authenticated Chrome capture integration without copying browser cookies
- More markup tools and export controls
- Optional integrations that keep AI-provider credentials outside the app
