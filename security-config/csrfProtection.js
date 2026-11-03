/**
 * rorraxy security configuration - CSRF Protection
 * Guards against Cross-Site Request Forgery attacks.
 */

const crypto = require('crypto');

const csrfProtection = {
    /**
     * ইউজারের সেশনের জন্য ইউনিক CSRF টোকেন জেনারেট করা
     */
    generateToken: (req, res, next) => {
        if (!req.session) {
            if (next) return next();
            return;
        }

        if (!req.session.csrfToken) {
            req.session.csrfToken = crypto.randomBytes(32).toString('hex');
        }
        
        // ভিউ বা ফ্রন্টএন্ডে পাঠানোর জন্য
        res.locals.csrfToken = req.session.csrfToken;
        
        if (next) next();
    },

    /**
     * পোস্ট, পুট বা ডিলিট রিকোয়েস্টে টোকেন ভ্যালিডেশন করা
     */
    verifyToken: (req, res, next) => {
        // GET, HEAD, OPTIONS রিকোয়েস্টের জন্য ভ্যালিডেশনের দরকার নেই
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            if (next) return next();
            return;
        }

        const clientToken = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;

        if (!clientToken || !req.session || clientToken !== req.session.csrfToken) {
            return res.status(403).json({
                success: false,
                message: 'Security Alert: Invalid or missing CSRF token.'
            });
        }

        if (next) next();
    }
};

module.exports = csrfProtection;
