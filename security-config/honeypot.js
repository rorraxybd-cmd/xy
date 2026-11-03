/**
 * rorraxy security configuration - Honeypot Bot Detector
 * Traps and blocks automated bots that fill invisible form fields.
 */

const honeypot = {
    /**
     * হানিপট মিডলওয়্যার যা ফর্ম সাবমিশন বা পোস্ট রিকোয়েস্ট চেক করবে
     * @param {string} fieldName - যে ফিল্ডটি বটের জন্য ফাঁকা থাকার কথা (যেমন: 'bot_check_field')
     */
    check: (fieldName = 'bot_check_field') => {
        return (req, res, next) => {
            // শুধুমাত্র POST, PUT, PATCH রিকোয়েস্ট চেক করা
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                const honeyValue = req.body[fieldName];

                // যদি হানিপট ফিল্ডে কোনো ভ্যালু থাকে, তবে বুঝবে এটি কোনো মানুষ নয়, বরং স্প্যাম বট
                if (honeyValue) {
                    console.warn(`[Honeypot Alert]: Automated bot detected and blocked from IP: ${req.ip}`);
                    return res.status(403).json({
                        success: false,
                        message: 'Access Denied: Automated submission detected.'
                    });
                }
            }

            if (typeof next === 'function') {
                next();
            }
        };
    }
};

module.exports = honeypot;
