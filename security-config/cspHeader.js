/**
 * rorraxy security configuration - Content Security Policy (CSP)
 * Prevents XSS attacks and unauthorized data injection.
 */

const cspHeader = (req, res, next) => {
    const cspDirectives = [
        "default-src 'self'",
        // স্ক্রিপ্ট সোর্স (গুগল বা ফায়ারবেস বা নিজের ডোমেইন)
        "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com",
        // স্টাইলশিট ও ফন্ট
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        // ছবি এবং মিডিয়া
        "img-src 'self' data: https:",
        // এপিআই ও কানেকশন (rorraxy সাবডোমেইন ও ফায়ারবেস বা ক্লাউডফ্লেয়ার)
        "connect-src 'self' https://*.rorraxy.com https://*.firebaseio.com https://*.googleapis.com"
    ];

    // CSP হেডার সেট করা
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    
    // অন্যান্য অতিরিক্ত সিকিউরিটি হেডার
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (typeof next === 'function') {
        next();
    }
};

module.exports = cspHeader;
