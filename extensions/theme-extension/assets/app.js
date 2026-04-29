console.log("Variant Image Automator: 100% Functional + Speed Fix");

(function () {
  const config = window.VariantImageAutomator;
  if (!config || !config.product || config.applyToAll === false || config.applyToAll === 'false') {
    return;
  }

  // 1. Simple CSS for transitions (Non-breaking)
  if (!document.getElementById('v-automator-style')) {
    const style = document.createElement('style');
    style.id = 'v-automator-style';
    style.textContent = `
      .v-hidden-item { display: none !important; }
      .product__media-item, .thumbnail-list__item { transition: opacity 0.1s ease; }
    `;
    document.head.appendChild(style);
  }

  function getCleanFilename(url) {
    if (!url) return "";
    const filename = url.split('/').pop().split('?')[0];
    return filename.replace(/(_\d+x|_(master|small|medium|large|thumb|crop|v=)).*$/g, '').toLowerCase();
  }

  function getActiveMedia(variantId) {
    const media = config.product.media;
    const variants = config.allVariants;
    const currentVariant = variants.find(v => v.id.toString() === variantId.toString());
    if (!variantId || !currentVariant || !currentVariant.featured_image_id || currentVariant.featured_image_id == "") return media;

    const startId = currentVariant.featured_image_id.toString();
    const startIndex = media.findIndex(m => m.id.toString() === startId);
    if (startIndex === -1) return media;

    const assignedIds = variants.filter(v => v.featured_image_id).map(v => v.featured_image_id.toString());
    let nextIdx = media.length;
    for (let i = startIndex + 1; i < media.length; i++) {
      if (assignedIds.includes(media[i].id.toString())) {
        nextIdx = i;
        break;
      }
    }
    return media.slice(startIndex, nextIdx);
  }

  function updateUI() {
    const variantId = new URLSearchParams(window.location.search).get('variant') || config.currentVariant.id;
    const activeMedia = getActiveMedia(variantId);
    const activeFiles = activeMedia.map(m => getCleanFilename(m.src));
    const allProductFiles = config.product.media.map(m => getCleanFilename(m.src));

    const gallery = document.querySelector('.product, .product-section, media-gallery, #MainContent') || document.body;
    const allImgs = gallery.querySelectorAll('img');
    
    allImgs.forEach((img) => {
      const src = img.src || img.dataset.src || "";
      if (!src.includes('cdn.shopify.com') && !src.includes('/cdn/shop/')) return;

      const filename = getCleanFilename(src);
      if (allProductFiles.includes(filename)) {
        let container = img.closest('li, .grid__item, .swiper-slide, .product__media-item, .product-main-slide') || img.parentElement;
        if (activeFiles.includes(filename)) {
          container.classList.remove('v-hidden-item');
        } else {
          container.classList.add('v-hidden-item');
        }
      }
    });

    // Thumbnail Sync
    document.querySelectorAll('.thumbnail-list__item, .product__thumb-item').forEach(thumb => {
        const img = thumb.querySelector('img');
        if (!img) return;
        const filename = getCleanFilename(img.src);
        if (allProductFiles.includes(filename)) {
            thumb.style.display = activeFiles.includes(filename) ? '' : 'none';
        }
    });
  }

  // 2. SMART OBSERVER: Watches body (stable) but filters changes for Speed
  const observer = new MutationObserver((mutations) => {
    // Only update if the change happened inside a product-related area
    const isRelevant = mutations.some(m => m.target.closest('media-gallery, .product, .product-section, #MainContent'));
    if (isRelevant) {
      updateUI(); // Instant update to kill the flash
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  updateUI();
  window.addEventListener('popstate', updateUI);
})();
