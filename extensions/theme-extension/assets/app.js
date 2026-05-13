console.log("Variant Image Automator: Stable & Silent Mode");

(function () {
  const config = window.VariantImageAutomator;
  if (!config || !config.product || config.applyToAll === false || config.applyToAll === 'false') {
    return;
  }

  // 1. Simple CSS for transitions
  if (!document.getElementById('v-automator-style')) {
    const style = document.createElement('style');
    style.id = 'v-automator-style';
    style.textContent = `
      .v-hidden-item { display: none !important; }
      .product__media-item, .thumbnail-list__item { transition: opacity 0.2s ease; }
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
  let lastUpdateTime = 0;
  let isProcessing = false;

  function updateUI() {
    const now = Date.now();
    if (isProcessing || (now - lastUpdateTime < 150)) return;
    
    isProcessing = true;
    lastUpdateTime = now;

    // Apply updating class to hide gallery during switch
    document.documentElement.classList.add('v-automator-updating');

    requestAnimationFrame(() => {
      const variantId = new URLSearchParams(window.location.search).get('variant') || config.currentVariant.id;
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
      let didChange = false;

      const toPrepend = [];

      allImgs.forEach(img => {
        const src = img.src || img.dataset.src || img.getAttribute('data-photoswipe-src') || "";
        const filename = getCleanFilename(src);
        
        if (filename && allProductFiles.includes(filename)) {
          const container = img.closest('li, .product__media-item, .grid__item, .product-single__media-item, .product__thumb-item') || img.parentElement;
          if (!container || processedContainers.has(container)) return;
          processedContainers.add(container);

          let shouldShow = false;
          let shouldPrepend = false;

          if (config.isReorderMode) {
            if (primaryGroupFiles.includes(filename)) {
              shouldShow = true;
              if (activeFiles.includes(filename)) {
                shouldPrepend = true;
              }
            }
          } else {
            if (activeFiles.includes(filename)) {
              shouldShow = true;
            }
          }

          if (shouldShow) {
            if (container.classList.contains('v-hidden-item')) {
              container.classList.remove('v-hidden-item');
              container.style.display = '';
              didChange = true;
            }
            if (shouldPrepend) toPrepend.push(container);
          } else {
            if (!container.classList.contains('v-hidden-item')) {
              container.classList.add('v-hidden-item');
              container.style.display = 'none';
              didChange = true;
            }
          }
        }
      });

      if (config.isReorderMode) {
        for (let i = toPrepend.length - 1; i >= 0; i--) {
          const container = toPrepend[i];
          if (container.parentElement.firstElementChild !== container) {
            container.parentElement.prepend(container);
            didChange = true;
          }
        }
      }

      if (didChange && config.isReorderMode) {
        window.dispatchEvent(new Event('resize'));
      }

      if (allImgs.length > 0) {
        document.documentElement.classList.remove('v-automator-loading');
        document.documentElement.classList.add('v-automator-ready');
      }

      // Remove updating class immediately after processing
      document.documentElement.classList.remove('v-automator-updating');

      isProcessing = false;
      startObserver();
    });
  }

  let observer;
  function startObserver() {
    const productArea = document.querySelector('media-gallery, .product, .product-section, #MainContent, [data-section-type="product"]') || document.body;
    if (!productArea) return;
    if (observer) observer.disconnect();
    
    observer = new MutationObserver((mutations) => {
      const variantId = new URLSearchParams(window.location.search).get('variant') || config.currentVariant.id;
      let shouldUpdate = variantId !== lastVariantId;
      
      if (!shouldUpdate) {
        for (let mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldUpdate = true;
            break;
          }
        }
      }

      if (shouldUpdate) updateUI();
    });

    observer.observe(productArea, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'selected']
    });
  }

  // Optimized Pulse Strategy: only frequent at the very beginning
  updateUI();
  setTimeout(updateUI, 500);
  setTimeout(updateUI, 2000);
  
  setTimeout(() => {
    document.documentElement.classList.remove('v-automator-loading');
    document.documentElement.classList.add('v-automator-ready');
  }, 3500);

  window.addEventListener('load', updateUI);
})();




