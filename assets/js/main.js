document.addEventListener('DOMContentLoaded', () => {

  const revealItems = document.querySelectorAll('[data-reveal]');

  // Fallback imediato (evita conteúdo invisível)
  revealItems.forEach(el => {
    el.classList.add('reveal-init');
  });

  if (!('IntersectionObserver' in window)) {
    revealItems.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -10% 0px'
  });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 60, 240)}ms`;
    observer.observe(item);
  });

});
(function () {
  const mainGalleryImages = document.querySelectorAll('.galleryMain img');

  if (!mainGalleryImages.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const updateParallax = () => {
    mainGalleryImages.forEach((img) => {
      const wrap = img.closest('.galleryMain');
      if (!wrap) return;

      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;

      if (rect.bottom < 0 || rect.top > vh) return;

      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      const translateY = progress * -18;

      img.style.transform = `scale(1.03) translateY(${translateY}px)`;
    });
  };

  let ticking = false;

  const requestTick = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateParallax();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  window.addEventListener('load', requestTick);

  requestTick();
})();