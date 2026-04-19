window.__SEO_SCHEMA_FACTORY__ = function buildBaseSchema({ absoluteUrl, title, description, lang }) {
  const language = lang === "pt" ? "pt-BR" : "en";
  const locale = lang === "pt" ? "pt_BR" : "en_US";

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.casasdavilahomes.com/#organization",
      "name": "Casas da Vila Homes",
      "url": "https://www.casasdavilahomes.com/",
      "logo": "https://www.casasdavilahomes.com/assets/meta/og/og-home.jpg",
      "sameAs": [
        "https://www.instagram.com/casasdavila"
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${absoluteUrl}#webpage`,
      "url": absoluteUrl,
      "name": title,
      "description": description,
      "inLanguage": language,
      "isPartOf": {
        "@id": "https://www.casasdavilahomes.com/#organization"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://www.casasdavilahomes.com/#website",
      "url": "https://www.casasdavilahomes.com/",
      "name": "Casas da Vila Homes",
      "inLanguage": language
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${absoluteUrl}#breadcrumb`,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": lang === "pt" ? "Home" : "Home",
          "item": `https://www.casasdavilahomes.com/${lang}/`
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Thing",
      "name": title,
      "description": description,
      "url": absoluteUrl,
      "inLanguage": language
    }
  ];
};