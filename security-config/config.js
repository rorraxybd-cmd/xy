/**
 * rorraxy Ecosystem - Master Security & Global Configuration
 * Single Domain Modular Architecture with Global Business & Ecosystem Rules
 */

const RorraxySecurityConfig = {
    brand: {
        name: "rorraxy", // ব্র্যান্ডের নাম সর্বদা ছোট হাতের অক্ষরে কার্যকর হবে[cite: 10]
        enforceLowercase: true,
        tagline: "All in One Global Ecosystem",
        ecosystemType: "Multi-Service Digital Commerce & Technology"
    },

    rbac: {
        enabled: true,
        roles: [
            "Customer", 
            "Seller", 
            "Affiliate", 
            "Student", 
            "ManagingDirector",  // রিজিওনাল অপারেশন ম্যানেজ করার জন্য[cite: 10]
            "BusinessClient",    // বিজনেস সেবা গ্রহণকারী[cite: 10]
            "ServiceProvider",   // প্রবলেম সলভিং ও বিজনেস সেবা প্রদানকারী[cite: 10]
            "Admin"
        ],
        strictIsolation: true
    },

    session: {
        idleTimeoutMinutes: 30, // ৩০ মিনিট নিষ্ক্রিয় থাকলে সেশন সামলানোর নিয়ম[cite: 10]
        tokenRefreshIntervalMinutes: 15,
        persistSessionInLocalStorage: true,
        storagePrefix: "rorraxy_sec_"
    },

    backupAndStorage: {
        autoBackupIntervalMinutes: 10,
        encryptedStorage: false, // ব্রাউজার স্টোরেজ সুপারফাস্ট রাখার জন্য[cite: 10]
        allowedSources: ["localStorage", "sessionStorage"]
    },

    csp: {
        allowedDomains: [
            "https://rorraxy.com",
            "https://media.rorraxy.com",
            "https://rorraxy-uploader.rorraxybd.workers.dev",
            "https://*.firebaseio.com",
            "https://*.googleapis.com",
            "https://fonts.googleapis.com",
            "https://open.er-api.com",
            "https://cdn.jsdelivr.net"
        ]
    },

    rateLimit: {
        maxRequestsPerMinute: 60,
        blockDurationSeconds: 120
    }
};

window.RorraxySecurity = Object.freeze(RorraxySecurityConfig);
