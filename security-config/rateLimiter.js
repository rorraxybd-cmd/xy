/**
 * rorraxy - Rate Limiter & Request Throttling
 * Description: Prevents brute-force attacks, DDoS, and repeated spam requests.
 */

class RateLimiter {
    constructor(options = {}) {
        this.maxRequests = options.maxRequests || 50; 
        this.timeWindow = options.timeWindow || 60 * 1000; 
        this.blockDuration = options.blockDuration || 5 * 60 * 1000; 
        this.storageKey = 'rorraxy_rate_limit_data';
    }

    getTrackingData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : { count: 0, firstRequestTime: Date.now(), blockedUntil: 0 };
        } catch (e) {
            return { count: 0, firstRequestTime: Date.now(), blockedUntil: 0 };
        }
    }

    saveTrackingData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            // Storage fallback
        }
    }

    checkLimit() {
        const now = Date.now();
        let data = this.getTrackingData();

        if (data.blockedUntil && now < data.blockedUntil) {
            const remainingMinutes = Math.ceil((data.blockedUntil - now) / 60000);
            console.warn(`Security Alert: Too many requests. Blocked for ${remainingMinutes} minutes.`);
            return {
                allowed: false,
                message: `Too many requests. Please try again later.`
            };
        }

        if (now - data.firstRequestTime > this.timeWindow) {
            data.count = 1;
            data.firstRequestTime = now;
            data.blockedUntil = 0;
            this.saveTrackingData(data);
            return { allowed: true };
        }

        data.count++;

        if (data.count > this.maxRequests) {
            data.blockedUntil = now + this.blockDuration;
            this.saveTrackingData(data);
            console.warn("Security Alert: Rate limit exceeded.");
            return {
                allowed: false,
                message: "Rate limit exceeded. Temporary block activated."
            };
        }

        this.saveTrackingData(data);
        return { allowed: true };
    }
}

const rorraxyRateLimiter = new RateLimiter({ maxRequests: 60, timeWindow: 60 * 1000 });

function validateRequestRate() {
    const check = rorraxyRateLimiter.checkLimit();
    if (!check.allowed) {
        alert(check.message);
        return false;
    }
    return true;
}

if (typeof window !== 'undefined') {
    window.RateLimiter = RateLimiter;
    window.validateRequestRate = validateRequestRate;
}
