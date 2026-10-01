# Portfolio: Mohammad Talib Khan (5D edition)

Five static pages sharing one stylesheet and one script. No framework, no build step, no
libraries. Drop the files in the repo and GitHub Pages serves them.

The 5D edition keeps every word, link, number and screenshot from the previous version and
the same four colours. What changed is the way it looks and moves: depth, motion, light and
metal-style colour on top of the same content.

## Files

```
index.html                          home: profile, stats, entity sphere, marquee, featured work, toolkit
work.html                           selected work, filterable
skills.html                         nine capabilities with case studies
career.html                         timeline, education, certificates
contact.html                        contact details

assets/style.css                    all styles, shared by every page
assets/app.js                       all behaviour and motion, shared by every page
assets/fonts/                       the four typefaces, self-hosted, plus their licence
assets/profile.webp                 portrait
assets/og-image.jpg                 social share image
assets/mohammad-talib-khan-cv.pdf   CV download, replace with your own export any time
assets/work/                        screenshots for the work cards

llms.txt                            plain-text summary for AI answer engines
robots.txt                          crawl rules, AI crawlers allowed
sitemap.xml                         all five pages
```

## Deploy to GitHub Pages

1. Upload everything to the root of `github.com/workholicinsaan/portfolio`, keeping the
   `assets` folder (with `fonts` and `work` inside it) intact. Replace the old files.
2. Settings -> Pages -> Source: Deploy from a branch, branch `main`, folder `/ (root)`.
3. Live at `https://workholicinsaan.github.io/portfolio/` in about a minute. If the old look
   still shows, hard refresh once (Ctrl+Shift+R), the browser is holding the old CSS.

Moving to a custom domain later? Search for `workholicinsaan.github.io/portfolio` across the
five HTML files, `llms.txt`, `robots.txt` and `sitemap.xml` and replace it.

## Design

Colours are CSS variables at the top of `assets/style.css`, unchanged:

```
--ground  #1C1C1C   page
--brass   #BFA181   accent
--sand    #D4C5B0   secondary text
--chalk   #F4F4F4   primary text
```

Every other colour in the file is a tint or shade of those four. Light mode flips ground and
chalk and darkens the brass to `#8A6A44` for contrast, as before.

Type, all self-hosted in `assets/fonts` (no Google Fonts request, so pages load faster):

```
Syne               headings, the name, big numbers
Instrument Serif   the italic accent word in headings
Outfit             body text
JetBrains Mono     labels, tags, data
```

To put a word in the italic accent style, wrap it in a span inside the heading:

```html
<h2>What I actually <span class="it">do</span></h2>
```

## The 5D layer

- Frosted glass cards with a bevel tilt toward the cursor, and their inner parts (screenshot,
  title, number tiles) shift at different depths. A perspective grid floor sits at the
  bottom of the screen.
- Everything arrives in 3D as you scroll. Headings flip up word by word, your name letter by
  letter, and numbers count up. Two marquee bands cross on the home page and speed up when
  you scroll.
- The background is liquid brass drawn in WebGL. It keeps flowing slowly and carries on where
  it left off when you change page.
- Brass is treated as metal. Headings have a polish and a sheen that sweeps across them, the
  polish angle follows the cursor, card borders light up where the cursor is, and the footer
  name fills with brass under the cursor.
- A 3D particle field you fly through as you scroll, a cursor ring that labels what it is
  over (View, Read, Drag), magnetic buttons, a rotating MK / SEO / AEO / GEO cube as the
  logo, a sliding pill in the menu, a circular wipe when the theme changes, and a 3D fade
  between pages in Chrome, Edge and Safari 18+.

All of it applies itself by class name, so new cards pick it up with no extra markup.

### Turning things down

- Background brightness: `uK` and the `mix(uG,c,...)` line in the shader in `assets/app.js`
- Particle field: the `0.2` line alpha and `0.78` dot alpha in section 3b of `assets/app.js`
- Floor grid: `--grid` in `assets/style.css`, or delete the `.gridfx` line in the HTML
- Tilt strength: `2400` in `engage()` in `assets/app.js` (lower is calmer)
- Glass: `--glass` and `--panel` at the top of `assets/style.css`
- Custom cursor: delete `safe(initCursor);` at the bottom of `assets/app.js`
- Marquee words: the `data-t="..."` attributes in the `.bands` block in `index.html`
- Logo cube faces: the `data-t` values inside `.cube` in the nav of each page
- Big outlined word behind each page title: `data-word` on the `pagehead` section
- Footer name: `data-word` on the `.wordmark` div in each page

### Speed and accessibility

- The page never waits for the effects. Text is in the HTML, the effects load after it.
- A guard in `app.js` watches the first two seconds of frames. On a slow device it switches
  the glass to solid panels, lowers the background resolution and thins the particles. If it
  still struggles, WebGL stops and soft glows take its place.
- Loops pause when their block is off screen and when the tab is hidden.
- Visitors with reduced motion turned on get a still version: no tilt, no flying, no count-up.
- Phones get the menu as a dock at the bottom, lighter blur and a lower-resolution
  background. Tilt and the custom cursor are desktop only.
- Keyboard: skill cards and screenshots open with Enter or Space, Escape closes.

## The entity sphere

Home page only. 76 nodes on a sphere, hand-written perspective projection, signal pulses that
travel along the edges, drag to spin it. No library. Edit the `LABELS` array in section 4 of
`assets/app.js` to change the entity names. It pauses when scrolled out of view.

## Adding work (work.html)

Same as before. Find `<div class="grid3" id="workGrid">` and copy any
`<article class="work rv">` block. Tilt, light, 3D entry and count-up numbers apply on their
own.

```html
<article class="work rv" data-type="web">

  <!-- 1. screenshot: opens full size when clicked -->
  <figure class="w__shot"><img src="assets/work/site.webp" alt="Homepage" loading="lazy"></figure>

  <div class="w__top"><span class="w__kind">Web design</span><span class="w__year">2026</span></div>
  <h3 class="w__t">Project name</h3>
  <p class="w__c">Client - Industry</p>
  <p class="w__d">What you did, in two or three sentences.</p>

  <!-- 2. number tiles: up to three, they count up when they scroll into view -->
  <ul class="w__m">
    <li><b>+64%</b><span>conversions</span></li>
    <li><b>1.2s</b><span>LCP</span></li>
  </ul>

  <!-- 3. links out: as many as you need -->
  <div class="w__links">
    <a class="w__link" href="https://clientsite.com" target="_blank" rel="noopener">Visit the site &rarr;</a>
  </div>

</article>
```

`data-type` decides which filter button the card appears under. Use exactly one of:

```
web      Web design
aeo      AI search
seo      Technical SEO
content  Content
links    Backlinks
ads      Google Ads
speed    Page speed
blog     Writing
```

Templates for a website build, an Ads campaign and a backlink placement sit in an HTML
comment at the bottom of the grid. Copy one, delete the comment markers, fill it in. The
filter buttons count the cards themselves.

### Screenshots

Put files in `assets/work/`. Around 1200x750, webp, under 200KB each. Clicking a screenshot
opens it full size, so dashboard numbers stay readable. Blur client names and revenue before
publishing anything from a client account.

## Adding case studies (skills.html)

Each skill card holds its own write-ups, shown in a reader when the card is clicked. Find the
card by its heading (for example `<h3 class="skill__t">Technical SEO</h3>`) and add inside its
`<div class="cases">`:

```html
<article class="case">
  <h4>What you did</h4>
  <p class="case__m">Client or company - Year</p>
  <p>Two or three sentences in plain words.</p>
  <span class="case__r">The result, with a number if you have one</span>
</article>
```

Leave out `case__r` when there is no clean number, which is better than inventing one.

## Why the content sits in the HTML

Google renders JavaScript. Most AI crawlers do not. Everything on these pages is real HTML in
the source, so GPTBot, PerplexityBot and ClaudeBot read the same text a person does. The
count-ups and letter effects are drawn on a layer above the text, so a crawler never catches
a half-animated number. The marquee words are drawn by CSS from `data-t`, so the repeated
copies are not page text.

## Notes

- Dark and light themes, remembered in `localStorage`, defaults to your system setting, set
  before the first paint so there is no flash.
- The portrait is inlined as base64 in `index.html` so the home page needs no image request.
- Each page carries its own title, description, canonical URL and schema, plus a breadcrumb.
- Font licences (SIL Open Font License) are in `assets/fonts/LICENSE.txt`.
