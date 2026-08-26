# Contributing

PageTweaker is intentionally narrow: it makes visual review and AI handoff faster. Contributions should make that loop clearer, faster, or more reliable.

## Local checks

```sh
npm install
npm test
npm start
npm run package:mac
npm run smoke:ui
```

Before opening a pull request, confirm local HTML files and public URLs still open without modifying their source, and export still produces a useful handoff bundle.

## Contribution rules

- Keep source artifacts immutable. Preview changes belong to the session and export bundle.
- Do not introduce browser-cookie reuse, credential capture, or automatic AI-provider submission without a clear security design.
- Prefer a small, observable improvement over a new visual-builder subsystem.
- Include a short before/after explanation for interaction changes.

## License

No open-source license has been granted yet. Do not assume permission to redistribute or reuse this code beyond GitHub's terms until a license is added.
