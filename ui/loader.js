/**
 * rorraxy - Refined Luxury Global Loader Manager
 * Description: Clean, lightweight, and smooth loading overlay for SPA transitions 
 * with minimal, elegant animations.
 */

class RorraxyLoader {
    constructor() {
        this.loaderId = 'rorraxy-global-loader';
        this.isActive = false;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.injectStyles());
        } else {
            this.injectStyles();
        }
    }

    injectStyles() {
        if (document.getElementById('rorraxy-loader-styles')) return;

        const style = document.createElement('style');
        style.id = 'rorraxy-loader-styles';
        style.innerHTML = `
            #${this.loaderId} {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background-color: rgba(11, 11, 11, 0.92); backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px); display: flex; flex-direction: column;
                align-items: center; justify-content: center; z-index: 999999;
                opacity: 0; visibility: hidden; transition: opacity 0.25s ease, visibility 0.25s ease;
            }
            #${this.loaderId}.rorraxy-loader-visible { opacity: 1; visibility: visible; }
            .rorraxy-spinner-ring {
                width: 48px; height: 48px; border: 2px solid rgba(212, 175, 55, 0.15);
                border-top: 2px solid #d4af37; border-radius: 50%;
                animation: rorraxySmoothSpin 0.7s linear infinite;
            }
            .rorraxy-loader-text {
                margin-top: 14px; font-family: 'Poppins', 'Plus Jakarta Sans', sans-serif; font-size: 11px;
                font-weight: 600; letter-spacing: 2px; color: #fcf6ba; text-transform: uppercase;
            }
            @keyframes rorraxySmoothSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    createLoaderElement() {
        if (document.getElementById(this.loaderId)) return;
        const loader = document.createElement('div');
        loader.id = this.loaderId;
        loader.innerHTML = `
            <div class="rorraxy-spinner-ring"></div>
            <div class="rorraxy-loader-text">rorraxy</div>
        `;
        document.body.appendChild(loader);
    }

    show(text = 'rorraxy') {
        this.createLoaderElement();
        const loader = document.getElementById(this.loaderId);
        if (loader) {
            const textEl = loader.querySelector('.rorraxy-loader-text');
            if (textEl) textEl.textContent = text;
            loader.classList.add('rorraxy-loader-visible');
            this.isActive = true;
        }
    }

    hide() {
        const loader = document.getElementById(this.loaderId);
        if (loader) {
            loader.classList.remove('rorraxy-loader-visible');
            this.isActive = false;
        }
    }
}

// গ্লোবাল ইন্সট্যান্স ও উইন্ডো বাইন্ডিং নিশ্চিত করা হলো
if (typeof window !== 'undefined') {
    window.RorraxyLoader = RorraxyLoader;
    if (!window.rorraxyLoader) {
        window.rorraxyLoader = new RorraxyLoader();
    }
}
