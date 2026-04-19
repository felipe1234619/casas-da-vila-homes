(function () {
  const SITE_URL = "https://www.casasdavilahomes.com";

  function getLang() {
    return document.documentElement.lang?.toLowerCase().startsWith("pt") ? "pt" : "en";
  }

  function ensureMeta(attrName, attrValue) {
    let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    return el;
  }

  function ensureLink(rel, extraSelector = "") {
    let el = document.head.querySelector(`link[rel="${rel}"]${extraSelector}`);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    return el;
  }

  function upsertMetaByName(name, content) {
    const el = ensureMeta("name", name);
    el.setAttribute("content", content);
  }

  function upsertMetaByProperty(property, content) {
    const el = ensureMeta("property", property);
    el.setAttribute("content", content);
  }

  function setCanonical(url) {
    const el = ensureLink("canonical");
    el.setAttribute("href", url);
  }

  function setAlternate(hreflang, href) {
    let el = document.head.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "alternate");
      el.setAttribute("hreflang", hreflang);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  }

  function injectSchema(schemaArray) {
    document.querySelectorAll('script[data-seo-schema="true"]').forEach((node) => node.remove());

    schemaArray.forEach((item) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoSchema = "true";
      script.textContent = JSON.stringify(item);
      document.head.appendChild(script);
    });
  }

  function resolveSiblingPath(pageKey, currentLang) {
    const map = window.__SEO_MAP__;
    const ptEntry = map.pt[pageKey];
    const enEntry = map.en[pageKey];

    return {
      pt: ptEntry ? `${SITE_URL}${ptEntry.path}` : `${SITE_URL}/pt/`,
      en: enEntry ? `${SITE_URL}${enEntry.path}` : `${SITE_URL}/en/`
    };
  }

  function applySEO() {
    const lang = getLang();
    const pageKey = document.documentElement.dataset.seoPage;
    const map = window.__SEO_MAP__;

    if (!pageKey || !map?.[lang]?.[pageKey]) return;

    const config = map[lang][pageKey];
    const absoluteUrl = `${SITE_URL}${config.path}`;
    const siblings = resolveSiblingPath(pageKey, lang);
    const locale = lang === "pt" ? "pt_BR" : "en_US";

    document.title = config.title;

    upsertMetaByName("description", config.description);
    upsertMetaByName("robots", "index, follow, max-image-preview:large");
    upsertMetaByName("author", "Casas da Vila Homes");

    setCanonical(absoluteUrl);
    setAlternate("pt-BR", siblings.pt);
    setAlternate("en", siblings.en);
    setAlternate("x-default", siblings.en);

    upsertMetaByProperty("og:type", config.type || "website");
    upsertMetaByProperty("og:site_name", "Casas da Vila Homes");
    upsertMetaByProperty("og:locale", locale);
    upsertMetaByProperty("og:title", config.title);
    upsertMetaByProperty("og:description", config.description);
    upsertMetaByProperty("og:url", absoluteUrl);
    upsertMetaByProperty("og:image", `${SITE_URL}${config.ogImage}`);
    upsertMetaByProperty("og:image:alt", config.title);

    upsertMetaByName("twitter:card", "summary_large_image");
    upsertMetaByName("twitter:title", config.title);
    upsertMetaByName("twitter:description", config.description);
    upsertMetaByName("twitter:image", `${SITE_URL}${config.ogImage}`);

    if (window.__SEO_SCHEMA_FACTORY__) {
      const schema = window.__SEO_SCHEMA_FACTORY__({
        absoluteUrl,
        title: config.title,
        description: config.description,
        lang
      });
      injectSchema(schema);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applySEO);
  } else {
    applySEO();
  }
})();