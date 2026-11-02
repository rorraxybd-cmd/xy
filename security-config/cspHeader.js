/**
 * rorraxy Ecosystem - Optimized Non-Blocking CSP Injector
 * Prevents all CSP blocking issues for Cloudflare Workers, Firebase, and authorized endpoints.
 */

(function () {
    'use strict';

    const cspPolicy = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline' https: wss: https://media.rorraxy.com https://rorraxy-uploader.rorraxybd.workers.dev; img-src * data: blob:; style-src * 'unsafe-inline';";

    function injectCSP() {
        if (!document.head) return;

        const existingCSP = document.querySelector("meta[http-equiv='Content-Security-Policy']");
        if (existingCSP) {
            existingCSP.remove();
        }

        const meta = document.createElement('meta');
        meta.httpEquiv = "Content-Security-Policy";
        meta.content = cspPolicy;
        document.head.appendChild(meta);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectCSP);
    } else {
        injectCSP();
    }
})();
