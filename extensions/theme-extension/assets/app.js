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

  let lastVariantId = null;
  function updateUI() {
    const variantId = new URLSearchParams(window.location.search).get('variant') || config.currentVariant.id;
    
    // 0. Only update if variant changed OR it's the first run
    if (lastVariantId === variantId) return;
    lastVariantId = variantId;

    if (observer) observer.disconnect();

    const currentVariant = config.allVariants.find(v => v.id.toString() === variantId.toString());
    const activeMedia = getActiveMedia(variantId);
    const activeFiles = activeMedia.map(m => getCleanFilename(m.src));
    const allProductFiles = config.product.media.map(m => getCleanFilename(m.src));

    let primaryGroupFiles = [];
    if (config.isReorderMode && currentVariant) {
      const primaryOption = currentVariant.title.split('/')[0].trim().toLowerCase();
      const groupVariants = config.allVariants.filter(v => v.title.toLowerCase().startsWith(primaryOption));
      
      groupVariants.forEach(v => {
        const vMedia = getActiveMedia(v.id);
        vMedia.forEach(m => {
          const fn = getCleanFilename(m.src);
          if (fn && !primaryGroupFiles.includes(fn)) primaryGroupFiles.push(fn);
        });
      });
    }

    const productArea = document.querySelector('media-gallery, .product, .product-section, #MainContent, [data-section-type="product"]') || document.body;
    const allImgs = productArea.querySelectorAll('img');
    const processedContainers = new Set();

    allImgs.forEach(img => {
      const src = img.src || img.dataset.src || img.getAttribute('data-photoswipe-src') || "";
      const filename = getCleanFilename(src);
      
      if (filename && allProductFiles.includes(filename)) {
        const container = img.closest('li, .product__media-item, .grid__item, .product-single__media-item, .product__thumb-item') || img.parentElement;
        if (!container || processedContainers.has(container)) return;
        processedContainers.add(container);

        if (config.isReorderMode) {
          // Reorder Mode: Show entire primary group (e.g. all Yellow Gold)
          if (primaryGroupFiles.includes(filename)) {
            container.classList.remove('v-hidden-item');
            container.style.display = '';
            // But MOVE active sub-variant (e.g. Emerald) to top
            if (activeFiles.includes(filename)) {
              container.parentElement.prepend(container);
            }
          } else {
            container.classList.add('v-hidden-item');
            container.style.display = 'none';
          }
        } else {
          // Normal Hide Mode: Only show active variant images
          if (activeFiles.includes(filename)) {
            container.classList.remove('v-hidden-item');
            container.style.display = '';
          } else {
            container.classList.add('v-hidden-item');
            container.style.display = 'none';
          }
        }
      }
    });

    if (config.isReorderMode) {
      window.dispatchEvent(new Event('resize'));
    }

    setTimeout(startObserver, 100);
  }

  let observer;
  function startObserver() {
    const productArea = document.querySelector('media-gallery, .product, .product-section, #MainContent, [data-section-type="product"]') || document.body;
    if (observer) observer.disconnect();
    
    observer = new MutationObserver((mutations) => {
      const variantId = new URLSearchParams(window.location.search).get('variant') || config.currentVariant.id;
      if (variantId !== lastVariantId) {
        updateUI();
      }
    });

    observer.observe(productArea, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'selected']
    });
  }

  updateUI();
})();
