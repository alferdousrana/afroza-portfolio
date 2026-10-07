# Afroza Riju — Portfolio · v2.0.0

Portfolio for **Afroza Riju**, Product Designer (UI/UX) and UX & HCI Researcher.
Static HTML, CSS and vanilla JavaScript (ES modules), with Firebase as the content backend and a built-in admin ("Studio").
It needs no build step, so it runs on GitHub Pages, Vercel or any static host.

---

## What's new in v2.0.0

| Area | What changed |
|---|---|
| **Gallery** | New section with mixed tile sizes (normal, wide, tall, large), category filters, scroll parallax and a lightbox (grows out of the tile; swipe sideways to browse, swipe down to close; arrow keys and Esc work). Managed in **Studio → Gallery**, including **Upload many images**. |
| **Let's talk button** | Looping animation: a light travels round the border, the availability dot pulses and the label rolls over. Label, link and animation style (Live, Ring, Pulse, Shine, Roll, None) are in **Studio → Colours & fonts**. |
| **Colours & fonts** | Six palettes or your own colours: background, text, accent and button colour for each theme. All other shades are derived automatically and text is kept at 4.5:1 contrast or better. 12 font pairs or any Google Font, plus heading and body text size sliders. Studio previews changes live before you save. |
| **Everything editable** | Section order and visibility, top menu, mobile tab labels, every section heading and intro, About facts, contact form topics and button, loader steps and hero canvas text. |
| **Live sections** | A moving ticker that speeds up as you scroll, and a **Right now** panel with a ticking local clock, a day line, a typewriter of current work, and counters that count up (they can count projects, companies, milestones and years automatically). |
| **Mobile motion** | Eased, interruptible smooth scrolling for every in-page link. Sections rise and settle as they scroll in and recede as they leave. The top bar and tab bar tuck away while you read down and return when you scroll up. Android tab taps give a small haptic tick. Everything is off for reduced motion. |
| **Content** | Education no longer shows a CGPA; it reads "Graduate". |

### Upgrading a live v1 site to v2
1. **Deploy the new rules** (they add `pageContent` and `gallery`):
   ```bash
   firebase deploy --only firestore:rules
   ```
   or paste `firestore.rules` into Firestore → Rules → Publish. Storage rules are unchanged.
2. Push the code (GitHub Pages / Vercel). The service worker is now `ar-v2.0.0`, so returning visitors get "A new version is ready".
3. Open **Studio → Overview** and select **Add v2 content**. This creates the editable page content and the starter gallery. It never overwrites projects, settings or messages, and it is safe to run more than once.
4. Replace the starter gallery (it uses your Behance covers and portrait) with your own photos in **Studio → Gallery**.

If step 1 is skipped the site still works: v2 content falls back to the defaults in `js/seed-data.js`. Saving v2 pages in Studio needs the new rules.

### New Studio pages
- **Portfolio → Gallery:** images, captions, categories, tile size, show or hide, drag to reorder.
- **Design → Colours & fonts:** palette, 8 colours, fonts, text size, Let's talk button.
- **Design → Sections & menu:** section order and visibility, menu links, tab bar labels.
- **Page → About & facts / Live & ticker / Section headings / Contact form / Loader & canvas:** every remaining piece of text.

### New files
`css/v2.css` (styles for all of the above) · `js/palette.js` (colour engine) · `js/live.js` (button, ticker, Right now) · `js/gallery.js` · `js/motion.js` (smooth scroll + mobile motion). `js/fonts.js` was extended.

### New Firestore data
| Collection / doc | Contents |
|---|---|
| `pageContent/main` | sections[{id, visible}], nav[{label, target}], tab labels, every heading/intro, facts[{label, value}], live panel fields, stats[{value, suffix, label}], marquee rows and speed, contact topics, loader steps, hero canvas text |
| `gallery/{id}` | image{url, path, alt}, title, caption, category, year, size, link, published, order |
| `siteSettings/main` (new fields) | palettePreset, darkBg/Ink/Accent/Warm, lightBg/Ink/Accent/Warm, fontPair, customDisplayFont, customBodyFont, customDisplayWeight, typeScale, bodyScale, ctaLabel, ctaHref, ctaStyle |

---

## 1. Quick start (no Firebase needed)

```bash
cd afroza-portfolio
python3 -m http.server 8080      # or: npx serve .
# open http://localhost:8080
```

Until Firebase is configured, the site runs on the default content in `js/seed-data.js`. The contact form opens the visitor's email app instead of storing the message.

> ES modules don't load from `file://`, so always use a local server.

---

## 2. Design system

| Token | Dark | Light | Role |
|---|---|---|---|
| `--c-bg` | `#14121f` | `#fbf6f2` | Canvas |
| `--c-ink` | `#f4eef0` | `#26224f` | Primary text |
| `--c-ink-2` | `#b3acc4` | `#5e5a7a` | Secondary text |
| `--c-accent` | `#a99bf0` | `#4a3f9f` | **Selection** (focus, active, links) |
| `--c-warm` | `#f09a7f` | `#e2775b` | Coral: call-to-action buttons, ✦ sparkles |

- **Type:** seven font pairs in `js/fonts.js` (Geist by default), chosen in Studio → Settings → Typography. Preview any pair without saving with `?font=editorial`, `?font=cormorant`, `?font=dmserif`, `?font=fraunces`, `?font=jakarta` or `?font=manrope`.
- **Themes:** dark (default) and light, defined in `css/tokens.css`. First visit follows the system setting; the sun/moon toggle saves the visitor's choice (`js/theme.js`). The Huawei section always stays dark. Custom accent colours are adjusted per theme to keep 4.5:1 contrast.
- **Motif:** a selection outline with four corner handles, as in a design tool. It marks hover, active and keyboard focus everywhere (`.sel` in `css/style.css`).
- **Tokens:** every color, size, space, radius, shadow, duration, easing and z-index is defined in `css/tokens.css`.
- **Motion rule:** each animation must communicate hierarchy, feedback, orientation or progress. All motion uses transform, opacity or clip-path, and `prefers-reduced-motion` removes movement, the loader and the custom cursor.

---

## 3. Project structure

```
/
├── index.html              Home page (all sections)
├── case-study.html         Case-study template: case-study.html?p=<slug>
├── 404.html / offline.html Fallback pages
├── manifest.json           PWA manifest
├── service-worker.js       Offline shell + caching
├── css/
│   ├── tokens.css          Design tokens
│   ├── style.css           Components and sections
│   ├── animations.css      Reveal system, keyframes, reduced motion
│   ├── responsive.css      360 → 1920 breakpoints, mobile app mode
│   └── case-study.css
├── js/
│   ├── config.js           ← paste your Firebase web config here
│   ├── firebase.js         Lazy SDK loader (only downloads when needed)
│   ├── content.js          Data layer: Firestore → cache → defaults
│   ├── seed-data.js        Default content (real information only)
│   ├── app.js              Boot, loader, nav, inspect mode, form, PWA
│   ├── hero.js             Live canvas: draggable frames, connectors
│   ├── projects.js         Sticky work story, filters, page transition
│   ├── sections.js         Capabilities, process, moment, experience, flow, milestones
│   ├── animations.js       Scroll scheduler, reveals, split text, magnetic
│   ├── cursor.js           Custom cursor states
│   ├── case-study.js / case-sections.js
│   └── utils.js            Escaping, sanitizer, helpers
├── admin/                  Studio dashboard (index.html, admin.css, admin.js)
├── assets/                 Icons, og-image.png
├── firestore.rules / storage.rules / firebase.json
├── vercel.json / robots.txt / sitemap.xml / .nojekyll
```

---

## 4. Firebase setup

1. **Create a project** at [console.firebase.google.com](https://console.firebase.google.com).
2. **Add a Web app** (Project settings → Your apps → `</>`). Copy the config object into `js/config.js`.
   These values are public identifiers, not secrets. Security comes from the rules. **Never** put an Admin SDK service-account key in this repo.
3. **Authentication** → Sign-in method → enable **Email/Password**. Then Users → **Add user** with your email and a strong password.
4. **Firestore Database** → Create database (production mode).
5. **Storage** → Get started.
6. **Deploy the rules.** Either paste `firestore.rules` and `storage.rules` into their Rules tabs in the console, or use the CLI:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add            # pick your project
   firebase deploy --only firestore:rules,storage
   ```
   The Storage rules check Firestore to confirm admin status. The first time, Firebase asks you to allow Storage to read Firestore, so accept it.
7. **Make yourself an admin.** Open `/admin/` and sign in. It will show "This account isn't an admin" with your **User ID** and a copy button.
   In Firestore, create collection `admins` → document ID = that UID → add any field (e.g. `role: "owner"`).
8. **Authorize your domains**: Authentication → Settings → Authorized domains → add `<you>.github.io` and your Vercel domain.
9. Reload `/admin/` → **Overview → Import default content**. This copies the current portfolio content into Firestore so you can edit it.

### Firestore data model

| Collection / doc | Contents |
|---|---|
| `siteSettings/main` | name, role, email, location, resumeUrl, SEO title/description, favicon, page copy, accentColor, showGrain, showLoader |
| `heroContent/main` | eyebrow, headline, roles[], CTA labels/link, noteText, profileImage |
| `featured/huawei` | published, label, mega, title, description, reelUrl, posterTitle, thumbnail |
| `projects/{id}` | title, slug, category, tags[], shortDescription, role, tools[], year, industry, problem, solution, outcome, behanceUrl, coverImage, gallery[], caseStudy{section:{body, images[], link}}, hue, featured, published, order |
| `experience/{id}` | company, role, period, start (YYYY-MM), end, summary, responsibilities[], order |
| `achievements/{id}` | title, org, year, type, description, url, highlight, order |
| `skills/{id}` | category, description, items[], order |
| `socialLinks/{id}` | label, url, icon, order |
| `processSteps/{id}` | title, summary, activities[], deliverables[], methods[], mindset, order |
| `techFlow/{id}` | label, icon, designer, what, cse, order |
| `contactMessages/{id}` | name, email, projectType, message, read, createdAt |
| `admins/{uid}` | exists → that user is an admin (create by hand only) |

Images are stored in Storage under `uploads/<collection>/<docId>/`, and each image is saved as `{ url, path, alt }`.

### Security summary
- The public can read published projects and site content, and nothing else.
- Anyone can **create** a contact message, but only one that matches the expected shape: field allow-list, length limits, email pattern, `read == false`, and a server timestamp. Only admins can read, update or delete messages.
- Every write requires an `admins/{uid}` document, which the client can never create.
- Storage only accepts images under 15 MB, uploaded by admins.
- The contact form also has a honeypot field to filter out simple bots.

---

## 5. Using Studio (admin)

Go to `/admin/` and sign in.

- **Projects:** add, edit or delete projects, and drag (or focus the handle and use ↑/↓) to reorder. Inline toggles control Published and Featured, and you can search and filter by Published, Drafts or Featured.
- **Project editor:** the slug fills in automatically from the title. It also has filter tags; tools; Behance URL; and problem, solution and outcome fields. You can upload a cover image and a gallery (drag to reorder, add alt text and captions, use any image as the cover). The fourteen case-study sections each take rich text, images and an optional link, and sections left empty are hidden on the site.
- **Experience, Achievements, Skills, Process, Design & tech, Social links:** the same list-and-edit pattern.
- **Hero, Featured moment, Settings:** single forms. Settings controls SEO, favicon, the accent color (previewed live), the grain texture and the loader.
- **Messages:** unread badge, search, read/unread filter, reply by email, delete.
- **Safeguards:** unsaved-change warnings, confirmation before deleting, and toasts after every action. Uploaded images are resized to WebP in the browser, and files you remove are deleted from Storage only after you save.

> **Content rule:** only add real outcomes, metrics and credits. The site hides empty fields, so leaving one blank never breaks the layout.

---

## 6. Deploy

### Phase 1 — GitHub Pages
1. Push the folder contents to a repo (the files go at the repo root).
2. In the repo, go to Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`.
3. The site will be at `https://<user>.github.io/<repo>/`. All paths are relative, so the subpath works. `404.html` detects the repo subpath, and `.nojekyll` stops Jekyll from processing the files.
4. Add `<user>.github.io` to the Firebase authorized domains.

### Phase 2 — Vercel (production)
1. Import the repo at [vercel.com/new](https://vercel.com/new). Framework preset: **Other**. Leave the build command empty and use the root as the output directory.
2. `vercel.json` already sets the service-worker cache headers, security headers and `noindex` for `/admin/`.
3. Add a custom domain if you want one, then update:
   - `canonical`, `og:url`, `og:image` and `twitter:image` in `index.html`
   - the URLs in `robots.txt` and `sitemap.xml`
   - the Firebase authorized domains

### After each deploy
Bump `VERSION` in `service-worker.js` whenever cached files change. Returning visitors then see "A new version is ready. Reload to update."

---

## 7. PWA
- **Installable:** the manifest has standalone display, 192 and 512 icons, a maskable icon, and theme/background colors.
- **Offline:** the service worker precaches the app shell. Pages load network-first, with the cached copy and then `offline.html` as fallbacks.
- **Never cached:** Firebase, Facebook, Behance and `/admin/`. Google Fonts are cached after the first load.
- **Content offline:** the last good Firestore content is kept in `localStorage`, so returning visitors still see content offline.

---

## 8. Accessibility checklist
- Semantic landmarks, a skip link, one `h1` per page, and a logical heading order.
- All selectable groups (capabilities, process, experience, design & tech) follow the WAI-ARIA **tabs** pattern: arrows, Home and End all work.
- Hero frames are focusable and can be moved with the arrow keys (Shift for bigger steps).
- Visible focus everywhere, using the selection-blue outline.
- Contrast: body text 15.6:1, secondary text 7.4:1, accent 6.4:1.
- Split headlines keep the real text for screen readers, while the animated pieces are `aria-hidden`.
- Form errors are linked with `aria-describedby` and announced with `role="alert"`, and status updates use `aria-live`.
- `prefers-reduced-motion` turns off the loader, the custom cursor, parallax, the collaborator cursor and the scroll animations.
- On touch devices: native cursor, no hover-only content, and touch targets of at least 44px.

---

## 9. QA performed
Tested in headless Chromium at 1440×900 and 390×844 (mobile/touch):

| Check | Result |
|---|---|
| JavaScript errors | None |
| Horizontal overflow (desktop/mobile) | 0px |
| Process tabs, arrow keys | ✓ |
| Hero frame keyboard move | ✓ (Shift+← moves 40px) |
| Contact validation messages | ✓ |
| Project filters | ✓ |
| Inspect mode | ✓ |
| Case study render + next project | ✓ |
| Unknown project slug → friendly page | ✓ |
| Admin without Firebase → setup guide | ✓ |
| Reduced motion: no loader, native cursor, content visible | ✓ |
| Broken/blocked cover images → generated cover | ✓ |

Not testable in this environment, so verify after connecting Firebase:
- [ ] Admin login and CRUD
- [ ] Image uploads
- [ ] Contact form writes to Firestore
- [ ] PWA install on a real phone (HTTPS required)
- [ ] Lighthouse score on the deployed URL

---

## 10. Content notes
- Behance project links and cover images come from https://www.behance.net/afrozariju.
  AeroAssist is labelled a team project because Behance lists multiple owners.
- Roles, tools, years and outcomes for each project are intentionally left empty. Fill them in from Studio.
- The Huawei reel opens the original Facebook URL, because Facebook embeds are unreliable. Upload a 9:16 still in **Featured moment → Thumbnail** to replace the designed poster.
- Add your résumé link in **Settings → Résumé URL**. It then appears in the footer.
