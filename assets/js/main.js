document.addEventListener('DOMContentLoaded', () => {
  const revealItems = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 70, 260)}ms`;
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
});
const revealEls = document.querySelectorAll('[data-reveal]');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.14,
  rootMargin: '0px 0px -6% 0px'
});

revealEls.forEach((el) => revealObserver.observe(el));
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
      const translateY = progress * -18; // bem sutil

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