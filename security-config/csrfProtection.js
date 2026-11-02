/**
 * rorraxy Ecosystem - Client-Side CSRF Protection Manager
 * Generates, validates, and injects anti-CSRF tokens into dynamic forms and API payloads.
 */

(function () {
    'use strict';

    const CSRF_TOKEN_KEY = 'rorraxy_csrf_token';
    const HEADER_NAME = 'X-CSRF-Token';

    class RorraxyCSRFManager {
        constructor() {
            this.initToken();
        }

        initToken() {
            let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
            if (!token) {
                token = this.generateSecureToken();
                sessionStorage.setItem(CSRF_TOKEN_KEY, token);
            }
            return token;
        }

        generateSecureToken() {
            const array = new Uint8Array(32);
            window.crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        }

        getToken() {
            return sessionStorage.getItem(CSRF_TOKEN_KEY) || this.initToken();
        }

        injectTokenIntoForms() {
            const token = this.getToken();
            const forms = document.querySelectorAll('form');

            forms.forEach(form => {
                if (!form.querySelector(`input[name="csrf_token"]`)) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'csrf_token';
                    input.value = token;
                    form.appendChild(input);
                }
            });
        }

        async secureFetch(url, options = {}) {
            options.headers = options.headers || {};
            
            const method = (options.method || 'GET').toUpperCase();
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
                options.headers[HEADER_NAME] = this.getToken();
            }

            return fetch(url, options);
        }

        validateRequest(incomingToken) {
            return incomingToken === this.getToken();
        }
    }

    const csrfManager = new RorraxyCSRFManager();
    window.RorraxyCSRF = csrfManager;

    document.addEventListener('DOMContentLoaded', () => {
        csrfManager.injectTokenIntoForms();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    csrfManager.injectTokenIntoForms();
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    });
})();
