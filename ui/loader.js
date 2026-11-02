/**
 * rorraxy - Refined Luxury Global Loader Manager
 * Description: Clean, lightweight, and smooth loading overlay for SPA transitions 
 * with minimal, elegant animations.
 */

class RorraxyLoader {
    constructor() {
        this.loaderId = 'rorraxy-global-loader';
        this.isActive = false;
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('rorraxy-loader-styles')) return;

        const style = document.createElement('style');
        style.id = 'rorraxy-loader-styles';
        style.innerHTML = `
            #${this.loaderId} {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background-color: rgba(11, 11, 11, 0.88); backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px); display: flex; flex-direction: column;
                align-items: center; justify-content: center; z-index: 99999;
                opacity: 0; visibility: hidden; transition: opacity 0.25s ease;
            }
            #${this.loaderId}.rorraxy-loader-visible { opacity: 1; visibility: visible; }
            .rorraxy-spinner-ring {
                width: 48px; height: 48px; border: 2px solid rgba(212, 175, 55, 0.1);
                border-top: 2px solid #d4af37; border-radius: 50%;
                animation: rorraxySmoothSpin 0.7s linear infinite;
            }
            .rorraxy-loader-text {
                margin-top: 14px; font-family: 'Poppins', sans-serif; font-size: 12px;
                font-weight: 500; letter-spacing: 2px; color: #e5c158; text-transform: uppercase;
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
        const textEl = loader.querySelector('.rorraxy-loader-text');
        if (textEl) textEl.textContent = text;
        loader.classList.add('rorraxy-loader-visible');
        this.isActive = true;
    }

    hide() {
        const loader = document.getElementById(this.loaderId);
        if (loader) {
            loader.classList.remove('rorraxy-loader-visible');
            this.isActive = false;
        }
    }
}

const rorraxyLoader = new RorraxyLoader();

if (typeof window !== 'undefined') {
    window.RorraxyLoader = RorraxyLoader;
}
