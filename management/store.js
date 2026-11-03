/**
 * rorraxy management - Global State Store
 * Centralized state management for application data.
 */

class Store {
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = [];
    }

    /**
     * বর্তমান স্টেট বা ডাটা পাওয়া
     */
    getState() {
        return this.state;
    }

    /**
     * স্টেট আপডেট করা এবং সাবস্ক্রাইবারদের নোটিফাই করা
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.listeners.forEach(listener => listener(this.state));
    }

    /**
     * স্টেটে কোনো পরিবর্তন আসলে তা ট্র্যাক করার জন্য লিসেনার যুক্ত করা
     */
    subscribe(listener) {
        this.listeners.push(listener);
        // আনসাবস্ক্রাইব করার ফাংশন রিটার্ন করা
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

// গ্লোবাল স্টোর ইনস্ট্যান্স তৈরি করে এক্সপোর্ট করা
const globalStore = new Store({
    user: null,
    cart: [],
    theme: 'dark' // রোর্যাক্সির পছন্দের ডার্ক থিম ডিফল্ট
});

module.exports = globalStore;
