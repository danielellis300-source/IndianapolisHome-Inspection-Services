/* ════════════════════════════════════════════════════════════
   Applies shared SEO markup to the hand-maintained top-level pages
   (index.html + every city page listed in site-config.js):
     - favicon / og:image / twitter:image tags in <head>
     - absolute (leading-slash) city links, so markup copied into a
       subfolder page can't resolve to /blog/carmel etc.
     - BreadcrumbList JSON-LD matching the visible breadcrumb (city pages)
     - "Helpful Guides" section before the final CTA (city pages), with
       titles/categories pulled from blog-data.js so they can't drift
   Safe to re-run: each step skips or refreshes in place.
   Run: node scripts/patch-hand-pages.js  (also run by generate.js)
   ════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const config = require('./site-config');
const articles = require('./blog-data');
const { renderIconTags, escapeHtml } = require('./template');

const ROOT = path.join(__dirname, '..');

// Evergreen posts featured on every city page: pricing guide, what an
// inspection covers, and a pre-inspection checklist.
const GUIDE_SLUGS = [
  'home-inspection-cost-indianapolis',
  'what-does-a-home-inspection-cover',
  'how-to-prepare-your-home-for-inspection'
];

const GUIDES_START = '<!-- helpful-guides:start -->';
const GUIDES_END = '<!-- helpful-guides:end -->';

const GUIDES_CSS = `    .guides-section { background: var(--light-bg); }
    .guides-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 22px; text-align: left; }
    .guide-card { display: flex; flex-direction: column; border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 26px 22px; background: #fff; transition: box-shadow .25s, transform .25s; }
    .guide-card:hover { box-shadow: 0 10px 36px rgba(0,0,0,.09); transform: translateY(-4px); }
    .guide-cat { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #718096; margin-bottom: 10px; }
    .guide-card h3 { font-size: 1.05rem; font-weight: 700; color: var(--dark); line-height: 1.4; margin-bottom: 14px; flex-grow: 1; }
    .guide-link { font-size: .88rem; font-weight: 700; color: var(--brand); }
`;

const citySlugs = config.cities.filter(c => c.file !== '/').map(c => c.file.slice(1));
const CITY_HREF_RE = new RegExp(`href="(${citySlugs.join('|')})(?:\\.html)?"`, 'g');

function decodeEntities(str) {
  return str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function renderGuides(cityName) {
  const bySlug = new Map(articles.map(a => [a.slug, a]));
  const cards = GUIDE_SLUGS.map(slug => {
    const a = bySlug.get(slug);
    if (!a) throw new Error(`Helpful Guides: blog slug not found in blog-data.js: ${slug}`);
    return `        <a href="/blog/${a.slug}" class="guide-card">
          <span class="guide-cat">${escapeHtml(a.category)}</span>
          <h3>${escapeHtml(a.title)}</h3>
          <span class="guide-link">Read the guide &rarr;</span>
        </a>`;
  }).join('\n');
  return `${GUIDES_START}
  <section class="section guides-section">
    <div class="container text-center">
      <h2 class="section-title">Helpful Guides</h2>
      <p class="section-sub">Straight answers for ${escapeHtml(cityName)} buyers and sellers before inspection day</p>
      <div class="guides-grid">
${cards}
      </div>
    </div>
  </section>
  ${GUIDES_END}`;
}

function renderBreadcrumbSchema(content, file) {
  const crumb = content.match(/<nav class="breadcrumb">[\s\S]*?<\/nav>/);
  const canonical = content.match(/<link rel="canonical" href="([^"]+)"/);
  if (!crumb || !canonical) return null;
  // Visible markup: <a href="/">Home</a><span>›</span>Current Page Label
  const label = decodeEntities(crumb[0].split('</span>').pop().replace(/<[^>]+>/g, '').trim());
  if (!label) throw new Error(`Breadcrumb label not found in ${file}`);
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${config.domain}/` },
      { "@type": "ListItem", "position": 2, "name": label, "item": canonical[1] }
    ]
  };
  return `  <script type="application/ld+json">
  ${JSON.stringify(schema, null, 2).replace(/\n/g, '\n  ')}
  </script>
`;
}

function patchFile(file, city) {
  const filePath = path.join(ROOT, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const hadCRLF = raw.includes('\r\n');
  let content = raw.replace(/\r\n/g, '\n');
  const log = [];

  if (!content.includes('rel="icon"')) {
    const before = content;
    content = content.replace(/(<meta property="og:description"[^>]*>\n)/, `$1${renderIconTags()}\n`);
    log.push(content === before ? 'WARNING icons not inserted' : 'icons');
  }

  const linkCount = (content.match(CITY_HREF_RE) || []).length;
  if (linkCount) {
    content = content.replace(CITY_HREF_RE, 'href="/$1"');
    log.push(`links(${linkCount})`);
  }

  if (city) {
    if (!content.includes('"BreadcrumbList"')) {
      const schema = renderBreadcrumbSchema(content, file);
      const before = content;
      if (schema) content = content.replace(/(\n)(\s*<style>)/, `$1${schema}$2`);
      log.push(content === before ? 'WARNING breadcrumb schema not inserted' : 'breadcrumb');
    }

    if (!content.includes('.guides-grid')) {
      const before = content;
      // Some city pages keep their CSS minified on one line, so </style>
      // is not always on its own line.
      content = content.replace(/\n?[ \t]*<\/style>/, `\n${GUIDES_CSS}  </style>`);
      log.push(content === before ? 'WARNING guides css not inserted' : 'css');
    }

    const guides = renderGuides(city.name);
    const existing = new RegExp(`${GUIDES_START}[\\s\\S]*?${GUIDES_END}`);
    if (existing.test(content)) {
      content = content.replace(existing, guides);
    } else {
      const before = content;
      content = content.replace(/(\n)(\s*)(<section class="cta-banner">)/, `$1$2${guides}\n\n$2$3`);
      log.push(content === before ? 'WARNING guides not inserted' : 'guides');
    }
  }

  if (hadCRLF) content = content.replace(/\n/g, '\r\n');
  log.filter(l => l.startsWith('WARNING')).forEach(w => console.log(`${w} in ${file}`));
  if (content !== raw) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`patched ${file}: ${log.join(', ') || 'guides refreshed'}`);
  }
}

function patchHandPages() {
  patchFile('index.html', null);
  config.cities
    .filter(c => c.file !== '/')
    .forEach(c => patchFile(`${c.file.slice(1)}.html`, c));
}

module.exports = { patchHandPages };

if (require.main === module) patchHandPages();
