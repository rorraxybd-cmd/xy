(function() {
    const domain = "https://rorraxy.com";
    const scripts = [
        `${domain}/security-config/cspHeader.js`,
        `${domain}/security-config/csrfProtection.js`,
        `${domain}/security-config/encryptionHelper.js`,
        `${domain}/security-config/config.js`,
        `${domain}/security-config/backupManager.js`,
        `${domain}/security-config/firewallRules.js`,
        `${domain}/security-config/honeypot.js`,
        `${domain}/security-config/rateLimiter.js`,
        `${domain}/management/formPersist.js`,
        `${domain}/management/storage.js`,
        `${domain}/management/store.js`,
        `${domain}/ui/imageHelper.js`,
        `${domain}/ui/loader.js`,
        `${domain}/ui/skeleton.js`,
        `${domain}/ui/toast.js`,
        `${domain}/ui/validator.js`,
        `${domain}/ui/videoEmbedSanitizer.js`,
        `${domain}/ui/videoHelper.js`,
        `${domain}/advanced/behavioralAnalytics.js`,
        `${domain}/advanced/codeSplit.js`,
        `${domain}/advanced/sanitizer.js`,
        `${domain}/advanced/syncManager.js`,
        `${domain}/advanced/worker.js`
    ];
    const fragment = document.createDocumentFragment();
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

window.rorraxyCloud = window.rorraxyCloud || {
    async save(storeName, data) {
        try {
            if (typeof window.saveDataToStore === 'function') {
                return await window.saveDataToStore(storeName, data);
            }
            console.warn("Storage module not loaded yet.");
            return { success: false, error: "Storage module pending" };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
};
