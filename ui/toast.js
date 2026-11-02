/**
 * rorraxy - Advanced Dark-Luxury Toast Notification Manager
 * Description: Displays sleek, non-intrusive notification banners with smooth 
 * slide-in animations and multiple status types (success, error, warning, info).
 */

class RorraxyToast {
    constructor() {
        this.containerId = 'rorraxy-toast-container';
        this.injectStyles();
        this.createContainer();
    }

    injectStyles() {
        if (document.getElementById('rorraxy-toast-styles')) return;

        const style = document.createElement('style');
        style.id = 'rorraxy-toast-styles';
        style.innerHTML = `
            #${this.containerId} {
                position: fixed; bottom: 25px; right: 25px; z-index: 100000;
                display: flex; flex-direction: column; gap: 12px; max-width: 360px;
                width: calc(100% - 50px); pointer-events: none;
            }
            .rorraxy-toast-item {
                background: rgba(15, 15, 22, 0.95); backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(212, 175, 55, 0.3);
                border-left: 4px solid #d4af37; color: #ffffff; padding: 14px 18px;
                border-radius: 12px; font-family: 'Poppins', sans-serif; font-size: 13px;
                font-weight: 500; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
                display: flex; align-items: center; justify-content: space-between;
                gap: 12px; pointer-events: auto; opacity: 0; transform: translateY(20px);
                transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .rorraxy-toast-item.rorraxy-toast-show { opacity: 1; transform: translateY(0); }
            .rorraxy-toast-item.rorraxy-toast-hide { opacity: 0; transform: translateY(-10px); transition: opacity 0.25s ease, transform 0.25s ease; }
            .rorraxy-toast-content { display: flex; align-items: center; gap: 10px; word-break: break-word; }
            .rorraxy-toast-icon { font-size: 16px; color: #d4af37; flex-shrink: 0; }
            .rorraxy-toast-success { border-left-color: #2ecc71; }
            .rorraxy-toast-success .rorraxy-toast-icon { color: #2ecc71; }
            .rorraxy-toast-error { border-left-color: #e74c3c; }
            .rorraxy-toast-error .rorraxy-toast-icon { color: #e74c3c; }
            .rorraxy-toast-warning { border-left-color: #f1c40f; }
            .rorraxy-toast-warning .rorraxy-toast-icon { color: #f1c40f; }
        `;
        document.head.appendChild(style);
    }

    createContainer() {
        if (document.getElementById(this.containerId)) return;
        const container = document.createElement('div');
        container.id = this.containerId;
        document.body.appendChild(container);
    }

    show(message, type = 'info', duration = 3500) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `rorraxy-toast-item rorraxy-toast-${type}`;

        let iconClass = 'fa-solid fa-circle-info';
        if (type === 'success') iconClass = 'fa-solid fa-circle-check';
        if (type === 'error') iconClass = 'fa-solid fa-triangle-exclamation';
        if (type === 'warning') iconClass = 'fa-solid fa-circle-exclamation';

        toast.innerHTML = `
            <div class="rorraxy-toast-content">
                <i class="${iconClass} rorraxy-toast-icon"></i>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('rorraxy-toast-show');
        });

        const removeTimer = setTimeout(() => {
            this.dismiss(toast);
        }, duration);

        toast.addEventListener('mouseenter', () => clearTimeout(removeTimer));
        toast.addEventListener('mouseleave', () => {
            setTimeout(() => this.dismiss(toast), 1500);
        });
    }

    dismiss(toast) {
        if (!toast || toast.classList.contains('rorraxy-toast-hide')) return;
        
        toast.classList.remove('rorraxy-toast-show');
        toast.classList.add('rorraxy-toast-hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 250);
    }
}

const rorraxyToast = new RorraxyToast();

if (typeof window !== 'undefined') {
    window.RorraxyToast = RorraxyToast;
}
