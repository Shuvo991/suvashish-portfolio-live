# Claude Instructions — Suvashish Portfolio

## Writing Standards (MANDATORY — applies to every copywriting task)

### No AI-flagged language
Every piece of copy written for this site must be checked against the lists below before any change is implemented. If a flagged word or pattern appears, rewrite it in plain, direct language.

**Banned words (never use):**
leverage, utilize, streamline, robust, seamless, holistic, transformative, innovative, cutting-edge, game-changing, elevate, empower, harness, spearhead, pioneering, navigate, orchestrate, foster, facilitate, drive (as a buzzword), enable, optimize (as filler), synergy, ecosystem (when used loosely), actionable, impactful, best-in-class, world-class, scalable (as filler), dynamic, comprehensive (as filler), deliver (when vague), ensure (as filler), solutions (when vague)

**Banned sentence patterns:**
- "X that Y" constructions used as padding (e.g. "a platform that empowers users to...")
- Starting sentences with "This" followed by a vague noun
- Passive constructions that hide the agent ("was delivered", "was built" — say who built it)
- Superlatives without evidence ("the most...", "best...")
- Hollow openers ("In today's world...", "In an era of...", "At its core...")

**No em-dashes in narrative copy.**
Date ranges like "Apr 2025 — Present" are fine. But prose sentences must never use " — " as a clause separator. Use a comma, colon, period, or rewrite the sentence instead.

---

## Verification Workflow (MANDATORY before implementing any copy change)

For any task that touches portfolio copy — case studies, timeline bullets, section descriptions, hero text, process steps, or metadata — follow this sequence:

1. **Research agent** — reads the relevant files and extracts current content
2. **Drafting agent** — writes the new copy, avoiding all flagged words and em-dashes
3. **Verification agent** — independently scans the draft for:
   - Any word from the banned list
   - Any " — " em-dash in narrative prose
   - Any fabricated or unverified numbers/claims
   - Any hollow or AI-pattern sentence structures
4. Only after the verification agent gives a clean pass does the change get implemented

If the verification agent flags anything, the drafting agent must revise before implementation proceeds. Never skip this step.

---

## Numbers and Claims

Never invent metrics. Every number on the site (percentages, user counts, country counts, cost savings) must trace back to something Suvashish has confirmed or that appears in existing site copy. If a number cannot be verified, use contextual framing instead (e.g. "real capital at stake" rather than "$500M+ annual trading volume").

---

## Case Study Rules

- Each case study must have a TL;DR block with 4 fields: Problem, Solution, Role, Impact
- Each case study must have a lifecycle type chip: "0-to-1: Built from scratch" (emerald) or "1-to-N: Scaled & extended" (blue)
- Radar chart labels must not be clipped — use `layout.padding` with at least 80px horizontal on mobile, 100px on desktop
- Location claims must be accurate — do not generalize (e.g. ECW LMS was Cox's Bazar – Chattogram, Bangladesh only, not "5 countries")

---

## CSS / Code Rules

- Never add case study styles to `styles.css` — use an inline `<style>` block with `fn-*` prefixed classes per page
- Clean URL pattern: subpages live at `subdirectory/index.html`, served at `/subdirectory/`
- Asset paths in subpages use `../` prefix (e.g. `../styles.css`, `../logos/foo.webp`)
- Chart.js version: 4.4.1
- Mobile breakpoint: `window.innerWidth < 860`

---

## Git / Push Rules (Windows CMD)

Windows CMD does not support backslash line continuation. Always provide separate `git add` commands per file, never chained with `\`. Example:

```
git add index.html
git add styles.css
git commit -m "message"
git push live main
```
