/**
 * rorraxy management - Form Persist Utility
 * Automatically saves and restores form input fields to prevent data loss.
 */

const formPersist = {
    /**
     * কোনো ফর্মে অটো-সেভ ও রিস্টোর ফিচার যুক্ত করা
     * @param {string} formId - ফর্মের HTML ID
     * @param {string} storageKey - লোকাল স্টোরেজে সেভ করার ইউনিক কি
     */
    init: (formId, storageKey) => {
        const form = document.getElementById(formId);
        if (!form) return;

        // ১. পেজ লোড হলে সংরক্ষিত ডেটা ফর্ম ইনপুটে ফিরিয়ে আনা (Restore)
        try {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                const formData = JSON.parse(savedData);
                Object.keys(formData).forEach(name => {
                    const field = form.elements[name];
                    if (field) {
                        if (field.type === 'checkbox' || field.type === 'radio') {
                            field.checked = formData[name];
                        } else {
                            field.value = formData[name];
                        }
                    }
                });
            }
        } catch (error) {
            console.error('[FormPersist Restore Error]:', error);
        }

        // ২. ইউজার টাইপ বা পরিবর্তন করার সময় তা স্বয়ংক্রিয়ভাবে সেভ করা (Auto-save)
        form.addEventListener('input', () => {
            const formData = {};
            Array.from(form.elements).forEach(element => {
                if (element.name && !['password', 'file'].includes(element.type)) {
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        formData[element.name] = element.checked;
                    } else {
                        formData[element.name] = element.value;
                    }
                }
            });
            localStorage.setItem(storageKey, JSON.stringify(formData));
        });

        // ৩. সফলভাবে সাবমিট হলে স্টোরেজ থেকে ডেটা মুছে ফেলা
        form.addEventListener('submit', () => {
            localStorage.removeItem(storageKey);
        });
    },

    /**
     * নির্দিষ্ট ফর্মের পার্সিস্টেন্ট ডেটা ম্যানুয়ালি মুছে ফেলা
     */
    clear: (storageKey) => {
        localStorage.removeItem(storageKey);
    }
};

module.exports = formPersist;
