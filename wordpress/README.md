# courses.housesithub.com brand layer

`edu-press-child/brand.css` restyles the LearnPress/EduPress/Elementor course site to match housesithub.com (Sky & Coral palette, Bricolage Grotesque + Instrument Sans, coral buttons, new wordmark).

Stack found on the live site: WordPress, EduPress theme + `edu-press-child`, LearnPress, Elementor with the Thim Elementor Kit (kit id 6922).

## Install (about 5 minutes)

1. **Back up or use staging first.**
2. WordPress admin > Appearance > Theme File Editor > choose **EduPress Child** > `style.css`.
   (Or edit `wp-content/themes/edu-press-child/style.css` over SFTP.)
3. Keep the `/* Theme Name: ... */` header comment at the very top.
4. Paste the whole contents of `brand.css` directly below it. The `@import` line must come right after the header comment.
5. Save, then hard-refresh. Check: home/courses, a course page, a lesson, login, checkout, mobile menu.
6. If your host or a plugin caches CSS (WP Rocket, LiteSpeed, Cloudflare), purge it. In Elementor: Tools > Regenerate CSS & Data.

## Roll back

Delete the pasted block from `style.css`. The Customizer settings and Elementor kit are untouched, so the old look returns immediately.

## How it works

EduPress takes its look from `--thim-*` CSS variables (Customizer) and Elementor from `--e-global-*` (kit). `brand.css` re-declares both sets with higher specificity (`html:root`, `body.elementor-kit-6922`), so no Customizer or kit edits are needed.

## Known limits

- **Hard-coded Elementor colours.** Sections built with their own colours in Elementor (hero blocks, banners) won't pick up the variables. Spot-check pages and fix those in the editor.
- **Logo.** The header and footer logo images are hidden and replaced by live text plus the coral paper plane. To use an image logo instead, delete the "Wordmark" block and upload one in Customizer > Site Identity.
- **Price display.** The course list shows $67 crossed out, $47.00 now. The main site advertises $10 for Black Friday via a Stripe promo code, so this page does not match during the sale. That is a LearnPress price setting, not CSS.
- Selectors target LearnPress 4.4 and EduPress 1.0.9 markup. After a major update, re-check the course card and lesson screens.
