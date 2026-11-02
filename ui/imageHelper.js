/**
 * rorraxy - Advanced High-Performance Image Helper
 * Description: Handles lightning-fast lazy loading using IntersectionObserver,
 * smooth fade-in transitions, and automatic fallback error handling.
 */

class RorraxyImageHelper {
    constructor() {
        this.fallbackImage = 'https://rorraxy.com/icon-512.png';
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.registerImages());
        } else {
            this.registerImages();
        }
    }

    registerImages() {
        const images = document.querySelectorAll('img[data-src], img.rorraxy-lazy');

        if ('IntersectionObserver' in window) {
            const observerOptions = {
                root: null,
                rootMargin: '100px 0px',
                threshold: 0.01
            };

            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadDatasetImage(img);
                        observer.unobserve(img);
                    }
                });
            }, observerOptions);

            images.forEach(img => imageObserver.observe(img));
        } else {
            images.forEach(img => this.loadDatasetImage(img));
        }
    }

    loadDatasetImage(img) {
        const src = img.getAttribute('data-src') || img.dataset.src;
        if (!src) return;

        this.applyStyles(img);

        const tempImage = new Image();
        tempImage.src = src;

        tempImage.onload = () => {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('rorraxy-img-loaded');
        };

        tempImage.onerror = () => {
            console.warn(`rorraxy ImageHelper: Failed to load -> ${src}. Switching to fallback.`);
            img.src = this.fallbackImage;
            img.classList.add('rorraxy-img-fallback');
        };
    }

    applyStyles(img) {
        if (!document.getElementById('rorraxy-image-styles')) {
            const style = document.createElement('style');
            style.id = 'rorraxy-image-styles';
            style.innerHTML = `
                img[data-src], img.rorraxy-lazy {
                    opacity: 0; transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    background: rgba(255, 255, 255, 0.03);
                }
                img.rorraxy-img-loaded, img.rorraxy-img-fallback {
                    opacity: 1 !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    createImage(src, alt = 'rorraxy ecosystem', className = '') {
        const img = document.createElement('img');
        img.className = `rorraxy-lazy ${className}`;
        img.dataset.src = src;
        img.alt = alt;
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
        
        this.loadDatasetImage(img);
        return img;
    }
}

const rorraxyImageHelper = new RorraxyImageHelper();

function getCompanyLogo(domainOrUrl, size = 128) {
  try {
    let domain = domainOrUrl;
    if (domainOrUrl.startsWith('http')) {
      const urlObj = new URL(domainOrUrl);
      domain = urlObj.hostname;
    }
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  } catch (error) {
    console.error('Logo generation error:', error);
    return '/icon-192.png';
  }
}

if (typeof window !== 'undefined') {
    window.RorraxyImageHelper = RorraxyImageHelper;
    window.getCompanyLogo = getCompanyLogo;
}
