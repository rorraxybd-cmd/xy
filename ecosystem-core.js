/**
 * rorraxy - Rocket Speed Master Core Loader & Global Ecosystem
 * File Location: /security-config/ecosystem-core.js
 */
(function() {
    const domain = "https://rorraxy.com";

    // প্রয়োজনীয় সিকিউরিটি, ম্যানেজমেন্ট, ইউআই ও রিয়েল-টাইম স্ক্রিপ্ট লিস্ট (PWA রিমুভ করা হয়েছে)
    const scripts = [
        // ১. সিকিউরিটি ও কনফিগ ফাইলসমূহ
        `${domain}/security-config/cspHeader.js`,
        `${domain}/security-config/csrfProtection.js`,
        `${domain}/security-config/encryptionHelper.js`,
        `${domain}/security-config/config.js`,
        `${domain}/security-config/backupManager.js`,
        `${domain}/security-config/firewallRules.js`,
        `${domain}/security-config/honeypot.js`,
        `${domain}/security-config/rateLimiter.js`,

        // ২. ম্যানেজমেন্ট ফাইলসমূহ (Management Folder)
        `${domain}/management/formPersist.js`,
        `${domain}/management/storage.js`,
        `${domain}/management/store.js`,

        // ৩. ইউজার ইন্টারফেস ফাইলসমূহ (UI Folder)
        `${domain}/ui/imageHelper.js`,
        `${domain}/ui/loader.js`,
        `${domain}/ui/skeleton.js`,
        `${domain}/ui/toast.js`,
        `${domain}/ui/validator.js`,
        `${domain}/ui/videoEmbedSanitizer.js`,
        `${domain}/ui/videoHelper.js`,

        // ৪. অ্যাডভান্সড ও রিয়েল-টাইম ফাইলসমূহ (Advanced Folder)
        `${domain}/advanced/behavioralAnalytics.js`,
        `${domain}/advanced/codeSplit.js`,
        `${domain}/advanced/sanitizer.js`,
        `${domain}/advanced/syncManager.js`,
        `${domain}/advanced/worker.js`
    ];

    const fragment = document.createDocumentFragment();

    // সিকোয়েন্স অনুযায়ী সুপারফাস্ট লোডিংয়ের জন্য স্ক্রিপ্ট লুপ
    scripts.forEach(src => {
        try {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            fragment.appendChild(script);
        } catch (e) {
            console.error("[rorraxy Script Load Error]:", src, e);
        }
    });

    if (document.head) {
        document.head.appendChild(fragment);
    }
})();

// অটো ডোমেইন লোগো ও ফেভিকন ফেচার হেলপার
function getCompanyLogo(domainOrUrl, size = 128) {
    try {
        let domain = domainOrUrl;
        if (domainOrUrl && domainOrUrl.startsWith('http')) {
            const urlObj = new URL(domainOrUrl);
            domain = urlObj.hostname;
        }
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
    } catch (error) {
        console.error('Logo fetching error:', error);
        return 'https://rorraxy.com/icon-192.png';
    }
}

/**
 * গ্লোবাল রিয়েল-টাইম ক্লাউড ব্রিজ
 */
window.rorraxyCloud = window.rorraxyCloud || {
    async save(storeName, data) {
        try {
            if (typeof window.saveDataToStore === 'function') {
                return await window.saveDataToStore(storeName, data);
            } else {
                console.warn("Storage module not loaded yet.");
                return { success: false, error: "Storage module pending" };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
};
