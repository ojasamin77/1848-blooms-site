# 1848 Blooms & Designs website

Static, dependency-free site (HTML, CSS, vanilla JS). Open `index.html` in a browser, or deploy the folder to any static host (GitHub Pages, Netlify, Cloudflare Pages).

## Before launch
- Replace the yellow-highlighted `[placeholder]` copy (designer name and story, prices, contact details, FAQ answers).
- Connect the forms: set `FORM_ENDPOINT` at the top of `assets/site.js` to a form service URL (for example Formspree). Until then the forms run in preview mode and send nothing.
- Update the social links in the header and footer.

## Regenerating pages
Pages are generated from `build.py` in the working copy; edit the HTML directly if you no longer use it.
