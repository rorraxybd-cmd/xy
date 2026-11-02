/**
 * rorraxy - Advanced Luxury Skeleton Loader Module
 * Description: Generates smooth shimmer skeleton placeholders for dynamic contents, 
 * preventing layout shift and ensuring a zero-lag perceived performance.
 */

class RorraxySkeleton {
    constructor() {
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('rorraxy-skeleton-styles')) return;

        const style = document.createElement('style');
        style.id = 'rorraxy-skeleton-styles';
        style.innerHTML = `
            .rorraxy-skeleton-box {
                background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 25%, rgba(212, 175, 55, 0.08) 50%, rgba(255, 255, 255, 0.03) 75%);
                background-size: 200% 100%; animation: rorraxyShimmer 1.5s infinite; border-radius: 8px;
            }
            .rorraxy-skeleton-card {
                background: rgba(15, 15, 22, 0.85); border: 1px solid rgba(212, 175, 55, 0.15);
                border-radius: 14px; padding: 15px; display: flex; flex-direction: column; gap: 12px; width: 100%;
            }
            .rorraxy-skeleton-line { height: 14px; width: 100%; }
            .rorraxy-skeleton-line.short { width: 60%; }
            .rorraxy-skeleton-img { width: 100%; height: 180px; }
            @keyframes rorraxyShimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }

    getCardSkeletonHtml() {
        return `
            <div class="rorraxy-skeleton-card">
                <div class="rorraxy-skeleton-box rorraxy-skeleton-img"></div>
                <div class="rorraxy-skeleton-box rorraxy-skeleton-line"></div>
                <div class="rorraxy-skeleton-box rorraxy-skeleton-line short"></div>
            </div>
        `;
    }

    show(containerSelector, count = 3) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        let htmlContent = '';
        for (let i = 0; i < count; i++) {
            htmlContent += this.getCardSkeletonHtml();
        }
        container.innerHTML = htmlContent;
    }

    hide(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = '';
        }
    }
}

const rorraxySkeleton = new RorraxySkeleton();

if (typeof window !== 'undefined') {
    window.RorraxySkeleton = RorraxySkeleton;
}
