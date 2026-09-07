# PageTweaker

> Turn visible page feedback into one implementation brief your AI can act on.

<img src="assets/pagetweaker-app-icon-transparent-v3.png" alt="PageTweaker app icon" width="150">

PageTweaker is a macOS feedback workspace for the moment when an AI-generated page is close, but words alone are slowing everything down.

Open the real page. Try the visual change yourself. Pin precise notes. Draw over the page and explain what the markup means. Then give your AI one ZIP containing the complete context.

**PageTweaker is not another CSS editor.** It does not rewrite your project, prescribe implementation code, or replace your AI coding agent. It helps you decide and communicate what the finished page should look like so the agent can make the real change correctly.

![PageTweaker product overview](assets/page-tweaker-concept.png)

## The problem it solves

Feedback such as “make this smaller,” “move that section,” or “use the same treatment as the other cards” forces an AI agent to guess what you saw and what you meant. Screenshots help, but they usually lose the exact element, page, breakpoint, tested values, and explanation.

PageTweaker keeps those pieces together:

- the page and exact element you were looking at;
- the desktop, tablet, or mobile view where the issue appears;
- visual values you tried and approved;
- replacement content, including safe inline formatting;
- pinned notes attached to specific elements;
- grouped drawing markup with a plain-language explanation;
- annotated page screenshots and structured evidence for the receiving agent.

The result is fewer blind revisions, less repeated prompting, and a clearer definition of done.

## What it is and what it is not

| PageTweaker is | PageTweaker is not |
| --- | --- |
| A visual feedback and decision tool | A source-code editor |
| A safe place to test the outcome you want | A no-code site builder |
| A structured handoff to an AI agent or developer | A generator that blindly exports CSS |
| A page-aware, breakpoint-aware review workspace | A replacement for your browser or coding agent |

Preview values and selectors are evidence. The handoff explicitly tells the receiving agent to inspect the real project and implement the intent through its existing components, design system, responsive rules, accessibility requirements, and conventions.

## From page to AI brief

![PageTweaker workflow](docs/workflow.svg)

1. **Open the page.** Drop a local HTML file or URL onto PageTweaker, type a domain such as `apple.com`, choose a file, or launch the current Chrome tab from the bookmarks bar.
2. **Try the outcome.** Select an element and preview typography, spacing, colors, background, or replacement content without changing the source.
3. **Explain the intent.** Pin a note to an exact element or draw as many strokes as one idea needs and give that markup one explanation.
4. **Check responsive views.** Keep desktop, tablet, and mobile feedback separate. Navigate between pages and return with the Back button without mixing their changes.
5. **Create the handoff.** Drag the resulting ZIP into Codex, Claude, another AI chat, or give it to a developer.

### Start from almost anywhere

![PageTweaker startup workspace showing drop, paste, file, and Chrome options](assets/screenshots/start-screen.png)

The startup screen shows every fast path. Drop onto the app icon or window, paste into the address bar, choose an HTML file, or install the Chrome shortcut once.

### Open the current Chrome page

<img src="assets/screenshots/chrome-shortcut.png" alt="Open in PageTweaker shortcut being dragged to the Chrome bookmarks bar" width="420">

The no-extension bookmarklet sends only the current URL through PageTweaker’s registered app link. It does not copy Chrome cookies, local storage, password-manager data, or authentication tokens. Protected sites can use PageTweaker’s own persistent login session after you sign in inside the app.

### Hand one file back to AI

<img src="assets/screenshots/handoff-ready.png" alt="PageTweaker handoff file ready to drag into an AI chat" width="390">

The Handoff tab gives you a draggable file, a selectable full path, Copy Path, and Show in Finder. The ZIP contains:

- `START-HERE.md`, which explains the user’s intent and tells the agent how to interpret the evidence;
- `handoff.json`, containing page, breakpoint, selector, tested-value, text, note, and grouped-markup context;
- annotated screenshots that show the real page beneath the feedback.

## Inspect without losing normal page behavior

Links, buttons, forms, and login controls work normally. Hold **Option (⌥)** while clicking an interactive control when you want to select it for feedback instead.

Exact-element scope is the default. When a repeated style should change everywhere, the selector bar can deliberately widen the visual preview to a shared class or matching tag. Text replacement and pinned notes remain attached to the exact selected element.

All changes are preview-only. PageTweaker never modifies the original local file, remote page, or source project.

## Install on macOS

The current public download is **v0.1.15 for Apple Silicon**. Download the DMG from [GitHub Releases](../../releases), drag PageTweaker to Applications, then Control-click the app and choose **Open** the first time.

The app is currently ad-hoc signed, not Apple Developer ID signed or notarized. macOS may block or warn about the download. Read [Installing PageTweaker](docs/INSTALLING.md) for the exact per-app installation path, safe troubleshooting, and build-from-source option. Do not disable Gatekeeper system-wide.

The `main` branch contains the newer unreleased v0.1.16 work. A new public DMG will not be published until Developer ID signing, notarization, stapling, and fresh-download Gatekeeper verification are complete.

## Run from source

Requirements: macOS, Node.js 20 or newer, and npm.

```sh
git clone https://github.com/DaneShakespear/page-tweaker.git
cd page-tweaker
npm install
npm start
```

Do not open `src/index.html` directly in a normal browser. Page selection, app links, native file operations, and handoff export require the Electron app runtime.

## Privacy and security boundaries

- PageTweaker does not upload your feedback to an AI provider.
- It does not store passwords or import browser cookies and tokens.
- Chrome and Safari password-manager extensions do not run inside its Electron preview.
- The Chrome shortcut sends only the current URL.
- Exported handoffs are ordinary local ZIP files under `Downloads/PageTweaker Handoffs`.
- Preview changes remain local and do not alter the source page.

## Development

```sh
npm test
npm run package:mac
npm run smoke:ui
```

See [Contributing](CONTRIBUTING.md), [Security](SECURITY.md), and the current technical state in [docs/CURRENT-STATE.md](docs/CURRENT-STATE.md).

## Current boundaries

PageTweaker supports local HTML artifacts, public pages, multi-page navigation, and sites you log into through its own persistent session. It does not inherit an existing Chrome or Safari session, capture a logged-in Chrome DOM, edit source code, deploy changes, or choose the final implementation architecture.

The repository does not yet grant an open-source license. Source is publicly visible, but reuse rights have not been granted.

## Roadmap

- Developer ID signing and Apple notarization
- Fresh-download macOS acceptance testing
- Optional authenticated Chrome capture without copying cookies or tokens
- Additional markup and handoff review tools
