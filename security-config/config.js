/**
 * rorraxy security configuration module
 * Centralized configuration for security policies, rate limits, and encryption keys.
 */

require('dotenv').config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    
    // সিকিউরিটি ও এনক্রিপশন কি (Encryption & Secrets)
    security: {
        jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-it',
        encryptionKey: process.env.ENCRYPTION_KEY || 'your-32-byte-secure-encryption-key-here',
        bcryptSaltRounds: 12,
    },

    // রেট লিমিটার কনফিগারেশন (Rate Limiter)
    rateLimit: {
        windowMs: 15 * 60 * 1000, // ১৫ মিনিট
        maxRequests: 100,         // প্রতি আইপি থেকে সর্বোচ্চ রিকোয়েস্ট
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    },

    // সিএসআরএফ ও কর্স পলিসি (CORS & CSRF) - অটোমেটিক সাবডোমেইন হ্যান্ডলার
    cors: {
        origin: function (origin, callback) {
            // অরিজিন না থাকলে (যেমন: সার্ভার-টু-সার্ভার বা মোবাইল অ্যাপ রিকোয়েস্ট) অনুমতি দেওয়া
            if (!origin) return callback(null, true);
            
            // rorraxy.com এবং এর যেকোনো সাবডোমেইন চেক করার রেগুলার এক্সপ্রেশন
            const allowedPattern = /^https:\/\/([a-zA-Z0-9-]+\.)*rorraxy\.com$/;
            
            if (allowedPattern.test(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS Policy'));
            }
        },
        credentials: true
    },

    // হানিপট ও ফায়ারওয়াল সেটিংস
    firewall: {
        blockSuspiciousUserAgents: true,
        honeypotFieldName: 'bot_check_field' // বট ডিটেকশনের জন্য হানিপট ফিল্ড
    }
};

module.exports = config;
