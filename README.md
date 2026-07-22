# Blue Prince Numeric Core Calculator

Live at **https://rimladris.github.io/blue-prince-numeric-core/** (auto-deploys from `main` via GitHub Pages).

Static web app that computes the "numeric core" for a 4-value code, for the Blue Prince puzzle mechanic. First-time visitors see a spoiler warning before the tool is shown, since it reveals late-game content.

## Rule

- Input is 4 values, entered either way in the same box:
  - A 4-character code: digits `0-9`, or letters `A-Z` (`A=1 ... Z=26`) — e.g. `PEAK` or `1942`.
  - 4 numbers separated by spaces or commas — e.g. `16, 5, 1, 11` or `16 5 1 11`. Use this when a value is itself a multi-digit number.
  - The app auto-detects which format you typed based on whether it contains a space or comma.
- Assign one operation to each value, applied strictly left to right with a running total starting at 0 (no normal order of operations).
- The first operation is always `+`. The remaining three are every possible ordering of `{-, *, /}` (6 orderings total).
- The numeric core is the **minimum non-negative integer** result across all valid orderings. Orderings that divide by zero, or that don't land on an integer, are excluded. If the only possible result is 0, that's still valid but flagged with a warning.
- If a pass's result has 4 or more digits, the process repeats using that result's digits as the new input.
- If no ordering produces a non-negative integer, the tool reports "no solution" rather than guessing.

## Run locally

No build step. Just serve the directory and open `index.html`:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

No server or build process required — it's a single static HTML file plus a plain JS module (`core.js`).

## License

MIT — see [LICENSE](LICENSE).
