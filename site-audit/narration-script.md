# Walkthrough narration script

For text-to-speech. Timings match the six steps in `docs/using-the-extension.html`.
Target pace is about 150 words per minute; word counts are noted so you can trim
if your voice runs fast or slow.

Two versions below: **timed segments** for recording section by section, and a
**continuous script** for pasting into a TTS tool in one go.

---

## Timed segments

### 0:00 — Click the toolbar icon  *(31 words, ~12s)*

> Click the Site Audit icon in your Chrome toolbar. It knows where you are. On
> azblue dot com, it opens the review panel right away. Anywhere else, you get the
> full dashboard.

### 0:12 — Pick Admin or Author  *(24 words, ~12s)*

> The first time, choose how you want to work. Admins can run audits and change
> settings. Authors see findings only. Pick a role and continue.

### 0:24 — Open a page on azblue dot com  *(32 words, ~14s)*

> Now browse the site normally. The panel follows you. Whatever page you land on,
> it shows that page's findings, its translation status, and how many problems are
> open. That includes the homepage.

### 0:38 — Expand a finding  *(39 words, ~17s)*

> Click any finding to open it. The page scrolls to the problem and outlines it in
> gold, so you can see exactly what the audit is talking about. Underneath, you get
> the evidence it captured and a suggested fix.

### 0:55 — Mark it done  *(38 words, ~15s)*

> When you've handled something, mark it done right here. That writes to the same
> shared store the dashboard reads, so your team sees it too, and it flows through
> to the Power BI report. Click again to undo.

### 1:10 — Back to the dashboard  *(35 words, ~15s)*

> Need the bigger picture? The button at the bottom takes you to the full dashboard
> without closing the panel. Run a new audit, review every finding, or set up your
> Power BI export from there.

**Total: about 1 minute 25 seconds.**

---

## Continuous script

Paste this straight into your TTS tool. No headings, no symbols.

Click the Site Audit icon in your Chrome toolbar. It knows where you are. On azblue dot com, it opens the review panel right away. Anywhere else, you get the full dashboard.

The first time, choose how you want to work. Admins can run audits and change settings. Authors see findings only. Pick a role and continue.

Now browse the site normally. The panel follows you. Whatever page you land on, it shows that page's findings, its translation status, and how many problems are open. That includes the homepage.

Click any finding to open it. The page scrolls to the problem and outlines it in gold, so you can see exactly what the audit is talking about. Underneath, you get the evidence it captured and a suggested fix.

When you've handled something, mark it done right here. That writes to the same shared store the dashboard reads, so your team sees it too, and it flows through to the Power BI report. Click again to undo.

Need the bigger picture? The button at the bottom takes you to the full dashboard without closing the panel. Run a new audit, review every finding, or set up your Power BI export from there.

---

## Recording notes

- **"azblue dot com"** is written out deliberately. Most TTS engines read
  "azblue.com" as "azblue dot com" correctly, but some read the period as a
  sentence break. Test one line first and switch to "azblue.com" if yours handles it.
- **"Power BI"** — check your engine says "Power B I", not "Power bee". If it
  stumbles, write it as "Power B I" with spaces.
- **Leave about a half second of silence** at the start of each segment if you're
  recording them separately. It gives the screen action a beat to land.
- **If your timings drift**, update the `data-timestamp` values in
  `docs/using-the-extension.html` to match the finished audio. They're in seconds:
  currently 0, 12, 24, 38, 55, and 70.
- **Save the finished video** as `using-the-extension.mp4` next to the docs HTML.
  The placeholder disappears on its own once the file loads.

---

## Optional: AEP Launch segment

If you want a second, separate video for the AEP tab, this runs about 35 seconds.

> AEP Launch answers one question: did every page that was supposed to change
> actually change? Before the release, capture what's live and what's on staging,
> then compare. After the release, capture production before and after. The
> Unchanged list is the important one. Anything sitting there that was supposed to
> be updated got missed. Open any page to see the exact text that changed, and any
> PDF that was swapped, side by side.

*(72 words, about 29 seconds at 150 words per minute.)*
