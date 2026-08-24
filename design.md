# Learn How to House Sit — Sales Landing Page: Design System

This document describes the visual language for the **sales landing page** for Learn How to House Sit (a House Sit Hub course), pulled directly from the existing brand mark and photography (the logo and the three Facebook images: kitchen, family play, house exterior). It's meant to be handed to a developer or designer alongside `index.html`, which already implements everything below.

## 0. Research basis (Kajabi-style course landing pages)

This pass restructured the page around patterns pulled from a review of well-known, high-converting Kajabi course/waitlist pages (BossBabe, Action Jacqueline, Psychotherapy.net, Family Fork, The Space, and others), plus general 2026 conversion guidance for course launch pages. The recurring patterns adopted here:

- **Full-bleed hero photo with an overlay**, not a plain background color, so the emotional/lifestyle payoff is visible in the first second.
- **A single, repeated call to action** with the offer stated in the button copy itself, shown in the hero, mid-page, the pricing section, and the closing band.
- **Alternating light/dark color-blocked sections** instead of long stretches of plain white, addressing the common critique that "big patches of white space look empty" — every section here has an intentional background (paper, dim paper, ink, or red).
- **Pain points named explicitly and early**, in a visually distinct (dark) section, mirroring how BossBabe and Rebecca Louise's pages lead with the reader's problem before pivoting to the solution.
- **Credibility/social proof surfaced immediately**, via a stat bar bridging the hero and the next section, rather than buried lower on the page.
- **A native FAQ accordion** and short, scannable benefit cards rather than dense paragraphs, echoing the "text-heavy pages need strong visual hierarchy" takeaway from the Psychotherapy.net example.

Sources consulted: [15 Kajabi Landing Page Examples](https://supplygem.com/kajabi-landing-sales-page-examples/), [Kajabi Landing Page Examples That Convert](https://www.shanarecker.com/blog/kajabi-landing-page-examples-that-actually-convert), [How to Optimize Your Kajabi Landing Page for Conversions](https://theeduassist.com/blog/kajabi-landing-page-design/).

## 1. Aesthetic direction

**Editorial travel diary meets a proven course-launch structure.** The brand mark is a simple house-outline icon in a rounded square badge, set next to the "House Sit Hub" wordmark — no paw print, no third color, just a clean line-art house. The photography is warm, lived-in and real: a real kitchen, a real kid playing on the floor, a real stone house in Belgium. The page keeps that editorial warmth in its typography and photo treatment, but borrows the color-blocked, single-CTA, credibility-forward structure that recurs across high-converting Kajabi pages, so it reads as a well-designed travel magazine spread with the bones of a page that's built to convert.

Things this page deliberately avoids: purple gradients, glassy card shadows, generic rounded SaaS buttons, stock icons, Inter/Roboto-style default type, and long unbroken stretches of plain white background.

**Note (2026 rebrand, v2 — "Global Trust & Golden Hour"):** the terracotta/teal warm-travel palette described below this note is retired. The page now runs a premium, trust-forward palette (deep indigo + warm sand + sunset gold) with a serif/sans typographic split, documented in the tables immediately below. The class names in the shipped code (`ink`, `ink-900`, `terracotta`, `slate-50`, `slate-600`, `font-display`) are unchanged from the earlier pass — only the hex values behind them (and, for headlines, the font-family) moved — plus a handful of new explicit tokens (`sand`, `indigo`, `gold`, `slate-plain`, `font-serif`) for new markup. The section below the old note (color palette / typography) documents the historical terracotta/teal version for reference; treat the table immediately following this note as authoritative.

## 2. Color palette — current (Global Trust & Golden Hour)

Trust and authority from a deep indigo, warmth from a sand background, energy from a single sunset-gold accent reserved for calls to action.

| Token | Hex | Tailwind class(es) | Use |
|---|---|---|---|
| Deep Indigo | `#1A2942` | `bg-ink`, `bg-ink-900`, `text-ink-900`, `bg-indigo`, `text-indigo` | Primary/header color: nav wordmark, dark section backgrounds (notebook, footer), H2 color on light sections |
| Warm Sand | `#F7F5F0` | `bg-sand`, `bg-slate-50` | Page canvas — replaces the old stark-white sections (hero-adjacent sections, nav, pricing/carousel backgrounds) |
| Sunset Gold | `#F2A900` | `bg-terracotta`, `text-terracotta`, `bg-gold`, `text-gold` | CTA buttons and accents only — hero button, pricing button, italic hero accent, "Behind the Hub" eyebrow, progress-bar fill |
| Slate | `#334155` | `text-slate-600`, `text-slate-plain` | Primary body copy on light backgrounds |
| Pure white | `#FFFFFF` | `bg-white` | Reserved for elevated cards/surfaces that need to pop off the sand canvas (e.g. the "after launch" pricing card, icon tiles) — never used as the page's base background |

Class names carried over from the prior palette (`ink`, `terracotta`, `slate-50`, `slate-600`) keep their original semantic role (header/authority, CTA, soft section background, body text respectively) — only their color values changed, so no markup rewrite was needed to apply the new palette globally.

## 3. Typography — current

Three typefaces, all loaded from Google Fonts:

- **Major headlines (H1, H2): "Playfair Display"** (weights 600/700, italic available), applied via a new `.font-serif` utility. Reserved for the page's largest headline moments — the hero H1 and every section H2 — to give the page an editorial, premium feel. Not applied to H3s, card titles, numbers, or labels, which stay on the sans-serif display face below so small type stays crisp and legible.
- **Secondary display / numbers / card titles: "Montserrat"** (weights 500–700), via the existing `.font-display` utility — unchanged from the prior pass.
- **Body / UI: "Inter"** (weights 300–600), via `.font-sans` — unchanged from the prior pass.

## 2 (historical) / 3 (historical). Prior "warm travel" palette & type

Warm, sun-baked travel tones rather than the flash-sale red the site briefly considered. Terracotta is reserved for calls to action only; teal carries the brand identity (logo badge, headings, dark sections, hover states) so the CTA color keeps a single, unambiguous meaning.

| Token | Hex | Use |
|---|---|---|
| `--color-terracotta` | `#D9622B` | CTA buttons, links, small accent dots — action color only |
| `--color-terracotta-hover` | `#B84F20` | Hover/active state for terracotta elements |
| `--color-teal` | `#1F4B4A` | Logo badge, headings ("ink-900" role), dark section backgrounds, hover states |
| `--color-teal-card` | `#1B3E38` | Card fills inside dark teal sections |
| `--color-ink` | `#241A14` | Body copy on light backgrounds |
| `--color-paper` | `#FBF1E4` | Warm off-white page background (not stark white) |
| `--color-paper-dim` | `#F3E4CF` | Section background alternation, hover tints, card fills |
| `--color-line` | `#E8CDA8` | Hairline borders, dividers |
| `--color-gold` | `#E8A33D` | Sparing accent — gradient highlight text, small tags/badges (never a large field) |
| `--color-cream-text` | `#FBF1E4` | Text on dark/terracotta/photo surfaces |

Terracotta and teal do the heavy lifting; gold is used sparingly and never as a CTA color.

Two typefaces, both loaded from Google Fonts:

- **Display / headlines: "Montserrat"** (weights 600–900). A bold, geometric sans that's the de facto standard heading font across high-converting course/coaching landing pages (it's one of the most commonly reached-for headline fonts on Kajabi sites, alongside the platform's other built-in Google fonts). It's confident and punchy at large sizes and echoes the geometric feel of the logo's "HOW" far more directly than a decorative serif does. This replaced an earlier Fraunces (serif) pass, which read as too soft/editorial for a course sales page and was flagged as such.
- **Body / UI: "Work Sans"**. A clean, highly readable geometric sans used for body copy, labels, buttons, nav and form fields — pairs cleanly with Montserrat without competing for attention.

Scale — all headline and body sizes use CSS `clamp()` so type scales smoothly with viewport width instead of jumping at fixed breakpoints:

| Role | Clamp range | Weight | Notes |
|---|---|---|---|
| H1 (hero) | `clamp(34px, 6vw, 66px)` | 700 | Montserrat, tight leading |
| H2 (section) | `clamp(26px, 3.6vw, 40px)` | 700 | Montserrat |
| H3 (card/FAQ) | 18–19px | 700 | Work Sans |
| Body | `clamp(16px, 1.6vw, 18px)` | 400 | Work Sans, 1.6 line-height |
| Eyebrow/label | 13px | 600 | Work Sans, uppercase, letter-spacing 0.08em, red |
| Button | 16px | 600 | Work Sans, 52px min-height for comfortable tap targets |

Using `clamp()` instead of a couple of fixed media-query sizes means there's no jarring resize between the 900px and 720px breakpoints — type scales continuously from phone to ultra-wide desktop.

## 4. Layout & spatial composition

- Max content width: 1180px; fluid section padding via `clamp(56px, 9vw, 104px)`.
- **Hero is now full-bleed**: the house-exterior photo fills the entire viewport height (min 92vh) behind a dark ink-to-red gradient overlay, with left-aligned white/cream text on top. `object-position: center 78%` keeps the crop below the small logo watermark baked into the original photo, so it isn't duplicated against the header's own logo.
- **A floating stat bar** ("22 house sits · 23 years · 9 weeks · 4+ countries") sits on a paper-colored card that overlaps the bottom edge of the hero by 50% of its own height — a bridge element that surfaces credibility before the fold ends, rather than burying it lower on the page.
- **Sections now alternate four backgrounds**, not two: `--color-paper`, `--color-paper-dim`, `--color-teal` (dark, cream text — used once for the "problem" section and once for the closing band, bookending the page with the hero's dark tone), and `--color-terracotta` (used for the mid-page repeat CTA). This removes any long run of plain white and gives the page clear visual "stops."
- Framed photos (course intro, why-we-made-this) keep the slight rotation (±2°) and soft ink-colored drop shadow from the original polaroid treatment, alternating which side of the two-column grid they sit on so the page doesn't feel like it's repeating a template.
- The primary CTA button copy and destination (`#pricing`) repeats three times: hero, mid-page (if present), the pricing section, and the closing dark band — consistent with the "one focused action, repeated" pattern from the research.
- **Scarcity treatment**: the page uses honest, static copy rather than a live remaining-count ticker. The pricing badge reads "First 20 · $47" and the subcopy states the launch price is for the first 20 people who join, after which the course stays the same and the price goes to $67. No countdown timer, no fake ticker.

## 5. Imagery

Three photos are used as-is (already branded with the logo in the original Facebook creative). All three source files are square (1254×1254):

- `assets/images/house-exterior.jpg` — full-bleed hero background (object-fit: cover, cropped low to avoid the baked-in logo watermark) and the preloaded/`fetchpriority="high"` LCP image
- `assets/images/kitchen.jpg` — framed rotated photo in the "The course" section; also the OG/Twitter share image
- `assets/images/family-play.jpg` — framed rotated photo in "Why we made this"

Each photo appears exactly once, so "Who this is for" stays a clean, image-free centered list rather than reusing a photo a second time.

The logo is not the standalone `assets/images/logo-transparent.png` file — that asset isn't referenced anywhere in the shipped page. The actual mark is an inline SVG house-outline icon in a rounded square badge, paired with the "House Sit Hub" wordmark in Montserrat. It appears twice: in the header (`w-10 h-10` badge, teal fill, dark text) and in the footer (`w-8 h-8` badge, white/10 fill against the dark teal footer background), both using the identical house path so the mark stays consistent at any size.

## 6. Motion

Minimal and purposeful, CSS-only:

- One staggered fade/rise-in on page load for the hero eyebrow → headline → subhead → CTA (120ms stagger).
- Photo stack images ease into their rotated resting position on load (translateY + rotate).
- Section headers and cards fade/rise in on scroll via `IntersectionObserver`, staggered by ~80ms per sibling.
- Buttons: subtle scale (1.02) and shadow lift on hover, terracotta darkens to `--color-terracotta-hover`.
- No parallax, no auto-playing carousels, no scroll-jacking — the content and photography carry the page.

## 7. Components

- **Sticky header**: transparent over the hero with a white logo; crossfades to a solid paper background with the full-color logo once the user scrolls past the hero. A "Claim my spot — $47" button (or a "See what's inside" secondary) fades in at the same moment.
- **Primary button**: solid red, cream text, 8px radius, bold, 54px min-height. On red/dark sections it flips to a light (cream background, red text) variant for contrast, matching the "contrasting background and font colors" pattern from the research.
- **Stat bar**: a four-up (two-up on mobile) card that floats between the hero and the next section, used for credibility, not benefits.
- **Benefit cards ("What's inside")**: now real cards (background, border, soft shadow, numbered tag) in a responsive 3/2/1 column grid, replacing the flatter left-rule list so the section reads as distinct, scannable modules rather than one long list.
- **Repeat CTA band**: a short, full-bleed red section with its own heading and the same button copy, inserted mid-page so the offer is never more than one scroll away.
- **FAQ**: native `<details>/<summary>` accordion, no JS required, red plus/minus glyph rotates via CSS. Expand with conversion-focused questions (YouTube, who it's for/not for, refund policy) alongside the honest operational FAQs.
- **Pricing section**: the page's primary conversion block. A two-card layout — a dark, lifted "Limited launch price" card at $47 with strikethrough $67, the "pays for itself" value line, named founder-call bonus, and a labeled 30-day Ready-to-Apply guarantee beside the buy button; plus a softer "After launch" card at $67 for context. CTA: "Claim my spot — $47" → Stripe checkout session.
- **Scarcity progress bar** (added alongside the "X of 20 spots left" pill): a thin gold-fill `.progress-track`/`.progress-fill` bar plus a "`{spotsClaimed}` / 20 spots claimed" label inside the launch-price card. `spotsClaimed` is currently derived client-side from the same `SPOTS_LEFT` constant used elsewhere on the page (see the inline script's `renderScarcity()`); the constant and the `{spotsClaimed}` comment mark where a live Stripe-backed count should be substituted once that endpoint exists. Deliberately static/live-updating rather than an animated countdown, to keep the urgency honest rather than gimmicky.
- **"Meet the Family" section** (between "From Our Own Notebook" and the photo carousel): a two-column split — `assets/images/strydom-family.webp` (the same Netherlands bridge photo used in the carousel) on one side, family origin story on the other, with a "Behind the Hub" gold eyebrow, a serif indigo H2, and an italic serif "See you out there." sign-off. Stacks image-first on mobile.

## 8. Accessibility

- Body text contrast: ink (#241A14) on paper (#FBF1E4) exceeds WCAG AA at all sizes.
- Terracotta CTA text is cream (#FBF1E4) on terracotta (#D9622B), roughly 3.3:1, which passes AA for large/bold button text but would not pass for small body text — kept to buttons and short labels only.
- All interactive elements are real `<button>`/`<a>`/`<summary>` elements, keyboard-focusable with a visible focus ring (2px red offset outline).
- Images carry descriptive `alt` text; decorative rotation/shadow is CSS-only and doesn't affect reading order.
- Form fields have associated `<label>` elements, plus `autocomplete` and `inputmode` attributes so mobile keyboards and browser autofill work correctly (fewer taps to complete the form).
- **First focusable element**: a "Skip to pricing" link is the first focusable element for keyboard users, pointing at the `#pricing` section.
- All entrance animations respect `prefers-reduced-motion`; motion is skipped entirely and content simply appears for anyone who has that OS setting on.
- Buttons keep a 52px minimum height (44px+ is the standard comfortable touch target), so the primary CTA is easy to tap accurately on a phone.

## 10. Mobile & performance notes

- **Fixed: the footer logo was illegible on both desktop and mobile.** The wordmark is a square lockup with three stacked lines of text ("LEARN" / "HOW" / "To House Sit"). At the old 24px display height, three lines of text in a 24px-tall square reads as an indistinct smudge, not a logo, at any viewport width. It's now sized at `clamp(60px, 9vw, 80px)`, large enough to actually read. It stays a single-color white version (not the original red/black) because the logo's black text would nearly disappear against the near-black `--color-ink` footer background otherwise. The footer layout is now a single centered column (logo, then the copyright line) instead of a logo-left/text-right row, so the text is centered on every screen size, not just below 480px.
- **Fixed the actual mobile-breaking bug: buttons were forcing horizontal scroll.** The `.btn` class had `white-space: nowrap`, and the primary CTA label ("Claim my spot — $47 launch price") is long. On any phone-width screen, that text couldn't wrap, so it pushed the button wider than the viewport and forced the whole page to scroll sideways — the single most common "this isn't mobile friendly" symptom. Fixed by allowing button text to wrap below 560px (nowrap now only applies at ≥560px, where there's enough width for the longest label to fit on one line), giving buttons real padding instead of relying on line-height, and adding `overflow-x: hidden` on `html`/`body` as a safety net against any future overflow.
- **Fixed: the floating stat bar no longer breaks mobile layout.** The bar bridges the hero and the next section by floating on top of it (`transform: translateY(50%)`), which only works safely when its height is predictable. On phones the bar reflows from 4 columns to 2, roughly doubling its height, which was overlapping text below it. Below 760px the float is now disabled entirely (`transform: none`, normal margin) so the bar sits in normal document flow instead — no overlap risk, at the cost of losing the "floating card" effect on small screens (an intentional tradeoff, since it's a decorative bridge, not a functional element).
- The hero also no longer forces `min-height: 92vh` on phones (that could push most of the page below the fold before any content is visible, especially with a mobile browser's address bar taking up viewport height). Below 760px, hero height is content-driven with generous top/bottom padding instead.
- Fluid type (`clamp()`) and fluid spacing (`--section-pad`, `clamp()` gaps) mean the layout doesn't just "shrink" at breakpoints — it scales continuously, so there's no dead zone between phone and tablet widths.
- The hero photo stack, "why we made this" photo, and footer logo all carry native `width`/`height` attributes matching the source file (1254×1254) so the browser reserves the right space before the image loads, preventing layout shift (CLS).
- The hero's kitchen photo is preloaded (`<link rel="preload">`) and marked `fetchpriority="high"` since it's the largest above-the-fold visual and the most likely Largest Contentful Paint element; the other two photos are `loading="lazy"`.
- Single-file HTML/CSS/JS with only one external request (Google Fonts) keeps the page fast on mobile data.

## 9. SEO & sharing (implemented in `<head>`)

- Unique, descriptive `<title>` and meta `description` under 160 characters.
- Canonical link pointed at `https://www.housesithub.com/`.
- Open Graph tags (`og:title`, `og:description`, `og:image` — absolute URL to the branded kitchen photo, `og:url`, `og:type=website`, `og:site_name`, `og:locale`).
- Twitter Card tags (`summary_large_image`).
- `robots` meta set to index/follow.
- Favicon + apple-touch-icon generated from the wordmark.
- JSON-LD structured data (`Course` + `Organization`) describing the course and its provider for rich results.
- Semantic HTML: one `<h1>`, logical `<h2>`/`<h3>` hierarchy, `<main>`, `<header>`, `<footer>`, `<section>` landmarks.
