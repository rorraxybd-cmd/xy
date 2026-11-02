/**
 * rorraxy - Security Configuration & Firewall Rules
 * Description: Handles safe request filtering and security headers without external breakages.
 */

const securityConfig = {
    enabled: true,
    mode: "strict",

    rateLimits: {
        windowMs: 15 * 60 * 1000,
        maxRequestsPerIP: 100,
        loginMaxAttempts: 5
    },

    allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    securityHeaders: {
        "Content-Security-Policy": "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: wss: https://media.rorraxy.com https://rorraxy-uploader.rorraxybd.workers.dev https://*.workers.dev https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://open.er-api.com https://ipapi.co https://cdn.jsdelivr.net; img-src 'self' data: blob: https:;",
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(self), microphone=()"
    },

    blockedUserAgents: [
        "BadBot",
        "ScraperX",
        "HTTrack",
        "Wget",
        "libwww-perl"
    ]
};

function evaluateFirewallRules(request) {
    if (!request || !request.headers) return { allowed: true };
    const userAgent = request.headers.get("user-agent") || "";
    const method = request.method;

    if (!securityConfig.allowedMethods.includes(method)) {
        return {
            allowed: false,
            status: 405,
            message: "Method Not Allowed"
        };
    }

    for (let bot of securityConfig.blockedUserAgents) {
        if (userAgent.includes(bot)) {
            return {
                allowed: false,
                status: 403,
                message: "Access Denied: Potential Security Threat Detected"
            };
        }
    }

    return {
        allowed: true,
        headers: securityConfig.securityHeaders
    };
}

if (typeof window !== 'undefined') {
    window.RorraxyFirewall = { securityConfig, evaluateFirewallRules };
}
