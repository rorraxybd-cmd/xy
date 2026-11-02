/**
 * rorraxy - Honeypot Anti-Spam & Bot Protection
 * Description: Detects automated bots via invisible form fields safely.
 */

class HoneypotProtection {
    constructor(options = {}) {
        this.fieldName = options.fieldName || "rorraxy_hp_check";
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener("DOMContentLoaded", () => this.setupForms());
        } else {
            this.setupForms();
        }
    }

    setupForms() {
        const forms = document.querySelectorAll("form");
        forms.forEach(form => {
            if (!form.querySelector(`input[name="${this.fieldName}"]`)) {
                const hpWrapper = document.createElement("div");
                hpWrapper.className = "rorraxy-hp-field-group";
                hpWrapper.style.display = "none";
                hpWrapper.style.visibility = "hidden";
                hpWrapper.style.position = "absolute";
                hpWrapper.style.left = "-9999px";

                const hpInput = document.createElement("input");
                hpInput.type = "text";
                hpInput.name = this.fieldName;
                hpInput.value = "";
                hpInput.autocomplete = "off";
                hpInput.tabIndex = -1;

                hpWrapper.appendChild(hpInput);
                form.appendChild(hpWrapper);
            }
        });
    }

    validateSubmission(formElement) {
        if (!formElement) return true;
        const hpInput = formElement.querySelector(`input[name="${this.fieldName}"]`);
        if (hpInput && hpInput.value.trim() !== "") {
            console.warn("Security Alert: Automated bot submission blocked.");
            return false; 
        }
        return true;
    }
}

const rorraxyHoneypot = new HoneypotProtection();

if (typeof window !== 'undefined') {
    window.HoneypotProtection = HoneypotProtection;
}
