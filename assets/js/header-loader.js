async function injectFragment(selector, path, callback) {
  const mount = document.querySelector(selector);
  if (!mount) return;

  try {
    const response = await fetch(path);
    const html = await response.text();
    mount.innerHTML = html;
    if (callback) callback();
  } catch (error) {
    console.error(`Failed to load fragment: ${path}`, error);
  }
}

function getLangFromPath() {
  return window.location.pathname.startsWith('/en') ? 'en' : 'pt';
}

function stripIndex(pathname) {
  return pathname.replace(/index\.html$/, '');
}

function normalizePath(path) {
  if (!path) return '/';
  let normalized = stripIndex(path);
  if (!normalized.endsWith('/')) normalized += '/';
  return normalized;
}

function getLocalizedPath(key, lang) {
  const map = {
    pt: {
      // navegação principal
      home: '/pt/',
      project: '/pt/projeto/',
      houses: '/pt/casas/',
      shared: '/pt/social/',
      operations: '/pt/rental-pool/',
      location: '/pt/localizacao/',
      investment: '/pt/investimento/',
      contact: '/pt/contato/',

      // ações
      cta: '/pt/contato/',
      brand: '/pt/',

      // footer / links auxiliares
      presentation: '/pt/contato/',
      request_presentation: '/pt/contato/',
      discover_houses: '/pt/casas/',
      view_houses: '/pt/casas/',
      view_shared: '/pt/social/',
      view_operations: '/pt/rental-pool/',

      // casas individuais
      breeze: '/pt/casas/brisa-suave.html',
      sky: '/pt/casas/ceu.html',
      serenity: '/pt/casas/serenidade.html'
    },

    en: {
      // navigation
      home: '/en/',
      project: '/en/project/',
      houses: '/en/houses/',
      shared: '/en/social/',
      operations: '/en/rental-pool/',
      location: '/en/location/',
      investment: '/en/investment/',
      contact: '/en/contact/',

      // actions
      cta: '/en/contact/',
      brand: '/en/',

      // footer / helper links
      presentation: '/en/contact/',
      request_presentation: '/en/contact/',
      discover_houses: '/en/houses/',
      view_houses: '/en/houses/',
      view_shared: '/en/social/',
      view_operations: '/en/rental-pool/',

      // individual houses
      breeze: '/en/houses/breeze.html',
      sky: '/en/houses/sky.html',
      serenity: '/en/houses/serenity.html'
    }
  };

  return map[lang]?.[key] || (lang === 'en' ? '/en/' : '/pt/');
}

function applyLocalizedPaths(root = document) {
  const lang = getLangFromPath();

  root.querySelectorAll('[data-localized-path]').forEach((node) => {
    const key = node.getAttribute('data-localized-path');
    const href = getLocalizedPath(key, lang);

    if (href) {
      node.setAttribute('href', href);
    }
  });
}

function buildTranslatedPath(currentPath, targetLang) {
  const path = normalizePath(currentPath);

  const routeMap = {
    pt: {
      home: '/pt/',
      project: '/pt/projeto/',
      houses: '/pt/casas/',
      shared: '/pt/social/',
      operations: '/pt/rental-pool/',
      location: '/pt/localizacao/',
      investment: '/pt/investimento/',
      contact: '/pt/contato/',

      breeze: '/pt/casas/brisa-suave.html',
      sky: '/pt/casas/ceu.html',
      serenity: '/pt/casas/serenidade.html'
    },

    en: {
      home: '/en/',
      project: '/en/project/',
      houses: '/en/houses/',
      shared: '/en/social/',
      operations: '/en/rental-pool/',
      location: '/en/location/',
      investment: '/en/investment/',
      contact: '/en/contact/',

      breeze: '/en/houses/breeze.html',
      sky: '/en/houses/sky.html',
      serenity: '/en/houses/serenity.html'
    }
  };

  const reverseMap = {
    // home
    '/pt': 'home',
    '/pt/': 'home',
    '/en': 'home',
    '/en/': 'home',

    // main sections
    '/pt/projeto': 'project',
    '/pt/projeto/': 'project',
    '/en/project': 'project',
    '/en/project/': 'project',

    '/pt/casas': 'houses',
    '/pt/casas/': 'houses',
    '/en/houses': 'houses',
    '/en/houses/': 'houses',

    '/pt/social': 'shared',
    '/pt/social/': 'shared',
    '/en/social': 'shared',
    '/en/social/': 'shared',

    '/pt/rental-pool': 'operations',
    '/pt/rental-pool/': 'operations',
    '/en/rental-pool': 'operations',
    '/en/rental-pool/': 'operations',

    '/pt/localizacao': 'location',
    '/pt/localizacao/': 'location',
    '/en/location': 'location',
    '/en/location/': 'location',

    '/pt/investimento': 'investment',
    '/pt/investimento/': 'investment',
    '/en/investment': 'investment',
    '/en/investment/': 'investment',

    '/pt/contato': 'contact',
    '/pt/contato/': 'contact',
    '/en/contact': 'contact',
    '/en/contact/': 'contact',

    // house pages
    '/pt/casas/brisa-suave.html': 'breeze',
    '/en/houses/breeze.html': 'breeze',

    '/pt/casas/ceu.html': 'sky',
    '/en/houses/sky.html': 'sky',

    '/pt/casas/serenidade.html': 'serenity',
    '/en/houses/serenity.html': 'serenity'
  };

  const exactKey = reverseMap[path];
  if (exactKey && routeMap[targetLang][exactKey]) {
    return routeMap[targetLang][exactKey];
  }

  const prefixChecks = [
    { key: 'project', pt: '/pt/projeto/', en: '/en/project/' },
    { key: 'houses', pt: '/pt/casas/', en: '/en/houses/' },
    { key: 'shared', pt: '/pt/social/', en: '/en/social/' },
    { key: 'operations', pt: '/pt/rental-pool/', en: '/en/rental-pool/' },
    { key: 'location', pt: '/pt/localizacao/', en: '/en/location/' },
    { key: 'investment', pt: '/pt/investimento/', en: '/en/investment/' },
    { key: 'contact', pt: '/pt/contato/', en: '/en/contact/' }
  ];

  for (const item of prefixChecks) {
    if (path.startsWith(item.pt) || path.startsWith(item.en)) {
      return routeMap[targetLang][item.key];
    }
  }

  return targetLang === 'en' ? '/en/' : '/pt/';
}

function setupHeaderI18n() {
  const lang = getLangFromPath();

  const dictionary = {
    pt: {
      home: 'Home',
      project: 'O Projeto',
      houses: 'As Casas',
      shared: 'Vida em Comum',
      operations: 'Operação',
      location: 'Localização',
      investment: 'Investimento',
      contact: 'Contato',
      request_presentation: 'Solicitar apresentação'
    },

    en: {
      home: 'Home',
      project: 'The Project',
      houses: 'The Houses',
      shared: 'Shared Living',
      operations: 'Operations',
      location: 'Location',
      investment: 'Investment',
      contact: 'Contact',
      request_presentation: 'Request Presentation'
    }
  };

  document.querySelectorAll('[data-key]').forEach((node) => {
    const key = node.getAttribute('data-key');
    if (dictionary[lang][key]) {
      node.textContent = dictionary[lang][key];
    }
  });

  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const key = link.getAttribute('data-nav-link');

    if (dictionary[lang][key]) {
      link.textContent = dictionary[lang][key];
    }

    link.setAttribute('href', getLocalizedPath(key, lang));
  });

  const brandLink = document.querySelector('[data-brand-link]');
  if (brandLink) {
    brandLink.setAttribute('href', getLocalizedPath('brand', lang));
  }

  const ctaLink = document.querySelector('[data-cta-link]');
  if (ctaLink) {
    ctaLink.setAttribute('href', getLocalizedPath('cta', lang));
  }

  applyLocalizedPaths(document);

  document.querySelectorAll('[data-lang-link]').forEach((link) => {
    const targetLang = link.getAttribute('data-lang-link');
    link.setAttribute('href', buildTranslatedPath(window.location.pathname, targetLang));
    link.classList.toggle('is-active', targetLang === lang);
  });

  highlightCurrentLink();
}

function setupFooterI18n() {
  const lang = getLangFromPath();

  const dictionary = {
    pt: {
      home: 'Home',
      project: 'O Projeto',
      houses: 'As Casas',
      shared: 'Vida em Comum',
      operations: 'Operação',
      location: 'Localização',
      investment: 'Investimento',
      contact: 'Contato',

      explore_title: 'Explorar',
      sales_title: 'Vendas Privadas',
      language_title: 'Idioma',

      request_presentation: 'Solicitar apresentação',
      discover_houses: 'Conhecer as casas',
      presentation: 'Solicitar apresentação',
      view_houses: 'Conhecer as casas',
      view_shared: 'Ver áreas sociais',
      view_operations: 'Entender a operação',

      rights: 'Todos os direitos reservados.',

      footer_copy:
        'Uma coleção residencial em Trancoso, pensada a partir de arquitetura autoral, jardins privativos e uma experiência mais silenciosa de permanência.'
    },

    en: {
      home: 'Home',
      project: 'The Project',
      houses: 'The Houses',
      shared: 'Shared Living',
      operations: 'Operations',
      location: 'Location',
      investment: 'Investment',
      contact: 'Contact',

      explore_title: 'Explore',
      sales_title: 'Private Sales',
      language_title: 'Language',

      request_presentation: 'Request Presentation',
      discover_houses: 'Discover the houses',
      presentation: 'Request presentation',
      view_houses: 'View the houses',
      view_shared: 'See shared living',
      view_operations: 'Understand operations',

      rights: 'All rights reserved.',

      footer_copy:
        'A residential collection in Trancoso shaped by authored architecture, private gardens and a quieter experience of permanence.'
    }
  };

  document.querySelectorAll('[data-footer-key]').forEach((node) => {
    const key = node.getAttribute('data-footer-key');
    if (dictionary[lang][key]) {
      node.textContent = dictionary[lang][key];
    }
  });

  const footerCopy = document.querySelector('[data-footer-copy]');
  if (footerCopy) {
    footerCopy.textContent = dictionary[lang].footer_copy;
  }

  document.querySelectorAll('[data-footer-link]').forEach((link) => {
    const key = link.getAttribute('data-footer-link');

    if (dictionary[lang][key]) {
      link.textContent = dictionary[lang][key];
    }

    link.setAttribute('href', getLocalizedPath(key, lang));
  });

  const footerBrandLink = document.querySelector('[data-footer-brand-link]');
  if (footerBrandLink) {
    footerBrandLink.setAttribute('href', getLocalizedPath('brand', lang));
  }

  applyLocalizedPaths(document);

  document.querySelectorAll('[data-footer-lang-link]').forEach((link) => {
    const targetLang = link.getAttribute('data-footer-lang-link');
    link.setAttribute('href', buildTranslatedPath(window.location.pathname, targetLang));
    link.classList.toggle('is-active', targetLang === lang);
  });
}

function highlightCurrentLink() {
  const current = normalizePath(window.location.pathname);

  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const href = normalizePath(link.getAttribute('href'));
    const isActive =
      current === href ||
      (href !== '/pt/' && href !== '/en/' && current.startsWith(href));

    link.classList.toggle('is-active', isActive);
  });
}

injectFragment('#site-header', '/components/header.html', setupHeaderI18n);
injectFragment('#site-footer', '/components/footer.html', setupFooterI18n);