/**
 * rorraxy - High-Performance Ultra-Fast Video Feed Manager
 * Description: Optimized for lightning-fast vertical scrolling, smooth lazy rendering,
 * and zero-lag performance for social media style video feeds.
 */

class RorraxyVideoHelper {
    constructor(containerSelector = '.video-feed-container', cardSelector = '.video-card') {
        this.container = document.querySelector(containerSelector);
        this.cardSelector = cardSelector;
        this.observer = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.optimizeFeed());
        } else {
            this.optimizeFeed();
        }
    }

    /**
     * Setup high-performance Intersection Observer for smooth scrolling
     */
    optimizeFeed() {
        const cards = document.querySelectorAll(this.cardSelector);
        if (cards.length === 0) return;

        const observerOptions = {
            root: this.container || null,
            rootMargin: '50px 0px',
            threshold: 0.7 
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const targetCard = entry.target;
                const videoElement = targetCard.querySelector('video, iframe');

                if (!videoElement) return;

                if (entry.isIntersecting) {
                    targetCard.classList.add('rorraxy-active-card');
                    if (videoElement.tagName === 'VIDEO') {
                        videoElement.play().catch(err => console.log('Auto-play optimized:', err));
                    }
                } else {
                    targetCard.classList.remove('rorraxy-active-card');
                    if (videoElement.tagName === 'VIDEO') {
                        videoElement.pause();
                        videoElement.currentTime = 0;
                    }
                }
            });
        }, observerOptions);

        cards.forEach(card => this.observer.observe(card));
    }

    /**
     * Dynamically append new social media style video card instantly without lag
     * @param {Object} data 
     */
    appendVideoCard(data) {
        if (!this.container) return;

        const { src, title, price, productId } = data;
        const card = document.createElement('div');
        card.className = 'video-card';
        
        card.innerHTML = `
            <div class="video-wrapper">
                <video src="${src}" loop playsinline preload="metadata"></video>
            </div>
            <div class="video-overlay-info">
                <div class="video-title">${window.RorraxyValidator ? window.RorraxyValidator.prototype.sanitizeInput(title) : title}</div>
                <div class="video-price">$${price}</div>
                <button class="direct-buy-btn" onclick="handleDirectBuy('${productId}', ${price})">
                    <i class="fa-solid fa-bolt"></i> Direct Buy Now
                </button>
            </div>
        `;

        this.container.appendChild(card);
        this.observer.observe(card);
    }
}

const rorraxyVideoHelper = new RorraxyVideoHelper();

if (typeof window !== 'undefined') {
    window.RorraxyVideoHelper = RorraxyVideoHelper;
}
