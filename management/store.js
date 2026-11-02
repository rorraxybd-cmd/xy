/**
 * rorraxy - Advanced Central Global State & Store Manager
 * Description: Manages application-wide reactive state, automatic local storage persistence,
 * multi-currency states, and network health monitoring for the global ecosystem.
 */

class RorraxyStore {
    constructor() {
        this.state = {
            user: this._getStoredState('user', null),
            currentCountry: this._getStoredState('currentCountry', 'US'),
            currentCurrency: this._getStoredState('currentCurrency', 'USD'),
            exchangeRates: this._getStoredState('exchangeRates', {}),
            cart: this._getStoredState('cart', []),
            isOnline: navigator.onLine,
            theme: 'dark',
            activeHub: typeof window !== 'undefined' ? window.location.pathname : '/'
        };
        
        this.listeners = new Map();
        this.initListeners();
    }

    _getStoredState(key, fallbackValue) {
        if (typeof rorraxyStorage !== 'undefined') {
            const saved = rorraxyStorage.getLocal(key);
            return saved !== null ? saved : fallbackValue;
        }
        return fallbackValue;
    }

    getState(key) {
        return key ? this.state[key] : this.state;
    }

    setState(key, value) {
        const oldValue = this.state[key];
        if (JSON.stringify(oldValue) === JSON.stringify(value)) return;

        this.state[key] = value;
        
        if (typeof rorraxyStorage !== 'undefined') {
            rorraxyStorage.setLocal(key, value);
        }

        this.notifyListeners(key, value, oldValue);
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);

        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                this.listeners.set(key, callbacks.filter(cb => cb !== callback));
            }
        };
    }

    notifyListeners(key, newValue, oldValue) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                try {
                    callback(newValue, oldValue, this.state);
                } catch (error) {
                    // Safe listener error handling
                }
            });
        }
    }

    initListeners() {
        if (typeof window === 'undefined') return;

        window.addEventListener('online', () => {
            this.setState('isOnline', true);
        });

        window.addEventListener('offline', () => {
            this.setState('isOnline', false);
        });

        window.addEventListener('popstate', () => {
            this.setState('activeHub', window.location.pathname);
        });
    }
}

const rorraxyStore = new RorraxyStore();

if (typeof window !== 'undefined') {
    window.RorraxyStore = RorraxyStore;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RorraxyStore;
}
