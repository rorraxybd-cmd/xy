/**
 * rorraxy security configuration - Rate Limiter
 * Limits repeated requests to public APIs and sensitive routes to prevent brute-force attacks.
 */

const rateLimit = require('express-rate-limit');

const rateLimiter = {
    /**
     * সাধারণ API বা পেজের জন্য স্ট্যান্ডার্ড রেট লিমিটার
     */
    standard: rateLimit({
        windowMs: 15 * 60 * 1000, // ১৫ মিনিট
        max: 100, // প্রতি ১৫ মিনিটে একটি আইপি থেকে সর্বোচ্চ ১০০টি রিকোয়েস্ট
        standardHeaders: true, // রিটার্ন রেসপন্সে রেট লিমিট ইনফো দেওয়া
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Too many requests from this IP, please try again after 15 minutes.'
        }
    }),

    /**
     * সংবেদনশীল রুট যেমন লগইন বা সাইনআপের জন্য কঠোর রেট লিমিটার
     */
    strict: rateLimit({
        windowMs: 10 * 60 * 1000, // ১০ মিনিট
        max: 5, // প্রতি ১০ মিনিটে সর্বোচ্চ ৫ বার চেষ্টার সুযোগ
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Too many login attempts, please try again after 10 minutes.'
        }
    })
};

module.exports = rateLimiter;
