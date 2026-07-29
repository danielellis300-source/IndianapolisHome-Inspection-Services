/* ════════════════════════════════════════════════════════════
   HTML rendering functions for the blog. Shared header/breadcrumb/
   footer markup mirrors the existing site's structure (see
   carmel.html) so blog pages match the design system exactly.
   ════════════════════════════════════════════════════════════ */

const config = require('./site-config');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function readTimeFor(article) {
  const text = (article.intro + article.sections.map(s => s.h2 + ' ' + s.html).join(' ')).replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function renderHead({ title, description, canonicalPath, ogTitle, ogDescription, extraSchema }) {
  const canonical = `${config.domain}${canonicalPath}`;
  return `<meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(ogDescription)}" />

  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="article" />
  <meta name="geo.region" content="US-IN" />
  <meta name="geo.placename" content="${config.addressLocality}" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/style.css" />
${extraSchema || ''}`;
}

function renderHeader() {
  return `  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="logo">Indianapolis<span>Home</span> Inspection Services</a>
      <div class="header-right">
        <div class="header-phone">Call us: <a href="tel:${config.phoneTel}">${config.phoneDisplay}</a></div>
        <a href="/#quote" class="btn btn-primary">Free Quote</a>
        <div class="menu-wrap">
          <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="menuDropdown">&#9776; Menu</button>
          <div class="menu-dropdown" id="menuDropdown" role="menu">
            <a href="/">Home</a>
            <a href="/#services">Services</a>
            <a href="/#areas">Service Areas</a>
            <a href="/#quote">Get a Quote</a>
            <a href="/blog/">Blog</a>
          </div>
        </div>
      </div>
    </div>
  </header>`;
}

function renderBreadcrumb(items) {
  // items: [{label, href?}] — last item has no href (current page)
  const inner = items.map((item, i) => {
    const sep = i === 0 ? '' : '<span>›</span>';
    const label = item.href ? `<a href="${item.href}">${escapeHtml(item.label)}</a>` : escapeHtml(item.label);
    return sep + label;
  }).join('');
  return `  <nav class="breadcrumb">
    <div class="container">
      ${inner}
    </div>
  </nav>`;
}

function renderFooter() {
  const cityLinks = config.cities.map(c => `<li><a href="${c.file}">${escapeHtml(c.name)}</a></li>`).join('\n            ');
  return `  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand">Indianapolis<span>Home</span> Inspection Services</div>
          <div class="footer-nap">
            <strong style="color:#ddd;">${escapeHtml(config.addressLocality)}, ${escapeHtml(config.addressRegion)}</strong><br>
            Phone: <a href="tel:${config.phoneTel}">${config.phoneDisplay}</a><br>
            Email: <a href="mailto:${config.email}">${config.email}</a><br>
            Serving Marion County &amp; surrounding areas
          </div>
        </div>
        <div class="footer-col">
          <h4>Services</h4>
          <ul class="footer-links">
            <li><a href="/#services">Full Home Inspection</a></li>
            <li><a href="/#services">Pre-Listing Inspection</a></li>
            <li><a href="/#services">New Construction Inspection</a></li>
            <li><a href="/#services">Radon Testing</a></li>
            <li><a href="/#services">Mold Inspection</a></li>
            <li><a href="/#services">Sewer Scope Inspection</a></li>
            <li><a href="/blog/">Blog</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Service Areas</h4>
          <ul class="footer-links">
            ${cityLinks}
          </ul>
        </div>
      </div>
      <div class="footer-bottom" style="color:#ddd;">
        &copy; 2025 Indianapolis Home Inspection Services. All rights reserved.
      </div>
    </div>
  </footer>`;
}

function renderMenuScript() {
  return `  <script>
    (function(){
      var btn = document.getElementById('menuBtn');
      var drop = document.getElementById('menuDropdown');
      if(!btn) return;
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var open = drop.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function(){
        drop.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    })();
  </script>`;
}

function renderCta() {
  return `      <div class="article-cta">
        <h3>Get a Free Inspection Quote</h3>
        <p>Serving ${escapeHtml(config.addressLocality)} and every surrounding suburb — call now or request a quote online.</p>
        <div class="cta-actions">
          <a href="tel:${config.phoneTel}" class="btn btn-primary">Call ${config.phoneDisplay}</a>
          <a href="/#quote" class="btn btn-outline">Request a Free Quote</a>
        </div>
      </div>`;
}

function renderRelatedPosts(article, articlesBySlug) {
  const cards = article.relatedSlugs
    .map(slug => articlesBySlug.get(slug))
    .filter(Boolean)
    .map(a => `<a href="/blog/${a.slug}" class="related-card">${escapeHtml(a.title)}</a>`)
    .join('\n        ');
  return `      <div class="related-posts">
        <h3>Related Articles</h3>
        <div class="related-grid">
          ${cards}
        </div>
      </div>`;
}

function renderArticleBody(article, articlesBySlug) {
  const midpoint = Math.ceil(article.sections.length / 2);
  const parts = [];
  article.sections.forEach((section, i) => {
    parts.push(`      <h2>${escapeHtml(section.h2)}</h2>\n      ${section.html}`);
    if (i === midpoint - 1) {
      parts.push(renderCta());
    }
  });
  return parts.join('\n\n');
}

function renderArticlePage(article, articlesBySlug) {
  const readTime = readTimeFor(article);
  const dateDisplay = formatDate(article.date);
  const canonicalPath = `/blog/${article.slug}`;

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.metaDescription,
    "image": config.logoUrl,
    "author": { "@type": "Organization", "name": config.businessName },
    "publisher": {
      "@type": "Organization",
      "name": config.businessName,
      "logo": { "@type": "ImageObject", "url": config.logoUrl }
    },
    "datePublished": article.date,
    "dateModified": article.date,
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${config.domain}${canonicalPath}` },
    "url": `${config.domain}${canonicalPath}`
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${config.domain}/` },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${config.domain}/blog/` },
      { "@type": "ListItem", "position": 3, "name": article.title, "item": `${config.domain}${canonicalPath}` }
    ]
  };

  const extraSchema = `  <script type="application/ld+json">
  ${JSON.stringify(blogPostingSchema, null, 2)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(breadcrumbSchema, null, 2)}
  </script>`;

  const head = renderHead({
    title: `${article.metaTitle} | ${config.businessName}`,
    description: article.metaDescription,
    canonicalPath,
    ogTitle: article.title,
    ogDescription: article.metaDescription,
    extraSchema
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>
<body>

${renderHeader()}

${renderBreadcrumb([
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog/' },
  { label: article.title }
])}

  <header class="article-header">
    <div class="container">
      <span class="article-cat">${escapeHtml(article.category)}</span>
      <h1>${escapeHtml(article.title)}</h1>
      <div class="article-meta">
        <span>${dateDisplay}</span>
        <span>·</span>
        <span>${readTime} min read</span>
      </div>
    </div>
  </header>

  <div class="article-wrap">
    <div class="container">
      <div class="article-body">
      ${article.intro}

${renderArticleBody(article, articlesBySlug)}

${renderRelatedPosts(article, articlesBySlug)}
      </div>
    </div>
  </div>

${renderFooter()}

${renderMenuScript()}

</body>
</html>
`;
}

function renderBlogIndexPage(articles) {
  const sorted = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));
  const cards = sorted.map(a => {
    const readTime = readTimeFor(a);
    return `        <a href="/blog/${a.slug}" class="blog-card">
          <span class="blog-card-cat">${escapeHtml(a.category)}</span>
          <h2>${escapeHtml(a.title)}</h2>
          <p>${escapeHtml(a.metaDescription)}</p>
          <div class="blog-card-meta">
            <span>${formatDate(a.date)}</span>
            <span>·</span>
            <span>${readTime} min read</span>
          </div>
        </a>`;
  }).join('\n');

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${config.domain}/` },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${config.domain}/blog/` }
    ]
  };
  const extraSchema = `  <script type="application/ld+json">
  ${JSON.stringify(breadcrumbSchema, null, 2)}
  </script>`;

  const head = renderHead({
    title: `Home Inspection Blog | Tips, Pricing &amp; Guides | ${config.businessName}`,
    description: `Pricing guides, seasonal maintenance checklists, and expert home inspection advice for Indianapolis, Carmel, Fishers, and the surrounding suburbs.`,
    canonicalPath: '/blog/',
    ogTitle: `Home Inspection Blog | ${config.businessName}`,
    ogDescription: `Pricing guides, maintenance checklists, and expert inspection advice for the Indianapolis metro.`,
    extraSchema
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>
<body>

${renderHeader()}

${renderBreadcrumb([
  { label: 'Home', href: '/' },
  { label: 'Blog' }
])}

  <section class="blog-hero">
    <div class="container">
      <h1>Home Inspection Tips &amp; Guides</h1>
      <p>Pricing breakdowns, Indiana-specific regulations, seasonal maintenance checklists, and honest advice from ${escapeHtml(config.businessName)} — serving ${escapeHtml(config.addressLocality)} and every surrounding suburb.</p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="blog-grid">
${cards}
      </div>
    </div>
  </section>

${renderFooter()}

${renderMenuScript()}

</body>
</html>
`;
}

module.exports = { renderArticlePage, renderBlogIndexPage, readTimeFor, formatDate };
