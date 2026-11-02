/**
 * rorraxy - Advanced Storage & Caching Manager
 * Description: Handles secure client-side storage (localStorage & sessionStorage) 
 * with automatic JSON serialization, error handling, and fallback support.
 */

class RorraxyStorageManager {
    constructor() {
        this.prefix = 'rorraxy_sys_';
    }

    setLocal(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serializedValue);
            return true;
        } catch (error) {
            return false;
        }
    }

    getLocal(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            return null;
        }
    }

    removeLocal(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            return false;
        }
    }

    setSession(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            sessionStorage.setItem(this.prefix + key, serializedValue);
            return true;
        } catch (error) {
            return false;
        }
    }

    getSession(key) {
        try {
            const item = sessionStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            return null;
        }
    }

    clearAll() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    sessionStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}

const rorraxyStorage = new RorraxyStorageManager();

if (typeof window !== 'undefined') {
    window.RorraxyStorage = RorraxyStorageManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RorraxyStorageManager;
}
