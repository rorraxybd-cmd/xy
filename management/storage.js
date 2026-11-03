/**
 * rorraxy management - Local & Session Storage Utility
 * Safely stores, retrieves, and manages client-side data.
 */

const storage = {
    /**
     * লোকাল স্টোরেজে ডাটা সেভ করা
     */
    setLocal: (key, value) => {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error('[Storage Error - setLocal]:', error);
            return false;
        }
    },

    /**
     * লোকাল স্টোরেজ থেকে ডাটা রিড বা বের করা
     */
    getLocal: (key) => {
        try {
            const serializedValue = localStorage.getItem(key);
            if (serializedValue === null) return null;
            return JSON.parse(serializedValue);
        } catch (error) {
            console.error('[Storage Error - getLocal]:', error);
            return null;
        }
    },

    /**
     * লোকাল স্টোরেজ থেকে নির্দিষ্ট কি রিমুভ করা
     */
    removeLocal: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('[Storage Error - removeLocal]:', error);
            return false;
        }
    },

    /**
     * সেশন স্টোরেজে ডাটা সেভ করা (ট্যাব খোলা থাকা পর্যন্ত থাকবে)
     */
    setSession: (key, value) => {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('[Storage Error - setSession]:', error);
            return false;
        }
    },

    /**
     * সেশন স্টোরেজ থেকে ডাটা রিড করা
     */
    getSession: (key) => {
        try {
            const serializedValue = sessionStorage.getItem(key);
            if (serializedValue === null) return null;
            return JSON.parse(serializedValue);
        } catch (error) {
            console.error('[Storage Error - getSession]:', error);
            return null;
        }
    },

    /**
     * সমস্ত স্টোরেজ পরিষ্কার করা
     */
    clearAll: () => {
        localStorage.clear();
        sessionStorage.clear();
    }
};

module.exports = storage;
