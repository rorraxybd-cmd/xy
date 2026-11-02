/**
 * rorraxy - Advanced Form State Persistence Manager
 * Description: Automatically saves user inputs in browser storage in real-time 
 * to prevent data loss on accidental page refreshes or closures.
 */

class RorraxyFormPersist {
    constructor(formId, storageKey = 'rorraxy_form_backup') {
        this.form = document.getElementById(formId);
        this.storageKey = storageKey;

        if (this.form) {
            this.initPersistence();
        }
    }

    initPersistence() {
        this.restoreFormData();

        this.form.addEventListener('input', () => {
            this.saveFormData();
        });

        this.form.addEventListener('change', () => {
            this.saveFormData();
        });

        this.form.addEventListener('submit', () => {
            this.clearSavedData();
        });
    }

    saveFormData() {
        const formData = {};
        const elements = this.form.elements;

        for (let element of elements) {
            if (element.name || element.id) {
                const key = element.name || element.id;
                if (element.type !== 'password' && element.type !== 'submit') {
                    formData[key] = element.value;
                }
            }
        }

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(formData));
        } catch (error) {
            // Safe storage fallback
        }
    }

    restoreFormData() {
        try {
            const savedDataJson = localStorage.getItem(this.storageKey);
            if (!savedDataJson) return;

            const formData = JSON.parse(savedDataJson);
            for (const key in formData) {
                const field = this.form.elements[key];
                if (field) {
                    field.value = formData[key];
                }
            }
        } catch (error) {
            // Safe restoration fallback
        }
    }

    clearSavedData() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            // Safe clearing fallback
        }
    }
}

if (typeof window !== 'undefined') {
    window.RorraxyFormPersist = RorraxyFormPersist;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RorraxyFormPersist;
}
